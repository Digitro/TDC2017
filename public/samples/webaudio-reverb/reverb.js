const startAudioContext = function (mediaStream) {
    const bufferLength = 4096;
    const numberOfChannels = 1;

    // criando novo contexto da webaudio
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioSource = audioContext.createMediaStreamSource(mediaStream); // criando fonte
    const gain = audioContext.createGain();
    const scriptNode = audioContext.createScriptProcessor(bufferLength, 1, 1);
    audioSource.connect(gain);
    gain.connect(scriptNode);
    scriptNode.connect(audioContext.destination);

    const coefSlider = document.querySelector('.coef-slider');
    coefSlider.addEventListener('change', () => {
        document.querySelector('.coef-label').innerHTML = coefSlider.value;
    });

    const gainSlider = document.querySelector('.gain-slider');
    gainSlider.addEventListener('change', () => {
        document.querySelector('.gain-label').innerHTML = gainSlider.value;
        gain.gain.value = gainSlider.value;
    });


    const delayBuffer = [];
    for (let channel = 0; channel < numberOfChannels; channel++){
         delayBuffer.push(new Float32Array(bufferLength));
    }

    scriptNode.onaudioprocess = function(audioProcessingEvent) {
        const inputBuffer = audioProcessingEvent.inputBuffer;
        const outputBuffer = audioProcessingEvent.outputBuffer;
        for (let channel = 0; channel < numberOfChannels; channel++) {
            const inputData = inputBuffer.getChannelData(channel);
            const outputData = outputBuffer.getChannelData(channel);
            const delayData = delayBuffer[channel];
            for (let sample = 0; sample < inputBuffer.length; sample++) {
                outputData[sample] = (1.0 - coefSlider.value) * inputData[sample] + coefSlider.value * delayData[sample];
                delayData[sample] = outputData[sample];
            }
        }
    }
}

const startApp = function () {
    navigator.mediaDevices.getUserMedia({audio: true, video: false})
        .then(mediaStream => startAudioContext(mediaStream))
        .catch(err => console.error(err));
};

startApp();
