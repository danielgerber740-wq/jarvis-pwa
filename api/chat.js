export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { mensagem } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ error: 'Chave não configurada' });

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
    const respostaTexto = data.candidates?.[0]?.content?.parts?.[0]?.text || "Erro na resposta.";
    return res.status(200).json({ resposta: respostaTexto });
  } catch (error) {
    return res.status(500).json({ error: 'Erro de conexão' });
  }
}
