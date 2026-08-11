import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

// Ensure directories exist
const notesDirA = path.join(rootDir, "fixtures/notes/child-a");
const notesDirB = path.join(rootDir, "fixtures/notes/child-b");
const notesDirC = path.join(rootDir, "fixtures/notes/child-c");
const extractedDir = path.join(rootDir, "fixtures/extracted");

[notesDirA, notesDirB, notesDirC, extractedDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// --- Child A Data (12 Notes) ---
// Ground truth spec: 27mo Female (구O윤), initial shy in note 1 resolved by note 2+.
const childANotes = [
  {
    noteId: "a-01",
    date: "2026-07-22",
    ageMonths: 27,
    childName: "구O윤",
    gender: "여아",
    rawNote: `2026년 7월 22일
구O윤 · 2세(27개월) · 여아 / 놀이
태그: 미술 놀이, 만들기, 역할 놀이, 촉감 놀이

[활동 내용]
지난주에 봤지만 혹시 다시 낯을 가릴까 싶어 지난주와 같은 옷으로 OO이를 만났어요 :)💕 초반엔 그래도 조금 낯설어하는 모습을 보였지만 금새 표정이 풀리며 놀이에 저번보다 더 적극적으로 참여하는 모습을 보여주었어요!!
제가 준비한 놀이는 플레이콘을 사용해 눌러보고 찢어보고 물로 여러개의 플레이콘을 이어붙이는 놀이였습니다! 생각했던 것보다 OO이가 새로운 놀이였는지 큰 흥미를 보였습니다!! 좋아하는 색깔이 파랑색이라며 먼저 이야기 꺼내주고 보들보들하다며 신기해하고 즐거워했습니다☺️
이외에 아이스크림 가게 놀이, 새로운 장난감인 병원놀이 세트로 놀이하였습니다. OO이가 처음에는 저에게 의사선생님 역할을 맡겨주더니 "콧물이 많이 나고 기침도 많이 나요"라며 똑똑하게 자신의 상태를 이야기해주었습니다. 진찰해주고 나니 동생과 토끼인형에게도 진찰해주는 OO이였습니다~!
이후에 OO이가 다시 플레이콘으로 놀이하고 싶은데 엄마와도 하고 싶었다며 잠시 엄마와 놀이할 수 있는 시간을 주고 OO이 동생을 봐주었습니다~

*어머니 음료수 감사합니다!🙇♀️💗

[악어 선생님의 한마디]
OO아! 오늘 두 번째 보는 날이라 그런지 지난주보다 더 이야기도 많이 해주고 놀이도 이젠 선생님이 하자는 놀이보다 OO이가 스스로 놀이하는 모습을 보며 그 사이에 많이 성장한 걸 느꼈어^^`,
    extracted: {
      noteId: "a-01",
      date: "2026-07-22",
      ageMonths: 27,
      activityTags: ["미술 놀이", "만들기", "역할 놀이", "촉감 놀이"],
      materials: ["플레이콘", "물티슈", "병원놀이 세트", "토끼인형"],
      positiveSignals: [
        { content: "플레이콘 촉감 자극에 흥미를 보임", quote: "보들보들하다며 신기해하고 즐거워했습니다" },
        { content: "역할놀이 시 주도적으로 놀이 확장", quote: "진찰해주고 나니 동생과 토끼인형에게도 진찰해주는 OO이였습니다" }
      ],
      negativeSignals: [
        { content: "초반 낯가림 관찰됨", quote: "초반엔 그래도 조금 낯설어하는 모습을 보였지만" }
      ],
      unfinished: {
        content: "플레이콘 놀이를 엄마와도 함께 진행하고 싶어함",
        quote: "다시 플레이콘으로 놀이하고 싶은데 엄마와도 하고 싶었다며"
      },
      traitHints: [
        { traitId: "shy", strength: "weak", quote: "초반엔 그래도 조금 낯설어하는 모습을 보였지만" }
      ]
    }
  },
  {
    noteId: "a-02",
    date: "2026-07-23",
    ageMonths: 27,
    childName: "구O윤",
    gender: "여아",
    rawNote: `2026년 7월 23일
구O윤 · 2세(27개월) · 여아 / 놀이
태그: 만들기, 책 읽기, 역할 놀이

[활동 내용]
오늘도 OO이와 반갑게 인사 후 놀이를 시작했어요. 간단히 준비한 플레이콘 조각을 만져보고 쏟아서 잠시 탐색해본 후 물티슈에 물을 묻혀 아이스크림과 토끼를 꾸며보았어요. 선생님을 따라 "붙었네~" 라고 말하는 OO이가 너무 귀여웠습니다^^ 이후에 OO이는 플레이콘을 다시 떼어 통에 정리에 주었답니다ㅎㅎ
이후에 OO이는 동생을 돌봐주기도 하고 선생님 무픔에 앉아 책을 읽기도 했어요^^
또 아이스크림 가게 놀이를 했는데, 지난주에 비해 가게 놀이가 더 길고 풍성해졌더라구요! 얼마에요? 묻는 선생님의 말에 "삼천원이요~"라고 말하는 OO이였답니다ㅎㅎ
그리고 선생님과 책을 몇 권 더 읽은 후 스케치북에 그림도 그리고 스티커도 붙이며 놀이하고 놀이를 마무리했습니다~ 다음엔 물감으로 손도장 찍자고 이야기하며 놀이를 마쳤습니다^^

[악어 선생님의 한마디]
"한 번 더~", "기차 타자!" 등 의사표현이 점점 더 늘어가는 OO이가 기특하기도 하고 점점 선생님을 편하게 느껴주는 것 같아 고맙기도 합니다^^`,
    extracted: {
      noteId: "a-02",
      date: "2026-07-23",
      ageMonths: 27,
      activityTags: ["만들기", "책 읽기", "역할 놀이"],
      materials: ["플레이콘", "물티슈", "그림책", "스케치북", "스티커"],
      positiveSignals: [
        { content: "선생님 무릎에 앉아 정서적 신뢰 형성", quote: "선생님 무픔에 앉아 책을 읽기도 했어요^^" },
        { content: "가게 역할놀이 몰입도 증가", quote: "얼마에요? 묻는 선생님의 말에 \"삼천원이요~\"라고 말하는 OO이였답니다" }
      ],
      negativeSignals: [],
      unfinished: {
        content: "다음 시간에 물감 표현 놀이를 하고 싶어함",
        quote: "다음엔 물감으로 손도장 찍자고 이야기하며 놀이를 마쳤습니다"
      },
      traitHints: []
    }
  },
  {
    noteId: "a-03",
    date: "2026-07-30",
    ageMonths: 27,
    childName: "구O윤",
    gender: "여아",
    rawNote: `2026년 7월 30일
구O윤 · 2세(27개월) · 여아 / 놀이
태그: 미술 놀이, 만들기, 역할 놀이

[활동 내용]
OO이와 반갑게 맞이 인사를 나누고 스케치북에 알록달록 크레파스로 그림을 그려보았어요!! 손가락에 크레용을 쥐고 선을 긋는 걸 좋아하더라구요ㅎㅎ
이어서 지난주에 좋아했던 아이스크림 가게 놀이를 재개했어요! 손님 역할을 훌륭히 수행해주며 아이스크림 콘을 정성스레 접시에 담아 선물해주었답니다 🍨
마지막으로 물티슈로 손을 닦으며 정리를 씩씩하게 잘해주었습니다!!

*어머님 간식 빵 맛있게 잘 먹었습니다 🥖💗

[악어 선생님의 한마디]
스스로 정리정돈까지 척척 해내는 모습에 또 한 번 감탄했습니다!! 다음 시간이 기다려지네요^^`,
    extracted: {
      noteId: "a-03",
      date: "2026-07-30",
      ageMonths: 27,
      activityTags: ["미술 놀이", "만들기", "역할 놀이"],
      materials: ["스케치북", "크레파스", "아이스크림 교구", "물티슈"],
      positiveSignals: [
        { content: "선 그리기 미술활동에 적극 호응", quote: "손가락에 크레용을 쥐고 선을 긋는 걸 좋아하더라구요ㅎㅎ" },
        { content: "스스로 정리정돈 습관 훌륭함", quote: "물티슈로 손을 닦으며 정리를 씩씩하게 잘해주었습니다" }
      ],
      negativeSignals: [],
      unfinished: null,
      traitHints: []
    }
  },
  {
    noteId: "a-04",
    date: "2026-08-06",
    ageMonths: 27,
    childName: "구O윤",
    gender: "여아",
    rawNote: `2026년 8월 6일
구O윤 · 2세(27개월) · 여아 / 놀이
태그: 역할 놀이, 만들기, 책 읽기

[활동 내용]
병원놀이 세트로 의사선생님 놀이를 신나게 했습니다 🩺 토끼 인형 아프다고 주사도 놓아주고 밴드도 붙여주었어요 ㅎㅎ
플레이콘으로 알록달록 알약을 만들어서 약국 놀이까지 이어서 진행했답니다!
놀이 후엔 스케치북에 밴드 스티커를 붙이며 깔끔하게 정리했습니다^^`,
    extracted: {
      noteId: "a-04",
      date: "2026-08-06",
      ageMonths: 27,
      activityTags: ["역할 놀이", "만들기", "책 읽기"],
      materials: ["병원놀이 세트", "토끼인형", "플레이콘", "스케치북", "스티커"],
      positiveSignals: [
        { content: "병원놀이를 가상약국으로 창의적 확장", quote: "플레이콘으로 알록달록 알약을 만들어서 약국 놀이까지 이어서 진행했답니다" }
      ],
      negativeSignals: [],
      unfinished: null,
      traitHints: []
    }
  },
  {
    noteId: "a-05",
    date: "2026-08-13",
    ageMonths: 28,
    childName: "구O윤",
    gender: "여아",
    rawNote: `2026년 8월 13일
구O윤 · 2세(28개월) · 여아 / 놀이
태그: 미술 놀이, 촉감 놀이, 만들기

[활동 내용]
오늘은 물감 찍기 놀이를 시도해보았습니다 🎨 핑거페인트 물감을 스케치북에 쿡쿡 찍으며 보들보들한 물감 촉감을 만끽했어요!
처음엔 손에 물감 묻는 걸 약간 멈칫하더니 물티슈로 닦아가며 신나게 손도장을 남겼답니다 ㅎㅎ
마무리는 역시 플레이콘 붙이기로 알록달록 액자를 꾸몄어요!! 액자가 다 마르면 다음 시간에 스티커 더 붙이자고 약속했어요^^`,
    extracted: {
      noteId: "a-05",
      date: "2026-08-13",
      ageMonths: 28,
      activityTags: ["미술 놀이", "촉감 놀이", "만들기"],
      materials: ["물감", "스케치북", "물티슈", "플레이콘"],
      positiveSignals: [
        { content: "물감 손도장 촉감 탐색 성공", quote: "물티슈로 닦아가며 신나게 손도장을 남겼답니다" }
      ],
      negativeSignals: [],
      unfinished: {
        content: "물감 놀이 스케치북 액자 완성을 다음 시간에 이어서 하고 싶어함",
        quote: "액자가 다 마르면 다음 시간에 스티커 더 붙이자고 약속했어요"
      },
      traitHints: []
    }
  },
  {
    noteId: "a-06",
    date: "2026-08-20",
    ageMonths: 28,
    childName: "구O윤",
    gender: "여아",
    rawNote: `2026년 8월 20일
구O윤 · 2세(28개월) · 여아 / 놀이
태그: 만들기, 역할 놀이, 촉감 놀이

[활동 내용]
클레이 점토를 조물조물 반죽해서 빵 만들기 놀이를 했습니다 🍞 빵집 사장님이 되어 "무슨 빵 드릴까요?" 묻는 모습이 아주 다정했어요^^
지난주 만든 물감 액자에 예쁜 동물 스티커도 듬뿍 붙여 완성을 축하했답니다 🎉`,
    extracted: {
      noteId: "a-06",
      date: "2026-08-20",
      ageMonths: 28,
      activityTags: ["만들기", "역할 놀이", "촉감 놀이"],
      materials: ["클레이", "스티커", "스케치북"],
      positiveSignals: [
        { content: "클레이 반죽으로 빵집 사장님 대화 상호작용 풍성", quote: "\"무슨 빵 드릴까요?\" 묻는 모습이 아주 다정했어요^^" }
      ],
      negativeSignals: [],
      unfinished: null,
      traitHints: []
    }
  },
  {
    noteId: "a-07",
    date: "2026-08-27",
    ageMonths: 28,
    childName: "구O윤",
    gender: "여아",
    rawNote: `2026년 8월 27일
구O윤 · 2세(28개월) · 여아 / 놀이
태그: 책 읽기, 만들기, 블록 놀이

[활동 내용]
그림책 3권을 연속으로 집중해서 읽은 후, 그림책에 나오는 기차를 블록으로 만들어보았습니다 🚂
블록 기차 위에 토끼인형을 탑승시키고 "출발합니다~" 신나게 칙칙폭폭 놀이를 이어갔습니다 ㅎㅎ`,
    extracted: {
      noteId: "a-07",
      date: "2026-08-27",
      ageMonths: 28,
      activityTags: ["책 읽기", "만들기", "블록 놀이"],
      materials: ["그림책", "블록", "토끼인형"],
      positiveSignals: [
        { content: "책 내용과 연계한 블록 기차 만들기 창의성", quote: "그림책에 나오는 기차를 블록으로 만들어보았습니다" }
      ],
      negativeSignals: [],
      unfinished: null,
      traitHints: []
    }
  },
  {
    noteId: "a-08",
    date: "2026-09-03",
    ageMonths: 28,
    childName: "구O윤",
    gender: "여아",
    rawNote: `2026년 9월 3일
구O윤 · 2세(28개월) · 여아 / 놀이
태그: 블록 놀이, 역할 놀이, 만들기

[활동 내용]
블록으로 높은 탑을 쌓아 올린 후 병원놀이 진찰실을 만들었어요 🏥
의사선생님 OO이가 주사도 놓아주고 스티커 칭찬 밴드도 착 붙여주는 다정한 시간이었습니다 ㅎㅎ`,
    extracted: {
      noteId: "a-08",
      date: "2026-09-03",
      ageMonths: 28,
      activityTags: ["블록 놀이", "역할 놀이", "만들기"],
      materials: ["블록", "병원놀이 세트", "스티커"],
      positiveSignals: [
        { content: "블록 진찰실 구성 및 다정한 정서 교감", quote: "주사도 놓아주고 스티커 칭찬 밴드도 착 붙여주는 다정한 시간" }
      ],
      negativeSignals: [],
      unfinished: null,
      traitHints: []
    }
  },
  {
    noteId: "a-09",
    date: "2026-09-10",
    ageMonths: 29,
    childName: "구O윤",
    gender: "여아",
    rawNote: `2026년 9월 10일
구O윤 · 2세(29개월) · 여아 / 놀이
태그: 만들기, 미술 놀이, 역할 놀이

[활동 내용]
오랜만에 플레이콘을 꺼내어 물티슈로 빵집 케이크를 장식해보았습니다 🎂
스케치북에 생일 축하 케이크 그림을 그리고 초를 끄는 역할놀이로 한참 웃었어요^^`,
    extracted: {
      noteId: "a-09",
      date: "2026-09-10",
      ageMonths: 29,
      activityTags: ["만들기", "미술 놀이", "역할 놀이"],
      materials: ["플레이콘", "물티슈", "스케치북", "크레파스"],
      positiveSignals: [
        { content: "생일 케이크 만들기 및 역할놀이 몰입", quote: "초를 끄는 역할놀이로 한참 웃었어요^^" }
      ],
      negativeSignals: [],
      unfinished: null,
      traitHints: []
    }
  },
  {
    noteId: "a-10",
    date: "2026-09-17",
    ageMonths: 29,
    childName: "구O윤",
    gender: "여아",
    rawNote: `2026년 9월 17일
구O윤 · 2세(29개월) · 여아 / 놀이
태그: 책 읽기, 촉감 놀이, 만들기

[활동 내용]
동화책을 읽은 후 클레이 반죽으로 알록달록 애벌레를 만들어보았어요 🐛
물티슈로 손을 깨끗이 닦고 애벌레 집을 그림책 옆에 예쁘게 놓아주었습니다 ㅎㅎ`,
    extracted: {
      noteId: "a-10",
      date: "2026-09-17",
      ageMonths: 29,
      activityTags: ["책 읽기", "촉감 놀이", "만들기"],
      materials: ["그림책", "클레이", "물티슈"],
      positiveSignals: [
        { content: "동화 연계 클레이 만들기 상호작용", quote: "애벌레 집을 그림책 옆에 예쁘게 놓아주었습니다" }
      ],
      negativeSignals: [],
      unfinished: null,
      traitHints: []
    }
  },
  {
    noteId: "a-11",
    date: "2026-09-24",
    ageMonths: 29,
    childName: "구O윤",
    gender: "여아",
    rawNote: `2026년 9월 24일
구O윤 · 2세(29개월) · 여아 / 놀이
태그: 역할 놀이, 블록 놀이, 만들기

[활동 내용]
병원놀이 세트와 블록으로 큰 종합병원을 지었어요 🏥
선생님이 아픈 환자 역할을 맡아 진찰받고 토끼인형도 쾌유 소식을 들었답니다 ㅎㅎ`,
    extracted: {
      noteId: "a-11",
      date: "2026-09-24",
      ageMonths: 29,
      activityTags: ["역할 놀이", "블록 놀이", "만들기"],
      materials: ["병원놀이 세트", "블록", "토끼인형"],
      positiveSignals: [
        { content: "선생님과의 상호 역할놀이 정서적 교감 우수", quote: "선생님이 아픈 환자 역할을 맡아 진찰받고" }
      ],
      negativeSignals: [],
      unfinished: null,
      traitHints: []
    }
  },
  {
    noteId: "a-12",
    date: "2026-10-01",
    ageMonths: 29,
    childName: "구O윤",
    gender: "여아",
    rawNote: `2026년 10월 1일
구O윤 · 2세(29개월) · 여아 / 놀이
태그: 책 읽기, 미술 놀이, 역할 놀이

[활동 내용]
가을 관련 그림책을 보고 알록달록 단풍잎을 스케치북에 그리고 스티커로 장식했어요 🍁
가게 놀이로 "단풍잎 하나에 백원이요~" 주거니 받거니 재미있게 보냈습니다^^`,
    extracted: {
      noteId: "a-12",
      date: "2026-10-01",
      ageMonths: 29,
      activityTags: ["책 읽기", "미술 놀이", "역할 놀이"],
      materials: ["그림책", "스케치북", "크레파스", "스티커"],
      positiveSignals: [
        { content: "계절 주제 미술 및 가게놀이 언어적 표현 우수", quote: "\"단풍잎 하나에 백원이요~\" 주거니 받거니 재미있게 보냈습니다^^" }
      ],
      negativeSignals: [],
      unfinished: null,
      traitHints: []
    }
  }
];

// --- Child B Data (5 Notes) ---
// Ground truth spec: 30mo Male (김O준), separation anxiety (cling) signal persistent across notes.
const childBNotes = [
  {
    noteId: "b-01",
    date: "2026-09-01",
    ageMonths: 30,
    childName: "김O준",
    gender: "남아",
    rawNote: `2026년 9월 1일
김O준 · 2세(30개월) · 남아 / 놀이
태그: 자동차 놀이, 블록 놀이

[활동 내용]
첫 만남이었어요. 엄마가 문을 닫고 나가시자마자 울먹이며 "엄마 언제 와요? 엄마 어디 갔어요"를 계속 반복했어요 🥺
좋아한다는 타요 자동차와 미니카를 보여주고 주차장 타워 블록을 같이 만들어주니 조금 안정을 찾았습니다^^`,
    extracted: {
      noteId: "b-01",
      date: "2026-09-01",
      ageMonths: 30,
      activityTags: ["자동차 놀이", "블록 놀이"],
      materials: ["타요 자동차", "미니카", "블록"],
      positiveSignals: [
        { content: "좋아하는 자동차 교구로 안정을 찾음", quote: "타요 자동차와 미니카를 보여주고 주차장 타워 블록을 같이 만들어주니 조금 안정을 찾았습니다^^" }
      ],
      negativeSignals: [
        { content: "부모 분리시 불안 신호 강함", quote: "엄마가 문을 닫고 나가시자마자 울먹이며 \"엄마 언제 와요? 엄마 어디 갔어요\"를 계속 반복했어요" }
      ],
      unfinished: null,
      traitHints: [
        { traitId: "cling", strength: "strong", quote: "엄마가 문을 닫고 나가시자마자 울먹이며 \"엄마 언제 와요? 엄마 어디 갔어요\"를 계속 반복했어요" }
      ]
    }
  },
  {
    noteId: "b-02",
    date: "2026-09-08",
    ageMonths: 30,
    childName: "김O준",
    gender: "남아",
    rawNote: `2026년 9월 8일
김O준 · 2세(30개월) · 남아 / 놀이
태그: 자동차 놀이, 만들기

[활동 내용]
두 번째 방문에서도 초반에 현관문을 보며 "엄마 보고 싶어요" 라며 훌쩍였어요 💧
시계를 함께 가리키며 "긴 바늘이 6에 가면 엄마 오실 거야" 안심시켜 주고 자동차 도로 테이프를 붙여 놀이했습니다!!`,
    extracted: {
      noteId: "b-02",
      date: "2026-09-08",
      ageMonths: 30,
      activityTags: ["자동차 놀이", "만들기"],
      materials: ["미니카", "도로 테이프"],
      positiveSignals: [
        { content: "도로 테이프 놀이에 호기심 표현", quote: "자동차 도로 테이프를 붙여 놀이했습니다!!" }
      ],
      negativeSignals: [
        { content: "분리 불안 지속", quote: "현관문을 보며 \"엄마 보고 싶어요\" 라며 훌쩍였어요" }
      ],
      unfinished: null,
      traitHints: [
        { traitId: "cling", strength: "strong", quote: "현관문을 보며 \"엄마 보고 싶어요\" 라며 훌쩍였어요" }
      ]
    }
  },
  {
    noteId: "b-03",
    date: "2026-09-15",
    ageMonths: 30,
    childName: "김O준",
    gender: "남아",
    rawNote: `2026년 9월 15일
김O준 · 2세(30개월) · 남아 / 놀이
태그: 자동차 놀이, 블록 놀이, 그림책

[활동 내용]
놀이 중간중간 "엄마 몇 시에 오지요?" 물어보는 귀여운 O준이였습니다^^
시계 약속을 상기시켜 주니 "응, 바늘 6!" 하고 대답하고 다시 자동차 블록 트랙 조립에 열중했습니다!`,
    extracted: {
      noteId: "b-03",
      date: "2026-09-15",
      ageMonths: 30,
      activityTags: ["자동차 놀이", "블록 놀이", "그림책"],
      materials: ["미니카", "블록", "그림책"],
      positiveSignals: [
        { content: "시계 약속에 적응하고 자율적 놀이 참여", quote: "\"응, 바늘 6!\" 하고 대답하고 다시 자동차 블록 트랙 조립에 열중했습니다!" }
      ],
      negativeSignals: [
        { content: "엄마 확인 발화 여전히 존재", quote: "놀이 중간중간 \"엄마 몇 시에 오지요?\" 물어보는" }
      ],
      unfinished: null,
      traitHints: [
        { traitId: "cling", strength: "weak", quote: "놀이 중간중간 \"엄마 몇 시에 오지요?\" 물어보는" }
      ]
    }
  },
  {
    noteId: "b-04",
    date: "2026-09-22",
    ageMonths: 30,
    childName: "김O준",
    gender: "남아",
    rawNote: `2026년 9월 22일
김O준 · 2세(30개월) · 남아 / 놀이
태그: 자동차 놀이, 미술 놀이

[활동 내용]
스케치북에 도로 그림을 그리고 미니카를 굴렸어요 🚗
이날은 엄마를 찾는 울음은 없었지만, 소리가 큰 밖의 소음이 나자 순간 깜짝 놀라며 안겨 들었습니다^^`,
    extracted: {
      noteId: "b-04",
      date: "2026-09-22",
      ageMonths: 30,
      activityTags: ["자동차 놀이", "미술 놀이"],
      materials: ["스케치북", "크레파스", "미니카"],
      positiveSignals: [
        { content: "울음 없이 미술과 자동차 연계 놀이 성공", quote: "이날은 엄마를 찾는 울음은 없었지만" }
      ],
      negativeSignals: [],
      unfinished: null,
      traitHints: []
    }
  },
  {
    noteId: "b-05",
    date: "2026-09-29",
    ageMonths: 30,
    childName: "김O준",
    gender: "남아",
    rawNote: `2026년 9월 29일
김O준 · 2세(30개월) · 남아 / 놀이
태그: 블록 놀이, 자동차 놀이

[활동 내용]
블록으로 주차장 건물을 3층까지 멋지게 건설했어요!!
엄마 오실 시간이 되자 "선생님, 나 오늘 엄마 안 찾고 잘 놀았죠?" 라며 씩씩하게 웃었습니다 🌟`,
    extracted: {
      noteId: "b-05",
      date: "2026-09-29",
      ageMonths: 30,
      activityTags: ["블록 놀이", "자동차 놀이"],
      materials: ["블록", "미니카"],
      positiveSignals: [
        { content: "성취감 느끼며 씩씩하게 놀이 마무리", quote: "\"선생님, 나 오늘 엄마 안 찾고 잘 놀았죠?\" 라며 씩씩하게 웃었습니다" }
      ],
      negativeSignals: [],
      unfinished: null,
      traitHints: []
    }
  }
];

// --- Child C Data (2 Notes) ---
// Ground truth spec: 24mo Female (이O아), low note count (2 notes), no negative signals -> cheerful fallback.
const childCNotes = [
  {
    noteId: "c-01",
    date: "2026-10-05",
    ageMonths: 24,
    childName: "이O아",
    gender: "여아",
    rawNote: `2026년 10월 5일
이O아 · 2세(24개월) · 여아 / 놀이
태그: 촉감 놀이, 그림책

[활동 내용]
밝게 웃으며 첫 인사를 해주었어요 😊 보들보들 헝겊책을 넘겨보고 소리 나는 딸랑이 공을 굴리며 하하 호호 즐거운 시간을 보냈답니다!!`,
    extracted: {
      noteId: "c-01",
      date: "2026-10-05",
      ageMonths: 24,
      activityTags: ["촉감 놀이", "그림책"],
      materials: ["헝겊책", "딸랑이 공"],
      positiveSignals: [
        { content: "첫 인사 맑은 표정과 딸랑이 공 반응 우수", quote: "밝게 웃으며 첫 인사를 해주었어요" }
      ],
      negativeSignals: [],
      unfinished: null,
      traitHints: []
    }
  },
  {
    noteId: "c-02",
    date: "2026-10-08",
    ageMonths: 24,
    childName: "이O아",
    gender: "여아",
    rawNote: `2026년 10월 8일
이O아 · 2세(24개월) · 여아 / 놀이
태그: 촉감 놀이, 만들기

[활동 내용]
오늘도 선생님 반갑게 맞아주고 플레이콘으로 동물 모양에 꼭꼭 찍어붙이기 놀이를 진행했습니다 🐰
노래에 맞춰 짝짝꿍 손뼉을 치며 신나게 놀이하고 마쳤어요!`,
    extracted: {
      noteId: "c-02",
      date: "2026-10-08",
      ageMonths: 24,
      activityTags: ["촉감 놀이", "만들기"],
      materials: ["플레이콘", "그림 도안"],
      positiveSignals: [
        { content: "리듬에 맞춰 짝짝꿍 상호작용 만점", quote: "노래에 맞춰 짝짝꿍 손뼉을 치며 신나게 놀이" }
      ],
      negativeSignals: [],
      unfinished: null,
      traitHints: []
    }
  }
];

// --- Save Notes to Files ---
function saveChildNotes(childKey, notesList, notesTargetDir) {
  const extractedList = [];
  notesList.forEach((n) => {
    const noteFilePath = path.join(notesTargetDir, `note-${n.noteId.split("-")[1]}.json`);
    fs.writeFileSync(noteFilePath, JSON.stringify(n, null, 2), "utf-8");
    extractedList.push(n.extracted);
  });

  const extractedFilePath = path.join(extractedDir, `${childKey}.json`);
  fs.writeFileSync(extractedFilePath, JSON.stringify(extractedList, null, 2), "utf-8");
}

saveChildNotes("child-a", childANotes, notesDirA);
saveChildNotes("child-b", childBNotes, notesDirB);
saveChildNotes("child-c", childCNotes, notesDirC);

console.log("Successfully generated all 19 synthetic raw note JSON files and 3 extracted JSON files!");
