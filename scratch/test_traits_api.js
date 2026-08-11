import fs from "fs";
import path from "path";
import { composeSystemPrompt, composeReviewPrompt } from "../server/services/promptComposer.js";

const traitsData = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "server/data/traits.json"), "utf-8")
);

console.log("Loaded traits count:", traitsData.length);
console.log("Trait IDs:", traitsData.map(t => t.id).join(", "));

const testTrait = traitsData.find(t => t.id === "sensitive");
const systemPrompt = composeSystemPrompt({
  scenarioPersona: "당신은 6세 아이입니다.",
  trait: testTrait,
  blindMode: false,
});

console.log("\n--- Composed System Prompt Sample ---");
console.log(systemPrompt.slice(0, 400));
console.log("...\n--- End Prompt Sample ---\n");

const reviewPrompt = composeReviewPrompt({
  title: "수줍음 타는 아이",
  transcript: "선생님: 안녕!\n아이: …",
  trait: testTrait,
});

console.log("Review Prompt contains traitScores request:", reviewPrompt.includes("traitScores"));
console.log("Review Prompt contains triggeredFails request:", reviewPrompt.includes("triggeredFails"));
