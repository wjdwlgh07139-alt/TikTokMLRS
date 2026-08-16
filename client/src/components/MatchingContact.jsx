import { useState } from "react";
import TopHeader from "./TopHeader.jsx";

const ASK_OPTIONS = [
  "간식 제공 여부",
  "미디어 시청 여부",
  "주차 가능 여부",
  "약 복용 및 건강 상태",
];

// ── 본문 템플릿 5종 (문장 구성 자체가 다른 변주) ──
const CONTACT_TEMPLATES = {
  '담백 기본형': (v) =>
    `안녕하세요, ${v.name || "김OO"}입니다.\n` +
    `${v.child || "OO"}의 돌봄을 맡게 되었습니다. 활동 전에 미리 알아두면 좋을 점이 있다면 편하게 알려주세요.` +
    (v.ask ? `\n추가적으로 ${v.ask}도 함께 알려주시면 큰 도움이 됩니다.` : "") +
    `\n확인해주시면 감사하겠습니다.`,

  '질문 항목형': (v) =>
    `안녕하세요! ${v.name || "김OO"}이에요 :)\n` +
    `${v.child || "OO"}와 즐거운 시간을 보내기 위해 몇 가지 여쭤보고 싶어요. ` +
    `① 요즘 좋아하는 놀이나 캐릭터, ② 알레르기·건강 등 주의할 점, ` +
    `③ 활동 중 꼭 지켜주셨으면 하는 요청이 있다면 알려주시면 큰 도움이 됩니다.` +
    (v.ask ? `\n④ 추가적으로 ${v.ask}도 함께 알려주시면 큰 도움이 됩니다.` : "") +
    `\n편하실 때 답 주세요!`,

  '부모 안심형': (v) =>
    `안녕하세요, ${v.name || "김OO"} 선생님입니다.\n` +
    `이번에 ${v.child || "OO"}의 돌봄을 맡게 되었습니다. 첫 만남인 만큼 ${v.child || "OO"}가 편안하게 느낄 수 있도록 ` +
    `천천히 다가가려 합니다. 보호자님께서 평소 신경 쓰시는 부분을 미리 알려주시면 그에 맞춰 세심하게 살피겠습니다.` +
    (v.ask ? `\n추가적으로 ${v.ask}도 함께 알려주시면 큰 도움이 됩니다.` : "") +
    `\n번거로우시더라도 확인 부탁드립니다.`,

  '아이 중심 따뜻형': (v) =>
    `안녕하세요! ${v.name || "김OO"}입니다.\n` +
    `${v.child || "OO"}를 만나게 되어 벌써 기대돼요. ${v.child || "OO"}가 어떤 놀이를 좋아하는지, 어떤 성격인지 ` +
    `살짝 귀띔해주시면 첫 만남을 더 잘 준비해볼게요. 주의할 점이 있다면 함께 알려주세요.` +
    (v.ask ? `\n추가적으로 ${v.ask}도 함께 알려주시면 큰 도움이 됩니다.` : "") +
    `\n편하게 말씀해 주시면 감사하겠습니다.`,

  '실무 확인형': (v) =>
    `안녕하세요, ${v.name || "김OO"} 선생님입니다.\n` +
    `${v.date || '예정된'} ${v.child || "OO"}의 첫 활동을 앞두고 몇 가지 확인드리고 싶어요. ` +
    `활동 시간과 장소에 변동은 없는지, 준비해두면 좋을 물품이나 간식 관련 안내가 있는지, ` +
    `그리고 ${v.child || "OO"}를 돌볼 때 꼭 알아야 할 사항이 있다면 미리 말씀해주세요.` +
    (v.ask ? `\n추가적으로 ${v.ask}도 함께 알려주시면 큰 도움이 됩니다.` : "") +
    `\n확인 후 답 주시면 감사하겠습니다.`
};

export default function MatchingContact() {
  const [templateKey, setTemplateKey] = useState("담백 기본형");
  const [name, setName] = useState("김OO");
  const [child, setChild] = useState("OO");
  const [date, setDate] = useState("7월 28일 오후 3시");
  const [ask, setAsk] = useState("");
  const [toast, setToast] = useState(false);
  const [warningModal, setWarningModal] = useState(false);

  const isDefaultName =
    name.trim() === "김OO" ||
    child.trim() === "OO" ||
    name.includes("OO") ||
    child.includes("OO");

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
      setWarningModal(true);
    } else {
      executeCopy();
    }
  }

  const v = { name, child, date, ask };
  const tplFn = CONTACT_TEMPLATES[templateKey] || CONTACT_TEMPLATES['담백 기본형'];
  const previewText = tplFn(v);

  return (
    <>
      {/* Header Bar */}
      <TopHeader />

      <div className="hero">
        <h1>
          매칭 직후, <b>첫 연락 템플릿</b>으로<br />부모님과 원활하게 소통하세요
        </h1>
        <p className="sub">
          매칭 직후 부모님께 드릴 첫인사와 사전 확인 사항을 빠르게 정리해요. 꼼꼼한 사전 소통으로 당일 혼선을 줄이고 시작부터 신뢰를 쌓아보세요.
        </p>
      </div>

      <div className="template-card">
        <div className="d-eyebrow">상황별 맞춤 메시지 생성</div>
        <h2 className="d-title">정보 입력 · 템플릿 선택 · 원클릭 복사</h2>

        <div className="form-grid">
          <div className="field-row full">
            <div className="field">
              <label htmlFor="p_name">선생님 이름</label>
              <input
                id="p_name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 김OO"
              />
            </div>

            <div className="field">
              <label htmlFor="p_child">아이 이름</label>
              <input
                id="p_child"
                type="text"
                value={child}
                onChange={(e) => setChild(e.target.value)}
                placeholder="예: OO"
              />
            </div>
          </div>

          <div className="field full">
            <label htmlFor="p_date">활동 날짜·시간</label>
            <input
              id="p_date"
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="예: 7월 28일 오후 3시"
            />
          </div>

          <div className="field full">
            <label htmlFor="p_ask">확인하고 싶은 사항 (추가 옵션)</label>
            <div className="pill-group" style={{ marginBottom: "6px" }}>
              {ASK_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`pill ${ask === opt ? "on" : ""}`}
                  onClick={() => setAsk(ask === opt ? "" : opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
            <input
              id="p_ask"
              type="text"
              value={ask}
              onChange={(e) => setAsk(e.target.value)}
              placeholder="옵션 선택 또는 직접 입력 (예: 간식 제공 여부)"
            />
          </div>

          <div className="field full">
            <label>본문 템플릿 선택 (5종)</label>
            <div className="pill-group">
              {Object.keys(CONTACT_TEMPLATES).map((key) => (
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
              <p className="sub">실제 성함으로 변경 후 복사하는 것을 권장합니다.</p>
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
    </>
  );
}
