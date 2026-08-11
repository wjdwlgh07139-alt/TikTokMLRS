import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildPrepDashboard } from "../server/services/prepEngine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

const OLLAMA_MODEL = "hf.co/dummy9996/kanana-2-1.3b-instruct-GGUF:latest";
const OLLAMA_URL = "http://localhost:11434/api/generate";

console.log("=======================================================");
console.log(`🤖 Ollama Kanana-2 1.3B SLM 로컬 배치 추출 & 벤치마크`);
console.log(`- 모델: ${OLLAMA_MODEL}`);
console.log(`- 엔드포인트: ${OLLAMA_URL}`);
console.log("=======================================================\n");

// Ensure output directory exists
const outputDir = path.join(rootDir, "fixtures/extracted_ollama");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Function to call Ollama API for a single note
async function extractNoteWithKanana(noteObj) {
  const prompt = `당신은 아동 돌봄 노트에서 수업 준비 및 아이 성향 정보를 추출하는 AI 전문가입니다.
아래 돌봄 노트 원문을 읽고 JSON 포맷으로 정보를 추출하세요.

[원칙]
1. quote 필드에는 절대로 "원문 인용"이라는 단어를 적지 말고, 원문 텍스트에서 직접 복사한 실제 문장을 입력하세요.
2. 콧물, 기침, 발열 등 건강 관련 서술은 제외하세요.
3. traitId는 다음 값 중 하나를 사용하세요: "shy" (낯가림), "cling" (분리불안/엄마찾음), "hyper" (산만), "stubborn" (고집), "rough" (터프), "quiet" (조용), "attached" (들러붙음), "why" (질문세례).

[예시]
원문: "초반엔 조금 낯설어하는 모습을 보였지만 플레이콘을 보들보들하다고 신기해했어요."
JSON:
{
  "positiveSignals": [{"content": "플레이콘 촉감에 흥미", "quote": "보들보들하다고 신기해했어요"}],
  "negativeSignals": [{"content": "초반 낯가림 경계", "quote": "초반엔 조금 낯설어하는 모습을 보였지만"}],
  "traitHints": [{"traitId": "shy", "strength": "weak", "quote": "초반엔 조금 낯설어하는 모습을 보였지만"}]
}

[돌봄 노트 원문]
ID: ${noteObj.noteId}
날짜: ${noteObj.date}
아동: ${noteObj.childName} (${noteObj.ageMonths}개월, ${noteObj.gender})
내용:
${noteObj.rawNote}

위 예시처럼 실제 원문 문장을 인용하여 JSON으로만 응답하세요:`;

  const startTime = Date.now();
  try {
    const res = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        format: "json",
        options: {
          temperature: 0.1,
          num_predict: 512,
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`Ollama HTTP Error: ${res.status}`);
    }

    const data = await res.json();
    const durationMs = Date.now() - startTime;
    const responseText = data.response || "{}";

    let parsed = {};
    try {
      parsed = JSON.parse(responseText);
      parsed.noteId = noteObj.noteId;
      parsed.date = noteObj.date;
      parsed.ageMonths = noteObj.ageMonths;
    } catch {
      console.warn(`[JSON Parse Error] Note ${noteObj.noteId}: raw response: ${responseText.slice(0, 100)}`);
      parsed = {
        noteId: noteObj.noteId,
        date: noteObj.date,
        ageMonths: noteObj.ageMonths,
        activityTags: [],
        materials: [],
        positiveSignals: [],
        negativeSignals: [],
        unfinished: null,
        traitHints: [],
      };
    }

    return { success: true, durationMs, data: parsed };
  } catch (err) {
    const durationMs = Date.now() - startTime;
    console.error(`[Ollama Extraction Failed] Note ${noteObj.noteId}:`, err.message);
    return { success: false, durationMs, error: err.message };
  }
}

// Batch extract for a child
async function processChild(childKey) {
  const notesDir = path.join(rootDir, `fixtures/notes/${childKey}`);
  if (!fs.existsSync(notesDir)) return [];

  const files = fs.readdirSync(notesDir).filter((f) => f.endsWith(".json"));
  files.sort();

  console.log(`▶ [${childKey.toUpperCase()}] ${files.length}건 노트 Ollama Kanana-2 1.3B 추출 시작...`);
  const extractedList = [];
  let totalTimeMs = 0;

  for (const file of files) {
    const noteObj = JSON.parse(fs.readFileSync(path.join(notesDir, file), "utf-8"));
    process.stdout.write(`   - ${noteObj.noteId} 추출 중... `);
    const result = await extractNoteWithKanana(noteObj);

    if (result.success) {
      console.log(`완료 (${result.durationMs}ms)`);
      extractedList.push(result.data);
    } else {
      console.log(`실패 (${result.error})`);
    }
    totalTimeMs += result.durationMs;
  }

  const avgTime = files.length > 0 ? (totalTimeMs / files.length).toFixed(0) : 0;
  console.log(`   └ [${childKey.toUpperCase()}] 총 ${totalTimeMs}ms 소요 (노트당 평균 ${avgTime}ms)\n`);

  // Save extracted JSON
  const outputFile = path.join(outputDir, `${childKey}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(extractedList, null, 2), "utf-8");
  return extractedList;
}

async function runBenchmark() {
  const childAExt = await processChild("child-a");
  const childBExt = await processChild("child-b");
  const childCExt = await processChild("child-c");

  console.log("-------------------------------------------------------");
  console.log("📊 Ollama Kanana-2 1.3B 추출 결과 도구 B 궤적 추천 평가");
  console.log("-------------------------------------------------------");

  // Child A dashboard check
  const dashA = buildPrepDashboard({ id: "child-a", childName: "구O윤", ageMonths: 27, gender: "여아" }, childAExt);
  console.log("Child A 추천:", dashA.recommendations.map((r) => `${r.title} (${r.badge})`));

  // Child B dashboard check
  const dashB = buildPrepDashboard({ id: "child-b", childName: "김O준", ageMonths: 30, gender: "남아" }, childBExt);
  console.log("Child B 추천:", dashB.recommendations.map((r) => `${r.title} (${r.badge})`));

  // Child C dashboard check
  const dashC = buildPrepDashboard({ id: "child-c", childName: "이O아", ageMonths: 24, gender: "여아" }, childCExt);
  console.log("Child C 추천:", dashC.recommendations.map((r) => `${r.title} (${r.badge})`));

  console.log("\n=======================================================");
  console.log("🎉 Ollama kanana-2-1.3b-instruct 모델 배치 추출 완료!");
  console.log(`결과 저장 경로: /fixtures/extracted_ollama/`);
  console.log("=======================================================");
}

runBenchmark();
