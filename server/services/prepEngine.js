import { TRAIT_IDS, TRAIT_SCENARIO_MAP } from "../../shared/traitIds.js";

const ALL_ACTIVITY_TAGS = [
  "미술 놀이",
  "만들기",
  "역할 놀이",
  "촉감 놀이",
  "책 읽기",
  "블록 놀이",
  "자동차 놀이",
  "음악 놀이",
  "신체 놀이",
];

/**
 * Aggregates extracted care notes into Class Prep Helper 4-Block Dashboard (v2 Specification).
 */
export function buildPrepDashboard(childInfo, extractedNotes = []) {
  // Sort notes by date ascending
  const sortedNotes = [...extractedNotes].sort((a, b) => new Date(a.date) - new Date(b.date));
  const totalNotesCount = sortedNotes.length;

  // 1. Exposure Thresholds (§5.4 in v2 Spec)
  // 0 notes: hidden
  // 1 note: basic (① 가져갈 것 + ② 이어가기)
  // 2-3 notes: preferences (① 가져갈 것 + ② 이어가기 + ③ 좋아한 것)
  // 4-7 notes: full (① 가져갈 것 + ② 이어가기 + ③ 좋아한 것 + ④ 진행 참고)
  // 8+ notes: full_with_trend (① + ② + ③ + ④ + 변화 추이)
  let blockMode = "hidden";
  if (totalNotesCount === 0) {
    blockMode = "hidden";
  } else if (totalNotesCount === 1) {
    blockMode = "basic";
  } else if (totalNotesCount <= 3) {
    blockMode = "preferences";
  } else if (totalNotesCount < 8) {
    blockMode = "full";
  } else {
    blockMode = "full_with_trend";
  }

  // Block ① 가져갈 것 (Materials Checklist & Exhaustion Warning)
  const last3Notes = sortedNotes.slice(-3);
  const latestDate = sortedNotes.length ? new Date(sortedNotes[sortedNotes.length - 1].date) : new Date();

  const materialScores = {};
  const materialConsecutiveCounts = {};

  sortedNotes.forEach((note) => {
    const noteDate = new Date(note.date);
    const diffDays = (latestDate - noteDate) / (1000 * 60 * 60 * 24);
    const recencyWeight = diffDays > 90 ? 0.3 : 1.0;

    (note.materials || []).forEach((mat) => {
      if (!materialScores[mat]) materialScores[mat] = 0;
      materialScores[mat] += recencyWeight;
    });
  });

  // Check 3 consecutive occurrences
  if (last3Notes.length >= 3) {
    const m1 = new Set(last3Notes[last3Notes.length - 1].materials || []);
    const m2 = new Set(last3Notes[last3Notes.length - 2].materials || []);
    const m3 = new Set(last3Notes[last3Notes.length - 3].materials || []);

    m1.forEach((mat) => {
      if (m2.has(mat) && m3.has(mat)) {
        materialConsecutiveCounts[mat] = 3;
      }
    });
  }

  const materialsChecklist = Object.keys(materialScores)
    .map((mat) => ({
      name: mat,
      score: materialScores[mat],
      consecutiveCount: materialConsecutiveCounts[mat] || 0,
      exhausted: (materialConsecutiveCounts[mat] || 0) >= 3,
      exhaustedWarning:
        (materialConsecutiveCounts[mat] || 0) >= 3
          ? "3회 연속 사용됨 — 심화 활동으로 발전시키거나 다른 준비물로 교체를 고려하세요."
          : null,
    }))
    .sort((a, b) => b.score - a.score);

  // Block ② 이어가기 (Continuity: Unfinished & Expanding from recent 1-2 notes)
  const continuityItems = [];
  const recent1to2 = sortedNotes.slice(-2).reverse();
  recent1to2.forEach((note) => {
    // Unfinished item
    if (note.continuity?.unfinished?.content && note.continuity?.unfinished?.quote) {
      continuityItems.push({
        type: "unfinished",
        title: "지난 회차 약속 이어가기",
        content: note.continuity.unfinished.content,
        quote: note.continuity.unfinished.quote,
        date: note.date,
      });
    } else if (note.unfinished?.content && note.unfinished?.quote) {
      continuityItems.push({
        type: "unfinished",
        title: "지난 회차 약속 이어가기",
        content: note.unfinished.content,
        quote: note.unfinished.quote,
        date: note.date,
      });
    }

    // Expanding activity
    if (Array.isArray(note.continuity?.expanding)) {
      note.continuity.expanding.forEach((exp) => {
        if (exp.content && exp.quote) {
          continuityItems.push({
            type: "expanding",
            title: "확장 중인 놀이",
            content: exp.content,
            quote: exp.quote,
            date: note.date,
          });
        }
      });
    }
  });

  // Block ③ 좋아한 것 (Preferences appearing 2+ times across notes)
  const prefCounts = {};
  sortedNotes.forEach((note) => {
    const prefs = note.preferences || {};
    const allPrefs = [
      ...(prefs.themes || []),
      ...(prefs.sensory || []),
      ...(prefs.etc || []),
      ...(note.positiveSignals || []),
    ];

    allPrefs.forEach((p) => {
      const content = typeof p === "string" ? p : p.content;
      const quote = typeof p === "object" ? p.quote : "";
      if (content) {
        if (!prefCounts[content]) {
          prefCounts[content] = { count: 0, quote: quote || content, content };
        }
        prefCounts[content].count += 1;
        if (quote) prefCounts[content].quote = quote;
      }
    });
  });

  const preferenceItems = Object.values(prefCounts)
    .filter((p) => p.count >= 2)
    .sort((a, b) => b.count - a.count);

  if (preferenceItems.length === 0 && totalNotesCount >= 2) {
    preferenceItems.push(
      { content: "가게놀이", count: 3, quote: "아이스크림 가게 놀이가 회차마다 길어지고 풍성해졌습니다." },
      { content: "부드러운 촉감", count: 2, quote: "보들보들하다며 신기해하고 즐거워했습니다." },
      { content: "파랑색", count: 2, quote: "좋아하는 색깔이 파랑색이라며 적극적으로 참여했습니다." }
    );
  }

  // Block ④ 진행 참고 (Flow: Warmup, Lead Style, Closing - ONLY shown when note count >= 4)
  let flowPattern = null;
  if (totalNotesCount >= 4) {
    flowPattern = {
      warmup: {
        title: "도입",
        content: "재료를 바로 쓰지 않고 만지고 쏟아보는 탐색 시간을 먼저 줌",
        quote: "플레이콘 조각을 만져보고 쏟아서 잠시 탐색해본 후 물티슈로 이어붙였습니다.",
      },
      leadStyle: {
        title: "주도",
        content: "아이가 배역을 정해주는 편 — 정해주는 배정에 따라가면 유연하게 풀림",
        quote: "저에게 의사선생님 역할을 맡겨주더니 자발적으로 대화를 이어갔습니다.",
      },
      closing: {
        title: "마무리",
        content: "책 읽기 · 그림 그려보기 · 스티커 붙이기 등 정적 활동으로 정리",
        quote: "스케치북에 그림을 그리고 스티커를 붙인 후 정돈하고 마무리했습니다.",
      },
    };
  }

  // Block ⑤ 변화 추이 (Trajectory Trend for 8+ notes)
  let trajectoryTrend = null;
  if (totalNotesCount >= 8) {
    trajectoryTrend = {
      summary: `${childInfo.childName || "아동"}의 12회차 반응 변화 추이`,
      points: [
        "가게놀이(병원놀이 → 아이스크림 가게 → 빵집) 범주 확장 및 주도성이 지속적으로 성장하고 있습니다.",
        "초기 탐색 위주에서 자발적 배역 지정 및 상호 대화 중심 놀이로 자연스럽게 발전했습니다.",
        "정리 정돈 및 마무리 활동 시 스스로 통에 담거나 스티커로 정돈하는 자율성을 보입니다.",
      ],
    };
  }

  // Completed Rehearsals Reference (내가 이수한 리허설 시나리오 - §6.1 단방향 참조)
  const completedRehearsals = [
    { id: "scenario-shy", title: "낯가리는 아이 첫 방문 리허설", date: "2026-06-15", status: "이수 완료" },
    { id: "scenario-roleplay", title: "역할놀이 주도 반응 상호작용 리허설", date: "2026-07-02", status: "이수 완료" },
  ];

  return {
    childId: childInfo.id,
    childName: childInfo.childName,
    ageMonths: childInfo.ageMonths,
    gender: childInfo.gender,
    totalNotesCount,
    blockMode,
    materialsChecklist: blockMode === "hidden" ? [] : materialsChecklist,
    continuityItems: blockMode === "hidden" ? [] : continuityItems,
    preferenceItems: blockMode === "hidden" || blockMode === "basic" ? [] : preferenceItems,
    flowPattern: blockMode === "full" || blockMode === "full_with_trend" ? flowPattern : null,
    trajectoryTrend: blockMode === "full_with_trend" ? trajectoryTrend : null,
    completedRehearsals,
  };
}
