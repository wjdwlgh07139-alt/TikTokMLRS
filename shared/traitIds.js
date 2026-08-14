// Shared Trait IDs between Rehearsal Scenarios & Care Note Extraction
export const TRAIT_IDS = {
  SHY: "shy",            // 낯가림 / 수줍음
  CLING: "cling",        // 엄마를 찾는 아이 / 분리불안
  HYPER: "hyper",        // 산만한 아이 / 활동 전환 잦음
  STUBBORN: "stubborn",  // 고집부리는 아이
  ROUGH: "rough",        // 터프한 아이 / 거친 표현
  QUIET: "quiet",        // 지나치게 조용한 아이
  ATTACHED: "attached",  // 과하게 들러붙는 아이
  WHY: "why",            // "왜요?" 공세 아이
  CHEERFUL: "cheerful",  // 활발하고 잘 노는 아이 (기본 균형 시나리오)
};

// Rehearsal Scenario ID Mapping
export const TRAIT_SCENARIO_MAP = {
  [TRAIT_IDS.SHY]: "shy",
  [TRAIT_IDS.CLING]: "cling",
  [TRAIT_IDS.HYPER]: "hyper",
  [TRAIT_IDS.STUBBORN]: "stubborn",
  [TRAIT_IDS.ROUGH]: "rough",
  [TRAIT_IDS.QUIET]: "quiet",
  [TRAIT_IDS.ATTACHED]: "attached",
  [TRAIT_IDS.WHY]: "why",
  [TRAIT_IDS.CHEERFUL]: "cheerful",
};
