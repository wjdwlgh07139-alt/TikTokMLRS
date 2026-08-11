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
        {/* Sticky Appbar */}
        <div className="appbar">
          <span className="back" onClick={() => onNavigate("/")} aria-label="홈으로">
            ‹
          </span>
          <span className="ttl">수업 준비 도우미</span>
          <span className="sp"></span>
        </div>

        {/* Hero Header */}
        <div className="hero">
          <span className="chip">담당 아동 {childrenList.length}명</span>
          <h1>
            수업 전, <b>돌봄 노트</b>로 아이 성향을 확인하세요
          </h1>
          <p>
            방문 전 담당 아동의 돌봄 노트를 분석하여 준비물 체크리스트와 맞춤 리허설을 추천해 드립니다.
          </p>
        </div>

        <div className="pad">
          <div className="sec" style={{ marginTop: "16px" }}>
            <div className="sec-h">
              <span className="sec-n">✓</span>
              <span className="sec-t">담당 아동 선택</span>
            </div>

            <div className="prep-child-list">
              {childrenList.map((child) => {
                const name = child.childName || child.name || "아동";
                const age = child.ageMonths || child.age || 0;
                const genderStr = child.gender || "";
                const noteCnt = child.noteCount ?? child.notesCount ?? child.totalNotesCount ?? 0;
                return (
                  <div
                    key={child.id}
                    className="check-child-card"
                    onClick={() => onNavigate(`/prep/${child.id}`)}
                  >
                    <div className="child-avatar-circle">
                      {genderStr === "여아" ? "👧" : "👦"}
                    </div>
                    <div className="child-card-main">
                      <div className="child-card-title-row">
                        <span className="child-card-name">{name}</span>
                        <span className="child-card-age">{age}개월 ({genderStr})</span>
                      </div>
                      <div className="child-card-sub">
                        📝 돌봄 노트 <b>{noteCnt}건</b>
                        {child.lastDate && <span> · 최근: {child.lastDate}</span>}
                      </div>
                    </div>
                    <button className="btn-child-select">
                      준비하기 ›
                    </button>
                  </div>
                );
              })}
            </div>
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
      {/* Sticky Appbar matching first-care-guide.html */}
      <div className="appbar">
        <button className="back" onClick={() => onNavigate("/prep")} aria-label="뒤로">
          ‹
        </button>
        <span className="ttl">수업 준비 도우미</span>
        <button className="btn-raw-link" onClick={handleOpenRawNotes}>
          원문 노트 보기
        </button>
      </div>

      {/* Hero Header matching first-care-guide.html */}
      <div className="hero">
        <span className="chip">
          {childName} · {ageMonths}개월 ({gender})
        </span>
        <h1>
          방문 전, <b>돌봄 노트 준비</b><br />이것만 챙기면 충분해요
        </h1>
        <p>
          총 <b>{totalNotesCount}건</b>의 작성된 돌봄 노트를 분석하여 전달하는 맞춤 리허설 및 준비물 체크리스트입니다.
        </p>
      </div>

      <div className="pad">
        {/* 0-Notes Empty Case */}
        {blockMode === "hidden" && (
          <div className="sec">
            <div className="check">
              <p className="check-t">🌱 첫 방문 안내</p>
              <p className="check-s">
                아직 작성된 돌봄 노트가 없습니다. 첫 대면 시 안전 수칙 및 기본 인사를 점검해두세요!
              </p>
            </div>
          </div>
        )}

        {/* Tool B: Rehearsal Recommendation Cards */}
        {recommendations && recommendations.length > 0 && (
          <div className="sec">
            <div className="sec-h">
              <span className="sec-n">1</span>
              <span className="sec-t">맞춤 리허설 추천 (도구 B)</span>
              <span className="cnt">신호 궤적</span>
            </div>
            <p className="sec-d">노트 관찰 신호에 기반하여 배정 직후 연습할 모의 리허설을 추천해 드립니다.</p>

            <div className="check" style={{ marginBottom: "16px" }}>
              {recommendations.map((rec, idx) => (
                <div key={idx} className="step" style={{ padding: "12px 0", borderBottom: idx < recommendations.length - 1 ? "1px solid var(--line)" : "none" }}>
                  <div className="step-hd" style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <span className="num" style={{ width: "32px", height: "32px", fontSize: "18px" }}>{rec.emoji}</span>
                    <div>
                      <span className="step-t" style={{ fontSize: "17px", fontWeight: 800 }}>{rec.title}</span>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "2px" }}>
                        <span className="chip" style={{ background: rec.strength === "strong" ? "var(--cyan)" : "var(--pink)", padding: "2px 8px", fontSize: "11px" }}>{rec.badge}</span>
                        {rec.date && <span style={{ fontSize: "12px", color: "var(--ink-3)" }}>관찰일: {rec.date}</span>}
                      </div>
                    </div>
                  </div>

                  <p className="step-why" style={{ marginTop: "8px" }}>{rec.reason}</p>

                  {rec.quote && rec.quote !== "첫 방문 필수 추천" && (
                    <div className="say">
                      &quot;{rec.quote}&quot;
                    </div>
                  )}

                  <button
                    className="start-rehearsal-btn"
                    onClick={() => onStartRehearsal(rec.scenarioId, rec.traitId)}
                  >
                    이 시나리오 리허설하기 ›
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tool A: Class Prep Checklist Blocks */}
        {materialsChecklist && materialsChecklist.length > 0 && (
          <div className="sec">
            <div className="sec-h">
              <span className="sec-n">2</span>
              <span className="sec-t">가져갈 준비물 (도구 A)</span>
              <span className="cnt">{materialsChecklist.length}</span>
            </div>

            <div className="check">
              <p className="check-t">아이가 좋아하는 놀이 준비물</p>
              <p className="check-s">최근 3회 사용 빈도 및 최근성을 분석한 준비물 추천 항목입니다.</p>

              {materialsChecklist.map((item, idx) => {
                const isChecked = checkedMaterials[item.name] || false;
                return (
                  <label
                    key={idx}
                    className="ck"
                    onClick={() => toggleMaterialCheck(item.name)}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                    />
                    <span>
                      <em>{item.name}</em>
                      {item.exhausted && (
                        <i>⚠️ 3회 연속 사용됨 — 심화 놀이로 발전시키거나 교체를 고려하세요.</i>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Block 2: 이어가기 (Unfinished Items) */}
        {unfinishedItems && unfinishedItems.length > 0 && (
          <div className="sec">
            <div className="sec-h">
              <span className="sec-n">3</span>
              <span className="sec-t">지난 수업 약속 이어가기</span>
            </div>
            <div className="check">
              {unfinishedItems.map((item, idx) => (
                <div key={idx} className="step" style={{ padding: "12px 0", borderBottom: "none" }}>
                  <p className="step-t" style={{ fontSize: "16px", fontWeight: 800 }}>{item.content}</p>
                  <p className="say" style={{ marginTop: "8px" }}>&quot;{item.quote}&quot;</p>
                  <p className="check-s" style={{ marginTop: "6px", fontSize: "13px" }}>관찰일: {item.date}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Block 3: 검증된 것 (Verified Success) */}
        {verifiedSuccess && verifiedSuccess.length > 0 && (
          <div className="sec">
            <div className="sec-h">
              <span className="sec-n">4</span>
              <span className="sec-t">검증된 성공 경험</span>
              <span className="cnt">{verifiedSuccess.length}</span>
            </div>
            <div className="check">
              <p className="check-s">2회 이상 높은 흥미와 긍정적 반응을 얻은 활동입니다.</p>
              <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {verifiedSuccess.map((v, idx) => (
                  <span key={idx} className="chip" style={{ background: "var(--cyan-soft)", color: "var(--cyan-deep)" }}>
                    ✨ {v.tag} <b>({v.count}회 성공)</b>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Block 4: 새로 시도 (New Try) */}
        {newTryActivities && newTryActivities.length > 0 && (
          <div className="sec">
            <div className="sec-h">
              <span className="sec-n">5</span>
              <span className="sec-t">새로 시도할 놀이</span>
            </div>
            <div className="check">
              <p className="check-s">최근 4회 수업에서 시도하지 않은 미출현 활동 아이디어입니다.</p>
              <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {newTryActivities.map((tag, idx) => (
                  <span key={idx} className="chip" style={{ background: "#F3F4F6", color: "var(--ink-2)" }}>
                    💡 {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Block 5: 변화 추이 (Trajectory Trends for 8+ notes) */}
        {trajectoryTrend && (
          <div className="sec">
            <div className="sec-h">
              <span className="sec-n">6</span>
              <span className="sec-t">반응 변화 추이 분석</span>
            </div>
            <div className="check">
              <p className="check-t">{trajectoryTrend.summary}</p>
              <div style={{ marginTop: "12px" }}>
                {trajectoryTrend.points.map((pt, idx) => (
                  <p key={idx} className="say" style={{ marginTop: "8px" }}>
                    • {pt}
                  </p>
                ))}
              </div>
            </div>
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
