import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import { GoogleGenAI } from "@google/genai";
import { PERSONAS, baseSystem, reviewSystem } from "./personas.js";
import { composeSystemPrompt, composeReviewPrompt } from "./services/promptComposer.js";
import { checkKananaStatus, extractNoteWithKanana, isExtractionInsufficient, reextractChildNotesWithKanana } from "./services/kananaService.js";
import { buildPrepDashboard } from "./services/prepEngine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "../client/dist");

const traitsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "./data/traits.json"), "utf-8")
);

// 세션 저장소 (In-memory)
const SESSIONS = new Map();

function getRandomTraitId() {
  const ids = traitsData.map((t) => t.id);
  return ids[Math.floor(Math.random() * ids.length)];
}

// Gemini 모델 문자열은 언제든 바뀔 수 있으므로 상수만 바꾸면 되게 분리해둠.
// 최신 목록: https://ai.google.dev/gemini-api/docs/models
const MODEL_ROLEPLAY = "gemini-3.5-flash-lite"; // 저비용·고빈도 역할극용
const MODEL_REVIEW = "gemini-3.5-flash-lite"; // 평가용. flash 말고 flash-lite도 은근 쓸만함
const MAX_TURNS = 3;
const MAX_USER_INPUT_CHARS = 500;

if (!process.env.GEMINI_API_KEY) {
  console.error(
    "[째깍 리허설] GEMINI_API_KEY가 설정되지 않았습니다. .env 파일에 키를 넣어주세요 (.env.example 참고)."
  );
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const app = express();
app.use(express.json());
app.use(express.static(distPath));

function extractJSON(text) {
  let cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1) {
    throw new Error("no JSON braces found");
  }

  // 1. 온전한 { ... } 가 존재할 경우 파싱 시도
  if (end > start) {
    const rawCandidate = cleaned.slice(start, end + 1);
    try {
      return JSON.parse(rawCandidate);
    } catch {
      // 쉼표 뒤 닫힘 기호 전 trailing comma 등 불완전한 문법 보정
      const sanitized = rawCandidate
        .replace(/,\s*([\}\]])/g, "$1")
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, " ");
      try {
        return JSON.parse(sanitized);
      } catch (e) {
        // 복구 실패 시 하단 자동 보정 로직으로 이관
      }
    }
  }

  // 2. 출력 토큰 부족 등으로 중간에 끊긴(Truncated) JSON 복구
  let jsonStr = cleaned.slice(start);
  // trailing comma 제거
  jsonStr = jsonStr.replace(/,\s*$/, "");

  // 열린 따옴표 및 열린 괄호 보정
  let openQuotes = false;
  const stack = [];
  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];
    if (char === '"' && jsonStr[i - 1] !== "\\") {
      openQuotes = !openQuotes;
    } else if (!openQuotes) {
      if (char === "{" || char === "[") {
        stack.push(char === "{" ? "}" : "]");
      } else if (char === "}" || char === "]") {
        if (stack.length && stack[stack.length - 1] === char) {
          stack.pop();
        }
      }
    }
  }

  if (openQuotes) jsonStr += '"';
  jsonStr = jsonStr.replace(/,\s*$/, "");
  while (stack.length > 0) {
    jsonStr += stack.pop();
  }

  try {
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("[extractJSON repair failed]", err.message, text.slice(-200));
    throw err;
  }
}

// JSON이 중간에 잘려도(토큰 한도 등) "reply" 값만이라도 건져서 자연스럽게 보여주기 위한 보조 파서
function salvageReply(text) {
  const match = text.match(/"reply"\s*:\s*"((?:\\.|[^"\\])*)/);
  if (!match) return null;
  try {
    return JSON.parse(`"${match[1]}"`);
  } catch {
    return match[1];
  }
}

function clampMood(mood) {
  const n = Number(mood);
  if (!Number.isFinite(n)) return 3;
  return Math.min(5, Math.max(1, Math.round(n)));
}

