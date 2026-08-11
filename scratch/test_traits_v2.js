import fs from "fs";
import path from "path";
import { composeSystemPrompt } from "../server/services/promptComposer.js";

const traitsData = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "server/data/traits.json"), "utf-8")
);

console.log("=== Testing Trait v2 Specs ===");

traitsData.forEach((trait) => {
  console.log(`\n[Trait: ${trait.label} (${trait.id})]`);
  console.log(`- initialLevel: ${trait.initialLevel}`);
  console.log(`- openingLine: ${trait.openingLine}`);
  console.log(`- negativeDirection: ${trait.negativeDirection}`);

  const systemPrompt = composeSystemPrompt({
    scenarioPersona: "당신은 아이입니다.",
    trait,
    blindMode: false,
  });

  const hasLevelRules = systemPrompt.includes("Level 0 (편안)");
  const hasStepLimitRule = systemPrompt.includes("정확히 1단계만 올려라");
  const hasRecoveryGuarantee = systemPrompt.includes("반드시 Level 2로 누그러지며");

  console.log(`  Prompt Check -> Level System: ${hasLevelRules}, Step Limit: ${hasStepLimitRule}, Recovery Guarantee: ${hasRecoveryGuarantee}`);
});
