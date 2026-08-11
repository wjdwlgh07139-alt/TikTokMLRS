import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import { GoogleGenAI } from "@google/genai";
import { PERSONAS, baseSystem, reviewSystem } from "./personas.js";
import { composeSystemPrompt, composeReviewPrompt } from "./services/promptComposer.js";

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

app.get("/api/traits", (req, res) => {
  const list = traitsData.map(({ id, label, summary }) => ({
    id,
    label,
    summary,
  }));
  res.json(list);
});

app.post("/api/rehearsal/session", (req, res) => {
  const { scenarioId, traitId: rawTraitId, blindMode = false } = req.body || {};
  let traitId = rawTraitId;

  if (traitId === "random") {
    traitId = getRandomTraitId();
  }

  const trait = traitsData.find((t) => t.id === traitId) || null;
  const sessionId = "sess_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);

  const sessionObj = {
    sessionId,
    scenarioId,
    traitId: trait ? trait.id : null,
    blindMode: Boolean(blindMode),
    createdAt: Date.now(),
  };

  SESSIONS.set(sessionId, sessionObj);

  const responseData = {
    sessionId,
  };

  if (trait && !blindMode) {
    responseData.trait = {
      id: trait.id,
      label: trait.label,
      tips: trait.tips,
      exampleLines: trait.exampleLines,
    };
  }

  res.json(responseData);
});

app.post("/api/roleplay", async (req, res) => {
  try {
    const { scenarioId: reqScenarioId, sessionId, traitId: reqTraitId, messages } = req.body || {};

    let scenarioId = reqScenarioId;
    let traitId = reqTraitId;
    let blindMode = false;

    if (sessionId && SESSIONS.has(sessionId)) {
      const sess = SESSIONS.get(sessionId);
      scenarioId = scenarioId || sess.scenarioId;
      traitId = traitId || sess.traitId;
      blindMode = sess.blindMode;
    }

    if (traitId === "random") {
      traitId = getRandomTraitId();
    }

    const persona = PERSONAS.find((p) => p.id === scenarioId);
    if (!persona) {
      return res.status(400).json({ error: "invalid scenarioId" });
    }

    const trait = traitsData.find((t) => t.id === traitId) || null;

    const convo = Array.isArray(messages) ? messages : [];
    const userTurns = convo.filter((m) => m.role === "user").length;
    const maxTurns = persona.turns || MAX_TURNS;
    const isFinal = userTurns >= maxTurns;

    let system = composeSystemPrompt({
      scenarioPersona: persona.persona,
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
    if (sessionId && SESSIONS.has(sessionId)) {
      const sess = SESSIONS.get(sessionId);
      traitId = traitId || sess.traitId;
    }

    const trait = traitsData.find((t) => t.id === traitId) || null;
    const system = composeReviewPrompt({ title, transcript, trait });

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
