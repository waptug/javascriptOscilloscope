/**
 * Midi Synth Scope
 * By Michael Scott McGinn
 * Version: 1
 * Date: September 8th, 2023
 */


// Maintain a list of active oscillators
let activeOscillators = {};

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

// Function to convert MIDI note to note name
function midiNoteToName(note) {
    const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    return noteNames[note % 12] + Math.floor(note / 12);
  }

// Function to handle MIDI messages
function handleMIDIMessage(message) {
    let command = message.data[0];
    let note = message.data[1];
    let velocity = message.data.length > 2 ? message.data[2] : 0;

    // Display MIDI info
    let midiInfo = `Command: ${command}, Note: ${note}, Velocity: ${velocity}`;
    document.getElementById('midiData').innerText = midiInfo;
    
    // Catch a key pressed
    if (command === 144 && velocity > 0) {  //Note On
        let frequency = 440.0 * Math.pow(2, (note - 69) / 12.0);
        let gainValue = velocity / 127.0; // Normalize the velocity to a 0-1 range for gain
        let noteName = midiNoteToName(note);
        let newOscillator = new OscilloscopeAndSound(frequency, gainValue);
        newOscillator.start();
        activeOscillators[note] = newOscillator;
        

        // Update the Note History
        document.getElementById('midiDataBox').innerHTML += `Note On: ${noteName}, Frequency: ${frequency.toFixed(2)}<br>`;
        document.getElementById('midiDataBox').scrollTop = document.getElementById('midiDataBox').scrollHeight;
        }

    if (command === 128 || (command === 144 && velocity === 0)) { // Note Off
        let noteName = midiNoteToName(note);
        if (activeOscillators[note]) {
            activeOscillators[note].stop();
            delete activeOscillators[note];
        }

          // Update the new div for Note Off
          document.getElementById('midiDataBox').innerHTML += `Note Off: ${noteName}<br>`;
          document.getElementById('midiDataBox').scrollTop = document.getElementById('midiDataBox').scrollHeight;
    }
       
    if (command === 128 || (command === 144 && velocity === 0)) {
        if (activeOscillators[note]) {
            activeOscillators[note].stop();
            delete activeOscillators[note];
        }
    }

    // Handle knobs and sliders here
    if (command === 176) {
        for (const activeNote in activeOscillators) {
            let activeOsc = activeOscillators[activeNote];
            if (note === 21) {
                // Handle volume knob
                let volume = velocity / 127.0;
                activeOsc.gainNode.gain.setValueAtTime(volume, activeOsc.audioCtx.currentTime);
                document.getElementById('volume').value = volume;
                document.getElementById('volumeValue').innerText = volume.toFixed(2);
            } else if (note === 22) {
                // Handle frequency knob
                let frequency = 100 + ((20000 - 100) * velocity / 127.0);
                activeOsc.oscillator.frequency.setValueAtTime(frequency, activeOsc.audioCtx.currentTime);
                document.getElementById('frequency').value = frequency;
                document.getElementById('frequencyValue').innerText = frequency.toFixed(2);
            }
            else if (note === 23) {
                // Handle wave selector knob
                let waveType;
                if (velocity < 32) {
                    waveType = 'sine';
                } else if (velocity < 64) {
                    waveType = 'square';
                } else if (velocity < 96) {
                    waveType = 'sawtooth';
                } else {
                    waveType = 'triangle';
                }
                activeOsc.oscillator.type = waveType;
                document.getElementById('waveType').value = waveType;
            }
        }
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
                console.warn("No access to MIDI devices.");
            });
    }
}

// Oscilloscope and Sound Generator Class
class OscilloscopeAndSound {
    constructor(frequency = 440, gainValue = 0.5) {
        this.audioCtx = new AudioContext();
        this.oscillator = this.audioCtx.createOscillator();
        this.oscillator.type = 'sine';
        this.oscillator.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
        this.gainNode = this.audioCtx.createGain();

        this.gainNode.gain.setValueAtTime(gainValue, this.audioCtx.currentTime); // Set initial gain
        

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
        // code for drawing grid
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
    }

    stop() {
        this.oscillator.stop();
    }

    draw() {
        // Existing code for drawing wave
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
    initializeMIDI();
    // (Any other DOMContentLoaded code you have can go here)
    // Add this line to clear the new div on page load
    document.getElementById('midiDataBox').innerHTML = "";
});