// 내부 role('user'|'assistant')을 Gemini contents role('user'|'model')로 변환
function toGeminiContents(messages) {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

app.get("/api/scenarios", (req, res) => {
  const list = PERSONAS.map((p) => ({
    id: p.id,
    group: p.group,
    emoji: p.emoji,
    title: p.title,
    situation: p.situation,
    tags: p.tags,
    level: p.level,
    turns: p.turns,
    initialLevel: p.initialLevel ?? 1,
    openingLine: p.openingLine,
    feedbackType: p.feedbackType || "signal",
    checklists: p.checklists || [],
    secondaryTraits: p.secondaryTraits || [],
  }));
  res.json(list);
});

app.get("/api/traits", (req, res) => {
  const list = traitsData.map(({ id, label, summary }) => ({
    id,
    label,
    summary,
  }));
  res.json(list);
});

const CHILDREN_METADATA = [
  { id: "child-a", childName: "구O윤", name: "구O윤", ageMonths: 27, gender: "여아", noteCount: 12, totalNotesCount: 12, lastDate: "2026-10-01", teacherNote: "악어 선생님 담당" },
  { id: "child-b", childName: "김O준", name: "김O준", ageMonths: 35, gender: "남아", noteCount: 5, totalNotesCount: 5, lastDate: "2026-09-29", teacherNote: "토끼 선생님 담당" },
  { id: "child-c", childName: "이O서", name: "이O서", ageMonths: 30, gender: "여아", noteCount: 2, totalNotesCount: 2, lastDate: "2026-10-08", teacherNote: "곰돌이 선생님 담당" },
  { id: "child-d", childName: "박O진", name: "박O진", ageMonths: 28, gender: "남아", noteCount: 0, totalNotesCount: 0, lastDate: null, teacherNote: "사자 선생님 담당" },
];

async function loadExtractedNotes(childId) {
  const ollamaPath = path.join(__dirname, `../fixtures/extracted_ollama/${childId}.json`);
  const defaultPath = path.join(__dirname, `../fixtures/extracted/${childId}.json`);
  const notesDir = path.join(__dirname, `../fixtures/notes/${childId}`);

  // Count raw notes
  let rawCount = 0;
  if (fs.existsSync(notesDir)) {
    rawCount = fs.readdirSync(notesDir).filter((f) => f.endsWith(".json")).length;
  }

  // 1. extracted_ollama가 우선적으로 보이도록 설정
  let ollamaNotes = [];
  if (fs.existsSync(ollamaPath)) {
    try {
      ollamaNotes = JSON.parse(fs.readFileSync(ollamaPath, "utf-8"));
    } catch {
      ollamaNotes = [];
    }
  }

  // 2. 내용이 부실하다 판단되면 (속성 누락/노트 수 부족 등) Kanana 모델로 재요약/재추출 수행
  if (isExtractionInsufficient(ollamaNotes, rawCount)) {
    console.log(`[Kanana Auto Trigger] child '${childId}' extraction is sparse/insufficient. Triggering Kanana re-summarization...`);
    try {
      const freshNotes = await reextractChildNotesWithKanana(childId, __dirname);
      if (Array.isArray(freshNotes) && freshNotes.length > 0) {
        return freshNotes;
      }
    } catch (err) {
      console.warn(`[Kanana Auto Trigger Error] Re-summarization failed for ${childId}:`, err.message);
    }
  } else {
    return ollamaNotes;
  }

  // Ollama 미실행 또는 실패 시 default extracted 파일 폴백
  if (fs.existsSync(defaultPath)) {
    try {
      return JSON.parse(fs.readFileSync(defaultPath, "utf-8"));
    } catch {
      return [];
    }
  }

  return ollamaNotes;
}

app.get("/api/prep/children", (req, res) => {
  res.json(CHILDREN_METADATA);
});

app.get("/api/prep/kanana/status", async (req, res) => {
  const status = await checkKananaStatus();
  res.json(status);
});

app.post("/api/prep/kanana/extract", async (req, res) => {
  const { rawNote } = req.body;
  if (!rawNote) {
    return res.status(400).json({ error: "rawNote is required" });
  }
  try {
    const extracted = await extractNoteWithKanana(rawNote);
    res.json({ success: true, extracted });
  } catch (err) {
    res.status(500).json({ error: "Kanana extraction failed", details: err.message });
  }
});

app.get("/api/prep/children/:childId", async (req, res) => {
  const { childId } = req.params;
  const childInfo = CHILDREN_METADATA.find((c) => c.id === childId);
  if (!childInfo) {
    return res.status(404).json({ error: "child not found" });
  }

  try {
    const extractedNotes = await loadExtractedNotes(childId);
    const dashboard = buildPrepDashboard(childInfo, extractedNotes);
    res.json(dashboard);
  } catch (err) {
    console.error(`[prep dashboard error for ${childId}]`, err);
    res.status(500).json({ error: "failed to build prep dashboard", details: err.message });
  }
});

app.post("/api/prep/children/:childId/reextract", async (req, res) => {
  const { childId } = req.params;
  try {
    const freshNotes = await reextractChildNotesWithKanana(childId, __dirname);
    res.json({ success: true, count: freshNotes.length, notes: freshNotes });
  } catch (err) {
    res.status(500).json({ error: "Re-extraction failed", details: err.message });
  }
});

app.get("/api/prep/children/:childId/notes", (req, res) => {
  const { childId } = req.params;
  const childDir = path.join(__dirname, `../fixtures/notes/${childId}`);
  if (!fs.existsSync(childDir)) {
    return res.json([]);
  }

  try {
    const files = fs.readdirSync(childDir).filter((f) => f.endsWith(".json"));
    const notes = files.map((f) => {
      return JSON.parse(fs.readFileSync(path.join(childDir, f), "utf-8"));
    });
    notes.sort((a, b) => new Date(b.date) - new Date(a.date)); // descending
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: "failed to load notes" });
  }
});

