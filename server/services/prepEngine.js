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
      ...(note.activityTags || []).map((tag) => ({ content: tag, quote: `${tag} 활동에 지속적인 흥미를 보임` })),
      ...(prefs.themes || []),
      ...(prefs.sensory || []),
      ...(prefs.etc || []),
      ...(note.positiveSignals || []),
    ];

    allPrefs.forEach((p) => {
      const content = typeof p === "string" ? p : p?.content;
      const quote = typeof p === "object" ? p?.quote : "";
      if (content && typeof content === "string") {
        if (!prefCounts[content]) {
          prefCounts[content] = { count: 0, quote: quote || content, content };
        }
        prefCounts[content].count += 1;
        if (quote && quote !== content) prefCounts[content].quote = quote;
      }
    });
  });

  const preferenceItems = Object.values(prefCounts)
    .filter((p) => p.count >= 2)
    .sort((a, b) => b.count - a.count);

  // Block ④ 진행 참고 (Flow: Warmup, Lead Style, Closing - ONLY shown when note count >= 4)
  let flowPattern = null;
  if (totalNotesCount >= 4) {
    let warmup = null;
    let leadStyle = null;
    let closing = null;

    // 1. Try to get explicit flow items from notes (search newest to oldest)
    for (let i = sortedNotes.length - 1; i >= 0; i--) {
      const f = sortedNotes[i].flow;
      if (f && typeof f === "object") {
        if (!warmup && f.warmup?.content) {
          warmup = { title: "도입", content: f.warmup.content, quote: f.warmup.quote || "" };
        }
        if (!leadStyle && f.leadStyle?.content) {
          leadStyle = { title: "주도", content: f.leadStyle.content, quote: f.leadStyle.quote || "" };
        }
        if (!closing && f.closing?.content) {
          closing = { title: "마무리", content: f.closing.content, quote: f.closing.quote || "" };
        }
      }
    }

    // 2. Dynamic Fallback Synthesis if flow items are missing in extracted notes
    const allPositives = sortedNotes.flatMap((n) => n.positiveSignals || []);
    const allNegatives = sortedNotes.flatMap((n) => n.negativeSignals || []);
    const allMaterials = sortedNotes.flatMap((n) => n.materials || []);
    const uniqueMaterials = [...new Set(allMaterials)];
    const topMaterial = uniqueMaterials[0] || "교구";

    if (!warmup) {
      const shySignal = allNegatives.find(
        (s) => s.content?.includes("낯가림") || s.content?.includes("불안") || s.quote?.includes("낯설어")
      );
      if (shySignal) {
        warmup = {
          title: "도입",
          content: `초반 적응 시간이 필요하므로 선호하는 ${topMaterial} 교구를 먼저 제시하며 탐색 유도`,
          quote: shySignal.quote || shySignal.content,
        };
      } else {
        const firstPos = allPositives.find(
          (s) => s.content?.includes("탐색") || s.content?.includes("흥미") || s.quote?.includes("탐색")
        );
        warmup = {
          title: "도입",
          content: `${topMaterial} 등 재료를 바로 쓰지 않고 만지고 탐색하는 시간을 먼저 부여`,
          quote: firstPos ? firstPos.quote || firstPos.content : `${topMaterial} 활동 탐색 시간을 먼저 가짐`,
        };
      }
    }

    if (!leadStyle) {
      const roleSignal = allPositives.find(
        (s) =>
          s.content?.includes("역할") ||
          s.content?.includes("주도") ||
          s.quote?.includes("의사") ||
          s.quote?.includes("가게") ||
          s.quote?.includes("역할")
      );
      if (roleSignal) {
        leadStyle = {
          title: "주도",
          content: "아이가 배역 및 주도권을 정해주는 스타일 — 제시하는 의도에 따라가면 자연스럽게 확장",
          quote: roleSignal.quote || roleSignal.content,
        };
      } else {
        const activePos = allPositives[0];
        leadStyle = {
          title: "주도",
          content: "아동의 반응과 표현에 맞추어 보조하며 정서적 공감대를 형성하는 스타일",
          quote: activePos ? activePos.quote || activePos.content : "자발적 참여 속도에 유연하게 맞추어 진행",
        };
      }
    }

    if (!closing) {
      const closingPos = sortedNotes
        .flatMap((n) => n.positiveSignals || [])
        .reverse()
        .find(
          (s) =>
            s.content?.includes("정리") ||
            s.content?.includes("약속") ||
            s.quote?.includes("마무리") ||
            s.quote?.includes("스케치북") ||
            s.quote?.includes("책")
        );

      if (closingPos) {
        closing = {
          title: "마무리",
          content: "책 읽기 · 그림 그리기 또는 정리정돈 등 정적 활동으로 마무리",
          quote: closingPos.quote || closingPos.content,
        };
      } else {
        closing = {
          title: "마무리",
          content: "수업 종료 전 미리 약속을 나누거나 스스로 정리정돈을 마칠 수 있도록 지도",
          quote: `${childInfo.childName || "아동"}와 함께 활동 교구를 정리하며 수업 마무리`,
        };
      }
    }

    flowPattern = { warmup, leadStyle, closing };
  }

  // Block ⑤ 변화 추이 (Trajectory Trend for 8+ notes)
  let trajectoryTrend = null;
  if (totalNotesCount >= 8) {
    const earlyNotes = sortedNotes.slice(0, Math.ceil(totalNotesCount / 3));
    const recentNotes = sortedNotes.slice(-Math.ceil(totalNotesCount / 3));

    const earlyMatList = [...new Set(earlyNotes.flatMap((n) => n.materials || []))].slice(0, 3);
    const recentMatList = [...new Set(recentNotes.flatMap((n) => n.materials || []))].slice(0, 3);

    const earlyPosCount = earlyNotes.flatMap((n) => n.positiveSignals || []).length;
    const recentPosCount = recentNotes.flatMap((n) => n.positiveSignals || []).length;

    trajectoryTrend = {
      summary: `${childInfo.childName || "아동"}의 ${totalNotesCount}회차 반응 변화 추이`,
      points: [
        `초기 (${earlyMatList.join(", ") || "기본 놀이"}) 탐색 위주에서 최근 (${recentMatList.join(", ") || "다양한 교구"}) 활동으로 놀이 영역이 확장되고 있습니다.`,
        recentPosCount >= earlyPosCount
          ? `회차가 지날수록 긍정적 상호작용과 자발적 참여 반응이 지속적으로 높아지고 있습니다.`
          : `선생님과의 라포 형성을 통해 자발적 의사표현 및 놀이 몰입도가 안정화되었습니다.`,
        `수업 마무리에 스스로 교구를 정리하거나 정적 활동으로 자연스럽게 정돈하는 자율성을 보입니다.`,
      ],
    };
  }

  const completedRehearsals = [];

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
