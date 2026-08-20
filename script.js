const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const userNameInput = document.getElementById('username');
const modeSelect = document.getElementById('jarvis-mode');
const chatLog = document.getElementById('chat-log');
const micBtn = document.getElementById('mic-btn');
const muteBtn = document.getElementById('mute-btn');
const spikeBtn = document.getElementById('spike-btn');

let isMuted = false;
const chatHistory = [];

// Variáveis para conexão Web Serial com o SPIKE
let serialPort = null;
let serialWriter = null;

// Conexão com o LEGO SPIKE Prime via Web Serial / Bluetooth
spikeBtn.addEventListener('click', async () => {
    if (!("serial" in navigator)) {
        alert("Seu navegador não suporta Web Serial API. Use o Google Chrome ou Microsoft Edge.");
        return;
    }

    try {
        if (!serialPort) {
            // Solicita permissão para conectar à porta COM do SPIKE
            serialPort = await navigator.serial.requestPort();
            await serialPort.open({ baudRate: 115200 });

            const textEncoder = new TextEncoderStream();
            const writableStreamClosed = textEncoder.readable.pipeTo(serialPort.writable);
            serialWriter = textEncoder.writable.getWriter();

            spikeBtn.innerText = '🤖 SPIKE: CONECTADO';
            spikeBtn.classList.add('connected');
            appendMessage('J.A.R.V.I.S.', 'Sistemas robóticos online. Hub LEGO SPIKE pareado com sucesso.');
        } else {
            // Desconecta se já estiver conectado
            if (serialWriter) await serialWriter.close();
            await serialPort.close();
            serialPort = null;
            serialWriter = null;

            spikeBtn.innerText = '🤖 SPIKE: DESCONECTADO';
            spikeBtn.classList.remove('connected');
            appendMessage('J.A.R.V.I.S.', 'Conexão com o Hub SPIKE encerrada.');
        }
    } catch (error) {
        console.error('Erro de Conexão SPIKE:', error);
        spikeBtn.innerText = '🤖 SPIKE: DESCONECTADO';
        spikeBtn.classList.remove('connected');
    }
});

// Envia comandos de texto para o SPIKE
async function sendSpikeCommand(command) {
    if (serialWriter) {
        try {
            await serialWriter.write(command + '\r\n');
            console.log('Comando enviado para o SPIKE:', command);
        } catch (err) {
            console.error('Erro ao enviar dados para o SPIKE:', err);
        }
    }
}

// Analisa a resposta da IA para acionar os motores/LEDs do SPIKE
function interpretRobotCommands(text) {
    if (!serialWriter) return;

    const lowerText = text.toLowerCase();

    if (lowerText.includes('frente') || lowerText.includes('avançar') || lowerText.includes('andar')) {
        sendSpikeCommand('FRENTE');
    } else if (lowerText.includes('trás') || lowerText.includes('recuar') || lowerText.includes('ré')) {
        sendSpikeCommand('TRAS');
    } else if (lowerText.includes('direita')) {
        sendSpikeCommand('DIREITA');
    } else if (lowerText.includes('esquerda')) {
        sendSpikeCommand('ESQUERDA');
    } else if (lowerText.includes('parar') || lowerText.includes('pare') || lowerText.includes('desligar')) {
        sendSpikeCommand('PARAR');
    } else if (lowerText.includes('feliz') || lowerText.includes('sorrir') || lowerText.includes('olá')) {
        sendSpikeCommand('FELIZ');
    }
}

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

// Reconhecimento de Voz
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
            body: JSON.stringify({ 
                message, 
                userName, 
                mode,
                history: chatHistory 
            })
        });

        if (!response.ok) throw new Error(`Status ${response.status}`);

        const data = await response.json();
        
        if (data.reply) {
            appendMessage('J.A.R.V.I.S.', data.reply);
            
            chatHistory.push({ sender: 'user', text: message });
            chatHistory.push({ sender: 'model', text: data.reply });

            // Envia o comando para o robô se estiver conectado
            interpretRobotCommands(data.reply);

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
