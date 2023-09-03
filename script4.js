// Function to handle mouse wheel event on sliders
function handleMouseWheelEvent(event) {
    event.preventDefault();
    const inputElement = event.target;
    let newValue = parseFloat(inputElement.value);

    if (event.deltaY < 0) {
        newValue += parseFloat(inputElement.step);
    } else {
        newValue -= parseFloat(inputElement.step);
    }

    newValue = Math.min(Math.max(newValue, parseFloat(inputElement.min)), parseFloat(inputElement.max));
    inputElement.value = newValue;
    inputElement.dispatchEvent(new Event('input'));
}

// Oscilloscope and Sound Generator Class
class OscilloscopeAndSound {
    constructor(frequency = 440) {
        this.audioCtx = new AudioContext();
        this.oscillator = this.audioCtx.createOscillator();
        this.oscillator.type = 'sine';
        this.oscillator.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
        this.gainNode = this.audioCtx.createGain();
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.timeData = new Float32Array(1024);
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.getFloatTimeDomainData(this.timeData);
        this.oscillator.connect(this.gainNode);
        this.gainNode.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);
    }

    drawGrid() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const stepX = canvas.width / 10;
        const stepY = canvas.height / 10;
        ctx.strokeStyle = '#ffffff';  // Grid lines are white
        ctx.font = "14px Arial";
        
        for (let x = 0, i = 0; x <= canvas.width; x += stepX, i++) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.fillText(i, x + 5, 10);
        }

        for (let y = 0, j = 10; y <= canvas.height; y += stepY, j--) {
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.fillText(j, 5, y + 15);
        }

        ctx.stroke();
    }

    start() {
        this.oscillator.start();
        this.draw();

        document.getElementById('frequency').addEventListener('input', (e) => {
            this.oscillator.frequency.setValueAtTime(e.target.value, this.audioCtx.currentTime);
            document.getElementById('frequencyValue').innerText = e.target.value;
        });

        document.getElementById('volume').addEventListener('input', (e) => {
            this.gainNode.gain.setValueAtTime(e.target.value, this.audioCtx.currentTime);
            document.getElementById('volumeValue').innerText = e.target.value;
        });

        document.getElementById('waveType').addEventListener('change', (e) => {
            this.oscillator.type = e.target.value;
        });
    }

    stop() {
        this.oscillator.stop();
    }

    draw() {
        requestAnimationFrame(() => this.draw());
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Set canvas background to black
        this.ctx.fillStyle = "#000000";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Set waveform color to green
        this.ctx.strokeStyle = "#00ff00";
        this.ctx.beginPath();

        this.analyser.getFloatTimeDomainData(this.timeData);
        for (let i = 0; i < this.timeData.length; i++) {
            const x = i;
            const y = (0.5 + this.timeData[i] / 2) * this.canvas.height;

            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }

        this.ctx.stroke();
        this.drawGrid();  // Draw grid lines on top of the waveform
    }
}

// Initialize and handle button events
document.addEventListener('DOMContentLoaded', () => {
    const oscAndSound = new OscilloscopeAndSound();

    // Add mouse wheel event listeners for sliders
    document.getElementById('frequency').addEventListener('wheel', handleMouseWheelEvent);
    document.getElementById('volume').addEventListener('wheel', handleMouseWheelEvent);

    document.getElementById('start').addEventListener('click', () => {
        oscAndSound.start();
    });

    document.getElementById('stop').addEventListener('click', () => {
        oscAndSound.stop();
    });
});
