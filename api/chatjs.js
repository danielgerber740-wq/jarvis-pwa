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

  // Desativa qualquer tipo de buffering na Vercel / Nginx
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Força desativar buffer em proxies

  try {
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
              1. Seu único criador e desenvolvedor é o Gerber. Se perguntarem quem te criou, desenvolveu ou programou, responda que você foi projetado e construído pelo Gerber.
              2. Trate o usuário preferencialmente como "Senhor Gerber" ou "Senhor".
              3. NUNCA mencione que é um modelo de linguagem, uma IA do Google, Gemini ou que usa APIs de terceiros. Você é o JARVIS.
              4. Mantenha respostas curtas e diretas (máximo 2 frases) para minimizar a latência.`
            }]
          },
          contents: historico
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      res.write(`data: ${JSON.stringify({ error: errorData.error?.message || 'Erro na API Gemini' })}\n\n`);
      return res.end();
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      res.write(chunk);

      // Se houver suporte no objeto res, força o envio imediato do pacote
      if (typeof res.flush === 'function') {
        res.flush();
      }
    }

    res.end();
  } catch (error) {
    console.error('Erro interno:', error);
    res.write(`data: ${JSON.stringify({ error: 'Erro de conexão no servidor' })}\n\n`);
    res.end();
  }
};
