const VIDEO_CONTAINER = 'body';
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

const closePeerConnection = function (peerId) {
    const container = document.querySelector(VIDEO_CONTAINER);
    const remoteStreamVideo = document.getElementById(peerId);
    if (remoteStreamVideo) {
        container.removeChild(remoteStreamVideo);
    }
};

const startApp = function (mediaStream) {
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
            console.log('debug: recebi stream remoto');
            const container = document.querySelector(VIDEO_CONTAINER);
            let remoteStreamVideo = document.getElementById(peerId);
            if (remoteStreamVideo){
                remoteStreamVideo.srcObject = evt.streams[0];
            } else {
                remoteStreamVideo = document.createElement('video');
                remoteStreamVideo.id = peerId;
                remoteStreamVideo.srcObject = evt.streams[0];
                remoteStreamVideo.onloadedmetadata = () => remoteStreamVideo.play();
                remoteStreamVideo.width="320";
                remoteStreamVideo.height="240";
                container.appendChild(remoteStreamVideo);
            }
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
            .catch(err => console.log('Erro: ', err))
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
            .catch(err => console.log('Erro: ', err));

    });

    socket.on('peerAnswer', answer => {
        console.log('recebeu resposta de', answer.from)
        const pc = peers.get(answer.from);
        if (pc) {
            console.log('debug: achou o peer');
            pc.setRemoteDescription(new RTCSessionDescription(answer.sdp))
                .catch(err => console.log('Erro: ', err));
        }
    });

    socket.on('peerIceCandidate', ice => {
        const pc = peers.get(ice.from);
        if (pc) {
            console.log('recebeu candidato ice de', ice.from);
            pc.addIceCandidate(new RTCIceCandidate(ice.candidate))
                .catch(err => console.log('Erro :', err));
        }
    });
};

const initializeApp = function () {
    navigator.mediaDevices.getUserMedia({audio: true, video: true})
        .then(mediaStream => {
            assignMediaStreamObject(mediaStream);
            startApp(mediaStream);
        }).catch(err => {
            console.log('Erro: ', err);
        });
}

initializeApp();
