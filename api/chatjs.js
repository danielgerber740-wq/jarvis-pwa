module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { historico } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Chave de API não configurada na Vercel.' });
  }

  if (!historico || !Array.isArray(historico)) {
    return res.status(400).json({ error: 'Formato de histórico inválido.' });
  }

  // Configura cabeçalhos HTTP para Streaming (SSE)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');

  try {
    // Usamos o endpoint 'streamGenerateContent' e ativamos o parametro alt=sse
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:streamGenerateContent?key=${apiKey}&alt=sse`,
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
              4. Mantenha o tom calmo, levemente sofisticado, extremamente prestativo e com respostas diretas e curtas (máximo 2 frases) para minimizar latência de áudio.`
            }]
          },
          contents: historico
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      res.write(`data: ${JSON.stringify({ error: errorData.error?.message || 'Erro na requisição' })}\n\n`);
      return res.end();
    }

    // Processa a stream recebida e repassa diretamente para o front-end
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      res.write(chunk);
    }

    res.end();
  } catch (error) {
    console.error('Erro interno:', error);
    res.write(`data: ${JSON.stringify({ error: 'Erro de conexão no servidor' })}\n\n`);
    res.end();
  }
};
