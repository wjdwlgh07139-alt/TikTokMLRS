import { useState } from "react";
import { TRAIT_DEFAULTS } from "../traits.js";

export default function BlindGuessModal({ actualTrait, log, onComplete }) {
  const [selectedGuess, setSelectedGuess] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const isCorrect = submitted && actualTrait && selectedGuess === actualTrait.id;

  // 실제 성향의 behaviorSignals 또는 키워드가 포함된 아이 발화 추출
  const childLogs = (log || []).filter((m) => m.role === "assistant");
  
  // 근거 발화 하이라이트 매칭
  const evidenceLogs = childLogs.filter((m) => {
    if (!actualTrait) return false;
    const content = m.content || "";
    // 괄호 표현(행동)이나 키워드 검색
    return content.includes("(") || (actualTrait.behaviorSignals || []).some(sig => {
      const keywords = sig.split(" ");
      return keywords.some(k => k.length >= 2 && content.includes(k));
    });
  });

  const handleSubmit = () => {
    if (!selectedGuess) return;
    setSubmitted(true);
  };

  const handleFinish = () => {
    onComplete({
      guessedTraitId: selectedGuess,
      isCorrect,
    });
  };

  return (
    <div className="scrim open">
      <div className="sheet blind-guess-sheet" role="dialog" aria-modal="true">
        <div className="grab" />
        <div className="sheet-head">
          <div>
            <h2>아이 성향 추측하기</h2>
            <div className="sh-age">
              대화 속 아이의 행동과 말투를 보고 어떤 성향이었는지 맞춰보세요!
            </div>
          </div>
        </div>

        {!submitted ? (
          <>
            <div className="guess-grid">
              {TRAIT_DEFAULTS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`guess-card ${selectedGuess === t.id ? "selected" : ""}`}
                  onClick={() => setSelectedGuess(t.id)}
                >
                  <div className="gc-label">{t.label}</div>
                  <div className="gc-summary">{t.summary}</div>
                </button>
              ))}
            </div>

            <div className="sheet-actions">
              <button
                type="button"
                className="start-btn"
                disabled={!selectedGuess}
                onClick={handleSubmit}
              >
                정답 제출하기 ➔
              </button>
            </div>
          </>
        ) : (
          <div className="guess-result-view">
            <div className={`result-banner ${isCorrect ? "success" : "miss"}`}>
              <div className="res-icon">{isCorrect ? "🎉" : "💡"}</div>
              <div className="res-title">
                {isCorrect ? "정답입니다!" : "아쉽네요!"}
              </div>
              <div className="res-desc">
                선택한 성향: <b>{TRAIT_DEFAULTS.find((t) => t.id === selectedGuess)?.label}</b>
                <br />
                실제 아이 성향: <b className="highlight-text">{actualTrait?.label}</b>
              </div>
            </div>

            {actualTrait && (
              <div className="evidence-section">
                <h3>🔍 근거 발화 하이라이트</h3>
                <p className="ev-sub">아이의 말과 행동 속에 성향 신호가 담겨있었어요:</p>
                <div className="evidence-logs">
                  {(evidenceLogs.length > 0 ? evidenceLogs : childLogs.slice(0, 2)).map(
                    (m, idx) => (
                      <div key={idx} className="ev-bubble">
                        <span className="ev-badge">아이 발화</span>
                        <div className="ev-content">{m.content}</div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            <div className="sheet-actions">
              <button type="button" className="start-btn" onClick={handleFinish}>
                상세 피드백 리포트 보기 ➔
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
