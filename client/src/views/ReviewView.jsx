import { useEffect, useState } from "react";
import MoodGauge from "../components/MoodGauge.jsx";
import LevelTrajectoryChart from "../components/LevelTrajectoryChart.jsx";

export default function ReviewView({ scenario, transcript, extraInfo, onRetry, onHome }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { sessionId, traitId, guessResult } = extraInfo || {};

  useEffect(() => {
    let unmounted = false;
    async function fetchReview() {
      try {
        const res = await fetch("/api/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: scenario.title,
            transcript,
            sessionId,
            traitId,
          }),
        });
        if (!res.ok) throw new Error("review failed");
        const json = await res.json();
        if (!unmounted) setData(json);
      } catch {
        if (!unmounted) setError("피드백을 생성하지 못했어요.");
      } finally {
        if (!unmounted) setLoading(false);
      }
    }
    fetchReview();
    return () => {
      unmounted = true;
    };
  }, [scenario, transcript, sessionId, traitId]);

  const isParent = scenario.group === "parent" || scenario.category === "parent";
  const counterpartName = isParent ? "보호자" : "아이";

  if (loading) {
    return (
      <div className="review-loading-container">
        <div className="review-loading-card">
          <div className="coach-avatar-wrapper">
            <div className="coach-pulse-ring"></div>
            <div className="coach-avatar-icon" style={{ fontSize: "20px", fontWeight: 800 }}>AI</div>
          </div>

          <h3 className="review-loading-title">
            코치가 대화를 살펴보고 있어요<span>.</span><span>.</span><span>.</span>
          </h3>

          <p className="review-loading-subtitle">
            {isParent
              ? "선생님의 경청 태도, 보호자 맞춤 설명 및 신뢰 형성 대화를 종합 리포트로 분석 중입니다."
              : "선생님의 발화 템포, 교구 활용 및 아이 성향 맞춤 반응을 종합 리포트로 분석 중입니다."}
          </p>

          <div className="loading-progress-bar">
            <div className="loading-progress-fill"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="review-error">
        <p>{error}</p>
        <button className="primary-btn" onClick={onHome}>
          처음으로 돌아가기
        </button>
      </div>
    );
  }

  const actualTrait = data?.actualTrait;
  const isCheerful = scenario.id === "cheerful";

  return (
    <>
      <div className="review-header">
        <h1>리허설 리포트</h1>
        <p className="scenario-sub">
          {scenario.emoji} {scenario.title}
          {actualTrait && <span className="trait-badge"> · {actualTrait.label}</span>}
        </p>
      </div>

      {data.isEarlyTermination && (
        <div className="early-termination-banner">
          <span className="icon">⚠️</span>
          <div className="text">
            <b>목표 턴 수({data.targetTurns}턴)에 도달하기 전에 대화가 종료되었습니다.</b>
            <p>역량 평가 점수가 생략되며, 대화 내용과 감정 변화 궤적을 중심으로 확인하세요.</p>
          </div>
        </div>
      )}

      {guessResult && (
        <div className={`guess-summary-card ${guessResult.isCorrect ? "success" : "miss"}`}>
          <span className="icon">{guessResult.isCorrect ? "🎯" : "💡"}</span>
          <div>
            <b>블라인드 모드 추측 결과: {guessResult.isCorrect ? "정답!" : "오답"}</b>
            <p>실제 {counterpartName} 성향: {actualTrait?.label || "비밀"}</p>
          </div>
        </div>
      )}

      {data.overall && (
        <div className="review-section overall-card">
          <div className="overall-header">
            <span className="overall-icon">📝</span>
            <h2>총평</h2>
          </div>
          <p className="overall-body">{data.overall}</p>
        </div>
      )}

      {data.levelHistory?.length > 0 && (
        <LevelTrajectoryChart history={data.levelHistory} isParent={isParent} />
      )}

      {data.feedbackType === "silent" && data.checklists?.length > 0 && (
        <div className="review-section silent-checklists">
          <h2>🔍 상호작용 체크리스트</h2>
          <p className="section-desc">
            {isParent
              ? "보호자님이 직접적인 우려를 표현하지 않더라도 점검해야 할 핵심 대화 요소입니다:"
              : "아이가 부정 신호를 주지 않더라도 체크해야 할 핵심 요소입니다:"}
          </p>
          <div className="checklist-grid">
            {data.checklists.map((c, i) => (
              <div key={i} className="checklist-item">
                <span className="chk-icon">✅</span>
                <span className="chk-label">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.feedbackType === "signal" && data.triggeredFails?.length > 0 && (
        <div className="review-section fail-triggers">
          <h2>⚠️ 실패 트리거 감지</h2>
          <p className="section-desc">
            {isParent
              ? "대화 중 보호자님이 당황하거나 신뢰가 흔들린 순간입니다:"
              : "대화 중 아이가 위축되거나 반응이 돌아선 순간입니다:"}
          </p>
          {data.triggeredFails.map((ft, i) => (
            <div key={i} className="fail-trigger-card">
              <div className="ft-header">
                <span className="turn-tag">{ft.turn ? `대화 ${ft.turn}턴` : "대화 중"}</span>
                <span className="trigger-text">{ft.trigger}</span>
              </div>
              {(ft.userQuote || ft.childReaction) && (
                <div className="ft-quotes">
                  {ft.userQuote && (
                    <div className="ft-quote user">
                      <span className="q-label">💬 선생님 발화:</span> "{ft.userQuote}"
                    </div>
                  )}
                  {ft.childReaction && (
                    <div className="ft-quote child">
                      <span className="q-label">🥺 {isParent ? "보호자 반응:" : "아이 반응:"}</span> "{ft.childReaction}"
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {data.traitScores?.length > 0 && !isCheerful && !data.isEarlyTermination && (
        <div className="review-section trait-rubric">
          <h2>🎯 {isParent ? "보호자 상황 맞춤 대응 평가" : "성향/시나리오 맞춤 대응 평가"}</h2>
          <div className="trait-rubric-list">
            {data.traitScores.map((item, i) => (
              <div key={i} className="trait-rubric-card">
                <div className="tr-header">
                  <span className="tr-question">{item.question}</span>
                  <span className="tr-score">
                    {item.status === "no_opportunity" ? (
                      <span className="no-opp-tag">➖ 기회 없음 (평가 제외)</span>
                    ) : item.status === "missed" ? (
                      <span className="missed-tag">⚠️ 기회 놓침 (0점)</span>
                    ) : (
                      <>
                        <b>{item.score}</b> / {item.max || 3}점
                      </>
                    )}
                  </span>
                </div>
                {item.evidence && (
                  <div className="tr-evidence">💬 근거: "{item.evidence}"</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!isCheerful && !data.isEarlyTermination && data.rubric?.length > 0 && (
        <div className="review-section">
          <h2>기본 역량 평가</h2>
          <div className="rubric-grid">
            {data.rubric.map((r, i) => (
              <div key={i} className="rubric-row">
                <span className="name">{r.name}</span>
                {r.status === "no_opportunity" || r.score === null ? (
                  <span className="no-opp-tag">➖ 기회 없음</span>
                ) : (
                  <>
                    <MoodGauge mood={r.score} />
                    <span className="score">{r.score}/5</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.strengths?.length > 0 && (
        <div className="review-section">
          <h2>좋았던 점</h2>
          {data.strengths.map((s, i) => (
            <div className="feedback-item strength" key={i}>
              <p className="quote">"{s.quote}"</p>
              <p className="body">{s.why}</p>
            </div>
          ))}
        </div>
      )}

      {data.improve?.length > 0 && (
        <div className="review-section">
          <h2>다음엔 이렇게</h2>
          {data.improve.map((s, i) => (
            <div className="feedback-item improve" key={i}>
              <p className="quote">"{s.quote}"</p>
              <p className="body">{s.suggestion}</p>
              <p className="better">💬 {s.better}</p>
            </div>
          ))}
        </div>
      )}

      {data.keep && <div className="keep-card">🌱 {data.keep}</div>}

      <div className="actions-row">
        <button className="ghost-btn" onClick={onHome}>
          다른 시나리오
        </button>
        <button className="primary-btn" onClick={onRetry}>
          다시 연습하기
        </button>
      </div>
    </>
  );
}
