import { useState } from "react";

const PRESET_TEMPLATES = [
  {
    label: "🚗 블록·자동차",
    activity: "자동차 주차장 만들기",
    content:
      "아이가 장난감 자동차에 관심을 보여 블록으로 주차장을 조립하고 즐거운 연계 놀이를 진행했습니다.",
  },
  {
    label: "🎨 미술·만들기",
    activity: "색종이 접기 및 그림 그리기",
    content:
      "좋아하는 캐릭터와 동물을 그리고 색종이 접기를 함께 진행하며 소근육 발달과 표현력을 기르는 시간을 가졌습니다.",
  },
  {
    label: "📚 독서·이야기",
    activity: "동화책 읽기 및 생각 나누기",
    content:
      "아이가 좋아하는 동화책을 읽고 이야기 속 등장인물에 대해 자유롭게 표현해보며 높은 집중력을 보였습니다.",
  },
  {
    label: "🧩 보드게임·퍼즐",
    activity: "보드게임 및 맞춤 퍼즐",
    content:
      "규칙이 있는 보드게임과 퍼즐 맞추기 놀이를 통해 차례를 지키고 문제를 해결해보는 성취감을 맛보았습니다.",
  },
  {
    label: "🏃 실내 신체놀이",
    activity: "신체 율동 및 장애물 통과 놀이",
    content:
      "신나는 음악에 맞춰 율동을 하고 안전한 실내 장애물 놀이를 통해 건강하게 에너지 발산 활동을 진행했습니다.",
  },
];

// ── 특이사항(사고·건강·정서) 종료 메시지 룰베이스 변주 ──
// 각 build(v)는 4단계로 구성: ① 사실 → ② 조치 → ③ 현재 상태 → ④ 이후 안내
const ISSUE_TEMPLATES = {
  '없음': {
    severity: 'none',
    build: () => `별도의 특이사항은 없었습니다.`
  },

  '가벼운 부딪힘·넘어짐': {
    severity: 'light',
    build: (v) =>
      `활동 중 ${v.child || "아이"}가 ${v.where || '놀이 도중'} 살짝 부딪혔어요. ` +
      `바로 상태를 살폈고 붓거나 상처가 나진 않았습니다. ` +
      `잠시 후 편안하게 놀이를 이어갔어요. ` +
      `귀가 후에도 한 번 확인해주시면 좋을 것 같습니다.`
  },

  '긁힘·찰과상': {
    severity: 'followup',
    build: (v) =>
      `활동 중 ${v.child || "아이"}가 넘어져 ${v.where || '팔'}에 긁힌 상처가 생겼어요. ` +
      `활동 중 바로 연락드린 것처럼 상처를 소독했고, 운영본부에도 상황을 공유했습니다. ` +
      `현재는 붓기 없이 안정된 상태예요. ` +
      `저녁에 붓기나 통증이 있는지 살펴봐 주시고, 추가로 필요한 부분은 운영본부를 통해 안내드리겠습니다.`
  },

  '멍·붓기 관찰 필요': {
    severity: 'followup',
    build: (v) =>
      `${v.child || "아이"}가 ${v.where || '무릎'}을 부딪혀 약간 붉어진 자국이 생겼어요. ` +
      `냉찜질로 진정시켰고, 상황을 운영본부에 공유했습니다. ` +
      `크게 아파하진 않았고 활동은 정상적으로 마쳤어요. ` +
      `시간이 지나며 멍이나 붓기가 올라올 수 있으니 오늘 저녁 상태를 한 번 살펴봐 주세요.`
  },

  '코피': {
    severity: 'light',
    build: (v) =>
      `활동 중 ${v.child || "아이"}가 코피를 흘렸어요. ` +
      `고개를 살짝 숙이게 하고 콧등을 눌러 지혈했으며, 몇 분 후 멎었습니다. ` +
      `이후 컨디션에 큰 문제 없이 놀이를 이어갔어요. ` +
      `자주 반복된다면 병원 상담이 필요할 수 있어 참고로 전해드립니다.`
  },

  '가벼운 발열·컨디션 저하': {
    severity: 'followup',
    build: (v) =>
      `활동 후반에 ${v.child || "아이"}가 평소보다 처지고 몸이 약간 따뜻하게 느껴졌어요. ` +
      `활동 강도를 낮추고 수분을 챙겼으며, 활동 중 보호자님께 미리 알려드렸습니다. ` +
      `마칠 무렵 큰 이상은 없었지만 컨디션을 지켜볼 필요가 있어 보였어요. ` +
      `귀가 후 체온과 상태를 확인해주시고, 필요하면 병원 진료를 권해드립니다.`
  },

  '정서적 특이사항(울음·불안)': {
    severity: 'light',
    build: (v) =>
      `오늘 ${v.child || "아이"}가 활동 초반에 낯설어하며 많이 울었어요. ` +
      `억지로 진행하지 않고 곁에서 기다리며 안정을 도왔습니다. ` +
      `후반에는 마음을 열고 함께 놀이를 즐겼어요. ` +
      `이런 경험이 쌓이면 점차 편해질 테니, 집에서도 따뜻하게 다독여주시면 좋겠습니다.`
  },

  '병원 확인 권고 수준(중한 사안)': {
    severity: 'followup',
    build: (v) =>
      `활동 중 ${v.child || "아이"}가 ${v.where || '다치는 상황'}으로 부상을 입었어요. ` +
      `즉시 보호자님께 연락드리고 운영본부에 신고했으며, 안전을 우선해 필요한 조치를 했습니다. ` +
      `현재 상태는 ${v.status || '운영본부 안내에 따라 확인 중'}입니다. ` +
      `병원 확인이 필요할 수 있어, 이후 절차와 보상 관련 사항은 운영본부를 통해 안내드리겠습니다.`
  }
};

