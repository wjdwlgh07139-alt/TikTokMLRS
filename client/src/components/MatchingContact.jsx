import { useState } from "react";

const SITUATIONS = {
  "매칭 후 첫인사": (v) =>
    `이번에 ${v.child || "OO"}의 돌봄을 맡게 되었습니다. 활동 전에 ${
      v.child || "OO"
    }가 좋아하는 놀이나 특별히 주의해야 할 점, 요청하실 사항이 있다면 편하게 알려주세요.`,
  "아이 성향·선호 놀이 확인": (v) =>
    `${
      v.child || "OO"
    }가 평소 좋아하는 놀이나 관심 있는 캐릭터가 있다면 미리 알려주시면 활동 준비에 참고하겠습니다.`,
  "주의사항 확인": (v) =>
    `활동 전 ${
      v.child || "OO"
    }의 알레르기나 건강, 안전과 관련해 미리 알아야 할 점이 있다면 알려주세요.`,
  "활동 일정 재확인": (v) =>
    `${
      v.date || "예정된"
    } 활동 일정 안내드립니다. 변경 사항이 있으시면 편하게 말씀해주세요.`,
  "추가 요청사항 확인": (v) =>
    `${
      v.ask ? v.ask : "활동과 관련해 미리 전달하고 싶은 사항"
    }이 있으시면 편하게 알려주세요.`,
};

const TONES = {
  기본: {
    greet: (v) => `안녕하세요, ${v.name || "선생님"}입니다.`,
    close: "확인해주시면 감사하겠습니다.",
  },
  편한: {
    greet: (v) => `안녕하세요! ${v.name || "선생님"}이에요 :)`,
    close: "편하실 때 답 주세요!",
  },
  정중: {
    greet: (v) => `안녕하세요, ${v.name || "선생님"} 선생님입니다.`,
    close: "번거로우시더라도 확인 부탁드립니다.",
  },
};

export default function MatchingContact() {
  const [situation, setSituation] = useState("매칭 후 첫인사");
  const [name, setName] = useState("김OO");
  const [child, setChild] = useState("OO");
  const [date, setDate] = useState("7월 28일 오후 3시");
  const [ask, setAsk] = useState("");
  const [tone, setTone] = useState("기본");
  const [toast, setToast] = useState(false);

  const v = { name, child, date, ask };
  const body = SITUATIONS[situation] ? SITUATIONS[situation](v) : "";
  const t = TONES[tone] || TONES["기본"];
  const previewText = `${t.greet(v)}\n${body}\n${t.close}`;

  async function handleCopy() {
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

  return (
    <div className="contact-template-container">
      <div className="template-card">
        <div className="template-badge">보호자 첫 연락 템플릿</div>
        <h2 className="template-title">매칭 직후 첫 연락 문구 작성</h2>
        <p className="template-desc">
          💡 첫 매칭 직후 1회 전달하는 메시지입니다. 상황과 정보를 입력하면 문구가 자동 완성됩니다.
        </p>

        <div className="form-grid">
          <div className="field full">
            <label htmlFor="p_sit">1. 상황 선택</label>
            <select
              id="p_sit"
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
            >
              {Object.keys(SITUATIONS).map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

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

          <div className="field">
            <label htmlFor="p_date">활동 날짜·시간</label>
            <input
              id="p_date"
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="예: 7월 28일 오후 3시"
            />
          </div>

          <div className="field">
            <label htmlFor="p_ask">
              확인하고 싶은 사항 <span className="sub-tag">(선택 입력)</span>
            </label>
            <input
              id="p_ask"
              type="text"
              value={ask}
              onChange={(e) => setAsk(e.target.value)}
              placeholder="예: 간식 제공 여부"
            />
          </div>

          <div className="field full">
            <label>말투 선택</label>
            <div className="pill-group">
              {Object.keys(TONES).map((tKey) => (
                <button
                  key={tKey}
                  type="button"
                  className={`pill-btn ${tone === tKey ? "active" : ""}`}
                  onClick={() => setTone(tKey)}
                >
                  {tKey}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="preview-box">
          <div className="preview-header">
            <span>미리보기</span>
            <span className="copy-note">
              {/* 카카오톡 공유 딥링크 SDK 추가 예정 (현재 단계는 클립보드 복사로 대응) */}
              💬 문구 복사 후 카카오톡 전송
            </span>
          </div>
          <div className="preview-content">{previewText}</div>
          <button type="button" className="copy-action-btn" onClick={handleCopy}>
            📋 문구 복사하기
          </button>
        </div>

        {toast && <div className="toast-popup">✅ 클립보드에 복사되었습니다!</div>}
      </div>
    </div>
  );
}
