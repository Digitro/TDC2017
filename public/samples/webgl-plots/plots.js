const runAudioContext = function (mediaStream) {
    const bufferLength = 1024;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioSource = audioContext.createMediaStreamSource(mediaStream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = bufferLength;
    audioSource.connect(analyser);
    analyser.connect(audioContext.destination);

    const timeDomainData = new Uint8Array(bufferLength);
    const frequencyData = new Uint8Array(bufferLength);

    const timeDomainVisualizer = new TimePlotGL(document.querySelector('#time-domain-plot'), bufferLength);
    const frequencyVisualizer = new SpectrumPlotGL(document.querySelector('#freq-domain-plot'), bufferLength/2);
    const waterfallVisualizer = new WaterfallPlotGL(document.querySelector('#waterfall-plot'), bufferLength/2, 256);


    const draw = function () {
        analyser.getByteTimeDomainData(timeDomainData);
        analyser.getByteFrequencyData(frequencyData);

        timeDomainVisualizer.draw(timeDomainData);
        frequencyVisualizer.draw(frequencyData.slice(0, bufferLength/2));
        waterfallVisualizer.draw(frequencyData.slice(0, bufferLength/2));
        requestAnimationFrame(draw);
    }

    draw();
}

const startApp = function () {
    navigator.mediaDevices.getUserMedia({audio: true, video: false})
        .then(mediaStream => runAudioContext(mediaStream))
        .catch(err => console.error(err));
};

startApp();
