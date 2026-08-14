import fs from "fs";
import path from "path";
import { isExtractionInsufficient, reextractChildNotesWithKanana } from "../services/kananaService.js";

export const CHILDREN_METADATA = [
  { id: "child-a", childName: "구O윤", name: "구O윤", ageMonths: 27, gender: "여아", noteCount: 12, totalNotesCount: 12, lastDate: "2026-10-01", teacherNote: "악어 선생님 담당" },
  { id: "child-b", childName: "김O준", name: "김O준", ageMonths: 35, gender: "남아", noteCount: 5, totalNotesCount: 5, lastDate: "2026-09-29", teacherNote: "토끼 선생님 담당" },
  { id: "child-c", childName: "이O서", name: "이O서", ageMonths: 30, gender: "여아", noteCount: 2, totalNotesCount: 2, lastDate: "2026-10-08", teacherNote: "곰돌이 선생님 담당" },
  { id: "child-d", childName: "박O진", name: "박O진", ageMonths: 28, gender: "남아", noteCount: 0, totalNotesCount: 0, lastDate: null, teacherNote: "사자 선생님 담당" },
];

export async function loadExtractedNotes(childId, serverDir) {
  const ollamaPath = path.join(serverDir, `../fixtures/extracted_ollama/${childId}.json`);
  const defaultPath = path.join(serverDir, `../fixtures/extracted/${childId}.json`);
  const notesDir = path.join(serverDir, `../fixtures/notes/${childId}`);

  let rawCount = 0;
  if (fs.existsSync(notesDir)) {
    rawCount = fs.readdirSync(notesDir).filter((f) => f.endsWith(".json")).length;
  }

  let ollamaNotes = [];
  if (fs.existsSync(ollamaPath)) {
    try {
      ollamaNotes = JSON.parse(fs.readFileSync(ollamaPath, "utf-8"));
    } catch {
      ollamaNotes = [];
    }
  }

  if (isExtractionInsufficient(ollamaNotes, rawCount)) {
    console.log(`[Kanana Auto Trigger] child '${childId}' extraction is sparse/insufficient. Triggering Kanana re-summarization...`);
    try {
      const freshNotes = await reextractChildNotesWithKanana(childId, serverDir);
      if (Array.isArray(freshNotes) && freshNotes.length > 0) {
        return freshNotes;
      }
    } catch (err) {
      console.warn(`[Kanana Auto Trigger Error] Re-summarization failed for ${childId}:`, err.message);
    }
  } else {
    return ollamaNotes;
  }

  if (fs.existsSync(defaultPath)) {
    try {
      return JSON.parse(fs.readFileSync(defaultPath, "utf-8"));
    } catch {
      return [];
    }
  }

  return ollamaNotes;
}
