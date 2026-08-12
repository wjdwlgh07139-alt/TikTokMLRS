import fs from "fs";
import path from "path";

const OLLAMA_MODEL = process.env.KANANA_MODEL || "hf.co/dummy9996/kanana-2-1.3b-instruct-GGUF:latest";
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434/api/generate";

/**
 * Checks if local Ollama Kanana server is running
 */
export async function checkKananaStatus() {
  try {
    const res = await fetch("http://localhost:11434/api/tags");
    if (!res.ok) return { online: false, model: OLLAMA_MODEL, error: "Ollama not responding" };
    const data = await res.json();
    const hasModel = data.models?.some((m) => m.name && (m.name.includes("kanana") || m.name.includes("1.3b")));
    return { online: true, model: OLLAMA_MODEL, availableModels: data.models, hasModel };
  } catch (err) {
    return { online: false, model: OLLAMA_MODEL, error: err.message };
  }
}

/**
 * Extract structured information from a raw care note using local Kanana SLM via Ollama (v2 Schema)
 */
export async function extractNoteWithKanana(rawNoteText) {
  const prompt = `당신은 아동 돌봄 노트에서 다음 수업 준비 및 진행 참고 정보를 추출하는 AI 전문가입니다. (v2 규격)
아래 돌봄 노트 원문을 읽고 JSON 포맷으로 정보를 추출.

[필수 원칙]
1. 모든 항목에 원문에서 직접 인용한 quote 필드를 반드시 포함.
2. 건강 관련 서술(콧물, 기침, 발열 등)은 추출에서 완전 제외.
3. 역할놀이 대사(예: "콧물이 많이 나요"라며 병원놀이 연기)를 실제 증상이나 건강 정보로 오인 금지.
4. 부모 관련 인사말("*어머니 음료수 감사합니다")은 제외.

[JSON 추출 구조]
{
  "materials": ["준비물1", "준비물2"],
  "preferences": {
    "themes": [{ "content": "선호 놀이/테마", "quote": "원문 문장" }],
    "sensory": [{ "content": "감각/촉감 반응", "quote": "원문 문장" }]
  },
  "flow": {
    "warmup": { "content": "도입 탐색 패턴", "quote": "원문 문장" },
    "leadStyle": { "content": "아이 주도 패턴", "quote": "원문 문장" },
    "closing": { "content": "마무리 패턴", "quote": "원문 문장" }
  },
  "continuity": {
    "expanding": [{ "content": "확장 중인 놀이", "quote": "원문 문장" }],
    "unfinished": { "content": "미완결 지점", "quote": "원문 문장" }
  }
}

[돌봄 노트 원문]
${rawNoteText}

JSON 포맷으로만 응답:`;

  try {
    const res = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        options: { temperature: 0.1, top_p: 0.9 }
      })
    });

    if (!res.ok) {
      throw new Error(`Ollama error: ${res.statusText}`);
    }

    const data = await res.json();
    const rawResponse = data.response;

    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return { rawResponse };
  } catch (err) {
    console.error("[Kanana Extraction Error]", err);
    throw err;
  }
}

/**
 * Checks if extracted notes array is sparse/insufficient
 */
export function isExtractionInsufficient(extractedNotes, rawNotesCount = 0) {
  if (!Array.isArray(extractedNotes) || extractedNotes.length === 0) {
    return rawNotesCount > 0;
  }

  if (rawNotesCount > 0 && extractedNotes.length < rawNotesCount) {
    return true;
  }

  let sparseCount = 0;
  for (const note of extractedNotes) {
    const hasMaterials = Array.isArray(note.materials) && note.materials.length > 0;
    const hasActivityTags = Array.isArray(note.activityTags) && note.activityTags.length > 0;
    const hasPosSignals = Array.isArray(note.positiveSignals) && note.positiveSignals.length > 0;
    const hasPrefs = note.preferences && (
      (Array.isArray(note.preferences.themes) && note.preferences.themes.length > 0) ||
      (Array.isArray(note.preferences.sensory) && note.preferences.sensory.length > 0)
    );

    if (!hasMaterials && !hasActivityTags && !hasPosSignals && !hasPrefs) {
      sparseCount++;
    }
  }

  return sparseCount >= Math.ceil(extractedNotes.length / 2);
}

function extractActivityTagsFromText(rawText = "") {
  const knownTags = ["미술 놀이", "만들기", "역할 놀이", "촉감 놀이", "책 읽기", "블록 놀이", "자동차 놀이", "음악 놀이", "신체 놀이", "병원놀이", "그리기"];
  const found = knownTags.filter((t) => rawText.includes(t));
  return found.length > 0 ? found : ["자율 놀이"];
}

function extractMaterialsFromText(rawText = "") {
  const knownMats = ["플레이콘", "물티슈", "병원놀이 세트", "토끼인형", "스케치북", "스티커", "클레이", "미니카", "블록", "타요 자동차", "도로 테이프", "그림책", "헝겊책", "딸랑이 공"];
  return knownMats.filter((m) => rawText.includes(m));
}

