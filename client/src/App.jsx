import { useEffect, useRef, useState } from "react";
import { SCENARIOS } from "./scenarios.js";
import MatchingContact from "./components/MatchingContact.jsx";
import ClosingContact from "./components/ClosingContact.jsx";
import TraitSelectorModal from "./components/TraitSelectorModal.jsx";
import TraitTipCard from "./components/TraitTipCard.jsx";
import BlindGuessModal from "./components/BlindGuessModal.jsx";

const MOOD_LABEL = {
  1: "😟 많이 불안해요",
  2: "😕 조심스러워요",
  3: "😐 지켜보는 중",
  4: "🙂 조금 편해졌어요",
  5: "😊 마음을 열었어요",
};

function speakerLabel(scenario, role) {
  if (role === "user") return "선생님";
  return scenario.group === "child" ? "아이" : "학부모";
}

function buildTranscript(scenario, log) {
  let userTurnCount = 0;
  return log
    .map((m) => {
      if (m.role === "user") {
        userTurnCount++;
        return `[${userTurnCount}턴] 선생님: ${m.content}`;
      } else {
        if (userTurnCount === 0) {
          return `[오프닝] 아이: ${m.content}`;
        } else {
          return `[${userTurnCount}턴 아이 반응] 아이: ${m.content}`;
        }
      }
    })
    .join("\n");
}

