import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const { message, userName } = req.body;

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: `Você é o J.A.R.V.I.S., uma inteligência artificial sofisticada. Dirija-se sempre ao usuário pelo nome "${userName || 'Senhor'}".`
        });

        const result = await model.generateContent(message);
        const response = await result.response;
        const text = response.text();

        return res.status(200).json({ reply: text });
    } catch (error) {
        console.error('Erro no Gemini:', error);
        return res.status(500).json({ error: error.message });
    }
}
