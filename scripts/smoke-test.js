import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

async function main() {
  const port = 3101;
  const env = { ...process.env, DISABLE_VITE: "1", PORT: String(port) };
  const child = spawn(process.execPath, ["dist-server/server.js"], {
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stderr = "";
  let stdout = "";
  child.stdout.on("data", (data) => {
    stdout += data.toString();
  });
  child.stderr.on("data", (data) => {
    stderr += data.toString();
  });

  try {
    await delay(3000);

    const profile = {
      user_id: 1,
      skills: "Python",
      hobbies: "Music",
      personality: "Curious",
      favorite_subjects: "Math",
      goals: "Engineer",
      strengths: "Problem solving",
      weaknesses: "Procrastination",
    };

    const recRes = await fetch(`http://localhost:${port}/api/ai/recommendations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: 1, profile }),
    });
    const recText = await recRes.text();

    const chatRes = await fetch(`http://localhost:${port}/api/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: 1,
        profile,
        messages: [{ role: "user", content: "Bonjour" }],
      }),
    });
    const chatText = await chatRes.text();

    console.log("---RECS---");
    console.log(`HTTP ${recRes.status}`);
    console.log(recText);
    console.log("---CHAT---");
    console.log(`HTTP ${chatRes.status}`);
    console.log(chatText);
    console.log("---STDOUT---");
    console.log(stdout.trim());
    console.log("---STDERR---");
    console.log(stderr.trim());
  } finally {
    child.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
