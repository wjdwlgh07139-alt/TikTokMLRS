import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { buildPrepDashboard } from "../server/services/prepEngine.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

console.log("=======================================================");
console.log("  🤖 Ollama Kanana-2 1.3B SLM 추출 품질 & 추천 평가 리포트");
console.log("=======================================================\n");

const childAExt = JSON.parse(fs.readFileSync(path.join(rootDir, "fixtures/extracted_ollama/child-a.json"), "utf-8"));
const childBExt = JSON.parse(fs.readFileSync(path.join(rootDir, "fixtures/extracted_ollama/child-b.json"), "utf-8"));
const childCExt = JSON.parse(fs.readFileSync(path.join(rootDir, "fixtures/extracted_ollama/child-c.json"), "utf-8"));

// 1. Quote Verification against Raw Notes
function evaluateQuotes(childKey, extractedList, notesDir) {
  let totalQuotes = 0;
  let validQuotes = 0;

  extractedList.forEach((ext, idx) => {
    const noteId = ext.noteId || `${childKey.split("-")[1]}-${String(idx + 1).padStart(2, "0")}`;
    const fileIndex = String(idx + 1).padStart(2, "0");
    const rawFile = path.join(notesDir, `note-${fileIndex}.json`);
    if (!fs.existsSync(rawFile)) return;
    const rawObj = JSON.parse(fs.readFileSync(rawFile, "utf-8"));
    const rawText = (rawObj.rawNote || "").replace(/\s+/g, "");

    const check = (quote) => {
      if (!quote || quote.length < 2) return;
      totalQuotes++;
      const cleanQuote = quote.replace(/\s+/g, "");
      if (rawText.includes(cleanQuote)) {
        validQuotes++;
      } else {
        console.warn(`   ⚠️ [인용문 불일치] 노트 ${ext.noteId}: "${quote}"`);
      }
    };

    const getArray = (val) => (Array.isArray(val) ? val : val && typeof val === "object" ? [val] : []);

    getArray(ext.positiveSignals).forEach((s) => check(s.quote));
    getArray(ext.negativeSignals).forEach((s) => check(s.quote));
    if (ext.unfinished && ext.unfinished.quote) check(ext.unfinished.quote);
    getArray(ext.traitHints).forEach((h) => check(h.quote));
  });

  const accuracy = totalQuotes > 0 ? (validQuotes / totalQuotes) * 100 : 100;
  console.log(`📌 [${childKey.toUpperCase()}] 인용문 검증: ${validQuotes}/${totalQuotes} (${accuracy.toFixed(1)}%) | 환각률: ${(100 - accuracy).toFixed(1)}%`);
  return accuracy;
}

evaluateQuotes("child-a", childAExt, path.join(rootDir, "fixtures/notes/child-a"));
evaluateQuotes("child-b", childBExt, path.join(rootDir, "fixtures/notes/child-b"));
evaluateQuotes("child-c", childCExt, path.join(rootDir, "fixtures/notes/child-c"));

console.log("\n-------------------------------------------------------");
console.log("🎭 도구 B 리허설 추천 궤적 평가 (Kanana-2 1.3B 추출 기반)");
console.log("-------------------------------------------------------");

// Child A
const dashA = buildPrepDashboard({ id: "child-a", childName: "구O윤", ageMonths: 27, gender: "여아" }, childAExt);
console.log("🔹 Child A (12건) 추천 시나리오:", dashA.recommendations.map((r) => `${r.title} (${r.badge})`));
console.log("   추천 사유:", dashA.recommendations[0]?.reason);

// Child B
const dashB = buildPrepDashboard({ id: "child-b", childName: "김O준", ageMonths: 30, gender: "남아" }, childBExt);
console.log("\n🔹 Child B (5건) 추천 시나리오:", dashB.recommendations.map((r) => `${r.title} (${r.badge})`));
console.log("   추천 사유:", dashB.recommendations[0]?.reason);

// Child C
const dashC = buildPrepDashboard({ id: "child-c", childName: "이O아", ageMonths: 24, gender: "여아" }, childCExt);
console.log("\n🔹 Child C (2건) 추천 시나리오:", dashC.recommendations.map((r) => `${r.title} (${r.badge})`));
console.log("   추천 사유:", dashC.recommendations[0]?.reason);

console.log("\n=======================================================");
console.log("✅ Ollama Kanana-2 1.3B 추출 및 도구 B 궤적 렌더링 검증 완료!");
console.log("=======================================================");
