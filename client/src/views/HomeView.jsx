import { useEffect, useState } from "react";
import { SCENARIOS } from "../scenarios.js";
import LevelDots from "../components/LevelDots.jsx";
import TraitSelectorModal from "../components/TraitSelectorModal.jsx";
import RehearsalRecommendBanner from "../components/RehearsalRecommendBanner.jsx";
import TopHeader from "../components/TopHeader.jsx";

const LEVEL_LABEL = { easy: "쉬움", mid: "보통", hard: "도전" };

const EXPLAIN = {
  child:
    "아이의 반응에 맞춰 다가가는 연습이에요. 정답을 맞히는 게 아니라, 나만의 대응을 편하게 찾아봐요.",
  parent:
    "보호자와 신뢰를 쌓는 대화 연습이에요. 어떻게 말을 건네면 좋을지 미리 감을 잡아봐요.",
};

function IconPin() {
  return (
    <svg className="job-row-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconSmile() {
  return (
    <svg className="job-row-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
  );
}

function IconTarget() {
  return (
    <svg className="job-row-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

export default function HomeView({ onSelect, onStartRehearsalFromRec }) {
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

  const handleStartScenario = async (targetScenario) => {
    setSheetScenario(null);
    if (targetScenario.secondaryTraits && targetScenario.secondaryTraits.length > 0) {
      setTraitSelectingScenario(targetScenario);
    } else {
      try {
        const res = await fetch("/api/rehearsal/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scenarioId: targetScenario.id,
            traitId: null,
            blindMode: false,
          }),
        });
        const data = await res.json();
        onSelect(targetScenario, {
          sessionId: data.sessionId,
          trait: null,
          blindMode: false,
          openingLine: data.openingLine,
          initialLevel: data.initialLevel,
        });
      } catch {
        onSelect(targetScenario, { sessionId: null, trait: null, blindMode: false });
      }
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
      {/* Header Bar */}
      <TopHeader />

      {/* Recommended Rehearsal Banner if applicable */}
      {onStartRehearsalFromRec && (
        <RehearsalRecommendBanner onSelectRecommendation={onStartRehearsalFromRec} />
      )}

      <div className="hero">
        <h1>
          방문 전, <b>실전 리허설</b>로<br />대화 자신감을 키우세요
        </h1>
        <p className="sub">
          실제 돌봄 현장에서 마주치는 다양한 상황을 AI와 1:1로 직접 대화하며 연습해보세요. 나만의 자연스러운 소통 방식을 찾고 첫 방문의 부담감을 덜어낼 수 있어요.
        </p>

        <div className="seg" role="tablist">
          <button
            role="tab"
            data-cat="child"
            aria-selected={activeCat === "child"}
            className={activeCat === "child" ? "active" : ""}
            onClick={() => setActiveCat("child")}
          >
            아이와 만나기 <span className="cnt">{childCount}</span>
          </button>
          <button
            role="tab"
            data-cat="parent"
            aria-selected={activeCat === "parent"}
            className={activeCat === "parent" ? "active" : ""}
            onClick={() => setActiveCat("parent")}
          >
            부모님과 대화 <span className="cnt">{parentCount}</span>
          </button>
        </div>
      </div>

      {/* 째깍악어 Reference Count & Sort Bar */}
      <div className="tictoc-list-header">
        <span className="tictoc-list-count">
          <strong className="count-num">{currentScenarios.length}</strong>개의 리허설
        </span>
        <div className="tictoc-list-sort">
          <span>기본 추천순 ▼</span>
        </div>
      </div>

      <div key={activeCat} className="rehearsal-list swap">
        {currentScenarios.map((s) => (
          <button
            key={s.id}
            className="tictoc-job-card"
            data-cat={s.group}
            data-id={s.id}
            aria-label={`${s.title} 연습 상세 보기`}
            onClick={() => setSheetScenario(s)}
          >
            {/* Card Header */}
            <div className="job-card-header">
              <div className="job-card-title-row">
                <h3 className="job-card-title">{s.title}</h3>
                <span className="job-card-count-badge">총 {s.turns}턴</span>
              </div>
              <div className="job-card-time-row">
                <span>약 3분 소요 · 실전 1:1 대화</span>
              </div>
            </div>

            {/* Hairline Divider */}
            <div className="job-card-divider" />

            {/* Card Body Rows with Icons */}
            <div className="job-card-body">
              <div className="job-info-row">
                <span className="job-row-icon"><IconPin /></span>
                <span className="job-row-text">{s.situation}</span>
              </div>

              <div className="job-info-row">
                <span className="job-row-icon"><IconSmile /></span>
                <span className="job-row-text">
                  난이도 {LEVEL_LABEL[s.level] || s.level} · 놀이{" "}
                  <span className="tictoc-ai-badge">째깍AI</span>{" "}
                  <span className="tictoc-content-badge">리허설</span>
                </span>
              </div>

              {s.tags && s.tags.length > 0 && (
                <div className="job-info-row">
                  <span className="job-row-icon"><IconTarget /></span>
                  <span className="job-row-text">
                    포인트 · {s.tags.join(" · ")}
                  </span>
                </div>
              )}
            </div>

            {/* Card Footer */}
            <div className="job-card-footer">
              <div className="job-card-chips">
                {s.level === "easy" && (
                  <span className="job-chip green">난이도 쉬움</span>
                )}
                {s.level === "mid" && (
                  <span className="job-chip amber">난이도 보통</span>
                )}
                {s.level === "hard" && (
                  <span className="job-chip pink">난이도 도전</span>
                )}
              </div>

              <div className="job-card-action">
                <span className="action-start-text">연습 시작 &gt;</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* AI Conversation Disclaimer Notice Card */}
      <div className="guide-policy-card">
        <div className="notice-eyebrow">AI REHEARSAL NOTICE</div>
        <h3 className="notice-title">AI 대화 및 리허설 이용 유의사항</h3>
        <p className="notice-body">
          AI 모델의 답변은 실제 상황 및 보호자와의 대화와 다를 수 있으며, 실수나 오류가 발생할 수 있습니다. 본 서비스는 연습 참고용이며, 실제 현장에서의 최종 대화 및 대응에 대한 책임은 사용자 본인에게 있습니다.
        </p>
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
              {sheetScenario.secondaryTraits && sheetScenario.secondaryTraits.length > 0
                ? "성향 선택 / 연습 시작 →"
                : "연습 시작 →"}
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
