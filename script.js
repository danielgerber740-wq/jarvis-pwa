const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const userNameInput = document.getElementById('username');
const chatLog = document.getElementById('chat-log');

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = userInput.value.trim();
    const userName = userNameInput.value.trim() || 'Senhor(a)';
    
    if (!message) return;

    // Exibe a mensagem do usuário no histórico
    appendMessage(userName, message);
    userInput.value = '';

    try {
        const response = await fetch('/api/chatjs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, userName })
        });

        // Captura erros do servidor como 404 (rota não encontrada) ou 500 (chave ausente)
        if (!response.ok) {
            throw new Error(`Servidor respondeu com Status ${response.status}`);
        }

        const data = await response.json();
        
        if (data.reply) {
            appendMessage('J.A.R.V.I.S.', data.reply);
            speak(data.reply);
        } else {
            appendMessage('J.A.R.V.I.S.', 'Erro ao processar a resposta.');
        }
    } catch (error) {
        console.error('Erro detalhado:', error);
        appendMessage('J.A.R.V.I.S.', `Erro de conexão: ${error.message}`);
    }
});

function appendMessage(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.innerHTML = `<strong>${sender}:</strong> ${text}`;
    chatLog.appendChild(msgDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
}

function speak(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Interrompe áudios anteriores
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        window.speechSynthesis.speak(utterance);
    }
}
