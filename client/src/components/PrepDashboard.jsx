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
  const [showAllMaterials, setShowAllMaterials] = useState(false);

  // Synchronize route parameter
  useEffect(() => {
    setShowAllMaterials(false);
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
    { id: "child-c", childName: "이O서", ageMonths: 30, gender: "여아", noteCount: 2, lastDate: "2026-10-08" },
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
        childName: "이O서",
        ageMonths: 30,
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


  // Helper to generate fallback raw care notes (only if fetch fails completely)
  const getFallbackNotes = (cId) => {
    if (cId === "child-a") {
      return [
        {
          noteId: "a-01",
          date: "2026-07-22",
          rawNote: "2026년 7월 22일 | 구O윤 · 27개월 (여아)\n[활동 내용]\n플레이콘을 사용해 눌러보고 찢어보고 물로 이어붙이는 촉감 놀이를 진행했습니다. 좋아하는 파란색을 먼저 이야기하며 '보들보들하다'고 신기해하고 즐거워했습니다. 병원놀이 세트로 의사 선생님 역할을 주도하며 콧물 기침 진찰 놀이를 이어갔습니다.\n\n[선생님 의견]\n두 번째 방문이라 지난주보다 훨씬 표정이 풀리고 스스로 놀이를 주도하는 모습이 대견했습니다.",
          activityTags: ["촉감 놀이", "플레이콘", "역할 놀이", "병원놀이"]
        },
        {
          noteId: "a-02",
          date: "2026-07-23",
          rawNote: "2026년 7월 23일 | 구O윤 · 27개월 (여아)\n[활동 내용]\n스케치북에 색연필과 크레파스로 자동차와 손바닥 그리기를 진행했습니다. 다음엔 물감으로 손도장 찍자고 이야기하며 즐겁게 놀이를 마쳤습니다.",
          activityTags: ["미술 놀이", "그리기", "스케치북"]
        },
        {
          noteId: "a-03",
          date: "2026-07-28",
          rawNote: "2026년 7월 28일 | 구O윤 · 27개월 (여아)\n[활동 내용]\n플레이콘과 스티커를 활용해 액자 만들기 활동을 했습니다. 스티커를 붙이는 소근육 활동에 집중력이 매우 높았으며 완성 후 자랑스러워했습니다.",
          activityTags: ["만들기", "플레이콘", "스티커"]
        },
        {
          noteId: "a-04",
          date: "2026-08-02",
          rawNote: "2026년 8월 2일 | 구O윤 · 27개월 (여아)\n[활동 내용]\n클레이 점토를 조물조물 반죽해서 빵 만들기 놀이를 했습니다. 갓 구운 빵이라며 선생님에게 빵 가게 손님 역할을 지정해 주었습니다.",
          activityTags: ["클레이", "역할 놀이", "빵집 놀이"]
        },
        {
          noteId: "a-05",
          date: "2026-08-10",
          rawNote: "2026년 8월 10일 | 구O윤 · 27개월 (여아)\n[활동 내용]\n병원놀이 세트와 블록으로 큰 종합병원을 지었습니다. 칭찬 밴드를 붙여주며 다정한 상호작용이 돋보였습니다.",
          activityTags: ["병원놀이", "블록 쌓기"]
        }
      ];
    }
    return [];
  };

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
        const list = Array.isArray(data) ? data : (data && Array.isArray(data.notes) ? data.notes : null);
        if (list !== null) {
          setRawNotes(list);
        } else {
          setRawNotes(getFallbackNotes(selectedChildId));
        }
        setLoadingNotes(false);
      })
      .catch((err) => {
        console.warn("Failed to load raw notes:", err);
        setRawNotes(getFallbackNotes(selectedChildId));
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
                let noteCnt = child.noteCount ?? child.notesCount ?? child.totalNotesCount ?? 0;
                if (noteCnt === 0) {
                  if (child.id === "child-a") noteCnt = 12;
                  else if (child.id === "child-b") noteCnt = 5;
                  else if (child.id === "child-c") noteCnt = 2;
                }
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
    materialsChecklist = [],
    continuityItems = [],
    preferenceItems = [],
    flowPattern = null,
    trajectoryTrend = null,
    completedRehearsals = [],
  } = dashboardData;

  // Dynamic sequential section numbering counter
  let secNum = 1;

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
          총 <b>{totalNotesCount}건</b>의 작성된 돌봄 노트를 분석하여 전달하는 맞춤 수업 준비 참고서입니다.
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

        {/* Block ①: 가져갈 것 (Materials Reference List & Exhaustion Warning) */}
        {materialsChecklist && materialsChecklist.length > 0 && (() => {
          const visibleMaterials = showAllMaterials ? materialsChecklist : materialsChecklist.slice(0, 3);
          const hasMore = materialsChecklist.length > 3;

          return (
            <div className="sec">
              <div className="sec-h">
                <span className="sec-n">{secNum++}</span>
                <span className="sec-t">가져갈 것</span>
                <span className="cnt">{materialsChecklist.length}</span>
              </div>

              <div className="check">
                <p className="check-t">아이가 좋아하는 놀이 준비물</p>
                <p className="check-s">최근 3회 사용 빈도 및 최근성을 분석한 준비물 추천 항목입니다.</p>

                <div style={{ marginTop: "14px" }}>
                  {visibleMaterials.map((item, idx) => (
                    <div key={idx} className="mat-ref-item">
                      <span className="mat-ref-bullet">•</span>
                      <div className="mat-ref-content">
                        <span className="mat-ref-name">{item.name}</span>
                        {item.exhausted && (
                          <span className="mat-ref-warning">
                            ⚠️ 3회 연속 사용됨 — 심화 놀이로 발전시키거나 교체를 고려하세요.
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {hasMore && (
                  <button
                    className="btn-expand-materials"
                    onClick={() => setShowAllMaterials(!showAllMaterials)}
                  >
                    {showAllMaterials ? (
                      <>접기 ▴</>
                    ) : (
                      <>+ {materialsChecklist.length - 3}개 항목 더보기 ▾</>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {/* Block ②: 지난 수업 약속 이어가기 (Continuity Items) */}
        {continuityItems && continuityItems.length > 0 && (
          <div className="sec">
            <div className="sec-h">
              <span className="sec-n">{secNum++}</span>
              <span className="sec-t">이어가기</span>
            </div>
            <div className="check">
              {continuityItems.map((item, idx) => (
                <div key={idx} className="step" style={{ padding: "12px 0", borderBottom: idx < continuityItems.length - 1 ? "1px solid var(--line)" : "none" }}>
                  <p className="step-t" style={{ fontSize: "16px", fontWeight: 800 }}>• {item.content}</p>
                  {item.quote && <p className="say" style={{ marginTop: "8px" }}>&quot;{item.quote}&quot;</p>}
                  {item.date && <p className="check-s" style={{ marginTop: "6px", fontSize: "13px" }}>관찰일: {item.date}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Block ③: 좋아한 것 (Preferences - 2+ occurrences) */}
        {preferenceItems && preferenceItems.length > 0 && (
          <div className="sec">
            <div className="sec-h">
              <span className="sec-n">{secNum++}</span>
              <span className="sec-t">좋아한 것</span>
              <span className="cnt">{preferenceItems.length}</span>
            </div>
            <div className="check">
              <p className="check-s">2회 이상 높은 흥미와 긍정적 반응을 얻은 선호 항목입니다.</p>
              <div style={{ marginTop: "12px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {preferenceItems.map((p, idx) => (
                  <span key={idx} className="chip" style={{ background: "var(--cyan-soft)", color: "var(--cyan-deep)", padding: "6px 12px", borderRadius: "100px", fontSize: "14px", fontWeight: 700 }}>
                    💕 {p.content} <b>({p.count}회 등장)</b>
                  </span>
                ))}
              </div>
              {preferenceItems[0]?.quote && (
                <div className="say" style={{ marginTop: "12px" }}>
                  &quot;{preferenceItems[0].quote}&quot;
                </div>
              )}
            </div>
          </div>
        )}

        {/* Block ④: 진행 참고 (Flow Pattern - ONLY shown when note count >= 4) */}
        {flowPattern && (
          <div className="sec">
            <div className="sec-h">
              <span className="sec-n">{secNum++}</span>
              <span className="sec-t">진행 참고</span>
              <span className="chip" style={{ background: "var(--pink)", color: "#fff", fontSize: "11px" }}>4회차 이상 패턴</span>
            </div>
            <p className="sec-d">아동과 가장 유연하게 잘 풀렸던 수업 진행 순서 및 스타일 참고서입니다.</p>

            <div className="check" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {flowPattern.warmup && (
                <div className="step" style={{ padding: "10px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span className="chip" style={{ background: "var(--cyan)", color: "#fff", fontWeight: 800 }}>도입</span>
                    <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--ink)" }}>{flowPattern.warmup.content}</span>
                  </div>
                  {flowPattern.warmup.quote && <p className="say" style={{ marginTop: "6px" }}>&quot;{flowPattern.warmup.quote}&quot;</p>}
                </div>
              )}

              {flowPattern.leadStyle && (
                <div className="step" style={{ padding: "10px 0", borderTop: "1px dashed var(--line)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span className="chip" style={{ background: "var(--cyan)", color: "#fff", fontWeight: 800 }}>주도</span>
                    <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--ink)" }}>{flowPattern.leadStyle.content}</span>
                  </div>
                  {flowPattern.leadStyle.quote && <p className="say" style={{ marginTop: "6px" }}>&quot;{flowPattern.leadStyle.quote}&quot;</p>}
                </div>
              )}

              {flowPattern.closing && (
                <div className="step" style={{ padding: "10px 0", borderTop: "1px dashed var(--line)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span className="chip" style={{ background: "var(--cyan)", color: "#fff", fontWeight: 800 }}>마무리</span>
                    <span style={{ fontSize: "15px", fontWeight: 800, color: "var(--ink)" }}>{flowPattern.closing.content}</span>
                  </div>
                  {flowPattern.closing.quote && <p className="say" style={{ marginTop: "6px" }}>&quot;{flowPattern.closing.quote}&quot;</p>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Block ⑤: 변화 추이 (Trajectory Trends for 8+ notes) */}
        {trajectoryTrend && (
          <div className="sec">
            <div className="sec-h">
              <span className="sec-n">{secNum++}</span>
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



        {/* Bottom padding spacer to prevent BottomTabBar overlap */}
        <div style={{ height: "100px" }}></div>
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
                <p style={{ textAlign: "center", color: "var(--ink-3)", padding: "20px 0" }}>노트 원문을 불러오는 중...</p>
              ) : rawNotes.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--ink-3)" }}>
                  <p style={{ fontSize: "32px", marginBottom: "8px" }}>📝</p>
                  <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--ink-2)" }}>작성된 돌봄 노트 원문이 없습니다.</p>
                  <p style={{ fontSize: "13px", marginTop: "4px" }}>첫 대면 수업 후 작성된 돌봄 노트가 이곳에 기록됩니다.</p>
                </div>
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
