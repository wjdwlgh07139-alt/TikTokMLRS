import { useState } from "react";

export default function ClosingContact() {
  const [activity, setActivity] = useState("자동차 주차장 만들기");
  const [content, setContent] = useState(
    "아이가 장난감 자동차에 관심을 보여 주차장 조립 및 놀이 활동을 진행했습니다."
  );
  const [hasIssue, setHasIssue] = useState(false);
  const [issueText, setIssueText] = useState("");
  const [toast, setToast] = useState(false);

  const issuePart = hasIssue
    ? issueText.trim()
      ? `특이사항: ${issueText.trim()}`
      : "특이사항이 있었습니다."
    : "별도의 특이사항은 없었습니다.";

  const previewText = `안녕하세요, 오늘 돌봄 활동 종료 안내드립니다.\n오늘은 ${
    activity || "활동"
  }을 진행했습니다. ${content || ""}\n${issuePart}\n감사합니다!`;

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
        <div className="template-badge">보호자 종료 메시지 템플릿</div>
        <h2 className="template-title">활동 완료 메시지 자동 작성</h2>
        <p className="template-desc">
          🏁 돌봄 활동 종료 후 보호자에게 전달할 종료 메시지입니다. 간단한 활동 정보를 입력하면 문구가 자동 생성됩니다.
        </p>

        <div className="form-grid">
          <div className="field full">
            <label htmlFor="c_activity">활동명</label>
            <input
              id="c_activity"
              type="text"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              placeholder="예: 자동차 주차장 만들기"
            />
          </div>

          <div className="field full">
            <label htmlFor="c_content">활동 내용</label>
            <textarea
              id="c_content"
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="아이가 장난감 자동차에 관심을 보여..."
            />
          </div>

          <div className="field full">
            <label>특이사항 여부</label>
            <div className="pill-group">
              <button
                type="button"
                className={`pill-btn ${!hasIssue ? "active" : ""}`}
                onClick={() => setHasIssue(false)}
              >
                없음
              </button>
              <button
                type="button"
                className={`pill-btn ${hasIssue ? "active" : ""}`}
                onClick={() => setHasIssue(true)}
              >
                있음
              </button>
            </div>
          </div>

          {hasIssue && (
            <div className="field full">
              <label htmlFor="c_issue">특이사항 내용 (사실 중심으로)</label>
              <textarea
                id="c_issue"
                rows={2}
                value={issueText}
                onChange={(e) => setIssueText(e.target.value)}
                placeholder="예: 예정에 없던 활동 시간 연장 요청이 있어 플랫폼 기준 확인을 안내함"
              />
            </div>
          )}
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
