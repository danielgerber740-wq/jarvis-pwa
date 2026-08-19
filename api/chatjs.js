export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ 
            reply: 'Erro: A chave GEMINI_API_KEY não está cadastrada na Vercel.' 
        });
    }

    const { message, userName } = req.body || {};

    if (!message) {
        return res.status(400).json({ error: 'Mensagem ausente' });
    }

    const promptText = `Você é o J.A.R.V.I.S., uma inteligência artificial elegante, cortês e altamente eficiente. Dirija-se sempre ao usuário como "${userName || 'Senhor'}". Mantenha respostas diretas e úteis.\n\nUsuário: ${message}`;

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: promptText }]
                }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Erro da API Google:', data);
            return res.status(500).json({ 
                reply: `Erro da API Gemini: ${data.error?.message || 'Falha ao processar.'}` 
            });
        }

        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sem resposta do sistema.';

        return res.status(200).json({ reply: replyText });

    } catch (error) {
        console.error('Erro de requisição:', error);
        return res.status(500).json({ reply: `Erro interno no servidor: ${error.message}` });
    }
}
