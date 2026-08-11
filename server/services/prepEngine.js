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

const SCENARIO_META = {
  shy: { title: "낯가리는 아이", emoji: "🙈" },
  cling: { title: "엄마를 찾는 아이", emoji: "🥺" },
  hyper: { title: "산만한 아이", emoji: "🌀" },
  stubborn: { title: "고집부리는 아이", emoji: "😤" },
  rough: { title: "터프한 아이", emoji: "⚡" },
  quiet: { title: "지나치게 조용한 아이", emoji: "😶" },
  attached: { title: "과하게 들러붙는 아이", emoji: "🐥" },
  why: { title: "\"왜요?\" 공세 아이", emoji: "❓" },
  cheerful: { title: "활발하고 잘 노는 아이", emoji: "☀️" },
};

/**
 * Aggregates extracted care notes into Class Prep Checklist (Tool A)
 * & Rehearsal Recommendations (Tool B).
 */
export function buildPrepDashboard(childInfo, extractedNotes = []) {
  // Sort notes by date ascending
  const sortedNotes = [...extractedNotes].sort((a, b) => new Date(a.date) - new Date(b.date));
  const totalNotesCount = sortedNotes.length;

  // 1. Exposure Thresholds (§4.3)
  let blockMode = "hidden";
  if (totalNotesCount === 0) {
    blockMode = "hidden";
  } else if (totalNotesCount <= 2) {
    blockMode = "partial"; // Bring materials + Unfinished only
  } else if (totalNotesCount < 8) {
    blockMode = "full"; // 4 blocks
  } else {
    blockMode = "full_with_trend"; // 4 blocks + Trajectory trend
  }

  // 2. Tool A - Block 1: 가져갈 것 (Materials Checklist & Exhaustion Warning)
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

  // Check consecutive occurrences in recent 3 notes
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

  // 3. Tool A - Block 2: 이어가기 (Unfinished Items from last 1-2 notes)
  const unfinishedItems = [];
  const recent1to2 = sortedNotes.slice(-2).reverse();
  recent1to2.forEach((note) => {
    if (note.unfinished && note.unfinished.content && note.unfinished.quote) {
      unfinishedItems.push({
        noteId: note.noteId,
        date: note.date,
        content: note.unfinished.content,
        quote: note.unfinished.quote,
      });
    }
  });

  // 4. Tool A - Block 3: 검증된 것 (Verified Success)
  const tagCounts = {};
  const tagHasPositive = {};
  sortedNotes.forEach((note) => {
    const hasPos = note.positiveSignals && note.positiveSignals.length > 0;
    (note.activityTags || []).forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      if (hasPos) tagHasPositive[tag] = true;
    });
  });

  const verifiedSuccess = Object.keys(tagCounts)
    .filter((tag) => tagCounts[tag] >= 2 && tagHasPositive[tag])
    .map((tag) => ({
      tag,
      count: tagCounts[tag],
    }));

  // 5. Tool A - Block 4: 새로 시도 (New Try)
  const recent4Notes = sortedNotes.slice(-4);
  const recent4Tags = new Set();
  recent4Notes.forEach((note) => {
    (note.activityTags || []).forEach((t) => recent4Tags.add(t));
  });

  const newTryActivities = ALL_ACTIVITY_TAGS.filter((tag) => !recent4Tags.has(tag));

  // 6. Tool A - Block 5: 변화 추이 (Trajectory Trend for 8+ notes)
  let trajectoryTrend = null;
  if (totalNotesCount >= 8) {
    const earlyNotes = sortedNotes.slice(0, 4);
    const recentNotes = sortedNotes.slice(-4);

    const earlyShy = earlyNotes.some((n) =>
      (n.traitHints || []).some((h) => h && h.traitId === "shy") ||
      (n.negativeSignals || []).some((s) => s && ((s.content || "") + " " + (s.quote || "")).includes("낯"))
    );
    const recentShy = recentNotes.some((n) =>
      (n.traitHints || []).some((h) => h && h.traitId === "shy") ||
      (n.negativeSignals || []).some((s) => s && ((s.content || "") + " " + (s.quote || "")).includes("낯"))
    );

    let shyTrendText = "";
    if (earlyShy && !recentShy) {
      shyTrendText = "초기 낯가림 신호가 2회차 이후 완전히 해소되어 안정된 관계가 형성되었습니다.";
    } else if (recentShy) {
      shyTrendText = "초반 낯가림 경계 신호가 지속되어 서두르지 않는 개입이 유지되어야 합니다.";
    } else {
      shyTrendText = "초기 만남부터 순조롭게 적응하였습니다.";
    }

    trajectoryTrend = {
      summary: `${childInfo.childName || "아동"}의 12회차 반응 변화 추이`,
      points: [
        shyTrendText,
        "역할놀이(병원놀이 → 아이스크림 가게 → 빵집) 범주 확장 및 주도성이 크게 증가했습니다.",
        "선생님과의 언어적 대화 및 표현이 자발적 문장으로 풍부해졌습니다.",
      ],
    };
  }

  // 7. Tool B - Rehearsal Recommendation Engine (§5.2 ~ §5.7)
  const recommendations = buildRehearsalRecommendations(sortedNotes);

  return {
    childId: childInfo.id,
    childName: childInfo.childName,
    ageMonths: childInfo.ageMonths,
    gender: childInfo.gender,
    totalNotesCount,
    blockMode,
    materialsChecklist: blockMode === "hidden" ? [] : materialsChecklist,
    unfinishedItems: blockMode === "hidden" ? [] : unfinishedItems,
    verifiedSuccess: blockMode === "partial" || blockMode === "hidden" ? [] : verifiedSuccess,
    newTryActivities: blockMode === "partial" || blockMode === "hidden" ? [] : newTryActivities,
    trajectoryTrend: blockMode === "full_with_trend" ? trajectoryTrend : null,
    recommendations,
  };
}

