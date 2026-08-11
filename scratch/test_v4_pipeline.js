import fs from "fs";
import path from "path";
import { PERSONAS } from "../server/personas.js";
import { composeSystemPrompt, composeReviewPrompt } from "../server/services/promptComposer.js";

console.log("=== Testing v4 Integrated Pipeline ===");
console.log("1. Total Scenarios Count:", PERSONAS.length);
console.log("Scenarios List:", PERSONAS.map(p => `${p.emoji} ${p.title} (${p.id}, turns: ${p.turns}, feedbackType: ${p.feedbackType})`).join("\n"));

const quietPersona = PERSONAS.find(p => p.id === "quiet");
console.log("\n2. Quiet Persona System Prompt Sample:");
const sysPrompt = composeSystemPrompt({ scenarioPersona: quietPersona.persona, trait: null, blindMode: false });
console.log("   Level system rules included:", sysPrompt.includes("Level 0 (편안)"));
console.log("   Level step limit included:", sysPrompt.includes("정확히 1단계만 올려라"));
console.log("   Recovery guarantee included:", sysPrompt.includes("반드시 Level 2로 누그러지며"));

console.log("\n3. Review Prompt 3-Status Rules Check:");
const revPrompt = composeReviewPrompt({
  title: quietPersona.title,
  transcript: "[1턴] 선생님: 안녕!\n[1턴 아이 반응] 아이: …네.",
  trait: null,
  persona: quietPersona,
});
console.log("   Contains status scored/no_opportunity instructions:", revPrompt.includes("status: \"no_opportunity\""));
console.log("   Contains missed quote requirement:", revPrompt.includes("missed로 판정하려면"));