app.get("/api/prep/recommendations", async (req, res) => {
  const allRecs = [];
  try {
    for (const child of CHILDREN_METADATA) {
      const extractedNotes = await loadExtractedNotes(child.id);
      const dash = buildPrepDashboard(child, extractedNotes);
      if (dash.recommendations && dash.recommendations.length > 0) {
        dash.recommendations.forEach((rec) => {
          allRecs.push({
            ...rec,
            childId: child.id,
            childName: child.childName,
            childAgeMonths: child.ageMonths,
          });
        });
      }
    }
    res.json(allRecs);
  } catch (err) {
    console.error("[prep recommendations error]", err);
    res.status(500).json({ error: "failed to load recommendations", details: err.message });
  }
});

app.post("/api/rehearsal/session", (req, res) => {
  const { scenarioId, traitId: rawTraitId, blindMode = false } = req.body || {};
  let traitId = rawTraitId;

  if (traitId === "random") {
    traitId = getRandomTraitId();
  }

  const persona = PERSONAS.find((p) => p.id === scenarioId);
  const trait = traitsData.find((t) => t.id === traitId) || null;
  const sessionId = "sess_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);

  const initialLevel = trait?.initialLevel ?? persona?.initialLevel ?? 1;

  const sessionObj = {
    sessionId,
    scenarioId,
    traitId: trait ? trait.id : null,
    blindMode: Boolean(blindMode),
    levelHistory: [{ turn: 0, level: initialLevel }],
    createdAt: Date.now(),
  };

  SESSIONS.set(sessionId, sessionObj);

  const responseData = {
    sessionId,
    openingLine: trait?.openingLine || persona?.openingLine || null,
    initialLevel,
  };

  if (trait && !blindMode) {
    responseData.trait = {
      id: trait.id,
      label: trait.label,
      tips: trait.tips,
      exampleLines: trait.exampleLines,
      initialLevel: trait.initialLevel,
      openingLine: trait.openingLine,
    };
  }

  res.json(responseData);
});

