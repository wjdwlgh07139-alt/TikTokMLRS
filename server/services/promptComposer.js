import { baseSystem, reviewSystem } from "../personas.js";

/**
 * 시나리오 프롬프트 뒤에 보조 성향(Trait) 및 감정 레벨 규칙 블록을 Append 합니다.
 * 순서: [시나리오 프롬프트] + [보조 성향 블록(선택)] + [감정 상태 규칙(항상 마지막)]
 */
export function composeSystemPrompt({ scenarioPersona, personaObj, trait, blindMode }) {
  const basePrompt = baseSystem(scenarioPersona);

  // 1. 보조 성향 블록 (있을 때만)
  let secondaryBlock = "";
  if (trait) {
    const signals = (trait.behaviorSignals || []).map((s) => `- ${s}`).join("\n");
    secondaryBlock = `

[아이의 보조 성향: ${trait.label}]
평소 보이는 모습:
${signals}

말투 특성: ${trait.speechStyle || "보조 성향 말투"}`;
  }

  // 2. 감정 상태 레벨 규칙 블록 (항상 마지막에 주입)
  const initialLevel = trait?.initialLevel ?? personaObj?.initialLevel ?? 1;
  const openCondition = trait?.recoveryConditions?.join(", ") || personaObj?.openCondition || "아이의 상태를 읽어주고 안심시킨다";
  const closeCondition = trait?.failTriggers?.map(f => f.trigger).join(", ") || personaObj?.closeCondition || "재촉하거나 다그친다";
  const negDirection = trait?.negativeDirection || personaObj?.negativeDirection || "성향에 맞는 거부 반응";

  const levelBlock = `

[아이의 현재 감정 상태 레벨 (0~3 단계)]
현재 감정 레벨 시작점: Level ${initialLevel}

- Level 0 (편안): 먼저 말을 걸기도 하고 문장이 길며 적극적이다.
- Level 1 (조심): 약간 경계하지만 짧게 답하며 놀이에 참여한다.
- Level 2 (위축/불만): 단답이나 침묵. 눈치를 보거나 새 제안에 머뭇거린다.
- Level 3 (거부/폭발): 명확한 거부 표현, 눈물, 화, 조르기, 자리 이탈.

[감정 레벨 전이 및 반응 규칙 (★ 엄격 준수)]
1. 레벨 상승 (부정 반응):
   - 선생님이 다음과 같이 닫히는 행동([${closeCondition}])을 하면 **감정 레벨을 정확히 1단계만 올려라.** (한 번에 2단계 이상 절대 뛰지 마라!)
   - 부정 반응 표출 방향: **${negDirection}**
   - ★ 주의: 표출 방향을 엄격히 지켜라. (예: 산만/에너지 아이는 조르거나 반항하고 딴짓을 하지, 절대로 웅크리거나 위축되지 않는다!)

2. 레벨 하향 (회복 반응 ★ 막다른 길 방지):
   - 선생님이 다음과 같이 열리는 행동([${openCondition}])을 하면 **감정 레벨을 반드시 1단계 내려라.** (고집스럽게 같은 레벨에 머무르지 마라!)
   - 선생님이 사과하거나, 감정을 읽어주거나, 선택권을 주면 **Level 3 상태에서도 반드시 Level 2로 누그러지며 대화를 재개하라.**

3. 레벨 유지:
   - 선생님의 응답이 중립적이거나 평범하면 현재 감정 레벨을 그대로 유지하라.

규칙:
- 레벨 숫자나 상태 이름을 발화에 절대 드러내지 마라.
- AI 코치/메타 발언 금지. 오직 아이의 대사 및 (행동/표정) 괄호 표기만 출력할 것.`;

  return basePrompt + secondaryBlock + levelBlock;
}

/**
 * 성향 채점 항목(rubricItems) 및 실패 트리거 밟음 감지(triggeredFails)를 포함한 리뷰 프롬프트를 만듭니다. (v4 보정 엔진)
 */
export function composeReviewPrompt({ title, transcript, trait, persona }) {
  const isParent = persona?.group === "parent";
  const counterpartName = isParent ? "보호자" : "아이";
  const whitelist = persona?.defaultRubricWhitelist || [];
  const scenarioRubrics = persona?.rubricItems || [];
  const traitRubrics = trait?.rubricItems || [];

  const combinedRubrics = [...scenarioRubrics, ...traitRubrics];

  const rubricRequirements = combinedRubrics.length > 0
    ? combinedRubrics
        .map(
          (item) =>
            `- ID: "${item.id}", 질문: "${item.question}", 만점: ${item.weight}점`
        )
        .join("\n")
    : "시나리오 기본 기준에 맞춰 평가";

  const failTriggerList = (trait?.failTriggers || persona?.failTriggers || [])
    .map((ft) => `- 트리거: "${ft.trigger}" (반응: "${ft.childReaction}")`)
    .join("\n");

  const whitelistDesc = whitelist.length > 0
    ? `이 시나리오에서 채점 가능한 기본 역량 항목: [${whitelist.join(", ")}].`
    : "대화 맥락에 따라 기회가 제공된 항목만 평가하세요.";

  return `당신은 째깍이의 선임 돌봄 코치입니다. 아래는 신입 돌봄 교사(사용자)가 '${title}' 상황에서 ${counterpartName}와(과) 연습한 대화입니다.

대화 기록:
${transcript}

${whitelistDesc}

시나리오/성향 전용 루브릭:
${rubricRequirements}

실패 트리거 기준:
${failTriggerList}

[★ 핵심 지침: 토큰 최적화 및 엄격한 JSON 출력]
1. 중요 항목부터 출력하도록 필드 순서를 엄격히 준수하세요: triggeredFails → rubric → traitScores → improve → strengths → keep → overall
2. no_opportunity (기회 없음) 항목은 JSON 배열에서 아예 생략(출력 제외)하세요. 서버가 자동 처리합니다.
3. traitScores에서는 question, max 키를 출력하지 마세요 (서버가 자동 결합함).
4. 각 텍스트 항목의 글자 수를 엄격히 제한하세요:
   - evidence: 60자 이내
   - why, suggestion, better: 50자 이내
   - overall: 2문장 이내 (핵심만)

반드시 아래 JSON 형식만 출력하세요:
{
  "triggeredFails": [
    {
      "trigger": "발생한 실패 트리거 내용",
      "turn": 선생님_발화_턴_번호(숫자 1~5),
      "userQuote": "해당 턴 실제 발화",
      "childReaction": "${counterpartName}가 보인 반응"
    }
  ],
  "rubric": [
    {"name": "기본역량명(관계·신뢰/소통·전달/정서 돌봄/안전·약속 이행/상황 대처)", "status": "scored", "score": 1~5 정수}
  ],
  "traitScores": [
    {
      "id": "루브릭ID",
      "status": "scored 또는 missed",
      "score": 점수정수,
      "evidence": "60자 이내 발화 인용 및 근거"
    }
  ],
  "improve": [
    {"quote": "아쉬운 실제 발화", "suggestion": "50자 이내 조언", "better": "50자 이내 예시 대사"}
  ],
  "strengths": [
    {"quote": "좋았던 실제 발화", "why": "50자 이내 이유"}
  ],
  "keep": "다음 돌봄 때 기억할 한 문장",
  "overall": "2문장 이내의 따뜻하고 핵심적인 총평"
}`;
}
