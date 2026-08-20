const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const userNameInput = document.getElementById('username');
const modeSelect = document.getElementById('jarvis-mode');
const chatLog = document.getElementById('chat-log');
const micBtn = document.getElementById('mic-btn');
const muteBtn = document.getElementById('mute-btn');

let isMuted = false;

// Controle do Botão Mute
muteBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    if (isMuted) {
        muteBtn.innerText = '🔇 Voz: DESLIGADA';
        muteBtn.classList.add('muted');
        window.speechSynthesis.cancel();
    } else {
        muteBtn.innerText = '🔊 Voz: LIGADA';
        muteBtn.classList.remove('muted');
    }
});

// Configuração do Reconhecimento de Voz (Microfone)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
        micBtn.style.backgroundColor = '#ff4444';
        micBtn.innerText = '🎙️...';
    };

    recognition.onend = () => {
        micBtn.style.backgroundColor = '';
        micBtn.innerText = '🎤';
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        userInput.value = transcript;
        chatForm.dispatchEvent(new Event('submit'));
    };

    recognition.onerror = (event) => {
        console.error('Erro no reconhecimento de voz:', event.error);
        micBtn.style.backgroundColor = '';
        micBtn.innerText = '🎤';
    };

    micBtn.addEventListener('click', () => {
        recognition.start();
    });
} else {
    micBtn.style.display = 'none';
}

// Envio de mensagens
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = userInput.value.trim();
    const userName = userNameInput.value.trim() || 'Senhor(a)';
    const mode = modeSelect.value;
    
    if (!message) return;

    appendMessage(userName, message);
    userInput.value = '';

    try {
        const response = await fetch('/api/chatjs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, userName, mode })
        });

        if (!response.ok) {
            throw new Error(`Status ${response.status}`);
        }

        const data = await response.json();
        
        if (data.reply) {
            appendMessage('J.A.R.V.I.S.', data.reply);
            speak(data.reply);
        } else {
            const errorMsg = 'Não posso responder agora. Reinicie o site';
            appendMessage('J.A.R.V.I.S.', errorMsg);
            speak(errorMsg);
        }
    } catch (error) {
        console.error('Erro:', error);
        const errorMsg = 'Não posso responder agora. Reinicie o site';
        appendMessage('J.A.R.V.I.S.', errorMsg);
        speak(errorMsg);
    }
});

function appendMessage(sender, text) {
    const msgDiv = document.createElement('div');
    let cleanText = text.replace(/[*#]/g, '');
    const paragraphs = cleanText.split('\n').filter(p => p.trim() !== '');
    const formattedText = paragraphs.map(p => `<p>${p.trim()}</p>`).join('');

    msgDiv.innerHTML = `<strong>${sender}:</strong>${formattedText}`;
    chatLog.appendChild(msgDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
}

// Leitura por Voz com suporte ao Mute
function speak(text) {
    if (isMuted) return;

    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const cleanSpeechText = text.replace(/[*#]/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
        utterance.lang = 'pt-BR';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    }
}
