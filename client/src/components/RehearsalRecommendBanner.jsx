import React, { useEffect, useState } from "react";

export default function RehearsalRecommendBanner({ onSelectRecommendation }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/prep/recommendations")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setRecommendations(data);
        } else {
          setRecommendations([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Failed to load recommendations for home banner:", err);
        setRecommendations([]);
        setLoading(false);
      });
  }, []);

  if (loading || !Array.isArray(recommendations) || recommendations.length === 0) {
    return null;
  }

  // Pick top priority active recommendation (Strong signal or first item)
  const topRec = recommendations[0];
  if (!topRec || !topRec.title) {
    return null;
  }


  return (
    <div className="home-recommend-banner">
      <div className="banner-left">
        <span className="banner-badge">💡 배정 아동 맞춤 추천</span>
        <h3 className="banner-title">
          {topRec.childName} ({topRec.childAgeMonths}개월) · {topRec.emoji} {topRec.title}
        </h3>
        <p className="banner-reason">{topRec.reason}</p>
        {topRec.quote && topRec.quote !== "첫 방문 필수 추천" && (
          <div className="banner-quote">&quot;{topRec.quote}&quot;</div>
        )}
      </div>

      <div className="banner-right">
        <button
          className="banner-action-btn"
          onClick={() => onSelectRecommendation(topRec.scenarioId, topRec.traitId)}
        >
          맞춤 리허설 시작 &rarr;
        </button>
      </div>
    </div>
  );
}
