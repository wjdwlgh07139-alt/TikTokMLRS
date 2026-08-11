import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import { GoogleGenAI } from "@google/genai";
import { PERSONAS, baseSystem, reviewSystem } from "./personas.js";
import { composeSystemPrompt, composeReviewPrompt } from "./services/promptComposer.js";
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
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("no JSON braces found");
  }
  return JSON.parse(cleaned.slice(start, end + 1));
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
  { id: "child-a", childName: "구O윤", ageMonths: 27, gender: "여아", noteCount: 12, lastDate: "2026-10-01" },
  { id: "child-b", childName: "김O준", ageMonths: 30, gender: "남아", noteCount: 5, lastDate: "2026-09-29" },
  { id: "child-c", childName: "이O아", ageMonths: 24, gender: "여아", noteCount: 2, lastDate: "2026-10-08" },
  { id: "child-d", childName: "박O진", ageMonths: 28, gender: "남아", noteCount: 0, lastDate: null },
];

function loadExtractedNotes(childId) {
  const filePath = path.join(__dirname, `../fixtures/extracted/${childId}.json`);
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch {
      return [];
    }
  }
  return [];
}

app.get("/api/prep/children", (req, res) => {
  res.json(CHILDREN_METADATA);
});

app.get("/api/prep/children/:childId", (req, res) => {
  const { childId } = req.params;
  const childInfo = CHILDREN_METADATA.find((c) => c.id === childId);
  if (!childInfo) {
    return res.status(404).json({ error: "child not found" });
  }

  const extractedNotes = loadExtractedNotes(childId);
  const dashboard = buildPrepDashboard(childInfo, extractedNotes);
  res.json(dashboard);
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

app.get("/api/prep/recommendations", (req, res) => {
  const allRecs = [];
  CHILDREN_METADATA.forEach((child) => {
    const extractedNotes = loadExtractedNotes(child.id);
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
  });
  res.json(allRecs);
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

    // 발화 길이에 관한 통계 계산 (선생님 vs 아이)
    const lines = transcript.split("\n");
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

    const response = await ai.models.generateContent({
      model: MODEL_REVIEW,
      contents: [
        { role: "user", parts: [{ text: "위 대화를 바탕으로 피드백을 작성해주세요." }] },
      ],
      config: {
        systemInstruction: system,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: "high" },
      },
    });

    const text = response.text ?? "";
    let result;
    try {
      result = extractJSON(text);
    } catch (err) {
      console.error("[review parse error]", err, text);
      return res.status(500).json({ error: "review parsing failed" });
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
