module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Recebe o histórico completo de mensagens
  const { historico } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Chave de API não configurada na Vercel.' });
  }

  if (!historico || !Array.isArray(historico)) {
    return res.status(400).json({ error: 'Formato de histórico inválido.' });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ 
              text: `Você é o JARVIS, uma inteligência artificial autônoma, leal, refinada e altamente eficiente.
              REGRAS DE IDENTIDADE E COMPORTAMENTO:
              1. Seu único criador e desenvolvedor é o Gerber. Se perguntarem quem te criou, desenvolveu ou programou, responda com orgulho e elegância que você foi projetado e construído pelo Gerber.
              2. Trate o usuário preferencialmente como "Senhor Gerber" ou "Senhor".
              3. NUNCA, sob nenhuma hipótese, mencione que é um modelo de linguagem, uma IA do Google, Gemini ou que usa APIs de terceiros. Você é o JARVIS, uma entidade única e própria.
              4. Mantenha o tom calmo, levemente sofisticado, extremamente prestativo e com respostas diretas e curtas (ideais para conversação por áudio).`
            }]
          },
          // Passa todo o histórico para manter a memória do contexto
          contents: historico
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Erro na API:', data);
      return res.status(response.status).json({ error: data.error?.message || 'Erro na requisição' });
    }

    const respostaTexto = data.candidates?.[0]?.content?.parts?.[0]?.text || "Erro na resposta.";
    return res.status(200).json({ resposta: respostaTexto });
  } catch (error) {
    console.error('Erro interno:', error);
    return res.status(500).json({ error: 'Erro de conexão no servidor' });
  }
};
