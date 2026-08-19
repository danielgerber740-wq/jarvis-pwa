import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
    // Permite apenas requisições POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        
        // Verifica se a chave existe antes de chamar a API
        if (!apiKey) {
            console.error('ERRO: GEMINI_API_KEY não foi encontrada nas variáveis de ambiente.');
            return res.status(500).json({ reply: 'Erro interno: Chave GEMINI_API_KEY não configurada na Vercel.' });
        }

        const { message, userName } = req.body || {};
        
        if (!message) {
            return res.status(400).json({ error: 'Mensagem não fornecida.' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: `Você é o J.A.R.V.I.S., uma inteligência artificial extremamente eficiente e cortês. Dirija-se sempre ao usuário pelo nome "${userName || 'Senhor'}".`
        });

        const result = await model.generateContent(message);
        const response = await result.response;
        const text = response.text();

        return res.status(200).json({ reply: text });

    } catch (error) {
        console.error('Erro de execução no backend:', error);
        return res.status(500).json({ 
            reply: `Falha no sistema J.A.R.V.I.S.: ${error.message || 'Erro desconhecido no servidor.'}` 
        });
    }
}
