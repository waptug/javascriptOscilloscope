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

// Function to handle MIDI messages
function handleMIDIMessage(message) {
    let command = message.data[0];
    let note = message.data[1];
    let velocity = message.data.length > 2 ? message.data[2] : 0;

    // Display MIDI info
    let midiInfo = `Command: ${command}, Note: ${note}, Velocity: ${velocity}`;
    document.getElementById('midiData').innerText = midiInfo;  // Update this line



    if (command === 144) {
        if (velocity > 0) {
            let frequency = 440.0 * Math.pow(2, (note - 69) / 12.0);
            oscAndSound.oscillator.frequency.setValueAtTime(frequency, oscAndSound.audioCtx.currentTime);
            oscAndSound.gainNode.gain.setValueAtTime(1, oscAndSound.audioCtx.currentTime); // Turn the volume up
        
        // Map the velocity (0-127) to gain (0-1)
        let volume = velocity / 127.0;
        oscAndSound.gainNode.gain.setValueAtTime(volume, oscAndSound.audioCtx.currentTime);
        
        //oscAndSound.start();  // Start the oscillator
        
         // Update the volume slider and display value
         document.getElementById('volume').value = volume;
         document.getElementById('volumeValue').innerText = volume.toFixed(2);
         
         // Update the frequency slider and display value
         document.getElementById('frequency').value = frequency;
         document.getElementById('frequencyValue').innerText = frequency.toFixed(2);


        }
        
    }

    if (command === 128) {

            oscAndSound.gainNode.gain.setValueAtTime(0, oscAndSound.audioCtx.currentTime); // Turn the volume down to stop sound
        }
    




        // Map Command 176, Note 21 to volume control - Nobe 1
        if (command === 176 && note === 21) {
            // Map the velocity (0-127) to gain (0-1)
            let volume = velocity / 127.0;
            oscAndSound.gainNode.gain.setValueAtTime(volume, oscAndSound.audioCtx.currentTime);
            
            // Update the volume slider and display value
            document.getElementById('volume').value = volume;
            document.getElementById('volumeValue').innerText = volume.toFixed(2);
        }
        // Map Command 176, Note 22 to frequency control - Nobe 2
        if (command === 176 && note === 22) {
            // Map the velocity (0-127) to frequency (e.g., 100-20000 Hz)
            let frequency = 100 + ((20000 - 100) * velocity / 127.0);
            oscAndSound.oscillator.frequency.setValueAtTime(frequency, oscAndSound.audioCtx.currentTime);
            
            // Update the frequency slider and display value
            document.getElementById('frequency').value = frequency;
            document.getElementById('frequencyValue').innerText = frequency.toFixed(2);
        }

            // Map Command 176, Note 23 to wave type control
    if (command === 176 && note === 23) {
        let waveType;
        
        // Map the velocity (0-127) to wave types
        if (velocity < 32) {
            waveType = 'sine';
        } else if (velocity < 64) {
            waveType = 'square';
        } else if (velocity < 96) {
            waveType = 'sawtooth';
        } else {
            waveType = 'triangle';
        }

        oscAndSound.oscillator.type = waveType;

        // Update the wave type dropdown and display value
        document.getElementById('waveType').value = waveType;
    }
}


// Function to initialize MIDI
function initializeMIDI() {
    if (navigator.requestMIDIAccess) {
        navigator.requestMIDIAccess()
            .then(function (access) {
                let inputs = access.inputs.values();
                for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
                    input.value.onmidimessage = handleMIDIMessage;
                }
            })
            .catch(function () {
                console.warn("No access to MIDI devices.")
            });
    }
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
        ctx.strokeStyle = '#ffffff';
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

        this.ctx.fillStyle = "#000000";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

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
        this.drawGrid();
    }
}

// Initialize and handle button events
document.addEventListener('DOMContentLoaded', () => {
    const oscAndSound = new OscilloscopeAndSound();
    window.oscAndSound = oscAndSound;  // Make it globally accessible for MIDI handling
    initializeMIDI();

    document.getElementById('start').addEventListener('click', () => {
        oscAndSound.start();
    });

    document.getElementById('stop').addEventListener('click', () => {
        oscAndSound.stop();
    });
});