function appendObjectParticle(text) {
  if (!text || !text.trim()) return "활동을";
  const trimmed = text.trim();
  let lastChar = trimmed.charAt(trimmed.length - 1);
  let code = lastChar.charCodeAt(0);

  if (code < 0xac00 || code > 0xd7a3) {
    for (let i = trimmed.length - 1; i >= 0; i--) {
      const c = trimmed.charCodeAt(i);
      if (c >= 0xac00 && c <= 0xd7a3) {
        code = c;
        break;
      }
    }
  }

  if (code >= 0xac00 && code <= 0xd7a3) {
    const hasJongseong = (code - 0xac00) % 28 !== 0;
    return `${trimmed}${hasJongseong ? "을" : "를"}`;
  }

  return `${trimmed}를`;
}

// ── 본문 템플릿 5종 (문장 구성 자체가 다른 변주) ──
const CLOSING_TEMPLATES = {
  '기본 보고형': (v, issuePart, hasIssue) =>
    `안녕하세요, 오늘 돌봄 활동 종료 안내드립니다.\n` +
    `오늘 ${v.child || "OO"}와 함께 ${appendObjectParticle(v.activity)} 진행했습니다. ${v.content || ""}\n` +
    `${issuePart}\n` +
    (hasIssue ? `감사합니다.` : `감사합니다!`),

  '세심 일지형': (v, issuePart, hasIssue) =>
    `안녕하세요! 오늘 ${v.child || "아이"}와 즐겁게 돌봄 잘 마친 ${v.name || "선생님"}이에요 :)\n` +
    `${v.child || "OO"}의 오늘 돌봄 일지 전달드립니다. 오늘은 ${appendObjectParticle(v.activity)} 중심으로 활동했으며, ${v.content || ""}\n` +
    `${issuePart}\n` +
    (hasIssue ? `오늘 하루도 편안하게 마무리하세요.` : `오늘 하루도 편안하게 마무리하세요!`),

  '성장 칭찬형': (v, issuePart, hasIssue) =>
    `보호자님 안녕하세요 :) 오늘 ${v.child || "아이"}와 따뜻하고 즐거운 시간 보낸 ${v.name || "선생님"}입니다.\n` +
    `오늘 ${v.child || "OO"}가 ${appendObjectParticle(v.activity)} 참 즐겁게 참여했어요! ${v.content || ""}\n` +
    `${issuePart}\n` +
    (hasIssue ? `오늘 하루도 고생 많으셨습니다. 늘 감사합니다.` : `오늘 하루도 고생 많으셨습니다. 늘 감사합니다!`),

  '요약 정리형': (v, issuePart, hasIssue) =>
    `안녕하세요, 금일 ${v.child || "아이"} 돌봄 활동 진행한 ${v.name || "선생님"}입니다.\n` +
    `금일 ${v.child || "OO"} 돌봄 활동 요약입니다.\n` +
    `① 주요 활동: ${v.activity || "활동"}\n` +
    `② 활동 내용: ${v.content || ""}\n` +
    `${issuePart}\n` +
    `보호자님의 확인 부탁드립니다. 감사합니다.`,

  '따뜻 감상형': (v, issuePart, hasIssue) =>
    `안녕하세요, ${v.name || "선생님"}입니다. 오늘 돌봄 활동 종료 안내드립니다.\n` +
    `오늘 ${v.child || "OO"}와 ${appendObjectParticle(v.activity)} 하며 정말 밝고 행복한 시간 보냈습니다. ${v.content || ""}\n` +
    `${issuePart}\n` +
    (hasIssue ? `오늘 하루도 편안하게 보내세요.` : `오늘 하루도 행복하세요!`)
};

