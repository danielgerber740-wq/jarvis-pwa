module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { mensagem } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Chave de API não configurada na Vercel.' });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: "Você é o JARVIS, uma inteligência artificial eficiente e objetiva para respostas em áudio." }]
          },
          contents: [{ parts: [{ text: mensagem }] }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Erro na API do Gemini:', data);
      return res.status(response.status).json({ error: data.error?.message || 'Erro na API do Gemini' });
    }

    const respostaTexto = data.candidates?.[0]?.content?.parts?.[0]?.text || "Erro na resposta.";
    return res.status(200).json({ resposta: respostaTexto });
  } catch (error) {
    console.error('Erro interno:', error);
    return res.status(500).json({ error: 'Erro de conexão no servidor' });
  }
};
