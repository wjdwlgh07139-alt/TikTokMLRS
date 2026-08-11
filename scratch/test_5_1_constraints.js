import { MAX_USER_INPUT_CHARS, WARN_USER_INPUT_CHARS, WARN_INPUT_MESSAGE } from "../client/src/constants.js";

console.log("=== Testing 5-1 Max Input Length Constraints ===");
console.log("MAX_USER_INPUT_CHARS:", MAX_USER_INPUT_CHARS);
console.log("WARN_USER_INPUT_CHARS:", WARN_USER_INPUT_CHARS);
console.log("WARN_INPUT_MESSAGE:", WARN_INPUT_MESSAGE);

const sample1 = "안녕하세요 아이야 반가워!";
const sample2 = "가".repeat(105);
const sample3 = "나".repeat(155);

console.log(`Sample 1 (${sample1.length}자): isWarn=${sample1.length >= WARN_USER_INPUT_CHARS}, isExceed=${sample1.length > MAX_USER_INPUT_CHARS}`);
console.log(`Sample 2 (${sample2.length}자): isWarn=${sample2.length >= WARN_USER_INPUT_CHARS}, isExceed=${sample2.length > MAX_USER_INPUT_CHARS}`);
console.log(`Sample 3 (${sample3.length}자): isWarn=${sample3.length >= WARN_USER_INPUT_CHARS}, isExceed=${sample3.length > MAX_USER_INPUT_CHARS}`);
