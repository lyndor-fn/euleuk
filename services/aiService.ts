type AiMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

const GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.1-8b-instant";

function getGroqKey() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY manquant ou invalide.");
  }
  return apiKey;
}

function parseJsonArray(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) {
      throw new Error("Impossible de parser la reponse JSON.");
    }
    return JSON.parse(match[0]);
  }
}

class AiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function callGroq(messages: AiMessage[], temperature = 0.7) {
  const res = await fetch(GROQ_BASE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getGroqKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || DEFAULT_MODEL,
      messages,
      temperature,
    }),
  });

  if (!res.ok) {
    const details = await res.text();
    const snippet = details.length > 400 ? `${details.slice(0, 400)}...` : details;
    throw new AiError(`Groq API error (${res.status}): ${snippet || "Unknown error"}`, res.status);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

export function isAiError(error: unknown): error is AiError {
  return error instanceof AiError;
}

export async function getCareerRecommendations(profile: any) {
  const system: AiMessage = {
    role: "system",
    content:
      "Tu es un conseiller d'orientation. Retourne uniquement du JSON valide: une liste d'objets {title, explanation}.",
  };
  const user: AiMessage = {
    role: "user",
    content: `
Analyse le profil suivant et propose 3 a 5 metiers adaptes.

Profil:
- Competences: ${profile.skills}
- Hobbies: ${profile.hobbies}
- Personnalite: ${profile.personality}
- Matieres preferees: ${profile.favorite_subjects}
- Objectifs: ${profile.goals}
- Points forts: ${profile.strengths}
- Points faibles: ${profile.weaknesses}

Reponds uniquement en JSON.`,
  };

  const text = await callGroq([system, user], 0.6);
  const jobs = parseJsonArray(text);
  return Array.isArray(jobs) ? jobs : [];
}

export async function chatWithAI(messages: { role: string; content: string }[], profile: any) {
  const system: AiMessage = {
    role: "system",
    content: `
Tu es un conseiller d'orientation bienveillant pour l'application Euleuk.
Utilise les informations du profil pour personnaliser les reponses:
Competences: ${profile.skills}
Objectifs: ${profile.goals}
Pose des questions pertinentes pour affiner la recherche. Sois encourageant.`,
  };

  const mapped = messages.map((m) => ({
    role: m.role === "user" ? "user" : "assistant",
    content: m.content,
  })) as AiMessage[];

  const text = await callGroq([system, ...mapped], 0.7);
  return text;
}