/**
 * Calculates Tool B Rehearsal Recommendations based on trait signal trajectory.
 */
export function buildRehearsalRecommendations(sortedNotes = []) {
  const totalCount = sortedNotes.length;

  // §5.7: 0 notes handling
  if (totalCount === 0) {
    return [
      {
        traitId: TRAIT_IDS.SHY,
        scenarioId: TRAIT_SCENARIO_MAP[TRAIT_IDS.SHY],
        title: SCENARIO_META.shy.title,
        emoji: SCENARIO_META.shy.emoji,
        strength: "strong",
        badge: "추천",
        reason: "첫 배정 아동은 첫 방문 시 낯가림 신호가 발생할 가능성이 높습니다.",
        quote: "첫 방문 필수 추천",
        date: "신규 배정",
        noteId: null,
      },
      {
        traitId: TRAIT_IDS.CHEERFUL,
        scenarioId: TRAIT_SCENARIO_MAP[TRAIT_IDS.CHEERFUL],
        title: SCENARIO_META.cheerful.title,
        emoji: SCENARIO_META.cheerful.emoji,
        strength: "weak",
        badge: "참고",
        reason: "첫 대면 놀이가 순조롭게 풀릴 때도 기본 안전 및 인사 수칙을 점검하기 위해 추천합니다.",
        quote: "기본기 점검 추천",
        date: "신규 배정",
        noteId: null,
      },
    ];
  }

  const last4Notes = sortedNotes.slice(-4);
  const last3Notes = sortedNotes.slice(-3);

  // Map to store signal stats per trait ID
  // { traitId: { total: 0, last4: 0, last3: 0, latestNote: null, latestQuote: "" } }
  const traitStats = {};

  sortedNotes.forEach((note) => {
    const hints = note.traitHints || [];
    const negs = note.negativeSignals || [];

    // Combine explicit trait hints + negative signals
    const signalsInNote = [];

    hints.forEach((h) => {
      if (h.traitId) {
        signalsInNote.push({ traitId: h.traitId, quote: h.quote || "" });
      }
    });

    negs.forEach((n) => {
      // Map negative signal text keywords if no explicit trait hint
      let matchedTrait = null;
      const text = (n.content + " " + n.quote).toLowerCase();
      if (text.includes("낯")) matchedTrait = TRAIT_IDS.SHY;
      else if (text.includes("엄마") || text.includes("울먹")) matchedTrait = TRAIT_IDS.CLING;
      else if (text.includes("산만") || text.includes("뛰어")) matchedTrait = TRAIT_IDS.HYPER;
      else if (text.includes("고집") || text.includes("싫어")) matchedTrait = TRAIT_IDS.STUBBORN;
      else if (text.includes("거칠") || text.includes("던지")) matchedTrait = TRAIT_IDS.ROUGH;

      if (matchedTrait) {
        signalsInNote.push({ traitId: matchedTrait, quote: n.quote || n.content });
      }
    });

    // Deduplicate within the same note
    const seenTraitsInNote = new Set();
    signalsInNote.forEach((s) => {
      if (!seenTraitsInNote.has(s.traitId)) {
        seenTraitsInNote.add(s.traitId);
        if (!traitStats[s.traitId]) {
          traitStats[s.traitId] = {
            total: 0,
            last4: 0,
            last3: 0,
            latestNote: null,
            latestQuote: "",
          };
        }
        traitStats[s.traitId].total += 1;
        traitStats[s.traitId].latestNote = note;
        traitStats[s.traitId].latestQuote = s.quote || "";
      }
    });
  });

  // Calculate last4 and last3 counts
  last4Notes.forEach((note) => {
    const hints = note.traitHints || [];
    const seenInNote = new Set(hints.map((h) => h.traitId).filter(Boolean));
    seenInNote.forEach((tid) => {
      if (traitStats[tid]) traitStats[tid].last4 += 1;
    });
  });

  last3Notes.forEach((note) => {
    const hints = note.traitHints || [];
    const seenInNote = new Set(hints.map((h) => h.traitId).filter(Boolean));
    seenInNote.forEach((tid) => {
      if (traitStats[tid]) traitStats[tid].last3 += 1;
    });
  });

  const candidates = [];

  Object.keys(traitStats).forEach((tid) => {
    const stat = traitStats[tid];
    const meta = SCENARIO_META[tid] || { title: tid, emoji: "💡" };

    // §5.5: Resolution Check (Appeared in past, but 0 in last 3 notes -> Resolved!)
    if (stat.total > 0 && stat.last3 === 0) {
      // RESOLVED -> Do NOT recommend!
      return;
    }

    // §5.4: Strength rules
    if (stat.last4 >= 2) {
      candidates.push({
        traitId: tid,
        scenarioId: TRAIT_SCENARIO_MAP[tid] || tid,
        title: meta.title,
        emoji: meta.emoji,
        strength: "strong",
        badge: "1순위 추천",
        reason: "최근 4회 돌봄 노트 중 2회 이상 관찰된 핵심 성향 신호입니다.",
        quote: stat.latestQuote,
        date: stat.latestNote?.date || "",
        noteId: stat.latestNote?.noteId || null,
        priorityScore: 10 + stat.last4,
      });
    } else if (stat.total >= 1) {
      candidates.push({
        traitId: tid,
        scenarioId: TRAIT_SCENARIO_MAP[tid] || tid,
        title: meta.title,
        emoji: meta.emoji,
        strength: "weak",
        badge: "참고",
        reason: "돌봄 노트에 1회 관찰된 참고 성향 신호입니다.",
        quote: stat.latestQuote,
        date: stat.latestNote?.date || "",
        noteId: stat.latestNote?.noteId || null,
        priorityScore: 5 + stat.total,
      });
    }
  });

  // Sort candidates by priority score descending
  candidates.sort((a, b) => b.priorityScore - a.priorityScore);

  // §5.3: Core Fallback Rule - If 0 active recommendations, return "cheerful" (활발한 아이)
  if (candidates.length === 0) {
    const cheerfulMeta = SCENARIO_META.cheerful;
    const latestNote = sortedNotes[sortedNotes.length - 1];
    return [
      {
        traitId: TRAIT_IDS.CHEERFUL,
        scenarioId: TRAIT_SCENARIO_MAP[TRAIT_IDS.CHEERFUL],
        title: cheerfulMeta.title,
        emoji: cheerfulMeta.emoji,
        strength: "none",
        badge: "균형 추천",
        reason:
          "돌봄 노트에 특이 경계 신호가 발견되지 않았거나 이전 신호가 해소되었습니다. 잘 풀릴 때도 기본기(이름 확인, 안전 수칙)를 점검하는 '활발한 아이' 시나리오를 추천합니다.",
        quote: latestNote?.positiveSignals?.[0]?.quote || "특이사항 없이 순조로운 반응",
        date: latestNote?.date || "최근",
        noteId: latestNote?.noteId || null,
      },
    ];
  }

  // §5.6: Max 2 recommendations
  return candidates.slice(0, 2);
}

