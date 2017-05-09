navigator.mediaDevices.getUserMedia({audio: true, video: true})
    .then(mediaStream => {
        const video = document.querySelector('video');
        video.srcObject = mediaStream;
        video.onloadedmetadata = () => video.play();
    })
    .catch(err => console.error(err));
