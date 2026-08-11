import { useState } from "react";

export default function TraitTipCard({ trait }) {
  const [collapsed, setCollapsed] = useState(false);

  if (!trait) return null;

  return (
    <div className="trait-tip-card">
      <div className="tip-card-header" onClick={() => setCollapsed(!collapsed)}>
        <div className="title-area">
          <span className="tip-icon">💡</span>
          <span className="tip-title">
            아이 성향 맞춤 상호작용 팁 <span className="trait-name">({trait.label})</span>
          </span>
        </div>
        <button
          type="button"
          className="collapse-toggle"
          aria-label={collapsed ? "팁 펼치기" : "팁 접기"}
        >
          {collapsed ? "펼치기 ▼" : "접기 ▲"}
        </button>
      </div>

      {!collapsed && (
        <div className="tip-card-body">
          {trait.tips && trait.tips.length > 0 && (
            <ul className="tip-bullets">
              {trait.tips.map((tip, idx) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
          )}

          {trait.exampleLines && trait.exampleLines.length > 0 && (
            <div className="example-box">
              <div className="example-badge">대화 예시</div>
              <div className="example-lines">
                {trait.exampleLines.map((line, idx) => (
                  <p key={idx} className="ex-line">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
