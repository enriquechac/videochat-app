
import React, {useEffect} from "react";
import { VideoCameraIcon, MicrophoneIcon, PhoneMissedCallIcon } from "@heroicons/react/outline"
// import "../js/connection"



function room() {

    
    var connections = [];
    useEffect(() => {
        //https://webrtc.org/getting-started/peer-connections

    //DOM elements

    console.log("Holaaaa!");
    const videoContainer = document.getElementById('video-container');
    const localVideoComponent = document.getElementById('localVideo');

    //Conexion al API mediante Socket.IO
    const io = require("socket.io-client");
    const socket = io("http://localhost:3030");

    // Variables

    let localStream;
    let isRoomCreator;
    let rtcPeerConnection;
    var localId;
    let roomId;
    let remoteStream;

    const iceServers = {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" },
            { urls: "stun:stun3.l.google.com:19302" },
            { urls: "stun:stun4.l.google.com:19302" },
        ],
    };

    const mediaConstraints = {
    video: {
        width: { min: 640, ideal: 1920, max: 1920 },
        height: { min: 400, ideal: 1080, max: 1080 },
        frameRate: { ideal: 30, max: 60 },
        aspectRatio: { ideal: 1.7777777778 },
    },
    audio: true,
    /*
        'audio': {
            sampleSize: 16,
            channelCount: 2,
            echoCancellation: true
        }
        
    */
    };




    // SOCKET EVENT CALLBACKS =====================================================
   

    socket.on('room:created', async () => {
        console.log('Se creo la habitacion!: room:created, tu id:', socket.id)
        localId = socket.id;
        isRoomCreator = true
        await setLocalStream(mediaConstraints);
    })
    
    socket.on('room:join', async () => {
        console.log('Se unio a la habitacion. Tu id:', socket.id)
        localId = socket.id;
        await setLocalStream(mediaConstraints);
        socket.emit('room:joined', roomId)
    })

    socket.on('room:user_joined', async (userID) => {
        console.log('Se unio el usuario con id:', userID);
        if(!connections[userID] && userID !== socket.id){
            connections[userID] = new RTCPeerConnection(iceServers);
            addLocalTracks(connections[userID]);
            connections[userID].ontrack = function(event) {
                setRemoteStream(event, userID)
            }
           //connections[userID].onicecandidate = sendIceCandidate();
            connections[userID].onicecandidate = function(event) {
                sendIceCandidate(event, userID) 
            }
            console.log('Creando oferta a usuario con id:', userID);
            await createOffer(connections[userID], userID)
            console.log(connections)
            
            
        }
    })
    socket.on('room:user_disconect', async (userID) => {
        console.log('Se desconecto user con id:', userID)
        var elem = document.getElementById("videoContainer-"+userID);
        elem.remove();
        console.log(typeof connections);
        connections[userID]=null;
        delete connections[userID];
        changeVideoWidth()
    })

    // Al recibir una oferta de otro usuario en llamada
    socket.on('webrtc_offer', async (event) => {
        console.log('Socket event callback: webrtc_offer')
        console.log("Contestando oferta a user con id", event.fromUserID)
        if (!connections[event.fromUserID]) {
            connections[event.fromUserID] = new RTCPeerConnection(iceServers)
            addLocalTracks(connections[event.fromUserID])
            connections[event.fromUserID].ontrack = function(e) {
                setRemoteStream(e, event.fromUserID)
            }
            console.log("Ice candidate a ",event.fromUserID);
            console.log("USER ID: ", event.fromUserID)
            connections[event.fromUserID].onicecandidate = function(e) {
                sendIceCandidate(e, event.fromUserID) 
            }
            connections[event.fromUserID].setRemoteDescription(new RTCSessionDescription(event.sdp))
            await createAnswer(connections[event.fromUserID], event.fromUserID)
        }
    })

    socket.on('webrtc_answer', (event) => {
        console.log("Answer")
        console.log(event)
        console.log("Contestando oferta a user con id ", event.fromUserID)
        connections[event.fromUserID].setRemoteDescription(new RTCSessionDescription(event.sdp))
    })
    socket.on('webrtc_ice_candidate', (event) => {
        console.log('Socket event callback: webrtc_ice_candidate')
    
        // ICE candidate configuration.
        var candidate = new RTCIceCandidate({
        sdpMLineIndex: event.label,
        candidate: event.candidate,
        })
        connections[event.fromUserID].addIceCandidate(candidate)
    })


    // Funciones ============================

    // Funcion para unirse a una habitacion.
    function joinRoom(room) {
        if (room === '') {
        alert('Porfavor ingresa un roomID')
        } else {
        roomId = room
        socket.emit('room:join', room)
        }
    }


    // Funcion para iniciar la camara local y mostrarla en la pantalla
    async function setLocalStream(mediaConstraints) {
        let stream
        try {
            stream = await navigator.mediaDevices.getUserMedia(mediaConstraints)
        } catch (error) {
            console.error('Could not get user media', error)
        }
        console.log("localstrar added")
        localStream = stream;
        localVideoComponent.srcObject = stream;
    }

    function addLocalTracks(rtcPeerConnection) {
        localStream.getTracks().forEach((track) => {
        rtcPeerConnection.addTrack(track, localStream)
        })
    }

    // Funcion para enviar los icecandidates 
    function sendIceCandidate(event, userID) {
        if (event.candidate) {
            //console.log(event.candidate)
            //console.log(userID)
        socket.emit('webrtc_ice_candidate', {
            roomId,
            label: event.candidate.sdpMLineIndex,
            candidate: event.candidate.candidate,
            userID,
            fromUserID: localId,
        })
        }
    }


    function setRemoteStream(event, userID) {
        
        let remoteVideoComponent  = document.getElementById('remoteVideo-'+userID);
        if(remoteVideoComponent){
            console.log("EXISTE")
        }else{
            let newVideoUser= document.createElement('div');
            console.log("SEASDAWD ", userID);
            newVideoUser.setAttribute("id", "videoContainer-"+userID);
            //newVideoUser.classList.add('flex','justify-center', 'w-[825px]', 'h-[464px]', 'bg-dark-light', 'rounded-xl', 'shadow-md', 'overflow-hidden',);
            newVideoUser.classList.add('flex', 'justify-center', 'bg-dark-light', 'rounded-xl', 'shadow-md', 'overflow-hidden', 'mx-2');
            newVideoUser.innerHTML = '<video id="remoteVideo-'+userID+'" autoPlay playsInline></video> </div>';
            videoContainer.insertBefore(newVideoUser, videoContainer.firstChild)        
            let remoteVideoComponent  = document.getElementById('remoteVideo-'+userID);
            remoteVideoComponent.srcObject = event.streams[0]
            remoteStream = event.stream
            changeVideoWidth();
        }
    }

    // Funcion para crear una nueva oferta
    async function createOffer(rtcPeerConnection, userID) {
        let sessionDescription
        try {
            sessionDescription = await rtcPeerConnection.createOffer()
            rtcPeerConnection.setLocalDescription(sessionDescription)
            console.log(sessionDescription)
            socket.emit('webrtc_offer', {
                type: 'webrtc_offer',
                sdp: sessionDescription,
                roomId,
                userID,
                fromUserID: localId,
            })
        } catch (error) {
            console.error(error)
        }
    }

    async function createAnswer(rtcPeerConnection, userID) {
        let sessionDescription
        try {
        sessionDescription = await rtcPeerConnection.createAnswer()
        rtcPeerConnection.setLocalDescription(sessionDescription)
        console.log(sessionDescription)
        } catch (error) {
        console.error(error)
        }
    
        socket.emit('webrtc_answer', {
            type: 'webrtc_answer',
            sdp: sessionDescription,
            userID,
            fromUserID: localId,
            roomId,
        })
    }


    joinRoom(123321);

    }, [])



    const videoBotonClic = () => {
        console.log("Boton Video Clic")
    }
    


    var videoClass = "flex justify-center bg-dark-light rounded-xl shadow-md overflow-hidden mx-2 "
    var maxWidth = ""
    
    const changeVideoWidth = () => {
        
        let width = 'w-[925px]';
        let x = Object.entries(connections).length;
        if(x === 1){
            width = 'w-[800px]'
        } else if (x===2){
            width = 'w-[750px]'
        } else if (x===3){
            width = 'w-[750px]'
        } else if (x>=4){
            width = 'w-[500px]'
        }
        console.log(width)
        document.getElementById('localVideo').className=width;

        Object.entries(connections).forEach(([key, value]) => {
            if(document.getElementById('remoteVideo-'+key)){
                document.getElementById('remoteVideo-'+key).className=width;
            }
        });
    }


    return (

        <>
            <div className="flex flex-col bg-dark min-h-screen">
                <div className="flex flex-grow flex-wrap justify-evenly items-center" id="video-container">
                    <div className={videoClass}>
                        <video className="w-[925px]" id="localVideo" autoPlay playsInline controls={false} muted></video>
                    </div>

                    {/* <div className="flex justify-center w-[825px] h-[464px] bg-dark-light rounded-xl shadow-md overflow-hidden">
                        <video id="remoteVideo" autoPlay playsInline controls={false}></video>
                    </div> */}
                </div>
                <div className="flex mb-12 justify-center items-center">
                    <div className="flex w-72 justify-around">
                        <div onClick={videoBotonClic} className="flex justify-center items-center bg-primary w-14 h-14 rounded-full cursor-pointer hover:opacity-70 active:scale-90 transition ease-out">
                            <VideoCameraIcon className="font-light w-8"/>
                        </div>
                        <div className="flex justify-center items-center bg-primary w-14 h-14 rounded-full cursor-pointer hover:opacity-70 active:scale-90 transition ease-out">
                            <MicrophoneIcon className="font-light w-8"/>
                        </div>
                        <div className="flex justify-center items-center bg-primary w-14 h-14 rounded-full cursor-pointer hover:opacity-70 active:scale-90 transition ease-out">
                            <PhoneMissedCallIcon className="font-light w-8"/>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default room
