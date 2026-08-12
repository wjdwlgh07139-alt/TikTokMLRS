import express from "express";
import fs from "fs";
import path from "path";
import { PERSONAS } from "../personas.js";
import { composeSystemPrompt, composeReviewPrompt } from "../services/promptComposer.js";
import { extractJSON, salvageReply, salvageJSON } from "../utils/jsonParser.js";

const MODEL_ROLEPLAY = "gemini-3.5-flash-lite";
const MODEL_REVIEW = "gemini-3.5-flash-lite";
const MAX_TURNS = 3;
const MAX_USER_INPUT_CHARS = 500;

function clampMood(mood) {
  const n = Number(mood);
  if (!Number.isFinite(n)) return 3;
  return Math.min(5, Math.max(1, Math.round(n)));
}

function toGeminiContents(messages) {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

function isMeaninglessSession(transcript) {
  const teacherLines = transcript
    .split("\n")
    .filter((l) => l.includes("선생님:"))
    .map((l) => l.replace(/\[.*?\]\s*선생님:\s*/, "").trim());

  if (teacherLines.length === 0) return true;

  let totalChars = 0;
  let meaninglessCount = 0;
  const hangulJamoRegex = /^[\u3131-\u318E\s\.\?!]+$/;

  for (const text of teacherLines) {
    totalChars += text.length;
    if (text.length < 2 || hangulJamoRegex.test(text)) {
      meaninglessCount++;
    }
  }

  const avgLen = totalChars / teacherLines.length;
  return avgLen < 2 || meaninglessCount >= Math.ceil(teacherLines.length / 2);
}

export function createRehearsalRouter(ai, serverDir) {
  const router = express.Router();
  const SESSIONS = new Map();

  const traitsData = JSON.parse(
    fs.readFileSync(path.join(serverDir, "./data/traits.json"), "utf-8")
  );

  function getRandomTraitId() {
    const ids = traitsData.map((t) => t.id);
    return ids[Math.floor(Math.random() * ids.length)];
  }

  router.get("/scenarios", (req, res) => {
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

  router.get("/traits", (req, res) => {
    const list = traitsData.map(({ id, label, summary }) => ({
      id,
      label,
      summary,
    }));
    res.json(list);
  });

  router.post("/rehearsal/session", (req, res) => {
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

  router.post("/roleplay", async (req, res) => {
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
        system += "\n\n[중요] 이번이 마지막 응답입니다. 자연스럽게 마무리하고 done=true로 하세요.";
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

  router.post("/review", async (req, res) => {
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

      const turnMatches = (transcript.match(/\[\d+턴\]/g) || []).length;
      const targetTurns = persona?.turns || 3;
      const isEarlyTermination = turnMatches > 0 && turnMatches < targetTurns;

      const lines = transcript.split("\n");

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
              better: "우리 째깍이 반가워! 오늘 선생님이랑 재미있는 놀이 해볼까?",
            },
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

      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const promptSuffix = attempt === 1
            ? "위 대화를 바탕으로 피드백을 작성해주세요. 반드시 완결된 정교한 JSON 포맷으로만 응답해주세요."
            : "[축소 재요청] 이전 생성 시 토큰 한도 초과(MAX_TOKENS)가 발생했습니다. 모든 evidence는 30자 이내로 극단적으로 축소하고, improve 항목은 최대 1개만 반환하세요.";

          const response = await ai.models.generateContent({
            model: MODEL_REVIEW,
            contents: [{ role: "user", parts: [{ text: promptSuffix }] }],
            config: {
              systemInstruction: system,
              maxOutputTokens: attempt === 1 ? 4096 : 2048,
              responseMimeType: "application/json",
            },
          });

          const candidate = response.candidates?.[0];
          const finishReason = candidate?.finishReason;
          lastRawText = response.text ?? candidate?.content?.parts?.[0]?.text ?? "";

          try {
            result = extractJSON(lastRawText);
            if (result && typeof result === "object") {
              if (attempt > 1) console.log(`[Review Retry Success] Attempt ${attempt} succeeded`);
              break;
            }
          } catch {
            // extractJSON failed
          }

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

      if (!result) {
        console.warn("[Review Fallback] All retries and salvages failed. Generating rule-based minimal report.");
        result = {
          overall: "대화 평가를 생성하는 도중 네트워크/토큰 한도로 인해 최소 리포트가 생성되었습니다.",
          strengths: [],
          improve: [
            {
              quote: lines.find((l) => l.includes("선생님:"))?.replace(/\[.*?\]\s*선생님:\s*/, "") || "",
              suggestion: "아이의 반응을 주의 깊게 살피고 긍정적인 공감 표현을 늘려주세요.",
              better: "우리 째깍이 반가워! 오늘 선생님이랑 재미있게 놀아볼까?",
            },
          ],
          rubric: [],
          traitScores: [],
          triggeredFails: [],
          keep: "아이와의 대화에서는 경청과 긍정적인 공감이 가장 중요합니다.",
          isFallbackReport: true,
        };
      }

      const DEFAULT_RUBRIC_NAMES = ["관계·신뢰", "소통·전달", "정서 돌봄", "안전·약속 이행", "상황 대처"];
      const returnedRubricMap = new Map((result.rubric || []).map((r) => [r.name, r]));
      const fullRubric = DEFAULT_RUBRIC_NAMES.map((name) => {
        if (returnedRubricMap.has(name)) {
          return returnedRubricMap.get(name);
        }
        return { name, status: "no_opportunity", score: null };
      });
      result.rubric = fullRubric;

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

  return router;
}
