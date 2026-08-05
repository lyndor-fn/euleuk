import { GoogleGenAI, Type } from "@google/genai";
let client = null;
function getClient() {
    if (client) {
        return client;
    }
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY must be set to use the AI services.");
    }
    client = new GoogleGenAI({ apiKey });
    return client;
}
export async function getCareerRecommendations(profile) {
    const prompt = `
    En tant qu'expert en orientation professionnelle, analyse le profil suivant d'un étudiant et propose 3 à 5 métiers adaptés.
    
    Profil:
    - Compétences: ${profile.skills}
    - Hobbies: ${profile.hobbies}
    - Personnalité: ${profile.personality}
    - Matières préférées: ${profile.favorite_subjects}
    - Objectifs: ${profile.goals}
    - Points forts: ${profile.strengths}
    - Points faibles: ${profile.weaknesses}

    Réponds au format JSON avec une liste d'objets contenant "title" (le métier) et "explanation" (pourquoi ce métier correspond).
  `;
    const response = await getClient().models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        explanation: { type: Type.STRING },
                    },
                    required: ["title", "explanation"],
                },
            },
        },
    });
    if (!response.text) {
        return [];
    }
    return JSON.parse(response.text);
}
export async function chatWithAI(messages, profile) {
    const systemInstruction = `
    Tu es un conseiller d'orientation bienveillant pour l'application Euleuk. 
    Ton but est d'aider l'étudiant à découvrir sa voie.
    Utilise les informations de son profil pour personnaliser tes réponses:
    Compétences: ${profile.skills}
    Objectifs: ${profile.goals}
    
    Pose des questions pertinentes pour affiner sa recherche. Sois encourageant.
  `;
    const response = await getClient().models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: messages.map((m) => ({ role: m.role === "user" ? "user" : "assistant", parts: [{ text: m.content }] })),
        config: {
            systemInstruction,
        },
    });
    return response.text || "";
}
//# sourceMappingURL=geminiService.js.map