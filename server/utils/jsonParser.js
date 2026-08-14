/**
 * JSON Parsing and Salvage Utilities for LLM outputs.
 */

export function extractJSON(text) {
  if (!text || typeof text !== "string") {
    throw new Error("empty or invalid text for extractJSON");
  }
  let cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1) {
    throw new Error("no JSON braces found");
  }

  // 1. Full { ... } parsing attempt
  if (end > start) {
    const rawCandidate = cleaned.slice(start, end + 1);
    try {
      return JSON.parse(rawCandidate);
    } catch {
      // Fix trailing comma & control characters
      const sanitized = rawCandidate
        .replace(/,\s*([\}\]])/g, "$1")
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, " ");
      try {
        return JSON.parse(sanitized);
      } catch (e) {
        // Fallback to truncation repair below
      }
    }
  }

  // 2. Repair truncated JSON
  let jsonStr = cleaned.slice(start);
  jsonStr = jsonStr.replace(/,\s*$/, "");

  let openQuotes = false;
  const stack = [];
  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];
    if (char === '"' && jsonStr[i - 1] !== "\\") {
      openQuotes = !openQuotes;
    } else if (!openQuotes) {
      if (char === "{" || char === "[") {
        stack.push(char === "{" ? "}" : "]");
      } else if (char === "}" || char === "]") {
        if (stack.length && stack[stack.length - 1] === char) {
          stack.pop();
        }
      }
    }
  }

  if (openQuotes) jsonStr += '"';
  jsonStr = jsonStr.replace(/,\s*$/, "");
  while (stack.length > 0) {
    jsonStr += stack.pop();
  }

  try {
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("[extractJSON repair failed]", err.message, text.slice(-200));
    throw err;
  }
}

export function salvageReply(text) {
  if (!text || typeof text !== "string") return null;
  const match = text.match(/"reply"\s*:\s*"((?:\\.|[^"\\])*)/);
  if (!match) return null;
  try {
    return JSON.parse(`"${match[1]}"`);
  } catch {
    return match[1];
  }
}

export function salvageJSON(text) {
  if (!text || typeof text !== "string") throw new Error("empty text");
  let s = text.replace(/```json|```/g, "").trim();
  const start = s.indexOf("{");
  if (start === -1) throw new Error("no opening brace");
  s = s.slice(start);

  const quotes = (s.match(/(?<!\\)"/g) || []).length;
  if (quotes % 2 === 1) {
    s = s.slice(0, s.lastIndexOf('"'));
  }

  s = s.replace(/,\s*[^,\[\]{}]*$/, "");

  const stack = [];
  let openQ = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"' && s[i - 1] !== "\\") {
      openQ = !openQ;
    } else if (!openQ) {
      if (c === "{" || c === "[") stack.push(c === "{" ? "}" : "]");
      else if (c === "}" || c === "]") {
        if (stack.length && stack[stack.length - 1] === c) stack.pop();
      }
    }
  }

  while (stack.length > 0) {
    s += stack.pop();
  }

  const parsed = JSON.parse(s);
  parsed.partial = true;
  return parsed;
}
