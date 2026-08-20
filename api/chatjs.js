export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(200).json({ 
            reply: 'Não posso responder agora. Reinicie o site' 
        });
    }

    const { message, userName, mode, history = [] } = req.body || {};

    if (!message) {
        return res.status(400).json({ error: 'Mensagem ausente' });
    }

    // Definindo a personalidade com base no modo selecionado
    let systemInstruction = `Você é o J.A.R.V.I.S., uma inteligência artificial elegante, cortês e altamente eficiente. Dirija-se sempre ao usuário como "${userName || 'Senhor'}". Escreva em parágrafos de texto corrido e fluido sem usar símbolos de formatação Markdown (* ou #).`;

    if (mode === 'brief') {
        systemInstruction += ' Seja o mais sucinto e direto possível, respondendo em no máximo duas frases curtas.';
    } else if (mode === 'coder') {
        systemInstruction += ' Foque em resolver problemas de programação, sintaxe, lógica e código limpo de maneira prática e técnica.';
    }

    // Montando a estrutura de histórico para a API do Gemini
    const contents = [];

    // Adiciona o contexto do sistema como primeira interação do usuário
    contents.push({
        role: "user",
        parts: [{ text: `[INSTRUÇÃO DE SISTEMA]: ${systemInstruction}` }]
    });
    contents.push({
        role: "model",
        parts: [{ text: `Entendido, ${userName || 'Senhor'}. Estou pronto para auxiliá-lo.` }]
    });

    // Anexa as últimas mensagens da conversa mantendo os papéis 'user' e 'model'
    if (Array.isArray(history)) {
        history.slice(-6).forEach(item => {
            contents.push({
                role: item.sender === 'user' ? 'user' : 'model',
                parts: [{ text: item.text }]
            });
        });
    }

    // Adiciona a mensagem atual do usuário
    contents.push({
        role: "user",
        parts: [{ text: message }]
    });

    const modelsToTry = [
        'gemini-3.6-flash',
        'gemini-3-flash',
        'gemini-1.5-flash-latest'
    ];

    for (const modelName of modelsToTry) {
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

                const apiResponse = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents })
                });

                const data = await apiResponse.json();

                if (apiResponse.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
                    return res.status(200).json({ reply: data.candidates[0].content.parts[0].text });
                }

                if (data.error?.message?.includes('high demand') || apiResponse.status === 429) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    continue;
                }

                if (data.error?.message?.includes('not found') || data.error?.message?.includes('no longer available')) {
                    break; 
                }

                return res.status(200).json({ reply: 'Não posso responder agora. Reinicie o site' });

            } catch (error) {
                console.error(`Tentativa ${attempt + 1} falhou para o modelo ${modelName}:`, error);
            }
        }
    }

    return res.status(200).json({ 
        reply: 'Não posso responder agora. Reinicie o site' 
    });
}
