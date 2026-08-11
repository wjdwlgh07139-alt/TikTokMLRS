// 서버 personas.js API 통신 모듈 및 Fallback 데이터
export async function fetchScenarios() {
  try {
    const res = await fetch("/api/scenarios");
    if (!res.ok) throw new Error("fetch scenarios failed");
    return await res.json();
  } catch (err) {
    console.warn("Using fallback scenarios", err);
    return SCENARIOS_FALLBACK;
  }
}

export const SCENARIOS_FALLBACK = [
  {
    id: "cheerful",
    group: "child",
    emoji: "☀️",
    title: "활발하고 잘 노는 아이",
    situation: "첫 방문 직후. 먼저 인사하고 제안에 즉각 호응해요.",
    tags: ["기본 절차", "성공 경험"],
    level: "easy",
    turns: 3,
    initialLevel: 0,
    openingLine: "선생님 안녕하세요! 오늘 저랑 뭐 하고 놀 거예요? 저 블록 완전 좋아해요!",
    feedbackType: "silent",
    secondaryTraits: []
  },
  {
    id: "quiet",
    group: "child",
    emoji: "😶",
    title: "지나치게 조용한 아이",
    situation: "첫 방문 15분 경과, 부모 외출. '네·몰라요'로만 답하고 표정 변화가 없어요.",
    tags: ["열린 질문", "관심사 추적"],
    level: "mid",
    turns: 5,
    initialLevel: 2,
    openingLine: "(선생님 시선을 피하고 바닥을 보며) …네. 몰라요.",
    feedbackType: "silent",
    secondaryTraits: []
  },
  {
    id: "attached",
    group: "child",
    emoji: "🐥",
    title: "과하게 들러붙는 아이",
    situation: "두 번째 방문. 계속 안기고 '이거 봐요' 반복. 부모 요청 활동을 시작하지 못해요.",
    tags: ["애정 수용", "활동 전환"],
    level: "hard",
    turns: 4,
    initialLevel: 0,
    openingLine: "(선생님 팔에 찰싹 붙으며) 선생님! 이것도 봐요! 나 예쁘죠? 계속 나만 봐요!",
    feedbackType: "signal",
    secondaryTraits: []
  },
  {
    id: "why",
    group: "child",
    emoji: "❓",
    title: "\"왜요?\" 공세 아이",
    situation: "방문 30분 경과. 모든 발화가 꼬리 질문이며 난이도가 답할 수 없는 영역까지 올라가요.",
    tags: ["솔직한 인정", "함께 탐구"],
    level: "mid",
    turns: 4,
    initialLevel: 0,
    openingLine: "선생님, 하늘은 왜 파래요? 그럼 왜 밤에는 검은색이에요? 왜요?",
    feedbackType: "silent",
    secondaryTraits: []
  },
  {
    id: "shy",
    group: "child",
    emoji: "🙈",
    title: "낯가리는 아이",
    situation: "어린이집에서 처음 만난 아이. 엄마 뒤에 반쯤 숨어 있고 눈을 잘 마주치지 않아요.",
    tags: ["서두르지 않기", "경계 낮추기"],
    level: "mid",
    turns: 4,
    initialLevel: 2,
    openingLine: "…(엄마 옷자락을 잡고 반쯤 숨어 선생님을 힐끔 본다)",
    feedbackType: "signal",
    secondaryTraits: ["sensitive"]
  },
  {
    id: "cling",
    group: "child",
    emoji: "🥺",
    title: "엄마를 찾는 아이",
    situation: "엄마가 방금 나갔어요. 아이가 울먹이며 '엄마 언제 와'를 반복합니다.",
    tags: ["분리불안 달래기", "정서 안정"],
    level: "mid",
    turns: 4,
    initialLevel: 2,
    openingLine: "엄마 어디 갔어요… 엄마 언제 와요? (훌쩍)",
    feedbackType: "signal",
    secondaryTraits: []
  },
  {
    id: "hyper",
    group: "child",
    emoji: "🌀",
    title: "산만한 아이",
    situation: "한곳에 집중하지 못하고 계속 움직여요. 재미있는 활동을 제안하면 흥미를 옮깁니다.",
    tags: ["에너지 맞추기", "집중 유도"],
    level: "mid",
    turns: 4,
    initialLevel: 0,
    openingLine: "이거 뭐예요? 저 저거 갖고 싶어요! 우리 뛰어놀면 안 돼요?",
    feedbackType: "signal",
    secondaryTraits: []
  },
  {
    id: "stubborn",
    group: "child",
    emoji: "😤",
    title: "고집부리는 아이",
    situation: "무엇을 제안해도 '싫어, 안 해'. 선택권을 주면 마음이 열려요.",
    tags: ["선택권 주기", "감정 읽기"],
    level: "hard",
    turns: 4,
    initialLevel: 1,
    openingLine: "싫어. 그거 안 할 거야.",
    feedbackType: "signal",
    secondaryTraits: ["achiever"]
  },
  {
    id: "rough",
    group: "child",
    emoji: "⚡",
    title: "터프한 아이",
    situation: "뜻대로 안 되면 소리치고 거칠어져요. 장난감을 던지려 합니다.",
    tags: ["안전 우선", "감정 읽기"],
    level: "hard",
    turns: 4,
    initialLevel: 1,
    openingLine: "(블록을 집어 던지려 한다) 다 싫어! 저리 가!",
    feedbackType: "signal",
    secondaryTraits: ["sensitive"]
  },
  {
    id: "first",
    group: "parent",
    emoji: "🤝",
    title: "불안한 첫 만남",
    situation: "처음 방문한 집. 엄마가 경험과 신뢰를 확인하고 싶어해요.",
    tags: ["신뢰 형성", "부드러운 어조"],
    level: "mid",
    turns: 3,
    initialLevel: 1,
    openingLine: "안녕하세요… 처음 뵙는 거라 걱정이 좀 많았어요. 혹시 아이 돌봐본 경험이 있으세요?",
    feedbackType: "signal",
    secondaryTraits: []
  },
  {
    id: "report",
    group: "parent",
    emoji: "📝",
    title: "하루 보고",
    situation: "하원 후 보호자가 오늘 아이가 어떻게 지냈는지 구체적으로 알고 싶어해요.",
    tags: ["관찰 전달", "소통"],
    level: "easy",
    turns: 3,
    initialLevel: 0,
    openingLine: "오늘 어땠어요? 우리 애가 잘 지냈어요? 밥은 잘 먹었나요?",
    feedbackType: "signal",
    secondaryTraits: []
  },
  {
    id: "grill",
    group: "parent",
    emoji: "🔍",
    title: "꼼꼼한 부모의 질문",
    situation: "알러지, 비상연락, 간식, 미디어 규칙을 꼼꼼히 확인해요.",
    tags: ["안전·약속", "침착함"],
    level: "hard",
    turns: 3,
    initialLevel: 1,
    openingLine: "몇 가지만 확인할게요. 아이가 견과류 알러지가 있어요. 비상연락이나 미디어 규칙은 알고 계시죠?",
    feedbackType: "signal",
    secondaryTraits: []
  }
];

export const SCENARIOS = SCENARIOS_FALLBACK;