app.post("/api/roleplay", async (req, res) => {
  try {
    const { scenarioId: reqScenarioId, sessionId, traitId: reqTraitId, messages } = req.body || {};

    const convo = Array.isArray(messages) ? messages : [];
    const lastUserMsg = convo.filter((m) => m.role === "user").pop();
    if (lastUserMsg && lastUserMsg.content && lastUserMsg.content.length > MAX_USER_INPUT_CHARS) {
      return res.status(400).json({ error: `입력 글자 수가 ${MAX_USER_INPUT_CHARS}자를 초과했습니다.` });
    }

    let scenarioId = reqScenarioId;
    let traitId = reqTraitId;
    let blindMode = false;
    let sessionObj = null;

    if (sessionId && SESSIONS.has(sessionId)) {
      sessionObj = SESSIONS.get(sessionId);
      scenarioId = scenarioId || sessionObj.scenarioId;
      traitId = traitId || sessionObj.traitId;
      blindMode = sessionObj.blindMode;
    }

    if (traitId === "random") {
      traitId = getRandomTraitId();
    }

    const persona = PERSONAS.find((p) => p.id === scenarioId);
    if (!persona) {
      return res.status(400).json({ error: "invalid scenarioId" });
    }

    const trait = traitsData.find((t) => t.id === traitId) || null;

    const userTurns = convo.filter((m) => m.role === "user").length;
    const maxTurns = persona.turns || MAX_TURNS;
    const isFinal = userTurns >= maxTurns;

    let system = composeSystemPrompt({
      scenarioPersona: persona.persona,
      personaObj: persona,
      trait,
      blindMode,
    });

    if (isFinal) {
      system +=
        "\n\n[중요] 이번이 마지막 응답입니다. 자연스럽게 마무리하고 done=true로 하세요.";
    }

    const contents = convo.length
      ? toGeminiContents(convo)
      : [{ role: "user", parts: [{ text: "(대화를 시작합니다)" }] }];

    const response = await ai.models.generateContent({
      model: MODEL_ROLEPLAY,
      contents,
      config: {
        systemInstruction: system,
        maxOutputTokens: 800,
        responseMimeType: "application/json",
        // gemini-3.x는 기본적으로 내부 사고(thinking) 토큰을 maxOutputTokens에서 함께 소비한다.
        // 짧은 대사만 있으면 되므로 최소 수준으로 낮춰 답변이 잘리지 않게 한다.
        thinkingConfig: { thinkingLevel: "low" },
      },
    });

    const text = response.text ?? "";
    let result;
    try {
      result = extractJSON(text);
    } catch {
      console.warn("[roleplay] JSON 파싱 실패, 원문 일부 보존:", text.slice(0, 300));
      result = { reply: salvageReply(text) || "…", mood: 3, done: isFinal };
    }

    result.mood = clampMood(result.mood);
    // level 결정 (0~3)
    if (result.level === undefined || result.level === null) {
      result.level = Math.max(0, Math.min(3, 4 - result.mood));
    }

    if (sessionObj) {
      if (!sessionObj.levelHistory) sessionObj.levelHistory = [];
      sessionObj.levelHistory.push({ turn: userTurns, level: result.level });
    }

    if (isFinal) result.done = true;
    result.turnsLeft = Math.max(0, maxTurns - userTurns);

    res.json(result);
  } catch (err) {
    console.error("[roleplay error]", err);
    res.status(500).json({ error: "roleplay failed" });
  }
});

