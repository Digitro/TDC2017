const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');
const SocketIO = require('socket.io');
const Url = require('url').URL;

const HTTPS_PORT = 443;
const HTTP_PORT = 80;
const sslOptions = {
    key: fs.readFileSync('certs/private.key'),
    cert: fs.readFileSync('certs/certificate.pem'),
};

const app = express();
// configuração de rotas do app
app.all('*', (req, res, next) => {
    if (req.secure) return next();
    res.redirect(`https://${req.hostname}:${HTTPS_PORT}${req.url}`);
});
app.use('/', express.static(__dirname + '/public'));
app.use('/vendor/', express.static(__dirname + '/node_modules/socket.io-client/dist'));
app.use('/vendor/', express.static(__dirname + '/node_modules/webrtc-adapter/out'));

const roomRouter = (req, res) => res.sendFile(__dirname + '/public/samples/peer-to-peer/index.html');
app.get('/samples/peer-to-peer/:room', roomRouter);
app.get('/samples/peer-to-peer', roomRouter);

const showroomRouter = (req, res) => res.sendFile(__dirname + '/public/samples/showroom/index.html');
app.get('/samples/showroom/:room', showroomRouter);
app.get('/samples/showroom', showroomRouter);

// criação do servidor
http.createServer(app).listen(HTTP_PORT);
const httpsServer = https.createServer(sslOptions, app).listen(HTTPS_PORT);

// tratamento do socket.io: usado para sinalização
const ROOM_NAME = 'TESTE';
const sockets = new Map();
const ioServer = SocketIO(httpsServer);
ioServer.on('connection', socket => {

    const myUrl = new Url(socket.request.headers.referer);
    const pathname = myUrl.pathname.split('/');
    const roomName = pathname.pop();
    console.log(`usuário com id ${socket.id} entrou na sala ${roomName}`);

    socket.on('peerOffer', offer => {
        console.log('peerOffer from', socket.id, 'to',offer.to);
        const remotePeer = offer.to;
        socket.to(remotePeer)
            .emit('peerOffer', {from: socket.id, sdp: offer.sdp});
    });

    socket.on('peerAnswer', answer => {
        console.log('peerAnswer from', socket.id, 'to', answer.to);
        const remotePeer = answer.to;
        socket.to(remotePeer)
            .emit('peerAnswer', {from: socket.id, sdp: answer.sdp});
    });

    socket.on('peerIceCandidate', ice => {
        console.log('peerIceCandidate from', socket.id, 'to', ice.to);
        const remotePeer = ice.to;
        socket.to(remotePeer)
            .emit('peerIceCandidate', {from: socket.id, candidate: ice.candidate});
    });

    socket.on('disconnect', reason => {
        sockets.delete(socket.id);
        socket.to(roomName).emit('peerDisconnected', {id: socket.id});
        socket.leave(roomName);
    });

    sockets.set(socket.id, socket);
    socket.join(roomName, () => {
        console.log(`emitindo peerConnected para sala ${roomName}`);
        socket.to(roomName).emit('peerConnected', {id: socket.id});
    });
});