export default function ClosingContact() {
  const [templateKey, setTemplateKey] = useState("기본 보고형");
  const [name, setName] = useState("김OO");
  const [child, setChild] = useState("OO");
  const [selectedActivityTpl, setSelectedActivityTpl] =
    useState("🚗 블록·자동차");
  const [activity, setActivity] = useState(PRESET_TEMPLATES[0].activity);
  const [content, setContent] = useState(PRESET_TEMPLATES[0].content);
  const [hasIssue, setHasIssue] = useState(false);
  const [issueKey, setIssueKey] = useState("가벼운 부딪힘·넘어짐");
  const [where, setWhere] = useState("");
  const [status, setStatus] = useState("");
  const [toast, setToast] = useState(false);
  const [warningModal, setWarningModal] = useState(false);
  const [modalType, setModalType] = useState("defaultName");

  const isDefaultName =
    name.trim() === "김OO" ||
    child.trim() === "OO" ||
    name.includes("OO") ||
    child.includes("OO");

  const currentIssueItem = hasIssue
    ? ISSUE_TEMPLATES[issueKey] || ISSUE_TEMPLATES['가벼운 부딪힘·넘어짐']
    : ISSUE_TEMPLATES['없음'];

  const issuePart = currentIssueItem.build({ child, where, status });

  function handleSelectActivityTpl(tpl) {
    setSelectedActivityTpl(tpl.label);
    setActivity(tpl.activity);
    setContent(tpl.content);
  }

  const v = { name, child, activity, content, where, status };
  const tplFn = CLOSING_TEMPLATES[templateKey] || CLOSING_TEMPLATES['기본 보고형'];
  let previewText = tplFn(v, issuePart, hasIssue);
  if (hasIssue) {
    previewText = previewText.replace(/!/g, ".");
  }

  async function executeCopy() {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(previewText);
      } else {
        const ta = document.createElement("textarea");
        ta.value = previewText;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setToast(true);
      setTimeout(() => setToast(false), 1500);
    } catch (err) {
      console.error("Copy failed", err);
    }
  }

  function handleCopyClick() {
    if (isDefaultName) {
      setModalType("defaultName");
      setWarningModal(true);
    } else {
      executeCopy();
    }
  }

  return (
    <div className="template-card">
      <div className="d-eyebrow">보호자 종료 메시지 템플릿</div>
      <h2 className="d-title">활동 완료 메시지 자동 작성</h2>

      <div className="form-grid">
        <div className="field-row full">
          <div className="field">
            <label htmlFor="c_name">선생님 이름</label>
            <input
              id="c_name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 김OO"
            />
          </div>

          <div className="field">
            <label htmlFor="c_child">아이 이름</label>
            <input
              id="c_child"
              type="text"
              value={child}
              onChange={(e) => setChild(e.target.value)}
              placeholder="예: OO"
            />
          </div>
        </div>

        <div className="field full">
          <label>활동 내용 빠른 입력</label>
          <div className="pill-group">
            {PRESET_TEMPLATES.map((tpl) => (
              <button
                key={tpl.label}
                type="button"
                className={`pill ${
                  selectedActivityTpl === tpl.label ? "on" : ""
                }`}
                onClick={() => handleSelectActivityTpl(tpl)}
              >
                {tpl.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field full">
          <label htmlFor="c_activity">활동명</label>
          <input
            id="c_activity"
            type="text"
            value={activity}
            onChange={(e) => {
              setActivity(e.target.value);
              setSelectedActivityTpl("");
            }}
            placeholder="예: 자동차 주차장 만들기"
          />
        </div>

        <div className="field full">
          <label htmlFor="c_content">활동 내용</label>
          <textarea
            id="c_content"
            rows={3}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setSelectedActivityTpl("");
            }}
            placeholder="아이가 장난감 자동차에 관심을 보여..."
          />
        </div>

        <div className="field full">
          <label>특이사항 여부</label>
          <div className="pill-group">
            <button
              type="button"
              className={`pill ${!hasIssue ? "on" : ""}`}
              onClick={() => setHasIssue(false)}
            >
              없음
            </button>
            <button
              type="button"
              className={`pill ${hasIssue ? "on" : ""}`}
              onClick={() => setHasIssue(true)}
            >
              있음
            </button>
          </div>
        </div>

        {hasIssue && (
          <>
            <div className="field full">
              <label>
                특이사항 유형 선택 (사고·건강·정서 룰베이스)
              </label>
              <div className="pill-group">
                {Object.keys(ISSUE_TEMPLATES)
                  .filter((k) => k !== "없음")
                  .map((k) => (
                    <button
                      key={k}
                      type="button"
                      className={`pill ${issueKey === k ? "on" : ""}`}
                      onClick={() => setIssueKey(k)}
                    >
                      {k}
                    </button>
                  ))}
              </div>
            </div>

            <div className="field-row full">
              <div className="field">
                <label htmlFor="c_where">다친 부위 / 발생 상황 (선택)</label>
                <input
                  id="c_where"
                  type="text"
                  value={where}
                  onChange={(e) => setWhere(e.target.value)}
                  placeholder="예: 무릎, 팔, 놀이 도중"
                />
              </div>

              <div className="field">
                <label htmlFor="c_status">현재 상태 / 안내 (선택)</label>
                <input
                  id="c_status"
                  type="text"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  placeholder="예: 운영본부 안내에 따라 확인 중"
                />
              </div>
            </div>

            {currentIssueItem.severity === "followup" && (
              <div className="field full" style={{ fontSize: "0.82rem", color: "#c9524e", fontWeight: "600" }}>
                📢 [공유 필요 사안] 이 항목은 활동 중 보호자 및 운영본부에 사전 공유가 필요한 사안입니다.
              </div>
            )}
          </>
        )}

        <div className="field full">
          <label>본문 템플릿 선택 (5종)</label>
          <div className="pill-group">
            {Object.keys(CLOSING_TEMPLATES).map((key) => (
              <button
                key={key}
                type="button"
                className={`pill ${templateKey === key ? "on" : ""}`}
                onClick={() => setTemplateKey(key)}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="preview">
        <div className="plabel">미리보기</div>
        <div className="ptext">{previewText}</div>
        <button type="button" className="copy-btn" onClick={handleCopyClick}>
          문구 복사하기
        </button>
        {toast && <div className="toast show">복사했어요</div>}
      </div>

      {warningModal && (
        <div className="modal-overlay" onClick={() => setWarningModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">⚠️</div>
            <h3>기본 문구 확인 필요</h3>
            <p>
              선생님 이름(<strong>{name}</strong>) 또는 아이 이름(
              <strong>{child}</strong>)이 기본값 상태입니다.
            </p>
            <p className="sub">
              실제 성함으로 변경 후 복사하는 것을 권장합니다.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="ghost-btn"
                onClick={() => {
                  setWarningModal(false);
                  executeCopy();
                }}
              >
                그대로 복사
              </button>
              <button
                type="button"
                className="primary-btn"
                onClick={() => setWarningModal(false)}
              >
                이름 수정하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