function MoodGauge({ mood }) {
  return (
    <div className="mood-gauge" aria-label={`편안함 정도 ${mood} / 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <div key={n} className={`cell${n <= mood ? " filled" : ""}`} />
      ))}
    </div>
  );
}

function BottomTabBar({ currentPath, onNavigate }) {
  const norm = currentPath === "" ? "/" : currentPath;

  const tabs = [
    { id: "/", label: "리허설", icon: "🎭" },
    { id: "/contact/matching", label: "첫 연락", icon: "🤝" },
  ];

  return (
    <nav className="bottom-tabbar" aria-label="하단 네비게이션">
      {tabs.map((tab) => {
        const isActive = norm === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={`bottom-tab-item ${isActive ? "active" : ""}`}
            onClick={() => onNavigate(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

const LEVEL_LABEL = { easy: "쉬움", mid: "보통", hard: "도전" };

const EXPLAIN = {
  child:
    "아이의 반응에 맞춰 다가가는 연습이에요. 정답을 맞히는 게 아니라, 나만의 대응을 편하게 찾아봐요.",
  parent:
    "보호자와 신뢰를 쌓는 대화 연습이에요. 어떻게 말을 건네면 좋을지 미리 감을 잡아봐요.",
};

function LevelDots({ level }) {
  return (
    <span className={`lvl ${level}`}>
      <span className="dots">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </span>
      {LEVEL_LABEL[level] || level}
    </span>
  );
}

function Home({ onSelect }) {
  const [activeCat, setActiveCat] = useState("child");
  const [sheetScenario, setSheetScenario] = useState(null);
  const [traitSelectingScenario, setTraitSelectingScenario] = useState(null);

  const childCount = SCENARIOS.filter((s) => s.group === "child").length;
  const parentCount = SCENARIOS.filter((s) => s.group === "parent").length;
  const currentScenarios = SCENARIOS.filter((s) => s.group === activeCat);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setSheetScenario(null);
        setTraitSelectingScenario(null);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleStartScenario = (targetScenario) => {
    setSheetScenario(null);
    if (targetScenario.group === "child") {
      setTraitSelectingScenario(targetScenario);
    } else {
      onSelect(targetScenario, { sessionId: null, trait: null, blindMode: false });
    }
  };

  const handleTraitConfirm = async ({ traitId, blindMode }) => {
    const targetScenario = traitSelectingScenario;
    setTraitSelectingScenario(null);

    try {
      const res = await fetch("/api/rehearsal/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId: targetScenario.id,
          traitId,
          blindMode,
        }),
      });
      const data = await res.json();
      onSelect(targetScenario, {
        sessionId: data.sessionId,
        trait: data.trait || null,
        blindMode,
        traitId,
        openingLine: data.openingLine || data.trait?.openingLine,
        initialLevel: data.initialLevel ?? data.trait?.initialLevel,
      });
    } catch {
      onSelect(targetScenario, {
        sessionId: null,
        trait: null,
        blindMode,
        traitId,
      });
    }
  };

  return (
    <>
      <div className="hero">
        <h1>🐣 째깍 리허설</h1>
        <p className="sub">
          진짜 만남 전에, 상황 하나를 골라 3~4번만 짧게 미리 연습해봐요.
        </p>
        <div className="seg" role="tablist">
          <button
            role="tab"
            data-cat="child"
            aria-selected={activeCat === "child"}
            onClick={() => setActiveCat("child")}
          >
            아이와 만나기 <span className="cnt">{childCount}</span>
          </button>
          <button
            role="tab"
            data-cat="parent"
            aria-selected={activeCat === "parent"}
            onClick={() => setActiveCat("parent")}
          >
            부모님과 대화 <span className="cnt">{parentCount}</span>
          </button>
        </div>
      </div>

      <div className="explain">{EXPLAIN[activeCat]}</div>

      <div key={activeCat} className="rehearsal-list swap">
        {currentScenarios.map((s) => (
          <button
            key={s.id}
            className="card"
            data-cat={s.group}
            data-id={s.id}
            aria-label={`${s.title} 연습 상세 보기`}
            onClick={() => setSheetScenario(s)}
          >
            <div className="c-top">
              <div className="avatar">{s.emoji}</div>
              <div className="c-main">
                <div className="c-title">{s.title}</div>
                <div className="c-situation">{s.situation}</div>
              </div>
              <div className="c-right">
                <span className="age">
                  {s.group === "child" ? "아이" : "보호자"}
                </span>
                <span className="chev">›</span>
              </div>
            </div>

            {s.tags && s.tags.length > 0 && (
              <div className="tags">
                {s.tags.map((t, idx) => (
                  <span key={idx} className="tag">
                    연습 · <b>{t}</b>
                  </span>
                ))}
              </div>
            )}

            <div className="c-meta">
              <LevelDots level={s.level} />
              <span className="sep">·</span>
              <span>약 3분</span>
              <span className="sep">·</span>
              <span>{s.turns}턴 대화</span>
              <span className="start">연습 시작 →</span>
            </div>
          </button>
        ))}
      </div>

      {/* Bottom Sheet Drawer Modal */}
      <div
        className={`scrim ${sheetScenario ? "open" : ""}`}
        onClick={(e) => {
          if (e.target.classList.contains("scrim")) setSheetScenario(null);
        }}
      >
        {sheetScenario && (
          <div
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sheetTitle"
          >
            <div className="grab" />
            <div className="sheet-head">
              <div
                className="avatar"
                style={{
                  background:
                    sheetScenario.group === "child"
                      ? "var(--child-soft)"
                      : "var(--parent-soft)",
                }}
              >
                {sheetScenario.emoji}
              </div>
              <div>
                <h2 id="sheetTitle">{sheetScenario.title}</h2>
                <div className="sh-age">
                  {(sheetScenario.group === "child" ? "아이" : "보호자") +
                    " · " +
                    (sheetScenario.situation || "").replace(/[.]$/, "")}
                </div>
              </div>
            </div>
            <p className="sheet-sit">
              이번 연습에서는{" "}
              {sheetScenario.tags ? sheetScenario.tags.join(", ") : ""}에
              집중해요. 편하게 대답하면 돼요.
            </p>
            <div className="sheet-meta">
              <span className="meta-chip">🕒 약 3분</span>
              <span className="meta-chip">💬 {sheetScenario.turns}턴 대화</span>
              <span className="meta-chip">
                난이도 {LEVEL_LABEL[sheetScenario.level] || sheetScenario.level}
              </span>
            </div>
            <button
              className="start-btn"
              onClick={() => handleStartScenario(sheetScenario)}
            >
              성향 선택 / 연습 시작 →
            </button>
            <button
              className="close-btn"
              onClick={() => setSheetScenario(null)}
            >
              닫기
            </button>
          </div>
        )}
      </div>

      {/* Trait Selector Modal */}
      {traitSelectingScenario && (
        <TraitSelectorModal
          scenario={traitSelectingScenario}
          onConfirm={handleTraitConfirm}
          onClose={() => setTraitSelectingScenario(null)}
        />
      )}
    </>
  );
}

function Chat({ scenario, sessionInfo, onDone, onExit }) {
  const { sessionId, trait, blindMode, traitId, openingLine, initialLevel } = sessionInfo || {};

  const initialMood = initialLevel !== null && initialLevel !== undefined
    ? Math.max(1, Math.min(5, 4 - initialLevel))
    : scenario.mood0;

  const initialOpening = openingLine || scenario.opening;

  const [log, setLog] = useState([
    { role: "assistant", content: initialOpening },
  ]);
  const [mood, setMood] = useState(initialMood);
  const [turnsLeft, setTurnsLeft] = useState(3);
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
      // 블라인드 모드인 경우 정답 성향을 받아와 Guess Modal 오픈
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
            <div className="turns-hint">남은 대화 {turnsLeft}회</div>
            <div className="input-row">
              <input
                type="text"
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

function Review({ scenario, transcript, extraInfo, onRetry, onHome }) {
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

  if (loading) {
    return (
      <div className="review-loading">
        <div className="spinner" />
        <p>코치가 대화를 살펴보고 있어요…</p>
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

  return (
    <>
      <div className="review-header">
        <h1>리허설 리포트</h1>
        <p className="scenario-sub">
          {scenario.emoji} {scenario.title}
          {actualTrait && <span className="trait-badge"> · {actualTrait.label}</span>}
        </p>
      </div>

      {guessResult && (
        <div className={`guess-summary-card ${guessResult.isCorrect ? "success" : "miss"}`}>
          <span className="icon">{guessResult.isCorrect ? "🎯" : "💡"}</span>
          <div>
            <b>블라인드 모드 추측 결과: {guessResult.isCorrect ? "정답!" : "오답"}</b>
            <p>실제 아이 성향: {actualTrait?.label || "비밀"}</p>
          </div>
        </div>
      )}

      {data.overall && (
        <div className="review-section overall">
          <h2>총평</h2>
          <p>{data.overall}</p>
        </div>
      )}

      {/* 성향 실패 트리거 감지 결과 */}
      {data.triggeredFails?.length > 0 && (
        <div className="review-section fail-triggers">
          <h2>⚠️ 실패 트리거 감지</h2>
          <p className="section-desc">대화 중 아이가 위축되거나 반응이 돌아선 순간입니다:</p>
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
                      <span className="q-label">🥺 아이 반응:</span> "{ft.childReaction}"
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 성향별 루브릭 항목 */}
      {data.traitScores?.length > 0 && (
        <div className="review-section trait-rubric">
          <h2>🎯 성향 맞춤 대응 평가</h2>
          <div className="trait-rubric-list">
            {data.traitScores.map((item, i) => (
              <div key={i} className="trait-rubric-card">
                <div className="tr-header">
                  <span className="tr-question">{item.question}</span>
                  <span className="tr-score">
                    <b>{item.score}</b> / {item.max || 3}점
                  </span>
                </div>
                {item.evidence && (
                  <div className="tr-evidence">
                    💬 근거: "{item.evidence}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.rubric?.length > 0 && (
        <div className="review-section">
          <h2>기본 역량 평가</h2>
          <div className="rubric-grid">
            {data.rubric.map((r, i) => (
              <div key={i} className="rubric-row">
                <span className="name">{r.name}</span>
                <MoodGauge mood={r.score} />
                <span className="score">{r.score}/5</span>
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

export default function App() {
  function getNormalizedPath() {
    const p = window.location.pathname.replace(/\/$/, "");
    return p === "" ? "/" : p;
  }

  const [currentPath, setCurrentPath] = useState(getNormalizedPath);
  const [screen, setScreen] = useState("home");
  const [scenario, setScenario] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [reviewExtraInfo, setReviewExtraInfo] = useState(null);
  const [chatKey, setChatKey] = useState(0);

  useEffect(() => {
    const onPopState = () => {
      const norm = getNormalizedPath();
      setCurrentPath(norm);
      if (norm === "/") {
        setScreen("home");
        setScenario(null);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function handleNavigate(path) {
    const norm = path.replace(/\/$/, "") === "" ? "/" : path.replace(/\/$/, "");
    window.history.pushState({}, "", norm);
    setCurrentPath(norm);
    if (norm === "/") {
      setScreen("home");
      setScenario(null);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function selectScenario(s, sInfo) {
    setScenario(s);
    setSessionInfo(sInfo || null);
    setChatKey((k) => k + 1);
    setScreen("chat");
  }

  function goHome() {
    setScreen("home");
    setScenario(null);
    setSessionInfo(null);
    setTranscript("");
    setReviewExtraInfo(null);
    handleNavigate("/");
  }

  function finishChat(t, extra) {
    setTranscript(t);
    setReviewExtraInfo(extra || null);
    setScreen("review");
  }

  function retry() {
    setChatKey((k) => k + 1);
    setScreen("chat");
  }

  return (
    <div className="app">
      {currentPath === "/contact/matching" && <MatchingContact />}

      {(currentPath === "/careendtemplete" ||
        currentPath === "/careendtemplate" ||
        currentPath === "/contact/closing") && <ClosingContact />}

      {currentPath === "/" && (
        <>
          {(screen === "home" || !scenario) && (
            <Home onSelect={selectScenario} onNavigate={handleNavigate} />
          )}
          {screen === "chat" && scenario && (
            <Chat
              key={chatKey}
              scenario={scenario}
              sessionInfo={sessionInfo}
              onDone={finishChat}
              onExit={goHome}
            />
          )}
          {screen === "review" && scenario && (
            <Review
              scenario={scenario}
              transcript={transcript}
              extraInfo={reviewExtraInfo}
              onRetry={retry}
              onHome={goHome}
            />
          )}
        </>
      )}

      {currentPath !== "/careendtemplete" &&
        currentPath !== "/careendtemplate" &&
        currentPath !== "/contact/closing" && (
          <BottomTabBar currentPath={currentPath} onNavigate={handleNavigate} />
        )}
    </div>
  );
}