/**
 * Re-extract notes using local Kanana Ollama model and write to extracted_ollama
 */
export async function reextractChildNotesWithKanana(childId, serverDir) {
  const notesDir = path.join(serverDir, `../fixtures/notes/${childId}`);
  const ollamaOutputDir = path.join(serverDir, `../fixtures/extracted_ollama`);
  const defaultPath = path.join(serverDir, `../fixtures/extracted/${childId}.json`);

  if (!fs.existsSync(notesDir)) {
    return [];
  }

  const files = fs.readdirSync(notesDir).filter((f) => f.endsWith(".json"));
  if (files.length === 0) return [];

  const rawNotes = files.map((f) => JSON.parse(fs.readFileSync(path.join(notesDir, f), "utf-8")));
  rawNotes.sort((a, b) => new Date(a.date) - new Date(b.date));

  const status = await checkKananaStatus();
  const reextracted = [];

  // 1. 기존 추출본(캐시) 로드하여 이미 요약된 노트 확인
  const outputPath = path.join(ollamaOutputDir, `${childId}.json`);
  const cachedMap = new Map();
  if (fs.existsSync(outputPath)) {
    try {
      const cachedArr = JSON.parse(fs.readFileSync(outputPath, "utf-8"));
      if (Array.isArray(cachedArr)) {
        cachedArr.forEach((item) => {
          if (item.noteId) cachedMap.set(item.noteId, item);
        });
      }
    } catch (e) {
      console.warn(`[Kanana Cache Warning] Failed to parse existing ${outputPath}:`, e.message);
    }
  }

  if (status.online) {
    for (const noteObj of rawNotes) {
      // 이미 요약된 캐시본이 있고 필수 정보가 채워져 있다면 Ollama 재호출 없이 기존 요약본 재사용
      const existing = cachedMap.get(noteObj.noteId);
      const isExistingValid = existing && (
        (Array.isArray(existing.materials) && existing.materials.length > 0) ||
        (Array.isArray(existing.positiveSignals) && existing.positiveSignals.length > 0) ||
        (existing.preferences && (existing.preferences.themes?.length > 0 || existing.preferences.sensory?.length > 0))
      );

      if (isExistingValid) {
        console.log(`[Kanana Cache Hit] Note '${noteObj.noteId}' is already extracted. Skipping LLM call.`);
        reextracted.push(existing);
        continue;
      }

      // 캐시가 없거나 부실한 신규/미완성 노트만 LLM 호출
      console.log(`[Kanana Extracting] Processing new/uncached note '${noteObj.noteId}' for ${childId}...`);
      try {
        const kananaRes = await extractNoteWithKanana(noteObj.rawNote || "");
        const mats = (Array.isArray(kananaRes.materials) && kananaRes.materials.length > 0)
          ? kananaRes.materials
          : (noteObj.extracted?.materials || extractMaterialsFromText(noteObj.rawNote));
        const tags = noteObj.extracted?.activityTags || extractActivityTagsFromText(noteObj.rawNote);

        const posSignals = (kananaRes.preferences?.themes || []).map((t) => ({
          content: t.content,
          quote: t.quote || t.content,
        }));

        if (posSignals.length === 0 && noteObj.extracted?.positiveSignals) {
          posSignals.push(...noteObj.extracted.positiveSignals);
        }

        reextracted.push({
          noteId: noteObj.noteId,
          date: noteObj.date,
          ageMonths: noteObj.ageMonths,
          activityTags: tags,
          materials: mats,
          positiveSignals: posSignals,
          negativeSignals: noteObj.extracted?.negativeSignals || [],
          preferences: kananaRes.preferences || { themes: [], sensory: [] },
          flow: kananaRes.flow || null,
          continuity: kananaRes.continuity || (noteObj.extracted?.unfinished ? { unfinished: noteObj.extracted.unfinished } : null),
          traitHints: noteObj.extracted?.traitHints || [],
        });
      } catch (err) {
        console.warn(`[Kanana Re-extract Warning] Note ${noteObj.noteId} failed:`, err.message);
        if (noteObj.extracted) reextracted.push(noteObj.extracted);
        else if (existing) reextracted.push(existing);
      }
    }
  } else {
    console.warn(`[Kanana Re-extract] Ollama offline. Falling back to default extracted data for ${childId}.`);
    if (fs.existsSync(defaultPath)) {
      return JSON.parse(fs.readFileSync(defaultPath, "utf-8"));
    }
  }

  if (reextracted.length > 0) {
    if (!fs.existsSync(ollamaOutputDir)) {
      fs.mkdirSync(ollamaOutputDir, { recursive: true });
    }
    const outputPath = path.join(ollamaOutputDir, `${childId}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(reextracted, null, 2), "utf-8");
    console.log(`[Kanana Auto Re-extract] Successfully saved updated extracted_ollama to ${outputPath}`);
  }

  return reextracted;
}
