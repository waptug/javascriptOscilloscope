// Function to handle mouse wheel event on sliders
function handleMouseWheelEvent(event) {
    // Prevent default scrolling behavior
    event.preventDefault();

    const inputElement = event.target;
    let newValue = parseFloat(inputElement.value);

    // Update the value based on the wheel delta
    if (event.deltaY < 0) {
        newValue += parseFloat(inputElement.step);
    } else {
        newValue -= parseFloat(inputElement.step);
    }

    // Clamp the value within the min and max range
    newValue = Math.min(Math.max(newValue, parseFloat(inputElement.min)), parseFloat(inputElement.max));

    // Set the new value
    inputElement.value = newValue;

    // Trigger an input event to update the OscilloscopeAndSound class
    inputElement.dispatchEvent(new Event('input'));
}

// Oscilloscope and Sound Generator Class
class OscilloscopeAndSound {
    constructor(frequency = 440) {
        // Initialize AudioContext and Oscillator
        this.audioCtx = new AudioContext();
        this.oscillator = this.audioCtx.createOscillator();
        this.oscillator.type = 'sine';
        this.oscillator.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);

        // Initialize Gain Node for volume control
        this.gainNode = this.audioCtx.createGain();

        // Initialize Canvas
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.timeData = new Float32Array(1024);
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.getFloatTimeDomainData(this.timeData);

        // Connect nodes
        this.oscillator.connect(this.gainNode);
        this.gainNode.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);
    }

    // Draw the grid lines on the canvas
    drawGrid() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const stepX = canvas.width / 10;
        const stepY = canvas.height / 10;
        ctx.strokeStyle = '#ccc';
        ctx.font = "14px Arial";

        // Draw vertical lines
        for (let x = 0, i = 0; x <= canvas.width; x += stepX, i++) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.fillText(i, x + 5, 10);
        }

        // Draw horizontal lines
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

        // Update slider value displays
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

        // Get time data from the analyser and draw it to the canvas
        this.analyser.getFloatTimeDomainData(this.timeData);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.beginPath();

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

        // Draw the grid lines
        this.drawGrid();
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
