import { useState, useEffect } from "react";
import { fetchTraits, TRAIT_DEFAULTS } from "../traits.js";

export default function TraitSelectorModal({ scenario, onConfirm, onClose }) {
  const [traits, setTraits] = useState(TRAIT_DEFAULTS);
  const [selectedTraitId, setSelectedTraitId] = useState(null); // null: 기본(성향 없음)
  const [blindMode, setBlindMode] = useState(false);

  useEffect(() => {
    fetchTraits().then(setTraits);
  }, []);

  const handleStart = () => {
    onConfirm({
      traitId: selectedTraitId,
      blindMode,
    });
  };

  return (
    <div className="scrim open" onClick={(e) => e.target.classList.contains("scrim") && onClose()}>
      <div className="sheet trait-selector-sheet" role="dialog" aria-modal="true">
        <div className="grab" />
        <div className="sheet-head">
          <div className="avatar" style={{ background: "var(--child-soft, #EEF2FF)" }}>
            {scenario.emoji}
          </div>
          <div>
            <h2>아이 성향(Trait) 선택</h2>
            <div className="sh-age">
              {scenario.title} · 같은 상황이라도 아이 성향에 따라 반응이 달라집니다
            </div>
          </div>
        </div>

        <div className="mode-toggle-bar">
          <div className="mode-desc">
            {blindMode
              ? "🎯 블라인드 모드: 성향을 보지 않고 대화 후 맞춰봅니다!"
              : "💡 연습 모드: 성향과 상호작용 팁을 보며 연습합니다."}
          </div>
          <div className="seg mode-seg">
            <button
              type="button"
              className={!blindMode ? "active" : ""}
              onClick={() => setBlindMode(false)}
            >
              연습 모드
            </button>
            <button
              type="button"
              className={blindMode ? "active" : ""}
              onClick={() => setBlindMode(true)}
            >
              블라인드 모드
            </button>
          </div>
        </div>

        <div className="trait-grid">
          {/* 성향 없음 (기본) */}
          <button
            type="button"
            className={`trait-card ${selectedTraitId === null ? "selected" : ""}`}
            onClick={() => setSelectedTraitId(null)}
          >
            <div className="tc-badge">기본</div>
            <div className="tc-label">성향 없음 (기본)</div>
            <div className="tc-summary">시나리오 기본 설정대로 대화를 진행합니다.</div>
          </button>

          {/* 랜덤 */}
          <button
            type="button"
            className={`trait-card ${selectedTraitId === "random" ? "selected" : ""}`}
            onClick={() => setSelectedTraitId("random")}
          >
            <div className="tc-badge random">🎲</div>
            <div className="tc-label">랜덤 성향</div>
            <div className="tc-summary">6가지 성향 중 무작위로 적용되어 시작합니다.</div>
          </button>

          {/* 6종 성향 */}
          {traits.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`trait-card ${selectedTraitId === t.id ? "selected" : ""}`}
              onClick={() => setSelectedTraitId(t.id)}
            >
              <div className="tc-label">{t.label}</div>
              <div className="tc-summary">{t.summary}</div>
            </button>
          ))}
        </div>

        <div className="sheet-actions">
          <button type="button" className="start-btn" onClick={handleStart}>
            {blindMode ? "블라인드 리허설 시작 🎲" : "리허설 시작 ➔"}
          </button>
          <button type="button" className="close-btn" onClick={onClose}>
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
