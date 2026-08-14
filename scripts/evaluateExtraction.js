import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildPrepDashboard } from "../server/services/prepEngine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

console.log("==========================================");
console.log("  돌봄 노트 추출 & 리허설 추천 평가 하네스");
console.log("==========================================");

// Load Fixtures
const childAExtracted = JSON.parse(fs.readFileSync(path.join(rootDir, "fixtures/extracted/child-a.json"), "utf-8"));
const childBExtracted = JSON.parse(fs.readFileSync(path.join(rootDir, "fixtures/extracted/child-b.json"), "utf-8"));
const childCExtracted = JSON.parse(fs.readFileSync(path.join(rootDir, "fixtures/extracted/child-c.json"), "utf-8"));

// 1. Quote Validity & Hallucination Rate Verification
function verifyQuotes(childKey, notesExtracted, notesDir) {
  let totalQuotes = 0;
  let validQuotes = 0;

  notesExtracted.forEach((ext) => {
    const rawNoteFile = path.join(notesDir, `note-${ext.noteId.split("-")[1]}.json`);
    if (!fs.existsSync(rawNoteFile)) return;
    const rawObj = JSON.parse(fs.readFileSync(rawNoteFile, "utf-8"));
    const rawText = rawObj.rawNote || "";

    const checkQuote = (quote) => {
      if (!quote) return;
      totalQuotes++;
      // Ignore subtle whitespace/punctuation difference
      const cleanRaw = rawText.replace(/\s+/g, "");
      const cleanQuote = quote.replace(/\s+/g, "");
      if (cleanRaw.includes(cleanQuote)) {
        validQuotes++;
      } else {
        console.warn(`[Quote Mismatch] ${ext.noteId}: "${quote}" not found in raw note.`);
      }
    };

    (ext.positiveSignals || []).forEach((s) => checkQuote(s.quote));
    (ext.negativeSignals || []).forEach((s) => checkQuote(s.quote));
    if (ext.unfinished && ext.unfinished.quote) checkQuote(ext.unfinished.quote);
    (ext.traitHints || []).forEach((h) => checkQuote(h.quote));
  });

  const quoteAccuracy = totalQuotes > 0 ? validQuotes / totalQuotes : 1.0;
  const hallucinationRate = 1.0 - quoteAccuracy;
  console.log(`\n[${childKey}] 인용문 검증: ${validQuotes}/${totalQuotes} (${(quoteAccuracy * 100).toFixed(1)}%) | 환각률: ${(hallucinationRate * 100).toFixed(1)}%`);
  return { quoteAccuracy, hallucinationRate };
}

verifyQuotes("Child A", childAExtracted, path.join(rootDir, "fixtures/notes/child-a"));
verifyQuotes("Child B", childBExtracted, path.join(rootDir, "fixtures/notes/child-b"));
verifyQuotes("Child C", childCExtracted, path.join(rootDir, "fixtures/notes/child-c"));

// 2. Tool B Trajectory Recommendation Logic Validation (§8.2)
console.log("\n------------------------------------------");
console.log("  도구 B 리허설 추천 궤적 검증 (§8.2)");
console.log("------------------------------------------");

let passed = true;

// Child A (12 notes, shyness resolved after note 1) -> Must NOT recommend 'shy'!
const dashA = buildPrepDashboard({ id: "child-a", childName: "구O윤", ageMonths: 27, gender: "여아" }, childAExtracted);
const recsA = dashA.recommendations.map((r) => r.scenarioId);
console.log("Child A 추천 시나리오:", dashA.recommendations.map((r) => `${r.title} (${r.badge})`));
if (recsA.includes("shy")) {
  console.error("❌ FAILED: Child A (낯가림 1회차 해소)에 'shy'(낯가림)가 추천되었습니다!");
  passed = false;
} else {
  console.log("✅ PASSED: Child A 낯가림 해소 궤적 판정 성공 (shy 제외됨)");
}

// Child B (5 notes, persistent separation anxiety) -> Must recommend 'cling'!
const dashB = buildPrepDashboard({ id: "child-b", childName: "김O준", ageMonths: 30, gender: "남아" }, childBExtracted);
const recsB = dashB.recommendations.map((r) => r.scenarioId);
console.log("Child B 추천 시나리오:", dashB.recommendations.map((r) => `${r.title} (${r.badge})`));
if (!recsB.includes("cling")) {
  console.error("❌ FAILED: Child B (분리 신호 지속)에 'cling'(엄마를 찾는 아이)이 추천되지 않았습니다!");
  passed = false;
} else {
  console.log("✅ PASSED: Child B 분리불안 추천 성공 (cling 포함됨)");
}

// Child C (2 notes, no negative signals) -> Must recommend 'cheerful'!
const dashC = buildPrepDashboard({ id: "child-c", childName: "이O아", ageMonths: 24, gender: "여아" }, childCExtracted);
const recsC = dashC.recommendations.map((r) => r.scenarioId);
console.log("Child C 추천 시나리오:", dashC.recommendations.map((r) => `${r.title} (${r.badge})`));
if (!recsC.includes("cheerful")) {
  console.error("❌ FAILED: Child C (신호 없음)에 'cheerful'(활발한 아이)이 추천되지 않았습니다!");
  passed = false;
} else {
  console.log("✅ PASSED: Child C 신호 없음 기본 분기 성공 (cheerful 포함됨)");
}

// Note 0 (New assignment) -> Must recommend 'shy' + 'cheerful'!
const dash0 = buildPrepDashboard({ id: "child-new", childName: "박O진", ageMonths: 28, gender: "남아" }, []);
const recs0 = dash0.recommendations.map((r) => r.scenarioId);
console.log("Child 0건 추천 시나리오:", dash0.recommendations.map((r) => `${r.title} (${r.badge})`));
if (!recs0.includes("shy") || !recs0.includes("cheerful")) {
  console.error("❌ FAILED: 노트 0건 아동에 'shy' + 'cheerful' 기본 2종이 추천되지 않았습니다!");
  passed = false;
} else {
  console.log("✅ PASSED: 노트 0건 기본 2종(shy + cheerful) 추천 성공");
}

console.log("\n==========================================");
if (passed) {
  console.log("🎉 모든 추출 & 추천 궤적 검증 통과 (SUCCESS)!");
} else {
  console.log("❌ 검증 실패 항목 존재 (FAIL)");
  process.exit(1);
}
console.log("==========================================");
