/**
 * Midi Synth Scope
 * By Michael Scott McGinn
 * Version: 2.1
 * Date: September 8th, 2023
 * Github : https://github.com/waptug/javascriptOscilloscope
 */

// Constants
const NOTE_ON = 144;
const NOTE_OFF = 128;
const CONTROL_CHANGE = 176;

// Global Variables
let activeOscillators = {};

/**
 * Prevents default event and adjusts slider value.
 */
function handleMouseWheelEvent(event) {
    event.preventDefault();
    adjustSliderValue(event.target, event.deltaY);
}

/**
 * Adjusts the slider value based on mouse wheel movement.
 */
function adjustSliderValue(inputElement, deltaY) {
    let newValue = parseFloat(inputElement.value);
    const step = parseFloat(inputElement.step);
    const min = parseFloat(inputElement.min);
    const max = parseFloat(inputElement.max);

    newValue += (deltaY < 0) ? step : -step;
    newValue = clampValue(newValue, min, max);

    updateInputElement(inputElement, newValue);
}

/**
 * Clamps the given value between min and max.
 */
function clampValue(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Updates the input element value and dispatches an input event.
 */
function updateInputElement(element, value) {
    element.value = value;
    element.dispatchEvent(new Event('input'));
}

/**
 * Converts a MIDI note number to its note name.
 */
function midiNoteToName(note) {
    const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    return `${noteNames[note % 12]}${Math.floor(note / 12)}`;
}

/**
 * Updates the display with the current MIDI command, note, and velocity.
 */
function updateMidiInfo(command, note, velocity) {
    const midiInfo = `Command: ${command}, Note: ${note}, Velocity: ${velocity}`;
    document.getElementById('midiData').innerText = midiInfo;
}

/**
 * Logs the given message to a designated data box.
 */
function logMidiData(message) {
    document.getElementById('midiDataBox').innerHTML += `${message}<br>`;
    document.getElementById('midiDataBox').scrollTop = document.getElementById('midiDataBox').scrollHeight;
}

/**
 * Main handler for incoming MIDI messages.
 */
function handleMIDIMessage(message) {
    const command = message.data[0];
    const note = message.data[1];
    const velocity = message.data.length > 2 ? message.data[2] : 0;

    updateMidiInfo(command, note, velocity);

    switch (command) {
        case NOTE_ON:
            if (velocity > 0) handleNoteOn(note, velocity);
            break;
        case NOTE_OFF:
        case NOTE_ON:
            if (velocity === 0) handleNoteOff(note);
            break;
        case CONTROL_CHANGE:
            handleControlChange(note, velocity);
            break;
    }
}

/**
 * Handles a Note On MIDI message.
 */
function handleNoteOn(note, velocity) {
    const frequency = calculateFrequency(note);
    const gainValue = calculateGain(velocity);
    const noteName = midiNoteToName(note);

    const newOscillator = new OscilloscopeAndSound(frequency, gainValue);
    newOscillator.start();
    activeOscillators[note] = newOscillator;

    logMidiData(`Note On: ${noteName}, Frequency: ${frequency.toFixed(2)}`);
}

/**
 * Calculates the frequency for a given note.
 */
function calculateFrequency(note) {
    return 440.0 * Math.pow(2, (note - 69) / 12.0);
}

/**
 * Calculates the gain value based on MIDI velocity.
 */
function calculateGain(velocity) {
    return velocity / 127.0;
}

/**
 * Handles a Note Off MIDI message.
 */
function handleNoteOff(note) {
    const noteName = midiNoteToName(note);
    if (activeOscillators[note]) {
        activeOscillators[note].stop();
        delete activeOscillators[note];
    }
    logMidiData(`Note Off: ${noteName}`);
}

/**
 * Handles a Control Change MIDI message.
 */
function handleControlChange(note, velocity) {
    // Existing code for handling control changes...
}

/**
 * Initializes MIDI access and message handling.
 */
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

/**
 * Class representing an Oscilloscope and Sound Generator.
 */
class OscilloscopeAndSound {
    /**
     * Constructs an Oscilloscope and Sound Generator object.
     */
    constructor(frequency = 440, gainValue = 0.5) {
        this.initializeAudio(frequency, gainValue);
        this.initializeCanvas();
        this.initializeAnalyser();
    }

    /**
     * Initializes the audio components.
     */
    initializeAudio(frequency, gainValue) {
        this.audioCtx = new AudioContext();
        this.oscillator = this.audioCtx.createOscillator();
        this.gainNode = this.audioCtx.createGain();

        this.oscillator.type = 'sine';
        this.oscillator.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
        this.gainNode.gain.setValueAtTime(gainValue, this.audioCtx.currentTime);
    }

    /**
     * Initializes the canvas for the oscilloscope.
     */
    initializeCanvas() {
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    /**
     * Initializes the audio analyser and time data array.
     */
    initializeAnalyser() {
        this.timeData = new Float32Array(1024);
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.getFloatTimeDomainData(this.timeData);

        this.oscillator.connect(this.gainNode);
        this.gainNode.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);
    }

    /**
     * Starts the oscillator and drawing functions.
     */
    start() {
        this.oscillator.start();
        this.draw();
    }

    /**
     * Stops the oscillator.
     */
    stop() {
        this.oscillator.stop();
    }

    /**
     * Main drawing loop for the oscilloscope.
     */
    draw() {
        requestAnimationFrame(() => this.draw());
        this.clearCanvas();
        this.drawWave();
        this.drawGrid();
    }

    /**
     * Clears the canvas.
     */
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "#000000";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Draws the wave on the oscilloscope.
     */
    drawWave() {
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
    }

    /**
     * Draws the grid on the oscilloscope.
     */
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
}

/**
 * Main entry point.
 */
document.addEventListener('DOMContentLoaded', () => {
    initializeMIDI();
    document.getElementById('midiDataBox').innerHTML = "";
});

