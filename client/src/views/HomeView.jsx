import { useEffect, useState } from "react";
import { SCENARIOS } from "../scenarios.js";
import LevelDots from "../components/LevelDots.jsx";
import TraitSelectorModal from "../components/TraitSelectorModal.jsx";

const LEVEL_LABEL = { easy: "쉬움", mid: "보통", hard: "도전" };

const EXPLAIN = {
  child:
    "아이의 반응에 맞춰 다가가는 연습이에요. 정답을 맞히는 게 아니라, 나만의 대응을 편하게 찾아봐요.",
  parent:
    "보호자와 신뢰를 쌓는 대화 연습이에요. 어떻게 말을 건네면 좋을지 미리 감을 잡아봐요.",
};

export default function HomeView({ onSelect }) {
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
