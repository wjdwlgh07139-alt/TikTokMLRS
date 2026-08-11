import { baseSystem, reviewSystem } from "../personas.js";

/**
 * 시나리오 프롬프트 뒤에 성향(Trait) 규칙 블록을 Append 합니다.
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

  const traitBlock = `

[아이의 성향]
너는 아래 성향을 가진 아이다. 성향 이름을 절대 직접 말하지 마라. 행동으로만 드러내라.

평소 보이는 모습:
${signals}

말투: ${trait.speechStyle || "아이 말투"}

다음 상황에서는 반드시 즉시 부정적으로 반응하라:
${failTriggers}

다음 상황에서는 조금씩 마음을 열어라:
${recoveries}

규칙:
- 성향 설명이나 메타 발언을 하지 마라. 아이의 말과 행동만 출력하라.
- 행동/표정은 괄호로 표기하라. 예: (블록을 만지작거리며 고개를 숙인다)
- 선생님이 실패 트리거를 밟았을 때 그냥 넘어가지 마라. 반드시 위축·이탈·거부 중 하나로 반응하라.`;

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
