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

  // secondaryTraits가 지정된 경우 해당 보조 성향만 필터링
  const secondaryAllowed = scenario?.secondaryTraits || [];
  const filteredTraits = secondaryAllowed.length > 0
    ? traits.filter((t) => secondaryAllowed.includes(t.id))
    : traits;

  return (
    <div className="scrim open" onClick={(e) => e.target.classList.contains("scrim") && onClose()}>
      <div className="sheet trait-selector-sheet" role="dialog" aria-modal="true">
        <div className="grab" />
        <div className="sheet-head">
          <div>
            <h2>아이 보조 성향(Trait) 선택</h2>
            <div className="sh-age">
              {scenario.title} · 시나리오에 결합할 보조 성향을 선택해 보세요.
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

          {/* 보조 성향 목록 */}
          {filteredTraits.map((t) => (
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
