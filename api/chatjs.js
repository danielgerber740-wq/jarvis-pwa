export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(200).json({ 
            reply: 'Erro: A variável GEMINI_API_KEY não foi encontrada nas configurações da Vercel.' 
        });
    }

    const { message, userName } = req.body || {};

    if (!message) {
        return res.status(400).json({ error: 'Mensagem ausente' });
    }

    const promptText = `Você é o J.A.R.V.I.S., uma inteligência artificial elegante, cortês e altamente eficiente. Dirija-se sempre ao usuário como "${userName || 'Senhor'}". Mantenha respostas diretas e úteis.\n\nUsuário: ${message}`;

    try {
        // Rota atualizada para o endpoint v1beta da API do Gemini
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const apiResponse = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [{ text: promptText }]
                    }
                ]
            })
        });

        const data = await apiResponse.json();

        if (!apiResponse.ok) {
            const errorMsg = data.error?.message || 'Erro desconhecido da API Google';
            
            // Tentativa de fallback para gemini-2.5-flash se o 1.5 não estiver disponível na conta
            if (errorMsg.includes('not found')) {
                const fallbackUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
                const fallbackResponse = await fetch(fallbackUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ role: "user", parts: [{ text: promptText }] }]
                    })
                });
                const fallbackData = await fallbackResponse.json();
                
                if (fallbackResponse.ok) {
                    const fallbackText = fallbackData.candidates?.[0]?.content?.parts?.[0]?.text || 'Sem resposta do sistema.';
                    return res.status(200).json({ reply: fallbackText });
                }
            }

            return res.status(200).json({ 
                reply: `Erro da API Gemini: ${errorMsg}` 
            });
        }

        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sem resposta do sistema.';

        return res.status(200).json({ reply: replyText });

    } catch (error) {
        return res.status(200).json({ 
            reply: `Erro de execução interna: ${error.message}` 
        });
    }
}
