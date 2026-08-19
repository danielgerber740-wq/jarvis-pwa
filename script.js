let historico = [];

document.getElementById('chat-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const input = document.getElementById('user-input');
  const mensagem = input.value.trim();

  if (!mensagem) return;

  input.value = '';
  await enviarMensagem(mensagem);
});

async function enviarMensagem(mensagemUsuario) {
  adicionarMensagemNaTela('usuario', mensagemUsuario);
  historico.push({ role: 'user', parts: [{ text: mensagemUsuario }] });

  const elementoJarvis = criarElementoMensagem('jarvis');
  let textoAcumulado = '';

  try {
    const response = await fetch('/api/chatjs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ historico })
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const linhas = chunk.split('\n');

      for (const linha of linhas) {
        if (linha.startsWith('data: ')) {
          try {
            const jsonStr = linha.replace('data: ', '').trim();
            if (!jsonStr) continue;

            const parsed = JSON.parse(jsonStr);

            if (parsed.error) {
              atualizarTextoMensagem(elementoJarvis, `Erro: ${parsed.error}`);
              return;
            }

            const pedacoTexto = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (pedacoTexto) {
              textoAcumulado += pedacoTexto;
              atualizarTextoMensagem(elementoJarvis, textoAcumulado);
            }
          } catch (e) {
            // Ignora fragmentos parciais no buffer
          }
        }
      }
    }

    if (textoAcumulado) {
      historico.push({ role: 'model', parts: [{ text: textoAcumulado }] });
      falarTexto(textoAcumulado);
    }

  } catch (erro) {
    console.error('Erro na comunicação:', erro);
    atualizarTextoMensagem(elementoJarvis, 'Não foi possível se comunicar com o servidor.');
  }
}

function adicionarMensagemNaTela(autor, texto) {
  const container = document.getElementById('chat-container');
  const div = document.createElement('div');
  div.className = `mensagem ${autor}`;
  div.innerText = `${autor === 'usuario' ? 'Gerber' : 'JARVIS'}: ${texto}`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function criarElementoMensagem(autor) {
  const container = document.getElementById('chat-container');
  const div = document.createElement('div');
  div.className = `mensagem ${autor}`;
  div.innerText = 'JARVIS: ...';
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return div;
}

function atualizarTextoMensagem(elemento, texto) {
  elemento.innerText = `JARVIS: ${texto}`;
  const container = document.getElementById('chat-container');
  container.scrollTop = container.scrollHeight;
}

function falarTexto(texto) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(texto);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}
