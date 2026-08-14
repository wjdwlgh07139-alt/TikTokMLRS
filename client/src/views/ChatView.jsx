import { useEffect, useRef, useState } from "react";
import MoodGauge from "../components/MoodGauge.jsx";
import TraitTipCard from "../components/TraitTipCard.jsx";
import BlindGuessModal from "../components/BlindGuessModal.jsx";
import { MAX_USER_INPUT_CHARS, WARN_USER_INPUT_CHARS, WARN_INPUT_MESSAGE } from "../constants.js";

const MOOD_LABEL = {
  1: "😟 많이 불안해요",
  2: "😕 조심스러워요",
  3: "😐 지켜보는 중",
  4: "🙂 조금 편해졌어요",
  5: "😊 마음을 열었어요",
};

function speakerLabel(scenario, role) {
  if (role === "user") return "선생님";
  return scenario.group === "parent" ? "보호자" : "아이";
}

function buildTranscript(scenario, log) {
  const isParent = scenario.group === "parent";
  const label = isParent ? "보호자" : "아이";
  let userTurnCount = 0;
  return log
    .map((m) => {
      if (m.role === "user") {
        userTurnCount++;
        return `[${userTurnCount}턴] 선생님: ${m.content}`;
      } else {
        if (userTurnCount === 0) {
          return `[오프닝] ${label}: ${m.content}`;
        } else {
          return `[${userTurnCount}턴 ${label} 반응] ${label}: ${m.content}`;
        }
      }
    })
    .join("\n");
}

export default function ChatView({ scenario, sessionInfo, onDone, onExit }) {
  const { sessionId, trait, blindMode, traitId, openingLine, initialLevel } = sessionInfo || {};

  const initialMood = initialLevel !== null && initialLevel !== undefined
    ? Math.max(1, Math.min(5, 4 - initialLevel))
    : scenario.mood0;

  const initialOpening = openingLine || scenario.opening;

  const [log, setLog] = useState([
    { role: "assistant", content: initialOpening },
  ]);
  const [mood, setMood] = useState(initialMood);
  const [turnsLeft, setTurnsLeft] = useState(scenario.turns || 3);
  const [done, setDone] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showGuessModal, setShowGuessModal] = useState(false);
  const [fetchedActualTrait, setFetchedActualTrait] = useState(null);

  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [log, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading || done) return;

    setError("");
    const userMsg = { role: "user", content: text };
    const nextLog = [...log, userMsg];
    setLog(nextLog);
    setInput("");
    setLoading(true);

    try {
      const apiMessages = nextLog
        .slice(1)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/roleplay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId: scenario.id,
          sessionId,
          traitId,
          messages: apiMessages,
        }),
      });

      if (!res.ok) throw new Error("server error");
      const data = await res.json();

      setLog((prev) => [...prev, { role: "assistant", content: data.reply }]);
      setMood(data.mood ?? mood);
      setTurnsLeft(data.turnsLeft ?? 0);
      if (data.done) setDone(true);
    } catch {
      setError("응답을 불러오지 못했어요. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const handleFinishClick = async () => {
    const transcriptText = buildTranscript(scenario, log);
    if (blindMode) {
      try {
        const res = await fetch("/api/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: scenario.title,
            transcript: transcriptText,
            sessionId,
            traitId,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          setFetchedActualTrait(json.actualTrait || null);
        }
      } catch {
        // fallback
      }
      setShowGuessModal(true);
    } else {
      onDone(transcriptText, { sessionId, traitId, trait });
    }
  };

  const handleGuessComplete = (guessResult) => {
    setShowGuessModal(false);
    const transcriptText = buildTranscript(scenario, log);
    onDone(transcriptText, {
      sessionId,
      traitId,
      trait: fetchedActualTrait,
      guessResult,
    });
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <button className="icon-btn" onClick={onExit} aria-label="나가기">
          ✕
        </button>
        <div className="chat-title">
          <span className="emoji">{scenario.emoji}</span>
          <span className="title">{scenario.title}</span>
        </div>
        <MoodGauge mood={mood} />
      </div>

      {!blindMode && trait && <TraitTipCard trait={trait} />}

      <div className="scenario-banner">
        <p className="mood-text">{MOOD_LABEL[mood] || ""}</p>
        <p className="setup-text">{scenario.setup}</p>
      </div>

      <div className="chat-log">
        {log.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.role}`}>
            <div className="speaker">{speakerLabel(scenario, m.role)}</div>
            <div className="content">{m.content}</div>
          </div>
        ))}
        {loading && (
          <div className="chat-bubble assistant loading">
            <div className="speaker">{speakerLabel(scenario, "assistant")}</div>
            <div className="content">생각하는 중…</div>
          </div>
        )}
        <div ref={logEndRef} />
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="chat-input-area">
        {done ? (
          <button className="primary-btn full" onClick={handleFinishClick}>
            {blindMode ? "대화 종료 · 성향 추측하기 🎲" : "대화 종료 · 피드백 보기 ➔"}
          </button>
        ) : (
          <>
            <div className="turns-hint-bar">
              <span className="turns-hint">남은 대화 {turnsLeft}회</span>
              <span className={`char-counter ${input.length >= WARN_USER_INPUT_CHARS ? "warn" : ""}`}>
                {input.length} / {MAX_USER_INPUT_CHARS}자
              </span>
            </div>
            {input.length >= WARN_USER_INPUT_CHARS && (
              <div className="char-warn-banner">
                💡 {WARN_INPUT_MESSAGE}
              </div>
            )}
            <div className="input-row">
              <input
                type="text"
                maxLength={MAX_USER_INPUT_CHARS}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="답변을 입력하세요…"
                disabled={loading}
              />
              <button
                className="primary-btn"
                onClick={send}
                disabled={loading || !input.trim()}
              >
                전송
              </button>
            </div>
          </>
        )}
      </div>

      {showGuessModal && (
        <BlindGuessModal
          actualTrait={fetchedActualTrait}
          log={log}
          onComplete={handleGuessComplete}
        />
      )}
    </div>
  );
}
