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

    start() {
        this.oscillator.start();
        this.draw();

        // Add event listeners for controls
        document.getElementById('frequency').addEventListener('input', (e) => {
            this.oscillator.frequency.setValueAtTime(e.target.value, this.audioCtx.currentTime);
        });

        document.getElementById('volume').addEventListener('input', (e) => {
            this.gainNode.gain.setValueAtTime(e.target.value, this.audioCtx.currentTime);
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
    }
}

// Initialize and handle button events
document.addEventListener('DOMContentLoaded', () => {
    const oscAndSound = new OscilloscopeAndSound();

    document.getElementById('start').addEventListener('click', () => {
        oscAndSound.start();
    });

    document.getElementById('stop').addEventListener('click', () => {
        oscAndSound.stop();
    });
});
