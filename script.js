let audioContext;
let analyser;
let dataArray;
let canvas;
let canvasCtx;
let permissionRequested = false;

const startButton = document.getElementById('startButton');
const messageArea = document.getElementById('messageArea');
const visualizer = document.getElementById('visualizer');

startButton.addEventListener('click', startVisualization);
visualizer.addEventListener('touchstart', handleTouch, false);

function showMessage(message, isError = false) {
    messageArea.textContent = message;
    messageArea.className = isError ? 'error' : 'success';
}

function startVisualization() {
    if (audioContext) {
        showMessage('Visualization is already running.');
        return;
    }

    if (permissionRequested) {
        showMessage('Permiso ya solicitado. Por favor, habilita el micrófono manualmente en la configuración del navegador.', true);
        showInstructions();
        return;
    }

    showMessage('Requesting microphone access...');
    permissionRequested = true;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
            .then(stream => {
                showMessage('Microphone access granted. Starting visualization...', false);
                setupAudioContext(stream);
            })
            .catch(handleError);
    } else {
        handleError(new Error('getUserMedia is not supported in this browser'));
    }
}

function setupAudioContext(stream) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256; // Reduced for better performance on mobile

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    canvas = document.getElementById('visualizer');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 0.6;
    canvasCtx = canvas.getContext('2d');

    dataArray = new Uint8Array(analyser.frequencyBinCount);
    draw();
}

function handleError(err) {
    console.error('Error accessing microphone:', err);
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        showMessage('Permiso denegado. Por favor, habilita el micrófono manualmente en la configuración del navegador.', true);
        showInstructions();
    } else {
        showMessage(`Error: ${err.message}. Please ensure you've granted microphone permissions.`, true);
    }
}

function showInstructions() {
    const instructions = document.createElement('div');
    instructions.innerHTML = `
        <h2>Cómo habilitar el micrófono:</h2>
        <ol>
            <li>Haz clic en el icono del candado en la barra de direcciones.</li>
            <li>Busca la opción "Micrófono" y cámbiala a "Permitir".</li>
            <li>Recarga la página y vuelve a intentarlo.</li>
        </ol>
    `;
    messageArea.appendChild(instructions);
}

function draw() {
    requestAnimationFrame(draw);

    analyser.getByteFrequencyData(dataArray);

    canvasCtx.fillStyle = 'rgb(0, 0, 0)';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / dataArray.length) * 2.5;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;

        const hue = i / dataArray.length * 360;
        canvasCtx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
    }
}

function handleTouch(event) {
    event.preventDefault();
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

window.addEventListener('resize', () => {
    if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight * 0.6;
    }
});

// Prevent scrolling when touching the canvas
document.body.addEventListener("touchstart", function (e) {
    if (e.target == canvas) {
        e.preventDefault();
    }
}, { passive: false });
document.body.addEventListener("touchend", function (e) {
    if (e.target == canvas) {
        e.preventDefault();
    }
}, { passive: false });
document.body.addEventListener("touchmove", function (e) {
    if (e.target == canvas) {
        e.preventDefault();
    }
}, { passive: false });
