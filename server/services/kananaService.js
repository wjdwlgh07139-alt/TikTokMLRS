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
아래 돌봄 노트 원문을 읽고 JSON 포맷으로 정보를 추출하세요.

[필수 원칙]
1. 모든 항목에 원문에서 직접 인용한 quote 필드를 반드시 포함하세요.
2. 건강 관련 서술(콧물, 기침, 발열 등)은 추출에서 완전 제외하세요.
3. 역할놀이 대사(예: "콧물이 많이 나요"라며 병원놀이 연기)를 실제 증상이나 건강 정보로 오인하지 마세요.
4. 부모 관련 인사말("*어머니 음료수 감사합니다")은 제외하세요.

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

JSON 포맷으로만 응답하세요:`;

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