function salvageJSON(text) {
  if (!text || typeof text !== "string") throw new Error("empty text");
  let s = text.replace(/```json|```/g, "").trim();
  const start = s.indexOf("{");
  if (start === -1) throw new Error("no opening brace");
  s = s.slice(start);

  // 1) 미완결 따옴표 문자열 잘라내기
  const quotes = (s.match(/(?<!\\)"/g) || []).length;
  if (quotes % 2 === 1) {
    s = s.slice(0, s.lastIndexOf('"'));
  }

  // 2) 마지막 완결 요소까지 되감기 (미완결 키나 쉼표 제거)
  s = s.replace(/,\s*[^,\[\]{}]*$/, "");

  // 3) 열린 괄호 스택으로 닫기
  const stack = [];
  let openQ = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"' && s[i - 1] !== "\\") {
      openQ = !openQ;
    } else if (!openQ) {
      if (c === "{" || c === "[") stack.push(c === "{" ? "}" : "]");
      else if (c === "}" || c === "]") {
        if (stack.length && stack[stack.length - 1] === c) stack.pop();
      }
    }
  }

  while (stack.length > 0) {
    s += stack.pop();
  }

  const parsed = JSON.parse(s);
  parsed.partial = true;
  return parsed;
}

function isMeaninglessSession(transcript) {
  const teacherLines = transcript
    .split("\n")
    .filter((l) => l.includes("선생님:"))
    .map((l) => l.replace(/\[.*?\]\s*선생님:\s*/, "").trim());

  if (teacherLines.length === 0) return true;

  let totalChars = 0;
  let meaninglessCount = 0;
  const hangulJamoRegex = /^[\u3131-\u318E\s\.\?!]+$/; // 초성만 있는 경우 (ㅇㅎ, ㅇㅋ, ㅂㅇ)

  for (const text of teacherLines) {
    totalChars += text.length;
    if (text.length < 2 || hangulJamoRegex.test(text)) {
      meaninglessCount++;
    }
  }

  const avgLen = totalChars / teacherLines.length;
  return avgLen < 2 || meaninglessCount >= Math.ceil(teacherLines.length / 2);
}

