import { useEffect, useState } from "react";
import { SCENARIOS } from "./scenarios.js";
import MatchingContact from "./components/MatchingContact.jsx";
import ClosingContact from "./components/ClosingContact.jsx";
import PrepDashboard from "./components/PrepDashboard.jsx";
import BottomTabBar from "./components/BottomTabBar.jsx";
import HomeView from "./views/HomeView.jsx";
import ChatView from "./views/ChatView.jsx";
import ReviewView from "./views/ReviewView.jsx";

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

  const handleStartRehearsalFromRec = async (scenarioId, traitId) => {
    const targetScenario = SCENARIOS.find((s) => s.id === scenarioId) || SCENARIOS[0];
    try {
      const res = await fetch("/api/rehearsal/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId: targetScenario.id,
          traitId: traitId || null,
          blindMode: false,
        }),
      });
      const data = await res.json();
      selectScenario(targetScenario, {
        sessionId: data.sessionId,
        trait: data.trait || null,
        blindMode: false,
        traitId,
        openingLine: data.openingLine || data.trait?.openingLine,
        initialLevel: data.initialLevel ?? data.trait?.initialLevel,
      });
      handleNavigate("/");
    } catch {
      selectScenario(targetScenario, { sessionId: null, trait: null, blindMode: false, traitId });
      handleNavigate("/");
    }
  };

  return (
    <div className="app">
      {currentPath === "/contact/matching" && <MatchingContact />}

      {(currentPath === "/careendtemplete" ||
        currentPath === "/careendtemplate" ||
        currentPath === "/contact/closing") && <ClosingContact />}

      {currentPath.startsWith("/prep") && (
        <PrepDashboard
          childIdParam={currentPath.replace(/^\/prep\/?/, "") || null}
          onNavigate={handleNavigate}
          onStartRehearsal={handleStartRehearsalFromRec}
        />
      )}

      {currentPath === "/" && (
        <>
          {(screen === "home" || !scenario) && (
            <HomeView
              onSelect={selectScenario}
              onNavigate={handleNavigate}
              onStartRehearsalFromRec={handleStartRehearsalFromRec}
            />
          )}
          {screen === "chat" && scenario && (
            <ChatView
              key={chatKey}
              scenario={scenario}
              sessionInfo={sessionInfo}
              onDone={finishChat}
              onExit={goHome}
            />
          )}
          {screen === "review" && scenario && (
            <ReviewView
              scenario={scenario}
              transcript={transcript}
              extraInfo={reviewExtraInfo}
              onRetry={retry}
              onHome={goHome}
            />
          )}
        </>
      )}

      <BottomTabBar currentPath={currentPath} onNavigate={handleNavigate} />
    </div>
  );
}
