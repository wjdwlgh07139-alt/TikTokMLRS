export default function LevelTrajectoryChart({ history, isParent }) {
  if (!history || history.length === 0) return null;
  const childLevelLabels = { 0: "0 (편안)", 1: "1 (조심)", 2: "2 (위축)", 3: "3 (거부)" };
  const parentLevelLabels = { 0: "0 (안심)", 1: "1 (확인)", 2: "2 (우려)", 3: "3 (불안)" };
  const levelLabels = isParent ? parentLevelLabels : childLevelLabels;

  return (
    <div className="review-section level-trajectory">
      <h2>📈 {isParent ? "보호자의 감정/신뢰 궤적 (내부 레벨)" : "아이의 감정 궤적 (내부 레벨)"}</h2>
      <p className="section-desc">
        {isParent
          ? "대화가 진행됨에 따라 보호자님이 느끼는 안심과 신뢰의 변화입니다:"
          : "겉으로 협조적이어도 마음의 닫힘 정도는 다를 수 있어요:"}
      </p>
      <div className="trajectory-bars">
        {history.map((h, i) => (
          <div key={i} className="tr-bar-item">
            <span className="tr-turn">{h.turn === 0 ? "오프닝" : `${h.turn}턴`}</span>
            <div className="tr-track">
              <div
                className={`tr-fill lvl-${h.level}`}
                style={{ width: `${((h.level + 1) / 4) * 100}%` }}
              >
                {levelLabels[h.level] || `Level ${h.level}`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
