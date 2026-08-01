import { useEffect, useRef, useState } from "react";
import { SCENARIOS } from "./scenarios.js";
import MatchingContact from "./components/MatchingContact.jsx";
import ClosingContact from "./components/ClosingContact.jsx";

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
  return log
    .map((m) => `${speakerLabel(scenario, m.role)}: ${m.content}`)
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

function TopNavbar({ currentPath, onNavigate }) {
  const norm = currentPath === "" ? "/" : currentPath;

  return (
    <header className="main-navbar">
      <div className="navbar-brand" onClick={() => onNavigate("/")}>
        <span className="logo-icon">🐣</span>
        <span className="logo-text">쨰깍 리허설</span>
      </div>
      <nav className="navbar-tabs">
        <button
          type="button"
          className={`nav-tab-item ${norm === "/" ? "active" : ""}`}
          onClick={() => onNavigate("/")}
        >
          🎭 리허설
        </button>
        <button
          type="button"
          className={`nav-tab-item ${norm === "/contact/matching" ? "active" : ""}`}
          onClick={() => onNavigate("/contact/matching")}
        >
          🤝 첫 연락
        </button>
        <button
          type="button"
          className={`nav-tab-item ${norm === "/contact/closing" ? "active" : ""}`}
          onClick={() => onNavigate("/contact/closing")}
        >
          🏁 종료 메시지
        </button>
      </nav>
    </header>
  );
}

function Home({ onSelect, onNavigate }) {
  const children = SCENARIOS.filter((s) => s.group === "child");
  const parents = SCENARIOS.filter((s) => s.group === "parent");

  return (
    <>
      <div className="hero">
        <h1>🐣 쨰깍 리허설</h1>
        <p>진짜 만남 전에, 3~4번만 짧게 미리 연습해봐요.</p>
      </div>

      <div>
        <div className="group-label">아이와 처음 만나기</div>
        <div className="card-grid">
          {children.map((s) => (
            <ScenarioCard key={s.id} scenario={s} onSelect={onSelect} />
          ))}
        </div>
      </div>

      <div>
        <div className="group-label">부모님과 대화하기</div>
        <div className="card-grid">
          {parents.map((s) => (
            <ScenarioCard key={s.id} scenario={s} onSelect={onSelect} />
          ))}
        </div>
      </div>

      <div>
        <div className="group-label">📩 메시지 템플릿 도구</div>
        <div className="card-grid">
          <button
            type="button"
            className="scenario-card template-nav-card"
            onClick={() => onNavigate("/contact/matching")}
          >
            <span className="badge template">첫 연락</span>
            <div className="title">🤝 보호자 첫 연락 템플릿</div>
            <div className="desc">상황·말투별 첫인사 문구 생성</div>
          </button>
          <button
            type="button"
            className="scenario-card template-nav-card"
            onClick={() => onNavigate("/contact/closing")}
          >
            <span className="badge template">종료 메시지</span>
            <div className="title">🏁 활동 완료 메시지 템플릿</div>
            <div className="desc">활동 결과 및 특이사항 요약</div>
          </button>
        </div>
      </div>
    </>
  );
}

function ScenarioCard({ scenario, onSelect }) {
  return (
    <button
      className={`scenario-card ${scenario.group}`}
      onClick={() => onSelect(scenario)}
    >
      <span className={`badge ${scenario.group}`}>
        {scenario.group === "child" ? "아이" : "학부모"}
        {scenario.age ? ` · ${scenario.age}` : ""}
      </span>
      <div className="card-emoji">{scenario.emoji}</div>
      <div className="card-title">{scenario.title}</div>
      <div className="card-tag">{scenario.tag}</div>
    </button>
  );
}

function Chat({ scenario, onDone, onExit }) {
  const [log, setLog] = useState([
    { role: "assistant", content: scenario.opening },
  ]);
  const [mood, setMood] = useState(scenario.mood0);
  const [turnsLeft, setTurnsLeft] = useState(3);
  const [done, setDone] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
        body: JSON.stringify({ scenarioId: scenario.id, messages: apiMessages }),
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
          <button
            className="primary-btn full"
            onClick={() => onDone(buildTranscript(scenario, log))}
          >
            대화 종료 · 피드백 보기 ➔
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
    </div>
  );
}

function Review({ scenario, transcript, onRetry, onHome }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let unmounted = false;
    async function fetchReview() {
      try {
        const res = await fetch("/api/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: scenario.title, transcript }),
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
  }, [scenario, transcript]);

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

  return (
    <>
      <div className="review-header">
        <h1>리허설 리포트</h1>
        <p className="scenario-sub">
          {scenario.emoji} {scenario.title}
        </p>
      </div>

      {data.overall && (
        <div className="review-section overall">
          <h2>총평</h2>
          <p>{data.overall}</p>
        </div>
      )}

      {data.rubric?.length > 0 && (
        <div className="review-section">
          <h2>역량 평가</h2>
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
  const [transcript, setTranscript] = useState("");
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

  function selectScenario(s) {
    setScenario(s);
    setChatKey((k) => k + 1);
    setScreen("chat");
  }

  function goHome() {
    setScreen("home");
    setScenario(null);
    setTranscript("");
    handleNavigate("/");
  }

  function finishChat(t) {
    setTranscript(t);
    setScreen("review");
  }

  function retry() {
    setChatKey((k) => k + 1);
    setScreen("chat");
  }

  return (
    <div className="app">
      <TopNavbar currentPath={currentPath} onNavigate={handleNavigate} />

      {currentPath === "/contact/matching" && <MatchingContact />}

      {currentPath === "/contact/closing" && <ClosingContact />}

      {currentPath === "/" && (
        <>
          {(screen === "home" || !scenario) && (
            <Home onSelect={selectScenario} onNavigate={handleNavigate} />
          )}
          {screen === "chat" && scenario && (
            <Chat
              key={chatKey}
              scenario={scenario}
              onDone={finishChat}
              onExit={goHome}
            />
          )}
          {screen === "review" && scenario && (
            <Review
              scenario={scenario}
              transcript={transcript}
              onRetry={retry}
              onHome={goHome}
            />
          )}
        </>
      )}
    </div>
  );
}
