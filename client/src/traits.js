export const TRAIT_DEFAULTS = [
  {
    id: "sensitive",
    label: "감수성이 풍부해요",
    summary: "작은 일에도 감정이 크게 움직이고 눈물이 많아요.",
  },
  {
    id: "anxious",
    label: "불안이 높아요",
    summary: "낯선 상황과 활동 전환에 불안해하고 확인을 자주 해요.",
  },
  {
    id: "achiever",
    label: "성취욕이 높아요",
    summary: "스스로 해결하고 싶어 하며 실패에 민감하게 반응해요.",
  },
  {
    id: "energetic",
    label: "에너지가 넘쳐요",
    summary: "몸을 많이 움직이고 흥미가 빠르게 이동해요.",
  },
  {
    id: "sensory",
    label: "감각이 민감해요",
    summary: "소리, 촉감, 새로운 자극에 신중하고 자극에 강하게 반응해요.",
  },
  {
    id: "shy",
    label: "수줍음이 많아요",
    summary: "낯을 가리고 서서히 적응하며 조용히 관찰해요.",
  },
];

export async function fetchTraits() {
  try {
    const res = await fetch("/api/traits");
    if (!res.ok) throw new Error("fetch traits failed");
    return await res.json();
  } catch (err) {
    console.warn("Using fallback trait defaults", err);
    return TRAIT_DEFAULTS;
  }
}
