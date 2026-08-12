export default function LevelTrajectoryChart({ history }) {
  if (!history || history.length === 0) return null;
  const levelLabels = { 0: "0 (편안)", 1: "1 (조심)", 2: "2 (위축)", 3: "3 (거부)" };

  return (
    <div className="review-section level-trajectory">
      <h2>📈 아이의 감정 궤적 (내부 레벨)</h2>
      <p className="section-desc">겉으로 협조적이어도 마음의 닫힘 정도는 다를 수 있어요:</p>
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
