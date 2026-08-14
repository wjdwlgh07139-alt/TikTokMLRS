import express from "express";
import fs from "fs";
import path from "path";
import { CHILDREN_METADATA, loadExtractedNotes } from "../data/childrenData.js";
import { checkKananaStatus, extractNoteWithKanana, reextractChildNotesWithKanana } from "../services/kananaService.js";
import { buildPrepDashboard } from "../services/prepEngine.js";

export function createPrepRouter(serverDir) {
  const router = express.Router();

  router.get("/children", (req, res) => {
    res.json(CHILDREN_METADATA);
  });

  router.get("/kanana/status", async (req, res) => {
    const status = await checkKananaStatus();
    res.json(status);
  });

  router.post("/kanana/extract", async (req, res) => {
    const { rawNote } = req.body;
    if (!rawNote) {
      return res.status(400).json({ error: "rawNote is required" });
    }
    try {
      const extracted = await extractNoteWithKanana(rawNote);
      res.json({ success: true, extracted });
    } catch (err) {
      res.status(500).json({ error: "Kanana extraction failed", details: err.message });
    }
  });

  router.get("/children/:childId", async (req, res) => {
    const { childId } = req.params;
    const childInfo = CHILDREN_METADATA.find((c) => c.id === childId);
    if (!childInfo) {
      return res.status(404).json({ error: "child not found" });
    }

    try {
      const extractedNotes = await loadExtractedNotes(childId, serverDir);
      const dashboard = buildPrepDashboard(childInfo, extractedNotes);
      res.json(dashboard);
    } catch (err) {
      console.error(`[prep dashboard error for ${childId}]`, err);
      res.status(500).json({ error: "failed to build prep dashboard", details: err.message });
    }
  });

  router.post("/children/:childId/reextract", async (req, res) => {
    const { childId } = req.params;
    try {
      const freshNotes = await reextractChildNotesWithKanana(childId, serverDir);
      res.json({ success: true, count: freshNotes.length, notes: freshNotes });
    } catch (err) {
      res.status(500).json({ error: "Re-extraction failed", details: err.message });
    }
  });

  router.get("/children/:childId/notes", (req, res) => {
    const { childId } = req.params;
    const childDir = path.join(serverDir, `../fixtures/notes/${childId}`);
    if (!fs.existsSync(childDir)) {
      return res.json([]);
    }

    try {
      const files = fs.readdirSync(childDir).filter((f) => f.endsWith(".json"));
      const notes = files.map((f) => {
        return JSON.parse(fs.readFileSync(path.join(childDir, f), "utf-8"));
      });
      notes.sort((a, b) => new Date(b.date) - new Date(a.date));
      res.json(notes);
    } catch (err) {
      res.status(500).json({ error: "failed to load notes" });
    }
  });

  router.get("/recommendations", async (req, res) => {
    const allRecs = [];
    try {
      for (const child of CHILDREN_METADATA) {
        const extractedNotes = await loadExtractedNotes(child.id, serverDir);
        const dash = buildPrepDashboard(child, extractedNotes);
        if (dash.recommendations && dash.recommendations.length > 0) {
          dash.recommendations.forEach((rec) => {
            allRecs.push({
              ...rec,
              childId: child.id,
              childName: child.childName,
              childAgeMonths: child.ageMonths,
            });
          });
        }
      }
      res.json(allRecs);
    } catch (err) {
      console.error("[prep recommendations error]", err);
      res.status(500).json({ error: "failed to load recommendations", details: err.message });
    }
  });

  return router;
}
