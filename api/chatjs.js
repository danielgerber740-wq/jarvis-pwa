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

    // Lista de modelos em ordem de preferência
    const modelsToTry = [
        'gemini-3.6-flash',
        'gemini-3-flash',
        'gemini-1.5-flash-latest'
    ];

    for (const modelName of modelsToTry) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

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

            if (apiResponse.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
                const replyText = data.candidates[0].content.parts[0].text;
                return res.status(200).json({ reply: replyText });
            }

            // Se for erro de modelo não encontrado/indisponível, tenta o próximo da lista
            if (data.error?.message?.includes('not found') || data.error?.message?.includes('no longer available')) {
                continue;
            }

            // Se for outro erro (ex: chave inválida ou quota), retorna o motivo
            return res.status(200).json({ 
                reply: `Erro da API Gemini: ${data.error?.message || 'Falha ao processar.'}` 
            });

        } catch (error) {
            console.error(`Erro ao tentar o modelo ${modelName}:`, error);
        }
    }

    return res.status(200).json({ 
        reply: 'Erro: Nenhum dos modelos Gemini suportados respondeu na sua conta.' 
    });
}
