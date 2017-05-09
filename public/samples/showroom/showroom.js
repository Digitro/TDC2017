const VIDEO_CONTAINER = '.view';
const peers = new Map();
const peerConfig = null;
/*const peerConfig = {'iceServers':[{'urls':'stun:23.21.150.121'},
    {'urls': 'stun:stun.l.google.com:19302'}]};*/

const assignMediaStreamObject = function (mediaStream) {
    const video = document.querySelector('video');
    video.srcObject = mediaStream;
    video.muted = true;
    video.onloadedmetadata = () => video.play();
};

const createAudioContext = function (peerId, mediaStream) {
    const bufferLength = 256;

    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioSource = audioContext.createMediaStreamSource(mediaStream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = bufferLength;
    audioSource.connect(analyser);
    analyser.connect(audioContext.destination);

    const timeDomainData = new Uint8Array(bufferLength);
    const frequencyData = new Uint8Array(bufferLength);

    const timeDomainVisualizer = new TimePlotGL(document.querySelector('#time-domain-' + peerId), bufferLength);
    const frequencyVisualizer = new SpectrumPlotGL(document.querySelector('#freq-domain-' + peerId), bufferLength/2);
    const waterfallVisualizer = new WaterfallPlotGL(document.querySelector('#waterfall-' + peerId), bufferLength/2, 128);

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

const closePeerConnection = function (peerId) {
    removeRemotePeerContainer(peerId);
};

const addRemotePeerContainer = function (peerId, mediaStream) {
    const view = document.querySelector(VIDEO_CONTAINER);
    const oldPeerContainer = document.getElementById(peerId);
    if (oldPeerContainer) removeRemotePeerContainer(peerId);

    const peerContainer = document.createElement('div');
    peerContainer.id = peerId;
    peerContainer.className = "container";

    const peerVideo = document.createElement('video');
    peerVideo.id = "video-" + peerId;
    peerVideo.srcObject = mediaStream;
    peerVideo.onloadedmetadata = () => peerVideo.play();
    peerVideo.width = "320";
    peerVideo.height = "240";

    const peerTimeDomain = document.createElement('canvas');
    peerTimeDomain.id = "time-domain-" + peerId;
    peerTimeDomain.width = "320";
    peerTimeDomain.height = "130";

    const peerFreqDomain = document.createElement('canvas');
    peerFreqDomain.id = "freq-domain-" + peerId;
    peerFreqDomain.width = "320";
    peerFreqDomain.height = "130";

    const peerWaterfall = document.createElement('canvas');
    peerWaterfall.id = "waterfall-" + peerId;
    peerWaterfall.width = "320";
    peerWaterfall.height = "130";

    peerContainer.appendChild(peerVideo);
    peerContainer.appendChild(peerTimeDomain);
    peerContainer.appendChild(peerFreqDomain);
    peerContainer.appendChild(peerWaterfall);
    view.appendChild(peerContainer);

    setTimeout( () => createAudioContext(peerId, mediaStream), 0);
};

const removeRemotePeerContainer = function (peerId) {
    const container = document.querySelector(VIDEO_CONTAINER);
    const peerContainer = document.getElementById(peerId);
    if (peerContainer) {
        container.removeChild(peerContainer);
    }
};

const startApp = function (mediaStream) {
    // socket io test
    const socket = io();
    const createPeerConnection = function (peerId) {

        const pc = new RTCPeerConnection(peerConfig);
        pc.onicecandidate = evt => {
            console.log('debug: candidato ice');
            if (evt.candidate) {
                console.log('emitindo candidato ice para', peerId);
                socket.emit('peerIceCandidate', {to: peerId, candidate: evt.candidate});
            }
        };

        pc.ontrack = evt => {
            const mediaStream = evt.streams[0];
            addRemotePeerContainer(peerId, mediaStream);
        };

        pc.onremovestream = () => closePeerConnection(peerId);

        pc.addStream(mediaStream);
        peers.set(peerId, pc);
        return pc;
    };

    socket.on('connect', () => console.log('conectou'));
    socket.on('disconnect', () => console.log('desconectou'));

    socket.on('peerConnected', remotePeer => {
        console.log(`usuario ${remotePeer.id} entrou na sala`);
        const pc = createPeerConnection(remotePeer.id);
        pc.createOffer()
            .then(sdp => pc.setLocalDescription(sdp))
            .then(() => socket.emit('peerOffer', {to: remotePeer.id, sdp: pc.localDescription}))
            .catch(err => console.error(err))
    });

    socket.on('peerDisconnected', remotePeer => {
        console.log(`usuario ${remotePeer.id} saiu da sala`);
        const id = remotePeer.id;
        if (peers.has(id)) {
            peers.get(id).close();
            peers.delete(id);
            closePeerConnection(id);
        }
    });

    socket.on('peerOffer', offer => {
        const pc = createPeerConnection(offer.from);
        pc.setRemoteDescription(new RTCSessionDescription(offer.sdp))
            .then(() => pc.createAnswer())
            .then(sdp => pc.setLocalDescription(sdp))
            .then(() => socket.emit('peerAnswer', {to: offer.from, sdp: pc.localDescription}))
            .catch(err => console.error(err));

    });

    socket.on('peerAnswer', answer => {
        console.log('recebeu resposta de', answer.from)
        const pc = peers.get(answer.from);
        if (pc) {
            console.log('debug: achou o peer');
            pc.setRemoteDescription(new RTCSessionDescription(answer.sdp))
                .catch(err => console.error(err));
        }
    });

    socket.on('peerIceCandidate', ice => {
        const pc = peers.get(ice.from);
        if (pc) {
            console.log('recebeu candidato ice de', ice.from);
            pc.addIceCandidate(new RTCIceCandidate(ice.candidate))
                .catch(err => console.error(err));
        }
    });
};


const initializeApp = function () {
    navigator.mediaDevices.getUserMedia({audio: true, video: true})
        .then(mediaStream => {
            startApp(mediaStream);
        }).catch(err => {
            console.error(err);
        });
}

initializeApp();
