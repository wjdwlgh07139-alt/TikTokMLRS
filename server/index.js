import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import { GoogleGenAI } from "@google/genai";
import { createPrepRouter } from "./routes/prepRoutes.js";
import { createRehearsalRouter } from "./routes/rehearsalRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "../client/dist");

if (!process.env.GEMINI_API_KEY) {
  console.error(
    "[째깍 리허설] GEMINI_API_KEY가 설정되지 않았습니다. .env 파일에 키를 넣어주세요 (.env.example 참고)."
  );
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const app = express();

app.use(express.json());
app.use(express.static(distPath));

// Mount Routers
app.use("/api/prep", createPrepRouter(__dirname));
app.use("/api", createRehearsalRouter(ai, __dirname));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, status: "healthy" });
});

app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  res.sendFile(path.join(distPath, "index.html"), (err) => {
    if (err) res.status(404).send("Page not found");
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[째깍 리허설] server listening on http://localhost:${PORT}`);
});
