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
      <span className="emoji">{scenario.emoji}</span>
      <span className="title">{scenario.title}</span>
      <span className="tag">{scenario.tag}</span>
    </button>
  );
}

function Chat({ scenario, onDone, onExit }) {
  const [log, setLog] = useState([{ role: "assistant", content: scenario.opening }]);
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

    const nextLog = [...log, { role: "user", content: text }];
    setLog(nextLog);
    setInput("");
    setError("");
    setLoading(true);

    try {
      // log[0]은 프론트가 하드코딩한 opening 대사이므로 서버로 보낼 messages에서는 제외한다.
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
    } catch (err) {
      setError("연결에 문제가 생겼어요. 다시 시도해주세요.");
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
    <>
      <div className="topbar">
        <button className="back" onClick={onExit} aria-label="목록으로 돌아가기">
          ←
        </button>
        <div className="info">
          <div className="title">
            {scenario.emoji} {scenario.title}
          </div>
          <div className="tag">{scenario.tag}</div>
        </div>
        <MoodGauge mood={mood} />
      </div>

      <div className="setup-card">{scenario.setup}</div>

      <div className="chat-log">
        {log.map((m, i) => (
          <div key={i} className={`bubble-row ${m.role} ${scenario.group}`}>
            <div className="bubble">{m.content}</div>
          </div>
        ))}
        {loading && <div className="typing">{speakerLabel(scenario, "assistant")}가 생각 중…</div>}
        <div ref={logEndRef} />
      </div>

      {error && <div className="error-banner">{error}</div>}

      {!done ? (
        <>
          <div className="composer">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="이렇게 말해볼게요…"
              disabled={loading}
              rows={1}
            />
            <button onClick={send} disabled={loading || !input.trim()}>
              보내기
            </button>
          </div>
          <div className="turns-left">남은 대화 {turnsLeft}번</div>
        </>
      ) : (
        <div className="actions-row">
          <button className="primary-btn" onClick={() => onDone(buildTranscript(scenario, log))}>
            피드백 받기
          </button>
        </div>
      )}
    </>
  );
}

function Review({ scenario, transcript, onRetry, onHome }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await fetch("/api/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: scenario.title, transcript }),
        });
        if (!res.ok) throw new Error("review failed");
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError("피드백을 불러오지 못했어요. 다시 시도해주세요.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [scenario, transcript]);

  if (loading) {
    return (
      <div className="review-section">
        <p className="overall-text">코치가 대화를 살펴보고 있어요…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="review-section">
        <div className="error-banner">{error || "피드백을 불러오지 못했어요."}</div>
        <div className="actions-row" style={{ marginTop: 12 }}>
          <button className="ghost-btn" onClick={onHome}>
            처음으로
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="review-section">
        <h2>총평</h2>
        <p className="overall-text">{data.overall}</p>
      </div>

      <div className="review-section">
        <h2>쨰깍 돌봄 5축</h2>
        {(data.rubric || []).map((r) => (
          <div className="rubric-row" key={r.name}>
            <span className="name">{r.name}</span>
            <span className="bar-track">
              <span className="bar-fill" style={{ width: `${(r.score / 5) * 100}%` }} />
            </span>
            <span className="score">{r.score}/5</span>
          </div>
        ))}
      </div>

      {data.strengths?.length > 0 && (
        <div className="review-section">
          <h2>잘한 점</h2>
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
  const [currentPath, setCurrentPath] = useState(
    window.location.pathname.replace(/\/$/, "")
  );

  useEffect(() => {
    const onPopState = () => {
      setCurrentPath(window.location.pathname.replace(/\/$/, ""));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function handleNavigate(path) {
    window.history.pushState({}, "", path);
    setCurrentPath(path.replace(/\/$/, ""));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (currentPath === "/contact/matching") {
    return <MatchingContact onNavigate={handleNavigate} />;
  }

  if (currentPath === "/contact/closing") {
    return <ClosingContact onNavigate={handleNavigate} />;
  }

  const [screen, setScreen] = useState("home");
  const [scenario, setScenario] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [chatKey, setChatKey] = useState(0);

  function selectScenario(s) {
    setScenario(s);
    setChatKey((k) => k + 1);
    setScreen("chat");
  }

  function goHome() {
    setScreen("home");
    setScenario(null);
    setTranscript("");
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
      {screen === "home" && (
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
    </div>
  );
}