app.post("/api/review", async (req, res) => {
  try {
    const { title, transcript, sessionId, traitId: reqTraitId } = req.body || {};
    if (!title || !transcript) {
      return res.status(400).json({ error: "title and transcript are required" });
    }

    let traitId = reqTraitId;
    let sessionObj = null;
    if (sessionId && SESSIONS.has(sessionId)) {
      sessionObj = SESSIONS.get(sessionId);
      traitId = traitId || sessionObj.traitId;
    }

    const persona = PERSONAS.find((p) => p.title === title || p.id === sessionObj?.scenarioId);
    const trait = traitsData.find((t) => t.id === traitId) || null;

    // 대화 턴 수 계산 (선생님의 발화 개수)
    const turnMatches = (transcript.match(/\[\d+턴\]/g) || []).length;
    const targetTurns = persona?.turns || 3;
    const isEarlyTermination = turnMatches > 0 && turnMatches < targetTurns;

    const lines = transcript.split("\n");

    // 1. 의미 없는 무성의 대화 사전 검사 (LLM 호출 차단 & 규칙 기반 리포트 반환)
    if (isMeaninglessSession(transcript)) {
      console.log("[Review Pre-filter] Meaningless/single-character session detected. Returning rule-based report.");
      const defaultRubricNames = ["관계·신뢰", "소통·전달", "정서 돌봄", "안전·약속 이행", "상황 대처"];
      return res.json({
        overall: "의미 있는 대화 내용이 부족하여 역량 평가를 생성할 수 없습니다. 초성이나 단답 대신 성의 있는 대화로 다시 연습해 주세요.",
        strengths: [],
        improve: [
          {
            quote: lines.find((l) => l.includes("선생님:"))?.replace(/\[.*?\]\s*선생님:\s*/, "") || "",
            suggestion: "아이와의 대화 시 단발성 답변보다는 아이의 반응을 살피고 감정을 읽어주는 완결된 문장으로 응답해 주세요.",
            better: "우리 째깍이 반가워! 오늘 선생님이랑 재미있는 놀이 해볼까?"
          }
        ],
        rubric: defaultRubricNames.map((name) => ({ name, status: "no_opportunity", score: null })),
        traitScores: [],
        triggeredFails: [],
        keep: "아이와의 만남에서는 성의 있고 정성 어린 표현이 관계 형성의 첫걸음입니다.",
        targetTurns,
        actualTurns: turnMatches || targetTurns,
        isEarlyTermination,
        feedbackType: persona?.feedbackType || "signal",
        checklists: persona?.checklists || [],
        levelHistory: sessionObj?.levelHistory || [],
        actualTrait: trait ? { id: trait.id, label: trait.label, summary: trait.summary } : null,
        isMeaningless: true,
      });
    }

    // 발화 길이에 관한 통계 계산 (선생님 vs 아이)
    let teacherTotal = 0, teacherCount = 0;
    let childTotal = 0, childCount = 0;

    lines.forEach((line) => {
      if (line.includes("선생님:")) {
        const text = line.replace(/\[.*?\]\s*선생님:\s*/, "");
        teacherTotal += text.length;
        teacherCount++;
      } else if (line.includes("아이:")) {
        const text = line.replace(/\[.*?\]\s*아이:\s*/, "");
        childTotal += text.length;
        childCount++;
      }
    });

    const totalChars = teacherTotal + childTotal || 1;
    const utteranceStats = {
      teacherAvgLen: teacherCount ? Math.round(teacherTotal / teacherCount) : 0,
      childAvgLen: childCount ? Math.round(childTotal / childCount) : 0,
      teacherRatio: Math.round((teacherTotal / totalChars) * 100),
      childRatio: Math.round((childTotal / totalChars) * 100),
    };

    const system = composeReviewPrompt({
      title: persona?.title || title,
      transcript,
      trait,
      persona,
    });

    let result = null;
    let lastRawText = "";

    // [단계별 재시도 정책]
    // 1차: 일반 생성 시도
    // 2차: MAX_TOKENS 또는 파싱 실패 시 'evidence 30자 제한 + improve 1개 축소' 재요청 후 salvage
    // 3차: 실패 시 규칙 기반 최소 리포트 반환

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const promptSuffix = attempt === 1
          ? "위 대화를 바탕으로 피드백을 작성해주세요. 반드시 완결된 정교한 JSON 포맷으로만 응답해주세요."
          : "[축소 재요청] 이전 생성 시 토큰 한도 초과(MAX_TOKENS)가 발생했습니다. 모든 evidence는 30자 이내로 극단적으로 축소하고, improve 항목은 최대 1개만 반환하세요.";

        const response = await ai.models.generateContent({
          model: MODEL_REVIEW,
          contents: [
            { role: "user", parts: [{ text: promptSuffix }] },
          ],
          config: {
            systemInstruction: system,
            maxOutputTokens: attempt === 1 ? 4096 : 2048,
            responseMimeType: "application/json",
          },
        });

        const candidate = response.candidates?.[0];
        const finishReason = candidate?.finishReason;
        lastRawText = response.text ?? candidate?.content?.parts?.[0]?.text ?? "";

        // 1) 정상 파싱 시도
        try {
          result = extractJSON(lastRawText);
          if (result && typeof result === "object") {
            if (attempt > 1) console.log(`[Review Retry Success] Attempt ${attempt} succeeded`);
            break;
          }
        } catch {
          // extractJSON 실패 시
        }

        // 2) MAX_TOKENS 또는 파싱 실패 시 salvage 파싱 시도
        if (finishReason === "MAX_TOKENS" || !result) {
          console.warn(`[Review Warning] Attempt ${attempt} failed (finishReason: ${finishReason}). Trying salvage...`);
          try {
            result = salvageJSON(lastRawText);
            if (result && typeof result === "object") {
              console.log(`[Review Salvage Success] Successfully salvaged partial JSON on attempt ${attempt}`);
              break;
            }
          } catch (salvageErr) {
            console.error(`[Review Salvage Failed] Attempt ${attempt}:`, salvageErr.message);
          }
        }
      } catch (attemptErr) {
        console.error(`[Review AI Attempt ${attempt} Error]`, attemptErr.message);
      }
    }

    // 3차: 1~2차 및 Salvage 모두 실패 시 규칙 기반 최소 리포트 (트리거 지점 중심)
    if (!result) {
      console.warn("[Review Fallback] All retries and salvages failed. Generating rule-based minimal report.");
      result = {
        overall: "대화 평가를 생성하는 도중 네트워크/토큰 한도로 인해 최소 리포트가 생성되었습니다.",
        strengths: [],
        improve: [
          {
            quote: lines.find((l) => l.includes("선생님:"))?.replace(/\[.*?\]\s*선생님:\s*/, "") || "",
            suggestion: "아이의 반응을 주의 깊게 살피고 긍정적인 공감 표현을 늘려주세요.",
            better: "우리 째깍이 반가워! 오늘 선생님이랑 재미있게 놀아볼까?"
          }
        ],
        rubric: [],
        traitScores: [],
        triggeredFails: [],
        keep: "아이와의 대화에서는 경청과 긍정적인 공감이 가장 중요합니다.",
        isFallbackReport: true,
      };
    }

    // 2. 서버 사이드 기본 루브릭 보정 (no_opportunity 자동 채움)
    const DEFAULT_RUBRIC_NAMES = ["관계·신뢰", "소통·전달", "정서 돌봄", "안전·약속 이행", "상황 대처"];
    const returnedRubricMap = new Map((result.rubric || []).map((r) => [r.name, r]));
    const fullRubric = DEFAULT_RUBRIC_NAMES.map((name) => {
      if (returnedRubricMap.has(name)) {
        return returnedRubricMap.get(name);
      }
      return { name, status: "no_opportunity", score: null };
    });
    result.rubric = fullRubric;

    // 3. 서버 사이드 성향/시나리오 루브릭 조인 (question, max 결합 & no_opportunity 자동 채움)
    const scenarioRubrics = persona?.rubricItems || [];
    const traitRubrics = trait?.rubricItems || [];
    const combinedRubricDefs = [...scenarioRubrics, ...traitRubrics];

    if (combinedRubricDefs.length > 0) {
      const returnedTraitScoresMap = new Map((result.traitScores || []).map((ts) => [ts.id, ts]));
      const fullTraitScores = combinedRubricDefs.map((def) => {
        const item = returnedTraitScoresMap.get(def.id);
        if (item && item.status && item.status !== "no_opportunity") {
          return {
            id: def.id,
            question: def.question,
            max: def.weight,
            status: item.status,
            score: item.score,
            evidence: item.evidence || "",
          };
        }
        return {
          id: def.id,
          question: def.question,
          max: def.weight,
          status: "no_opportunity",
          score: null,
          evidence: null,
        };
      });
      result.traitScores = fullTraitScores;
    } else {
      result.traitScores = result.traitScores || [];
    }

    result.targetTurns = targetTurns;
    result.actualTurns = turnMatches || targetTurns;
    result.isEarlyTermination = isEarlyTermination;
    result.feedbackType = persona?.feedbackType || "signal";
    result.checklists = persona?.checklists || [];
    result.levelHistory = sessionObj?.levelHistory || [];
    result.utteranceStats = utteranceStats;

    if (trait) {
      result.actualTrait = {
        id: trait.id,
        label: trait.label,
        summary: trait.summary,
        behaviorSignals: trait.behaviorSignals,
        tips: trait.tips,
        exampleLines: trait.exampleLines,
      };
    }

    res.json(result);
  } catch (err) {
    console.error("[review error]", err);
    res.status(500).json({ error: "review failed" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, roleplay: MODEL_ROLEPLAY, review: MODEL_REVIEW });
});

app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  res.sendFile(path.join(distPath, "index.html"), (err) => {
    if (err) res.status(404).send("Page not found");
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[째깍 리허설] server listening on http://localhost:${PORT}`);
});
