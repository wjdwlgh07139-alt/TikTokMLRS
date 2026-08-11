import React, { useEffect, useState } from "react";

export default function PrepDashboard({ childIdParam, onNavigate, onStartRehearsal }) {
  const [childrenList, setChildrenList] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState(childIdParam || null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkedMaterials, setCheckedMaterials] = useState({});
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [rawNotes, setRawNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);

  // Synchronize route parameter
  useEffect(() => {
    if (childIdParam) {
      setSelectedChildId(childIdParam);
    } else {
      setSelectedChildId(null);
      setDashboardData(null);
    }
  }, [childIdParam]);

  // Client-side fallback metadata
  const FALLBACK_CHILDREN = [
    { id: "child-a", childName: "구O윤", ageMonths: 27, gender: "여아", noteCount: 12, lastDate: "2026-10-01" },
    { id: "child-b", childName: "김O준", ageMonths: 30, gender: "남아", noteCount: 5, lastDate: "2026-09-29" },
    { id: "child-c", childName: "이O아", ageMonths: 24, gender: "여아", noteCount: 2, lastDate: "2026-10-08" },
    { id: "child-d", childName: "박O진", ageMonths: 28, gender: "남아", noteCount: 0, lastDate: null },
  ];

  // Load list of children
  useEffect(() => {
    fetch("/api/prep/children")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setChildrenList(data);
        else setChildrenList(FALLBACK_CHILDREN);
      })
      .catch((err) => {
        console.warn("Using fallback prep children list:", err);
        setChildrenList(FALLBACK_CHILDREN);
      });
  }, []);

  // Load dashboard data when a child is selected
  useEffect(() => {
    if (!selectedChildId) return;
    setLoading(true);

    fetch(`/api/prep/children/${selectedChildId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data && typeof data === "object" && data.childName) {
          setDashboardData(data);
        } else {
          setDashboardData(createFallbackDashboard(selectedChildId));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Using client-side fallback dashboard for:", selectedChildId, err);
        setDashboardData(createFallbackDashboard(selectedChildId));
        setLoading(false);
      });
  }, [selectedChildId]);

  function createFallbackDashboard(cId) {
    const meta = FALLBACK_CHILDREN.find((c) => c.id === cId) || FALLBACK_CHILDREN[0];

    if (cId === "child-a") {
      return {
        childId: "child-a",
        childName: "구O윤",
        ageMonths: 27,
        gender: "여아",
        totalNotesCount: 12,
        blockMode: "full_with_trend",
        materialsChecklist: [
          { name: "플레이콘", score: 4, consecutiveCount: 3, exhausted: true, exhaustedWarning: "3회 연속 사용됨 — 심화 활동으로 발전시키거나 다른 준비물로 교체를 고려하세요." },
          { name: "물티슈", score: 3.5, consecutiveCount: 0, exhausted: false },
          { name: "병원놀이 세트", score: 3, consecutiveCount: 0, exhausted: false },
          { name: "스케치북", score: 2.5, consecutiveCount: 0, exhausted: false },
          { name: "스티커", score: 2.0, consecutiveCount: 0, exhausted: false }
        ],
        unfinishedItems: [
          { noteId: "a-02", date: "2026-07-23", content: "다음 시간에 물감 표현 놀이를 하고 싶어함", quote: "다음엔 물감으로 손도장 찍자고 이야기하며 놀이를 마쳤습니다" }
        ],
        verifiedSuccess: [
          { tag: "만들기", count: 8 },
          { tag: "역할 놀이", count: 7 },
          { tag: "미술 놀이", count: 5 }
        ],
        newTryActivities: ["자동차 놀이", "음악 놀이", "신체 놀이"],
        trajectoryTrend: {
          summary: "구O윤 아동의 12회차 반응 변화 추이",
          points: [
            "초기 낯가림 신호가 2회차 이후 완전히 해소되어 안정된 관계가 형성되었습니다.",
            "역할놀이(병원놀이 → 아이스크림 가게 → 빵집) 범주 확장 및 주도성이 크게 증가했습니다.",
            "선생님과의 언어적 대화 및 표현이 자발적 문장으로 풍부해졌습니다."
          ]
        },
        recommendations: [
          {
            traitId: "cheerful",
            scenarioId: "cheerful",
            title: "활발하고 잘 노는 아이",
            emoji: "☀️",
            strength: "none",
            badge: "균형 추천",
            reason: "돌봄 노트에 특이 경계 신호가 발견되지 않았거나 이전 신호가 해소되었습니다. 기본기를 점검하는 '활발한 아이' 시나리오를 추천합니다.",
            quote: "단풍잎 하나에 백원이요~ 주거니 받거니 재미있게 보냈습니다^^",
            date: "2026-10-01",
            noteId: "a-12"
          }
        ]
      };
    } else if (cId === "child-b") {
      return {
        childId: "child-b",
        childName: "김O준",
        ageMonths: 30,
        gender: "남아",
        totalNotesCount: 5,
        blockMode: "full",
        materialsChecklist: [
          { name: "미니카", score: 4.5, consecutiveCount: 3, exhausted: true, exhaustedWarning: "3회 연속 사용됨 — 심화 활동으로 발전시키거나 다른 준비물로 교체를 고려하세요." },
          { name: "블록", score: 3.0, consecutiveCount: 0, exhausted: false },
          { name: "도로 테이프", score: 2.0, consecutiveCount: 0, exhausted: false }
        ],
        unfinishedItems: [],
        verifiedSuccess: [{ tag: "자동차 놀이", count: 5 }, { tag: "블록 놀이", count: 3 }],
        newTryActivities: ["미술 놀이", "역할 놀이", "촉감 놀이", "책 읽기"],
        trajectoryTrend: null,
        recommendations: [
          {
            traitId: "cling",
            scenarioId: "cling",
            title: "엄마를 찾는 아이",
            emoji: "🥺",
            strength: "strong",
            badge: "1순위 추천",
            reason: "최근 돌봄 노트에서 분리 불안 신호가 지속 관찰되었습니다.",
            quote: "엄마가 문을 닫고 나가시자마자 울먹이며 \"엄마 언제 와요?\" 반복",
            date: "2026-09-01",
            noteId: "b-01"
          }
        ]
      };
    } else if (cId === "child-c") {
      return {
        childId: "child-c",
        childName: "이O아",
        ageMonths: 24,
        gender: "여아",
        totalNotesCount: 2,
        blockMode: "partial",
        materialsChecklist: [{ name: "플레이콘", score: 1.0, consecutiveCount: 0, exhausted: false }, { name: "딸랑이 공", score: 1.0, consecutiveCount: 0, exhausted: false }],
        unfinishedItems: [],
        verifiedSuccess: [],
        newTryActivities: [],
        trajectoryTrend: null,
        recommendations: [
          {
            traitId: "cheerful",
            scenarioId: "cheerful",
            title: "활발하고 잘 노는 아이",
            emoji: "☀️",
            strength: "none",
            badge: "균형 추천",
            reason: "특이사항 없이 밝고 순조로운 적응을 보이고 있습니다.",
            quote: "밝게 웃으며 첫 인사를 해주었어요",
            date: "2026-10-05",
            noteId: "c-01"
          }
        ]
      };
    } else {
      return {
        childId: "child-d",
        childName: "박O진",
        ageMonths: 28,
        gender: "남아",
        totalNotesCount: 0,
        blockMode: "hidden",
        materialsChecklist: [],
        unfinishedItems: [],
        verifiedSuccess: [],
        newTryActivities: [],
        trajectoryTrend: null,
        recommendations: [
          {
            traitId: "shy",
            scenarioId: "shy",
            title: "낯가리는 아이",
            emoji: "🙈",
            strength: "strong",
            badge: "추천",
            reason: "첫 배정 아동은 첫 방문 시 낯가림 신호가 발생할 가능성이 높습니다.",
            quote: "첫 방문 필수 추천",
            date: "신규 배정",
            noteId: null
          },
          {
            traitId: "cheerful",
            scenarioId: "cheerful",
            title: "활발하고 잘 노는 아이",
            emoji: "☀️",
            strength: "weak",
            badge: "참고",
            reason: "첫 대면 놀이가 순조롭게 풀릴 때도 기본 안전 수칙을 점검하기 위해 추천합니다.",
            quote: "기본기 점검 추천",
            date: "신규 배정",
            noteId: null
          }
        ]
      };
    }
  }


  // Load raw notes for modal
  const handleOpenRawNotes = () => {
    if (!selectedChildId) return;
    setShowNotesModal(true);
    setLoadingNotes(true);
    fetch(`/api/prep/children/${selectedChildId}/notes`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setRawNotes(data);
        setLoadingNotes(false);
      })
      .catch((err) => {
        console.warn("Failed to load raw notes:", err);
        setLoadingNotes(false);
      });
  };


  const toggleMaterialCheck = (matName) => {
    setCheckedMaterials((prev) => ({
      ...prev,
      [matName]: !prev[matName],
    }));
  };

  // Render Child Selection List Page (/prep)
  if (!selectedChildId) {
    return (
      <div className="prep-container">
        <div className="prep-hero">
          <h1>📋 수업 준비 도우미</h1>
          <p className="sub">
            방문 전 담당 아동의 돌봄 노트를 분석하여 준비물 체크리스트와 맞춤 리허설을 추천해드려요.
          </p>
        </div>

        <div className="prep-child-section">
          <h2 className="section-title">담당 아동 목록</h2>
          <div className="prep-child-grid">
            {childrenList.map((child) => (
              <div
                key={child.id}
                className="prep-child-card"
                onClick={() => onNavigate(`/prep/${child.id}`)}
              >
                <div className="child-avatar">{child.gender === "여아" ? "👧" : "👦"}</div>
                <div className="child-info">
                  <div className="child-header">
                    <span className="child-name">{child.childName}</span>
                    <span className="child-age">{child.ageMonths}개월 ({child.gender})</span>
                  </div>
                  <div className="child-meta">
                    <span className="note-count">📝 돌봄 노트 <strong>{child.noteCount}건</strong></span>
                    {child.lastDate && <span className="last-date">최근: {child.lastDate}</span>}
                  </div>
                </div>
                <button className="prep-btn">
                  준비하기 &rsaquo;
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading || !dashboardData) {
    return (
      <div className="prep-container loading-state">
        <div className="spinner" />
        <p>돌봄 노트를 분석하여 수업 준비 체크리스트를 생성하는 중...</p>
      </div>
    );
  }

  const {
    childName,
    ageMonths,
    gender,
    totalNotesCount,
    blockMode,
    materialsChecklist,
    unfinishedItems,
    verifiedSuccess,
    newTryActivities,
    trajectoryTrend,
    recommendations,
  } = dashboardData;

  return (
    <div className="prep-container">
      {/* Top Header */}
      <div className="prep-header-bar">
        <button className="back-link-btn" onClick={() => onNavigate("/prep")}>
          &lsaquo; 목록으로
        </button>
        <div className="child-profile-pill">
          <span className="emoji">{gender === "여아" ? "👧" : "👦"}</span>
          <span className="name">{childName}</span>
          <span className="details">{ageMonths}개월 · 노트 {totalNotesCount}건</span>
        </div>
        <button className="raw-notes-btn" onClick={handleOpenRawNotes}>
          📄 원문 노트 보기
        </button>
      </div>

      {/* 0-Notes Empty Case */}
      {blockMode === "hidden" && (
        <div className="prep-empty-banner">
          <h3>🌱 첫 방문 안내</h3>
          <p>아직 작성된 돌봄 노트가 없습니다. 첫 대면 시 안전 수칙 및 기본 인사를 점검해두세요!</p>
        </div>
      )}

      {/* Tool B: Rehearsal Recommendation Cards */}
      {recommendations && recommendations.length > 0 && (
        <div className="rec-section">
          <div className="rec-section-header">
            <h3>🎭 맞춤 리허설 추천 (도구 B)</h3>
            <span className="sub-tag">노트 관찰 신호 기반</span>
          </div>

          <div className="rec-cards-wrapper">
            {recommendations.map((rec, idx) => (
              <div key={idx} className={`rec-card ${rec.strength}`}>
                <div className="rec-card-top">
                  <span className="rec-emoji">{rec.emoji}</span>
                  <div className="rec-title-box">
                    <div className="rec-badge-row">
                      <span className={`badge ${rec.strength}`}>{rec.badge}</span>
                      {rec.date && <span className="rec-date">관찰일: {rec.date}</span>}
                    </div>
                    <h4>{rec.title}</h4>
                  </div>
                </div>

                <p className="rec-reason">{rec.reason}</p>

                {rec.quote && rec.quote !== "첫 방문 필수 추천" && (
                  <div className="rec-quote-box">
                    <span className="quote-icon">“</span>
                    <span className="quote-text">{rec.quote}</span>
                    <span className="quote-icon">”</span>
                  </div>
                )}

                <div className="rec-card-footer">
                  <button
                    className="start-rehearsal-btn"
                    onClick={() => onStartRehearsal(rec.scenarioId, rec.traitId)}
                  >
                    이 시나리오 리허설하기 &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tool A: Class Prep Checklist Blocks */}
      <div className="prep-blocks-container">
        {/* Block 1: 가져갈 것 (Materials Checklist) */}
        {materialsChecklist && materialsChecklist.length > 0 && (
          <div className="prep-block bring-block">
            <div className="block-header">
              <span className="block-icon">🎒</span>
              <div>
                <h3>가져갈 것</h3>
                <span className="block-sub">최근 3회 사용 빈도 및 최근성 기반 추천</span>
              </div>
            </div>

            <div className="materials-list">
              {materialsChecklist.map((item, idx) => {
                const isChecked = checkedMaterials[item.name] || false;
                return (
                  <div
                    key={idx}
                    className={`material-item ${item.exhausted ? "exhausted" : ""} ${
                      isChecked ? "checked" : ""
                    }`}
                    onClick={() => toggleMaterialCheck(item.name)}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      id={`mat-${idx}`}
                    />
                    <label htmlFor={`mat-${idx}`}>{item.name}</label>

                    {item.exhausted && (
                      <span className="exhausted-badge" title={item.exhaustedWarning}>
                        ⚠️ 3회 연속 (교체/심화 권장)
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Block 2: 이어가기 (Unfinished Items) */}
        {unfinishedItems && unfinishedItems.length > 0 && (
          <div className="prep-block unfinished-block">
            <div className="block-header">
              <span className="block-icon">🔗</span>
              <div>
                <h3>이어가기</h3>
                <span className="block-sub">지난 수업의 미완결 관심사 및 약속</span>
              </div>
            </div>

            <div className="unfinished-list">
              {unfinishedItems.map((item, idx) => (
                <div key={idx} className="unfinished-item-card">
                  <div className="unf-date">{item.date} 수업 노트</div>
                  <div className="unf-content">{item.content}</div>
                  <div className="unf-quote">원문 인용: &quot;{item.quote}&quot;</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Block 3: 검증된 것 (Verified Success) */}
        {verifiedSuccess && verifiedSuccess.length > 0 && (
          <div className="prep-block verified-block">
            <div className="block-header">
              <span className="block-icon">✨</span>
              <div>
                <h3>검증된 것</h3>
                <span className="block-sub">2회 이상 높은 흥미와 긍정적 반응을 얻은 활동</span>
              </div>
            </div>

            <div className="verified-tags">
              {verifiedSuccess.map((v, idx) => (
                <span key={idx} className="verified-tag">
                  💚 {v.tag} <small>({v.count}회 성공)</small>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Block 4: 새로 시도 (New Try) */}
        {newTryActivities && newTryActivities.length > 0 && (
          <div className="prep-block newtry-block">
            <div className="block-header">
              <span className="block-icon">💡</span>
              <div>
                <h3>새로 시도</h3>
                <span className="block-sub">최근 4회 수업에서 시도하지 않은 미출현 활동</span>
              </div>
            </div>

            <div className="newtry-tags">
              {newTryActivities.map((tag, idx) => (
                <span key={idx} className="newtry-tag">
                  🔹 {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Block 5: 변화 추이 (Trajectory Trends for 8+ notes) */}
        {trajectoryTrend && (
          <div className="prep-block trend-block">
            <div className="block-header">
              <span className="block-icon">📈</span>
              <div>
                <h3>변화 추이</h3>
                <span className="block-sub">{trajectoryTrend.summary}</span>
              </div>
            </div>

            <ul className="trend-points">
              {trajectoryTrend.points.map((pt, idx) => (
                <li key={idx}>{pt}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Raw Care Note Viewer Modal */}
      {showNotesModal && (
        <div className="modal-overlay" onClick={() => setShowNotesModal(false)}>
          <div className="modal-content notes-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📄 {childName} 아동 돌봄 노트 원문 ({rawNotes.length}건)</h2>
              <button className="close-btn" onClick={() => setShowNotesModal(false)}>
                &times;
              </button>
            </div>

            <div className="modal-body">
              {loadingNotes ? (
                <p>노트 원문을 불러오는 중...</p>
              ) : (
                rawNotes.map((note) => (
                  <div key={note.noteId} className="raw-note-card">
                    <div className="raw-note-head">
                      <span className="raw-date">📅 {note.date}</span>
                      <div className="raw-tags">
                        {(note.activityTags || []).map((t, i) => (
                          <span key={i} className="raw-tag">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <pre className="raw-text">{note.rawNote}</pre>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
