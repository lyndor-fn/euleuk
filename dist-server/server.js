import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const db = new Database("euleuk.db");
// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT CHECK(role IN ('student', 'coach')),
    full_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS profiles (
    user_id INTEGER PRIMARY KEY,
    skills TEXT,
    hobbies TEXT,
    personality TEXT,
    favorite_subjects TEXT,
    goals TEXT,
    strengths TEXT,
    weaknesses TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    job_title TEXT,
    explanation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER,
    receiver_id INTEGER,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sender_id) REFERENCES users(id),
    FOREIGN KEY(receiver_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    role TEXT,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);
async function startServer() {
    const app = express();
    const PORT = 3000;
    app.use(express.json());
    // Auth Endpoints
    app.post("/api/auth/signup", (req, res) => {
        const { email, password, role, full_name } = req.body;
        try {
            const stmt = db.prepare("INSERT INTO users (email, password, role, full_name) VALUES (?, ?, ?, ?)");
            const info = stmt.run(email, password, role, full_name);
            res.json({ id: info.lastInsertRowid, email, role, full_name });
        }
        catch (e) {
            res.status(400).json({ error: "Email already exists" });
        }
    });
    app.post("/api/auth/login", (req, res) => {
        const { email, password } = req.body;
        const user = db.prepare("SELECT * FROM users WHERE email = ? AND password = ?").get(email, password);
        if (user) {
            res.json(user);
        }
        else {
            res.status(401).json({ error: "Invalid credentials" });
        }
    });
    // Profile Endpoints
    app.get("/api/profile/:userId", (req, res) => {
        const profile = db.prepare("SELECT * FROM profiles WHERE user_id = ?").get(req.params.userId);
        res.json(profile || {});
    });
    app.post("/api/profile", (req, res) => {
        const { user_id, skills, hobbies, personality, favorite_subjects, goals, strengths, weaknesses } = req.body;
        const stmt = db.prepare(`
      INSERT OR REPLACE INTO profiles (user_id, skills, hobbies, personality, favorite_subjects, goals, strengths, weaknesses)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
        stmt.run(user_id, skills, hobbies, personality, favorite_subjects, goals, strengths, weaknesses);
        res.json({ success: true });
    });
    // Recommendations
    app.get("/api/recommendations/:userId", (req, res) => {
        const recs = db.prepare("SELECT * FROM recommendations WHERE user_id = ? ORDER BY created_at DESC").all(req.params.userId);
        res.json(recs);
    });
    app.post("/api/recommendations", (req, res) => {
        const { user_id, jobs } = req.body; // jobs is array of {title, explanation}
        const stmt = db.prepare("INSERT INTO recommendations (user_id, job_title, explanation) VALUES (?, ?, ?)");
        const insertMany = db.transaction((data) => {
            for (const job of data)
                stmt.run(user_id, job.title, job.explanation);
        });
        insertMany(jobs);
        res.json({ success: true });
    });
    app.post("/api/ai/recommendations", async (req, res) => {
        const { user_id, profile } = req.body;
        if (!user_id || !profile) {
            return res.status(400).json({ error: "Données manquantes" });
        }
        try {
            const { getCareerRecommendations } = await import("./services/geminiService.js");
            const jobs = await getCareerRecommendations(profile);
            const deleteStmt = db.prepare("DELETE FROM recommendations WHERE user_id = ?");
            deleteStmt.run(user_id);
            const insertStmt = db.prepare("INSERT INTO recommendations (user_id, job_title, explanation) VALUES (?, ?, ?)");
            const insertMany = db.transaction((data) => {
                for (const job of data)
                    insertStmt.run(user_id, job.title, job.explanation);
            });
            insertMany(jobs);
            const recs = db.prepare("SELECT * FROM recommendations WHERE user_id = ? ORDER BY created_at DESC").all(user_id);
            res.json({ recommendations: recs });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: "Impossible de générer les recommandations pour le moment." });
        }
    });
    app.post("/api/ai/chat", async (req, res) => {
        const { user_id, profile, messages } = req.body;
        if (!user_id || !profile || !Array.isArray(messages)) {
            return res.status(400).json({ error: "Données manquantes pour le chat." });
        }
        try {
            const { chatWithAI } = await import("./services/geminiService.js");
            const reply = await chatWithAI(messages, profile);
            const convStmt = db.prepare("INSERT INTO conversations (user_id, role, content) VALUES (?, ?, ?)");
            const lastUserMessage = messages.at(-1);
            if (lastUserMessage && lastUserMessage.role === "user") {
                convStmt.run(user_id, "user", lastUserMessage.content);
            }
            convStmt.run(user_id, "model", reply);
            res.json({ reply });
        }
        catch (error) {
            console.error(error);
            res.status(500).json({ error: "Impossible de contacter l'IA pour le moment." });
        }
    });
    // Coach Dashboard Endpoints
    app.get("/api/coach/students", (req, res) => {
        const students = db.prepare(`
      SELECT u.id, u.full_name, u.email, p.skills, p.goals
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.role = 'student'
    `).all();
        res.json(students);
    });
    // Messages
    app.get("/api/messages/:userId/:otherId", (req, res) => {
        const msgs = db.prepare(`
      SELECT * FROM messages 
      WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
      ORDER BY created_at ASC
    `).all(req.params.userId, req.params.otherId, req.params.otherId, req.params.userId);
        res.json(msgs);
    });
    app.post("/api/messages", (req, res) => {
        const { sender_id, receiver_id, content } = req.body;
        db.prepare("INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)").run(sender_id, receiver_id, content);
        res.json({ success: true });
    });
    // Vite middleware for development
    if (process.env.NODE_ENV !== "production" && process.env.DISABLE_VITE !== "1") {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
        });
        app.use(vite.middlewares);
    }
    else if (process.env.NODE_ENV !== "production") {
        app.get("/", (_req, res) => {
            res.send("API server running. Vite disabled.");
        });
    }
    else {
        const distPath = path.join(process.cwd(), "dist");
        app.use(express.static(distPath));
        app.get("*", (req, res) => {
            res.sendFile(path.join(distPath, "index.html"));
        });
    }
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}
startServer();
//# sourceMappingURL=server.js.map