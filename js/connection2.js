    
    
    
    //https://webrtc.org/getting-started/peer-connections

    //Conexion al API mediante Socket.IO
    const io = require("socket.io-client");
    const socket = io("http://localhost:3030");

    // Envio mensaje de prueba, al conectarse.
    socket.emit('message', {message: 'hola'});    
    // Recibo el mensaje de prueba en todos los clientes.
    socket.on('message', function(data) {
        //console.log(data)
    });



    // Variables

    let localStream;
    let remoteStream;
    let isRoomCreator;
    let rtcPeerConnection;
    let roomId;

    const iceServers = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' },
        ],
    }
    const mediaConstraints = {
        'video': {
            width: { min: 640, ideal: 1920, max: 1920 },
            height: { min: 400, ideal: 1080, max: 1080 },
            frameRate: { ideal:30, max: 60 },
            aspectRatio: { ideal: 1.7777777778 },
        },
        'audio': false
        /*
        'audio': {
            sampleSize: 16,
            channelCount: 2,
            echoCancellation: true
        }
        
        */
    }


    


    //Funcion para reproducir el video del cliente.
    async function playVideoFromCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
            const videoElement = document.querySelector('video#localVideo');
            videoElement.srcObject = stream;
        } catch(error) {
            console.error('Error opening video camera.', error);
        }
    }



    //Hacer una llamada
    export async function makeCall() {
        window.configuration = {'iceServers': [{urls: "stun:stun.l.google.com:19302"}]};
        window.peerConnection = new RTCPeerConnection(window.configuration);
        registerPeerConnectionListeners();

        window.peerConnection.oncandidate = e =>{
            console.log(e.candidate);
        }

        //Create Offer
        const offer = await window.peerConnection.createOffer();
        await window.peerConnection.setLocalDescription(offer);
        socket.emit('offer', {offer}); 
        console.log("call");
        
    }


    socket.on('offer', async function(data) {
        if(data.answer){
            const remoteDesc = new RTCSessionDescription(data.answer);
            console.log(data.answer);
            console.log("Answered");
            await window.peerConnection.setRemoteDescription(remoteDesc);




        }
        if (data.offer) {
            window.peerConnection = new RTCPeerConnection(window.configuration);
            registerPeerConnectionListeners();
            window.peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await window.peerConnection.createAnswer();
            await window.peerConnection.setLocalDescription(answer);
            socket.emit('offer',{'answer': answer});
            console.log("New offer");

            window.peerConnection.addEventListener('icecandidate', event => {
                if (event.candidate) {
                    console.log("new icecandidate");
                }
            });


        }
    });
    










    
    if (typeof window !== 'undefined' && typeof window.navigator !== 'undefined') { 
        playVideoFromCamera();

    }

function registerPeerConnectionListeners() {
    window.peerConnection.addEventListener('icegatheringstatechange', () => {
        console.log(
            `ICE gathering state changed: ${window.peerConnection.iceGatheringState}`);
    });
    
    window.peerConnection.addEventListener('connectionstatechange', () => {
        console.log(`Connection state change: ${window.peerConnection.connectionState}`);
    });
    
    window.peerConnection.addEventListener('signalingstatechange', () => {
        console.log(`Signaling state change: ${window.peerConnection.signalingState}`);
    });
    
    window.peerConnection.addEventListener('iceconnectionstatechange ', () => {
        console.log(
            `ICE connection state change: ${window.peerConnection.iceConnectionState}`);
    });
    window.peerConnection.addEventListener('icecandidate', event => {
        if (event.candidate) {
            signalingChannel.send({'new-ice-candidate': event.candidate});
        }
    });


}


    