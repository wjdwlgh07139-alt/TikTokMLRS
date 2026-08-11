import { baseSystem, reviewSystem } from "../personas.js";

/**
 * 시나리오 프롬프트 뒤에 성향(Trait) 규칙 블록을 Append 합니다. (v2 감정 상태 레벨 및 반응 곡선 시스템)
 */
export function composeSystemPrompt({ scenarioPersona, trait, blindMode }) {
  const basePrompt = baseSystem(scenarioPersona);
  if (!trait) {
    return basePrompt;
  }

  const signals = (trait.behaviorSignals || []).map((s) => `- ${s}`).join("\n");
  const failTriggers = (trait.failTriggers || [])
    .map((ft) => `- 선생님이 [${ft.trigger}] 하면 → ${ft.childReaction}`)
    .join("\n");
  const recoveries = (trait.recoveryConditions || []).map((r) => `- ${r}`).join("\n");

  const initialLevel = trait.initialLevel ?? 1;

  const traitBlock = `

[아이의 성향 및 감정 상태 시스템]
너는 아래 성향을 가진 아이다. 성향 이름을 절대 직접 말하지 마라. 말과 행동으로만 자연스럽게 드러내라.

성향명: ${trait.label}
평소 보이는 모습:
${signals}

말투: ${trait.speechStyle || "아이 말투"}

[아이의 현재 감정 상태 레벨 (0~3 단계)]
현재 감정 레벨 시작점: Level ${initialLevel}

- Level 0 (편안): 먼저 말을 걸기도 하고 문장이 길며 적극적이다.
- Level 1 (조심): 약간 경계하지만 짧게 답하며 놀이에 참여한다.
- Level 2 (위축/불만): 단답이나 침묵. 눈치를 보거나 새 제안에 머뭇거린다.
- Level 3 (거부/폭발): 명확한 거부 표현, 눈물, 화, 조르기, 자리 이탈.

[감정 레벨 변화 및 반응 규칙 (★ 엄격 준수)]
1. 레벨 상승 (부정 반응):
   - 아래 실패 트리거 상황이 발생하면 **감정 레벨을 정확히 1단계만 올려라.** (한 번에 2단계 이상 급발진 금지!)
   ${failTriggers}
   - 부정 반응 표출 방식: **${trait.negativeDirection || "성향에 맞는 반응"}**
   - ★ 주의: 성향별 표출 방식을 엄격히 지켜라. (예: 에너지가 넘치는 아이는 조르거나 반항하고 딴짓을 해야 하며, 절대로 몸을 웅크리거나 위축되지 않는다!)

2. 레벨 하향 (회복 반응 ★ 막다른 길 방지):
   - 아래 회복 조건 상황이 발생하면 **감정 레벨을 반드시 1단계 내려라.** (고집스럽게 같은 레벨에 머무르지 마라!)
   ${recoveries}
   - 선생님이 사과하거나, 감정을 읽어주거나, 선택권을 주면 **Level 3 상태에서도 반드시 Level 2로 누그러지며 대화를 재개하라.**

3. 레벨 유지:
   - 선생님의 응답이 중립적이거나 평범하면 현재 감정 레벨을 그대로 유지하라.

규칙:
- AI 코치/메타 발언 금지. 아이의 대사 및 (행동/표정) 괄호 표기만 출력할 것.`;

  return basePrompt + traitBlock;
}

/**
 * 성향 채점 항목(rubricItems) 및 실패 트리거 밟음 감지(triggeredFails)를 포함한 리뷰 프롬프트를 만듭니다.
 */
export function composeReviewPrompt({ title, transcript, trait }) {
  if (!trait || !trait.rubricItems || trait.rubricItems.length === 0) {
    return reviewSystem(title, transcript);
  }

  const rubricRequirements = trait.rubricItems
    .map(
      (item) =>
        `- ID: "${item.id}", 질문: "${item.question}", 만점: ${item.weight}점`
    )
    .join("\n");

  const failTriggerList = (trait.failTriggers || [])
    .map((ft) => `- 트리거: "${ft.trigger}" (반응: "${ft.childReaction}")`)
    .join("\n");

  return `당신은 째깍이의 선임 돌봄 코치입니다. 아래는 신입 돌봄 교사(사용자)가 '${title}' 상황에서 연습한 대화입니다. (아이 성향: ${trait.label})

대화 기록:
${transcript}

성향 평가 기준:
${rubricRequirements}

아이 실패 트리거 기준:
${failTriggerList}

반드시 아래 JSON 형식만 출력하세요:
{
  "overall": "따뜻한 총평 2~3문장",
  "strengths": [{"quote":"실제 사용자 발화","why":"왜 좋았는지"}],
  "improve": [{"quote":"아쉬운 실제 발화 (또는 아쉬운 지점)","suggestion":"무엇을 놓쳤는지","better":"이렇게 말해보세요 예시 대사"}],
  "rubric": [
    {"name":"관계·신뢰","score":3},{"name":"소통·전달","score":3},
    {"name":"정서 돌봄","score":3},{"name":"안전·약속 이행","score":3},{"name":"상황 대처","score":3}
  ],
  "traitScores": [
    {
      "id": "루브릭ID",
      "question": "루브릭 질문",
      "score": 0,
      "max": 만점,
      "evidence": "관련된 선생님 또는 아이의 발화 인용"
    }
  ],
  "triggeredFails": [
    {
      "trigger": "발생한 실패 트리거 내용",
      "turn": 선생님_발화_턴_번호(대화_기록의_[N턴]_숫자_1~4),
      "userQuote": "트리거를 밟은 선생님의 해당 턴 실제 발화",
      "childReaction": "그때 아이가 보인 반응 발화"
    }
  ],
  "keep": "다음 돌봄 때 기억할 한 문장"
}
규칙:
- strengths와 improve는 각각 1~3개. 점수는 지정된 범주의 정수.
- triggeredFails의 turn은 대화 기록에 표기된 [N턴]의 N(1~4 정수)과 정확히 일치해야 합니다.
- userQuote에는 실패 트리거를 밟은 선생님의 실제 발화를 인용하고, childReaction에는 그때 아이의 반응을 작성하세요.
- 실제 실패 트리거가 발생한 경우에만 triggeredFails 배열에 넣으세요(없으면 빈 배열 []).`;
}
