const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const userNameInput = document.getElementById('username');
const chatLog = document.getElementById('chat-log');

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = userInput.value.trim();
    const userName = userNameInput.value.trim() || 'Senhor(a)';
    
    if (!message) return;

    appendMessage(userName, message);
    userInput.value = '';

    try {
        const response = await fetch('/api/chatjs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, userName })
        });

        if (!response.ok) {
            throw new Error(`Status ${response.status}`);
        }

        const data = await response.json();
        
        if (data.reply) {
            appendMessage('J.A.R.V.I.S.', data.reply);
            speak(data.reply);
        } else {
            appendMessage('J.A.R.V.I.S.', 'Não posso responder agora. Reinicie o site');
        }
    } catch (error) {
        console.error('Erro:', error);
        appendMessage('J.A.R.V.I.S.', 'Não posso responder agora. Reinicie o site');
    }
});

function appendMessage(sender, text) {
    const msgDiv = document.createElement('div');
    
    // Remove marcadores e cria elementos de parágrafo (<p>)
    let cleanText = text.replace(/[*#]/g, '');
    const paragraphs = cleanText.split('\n').filter(p => p.trim() !== '');
    const formattedText = paragraphs.map(p => `<p>${p.trim()}</p>`).join('');

    msgDiv.innerHTML = `<strong>${sender}:</strong>${formattedText}`;
    chatLog.appendChild(msgDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
}

function speak(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        // Remove caracteres especiais antes de reproduzir a voz
        const cleanSpeechText = text.replace(/[*#]/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
        utterance.lang = 'pt-BR';
        window.speechSynthesis.speak(utterance);
    }
}
