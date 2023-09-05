// Function to handle MIDI messages
function handleMIDIMessage(message) {
    let command = message.data[0];
    let note = message.data[1];
    let velocity = (message.data.length > 2) ? message.data[2] : 0;

    // Display MIDI info
    let midiInfo = `Command: ${command}, Note: ${note}, Velocity: ${velocity}`;
    document.getElementById('midiData').innerText = midiInfo;
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

// Initialize MIDI when the document is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeMIDI();
});
