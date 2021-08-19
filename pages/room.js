
import React, {useEffect} from "react";
import { VideoCameraIcon, MicrophoneIcon, PhoneMissedCallIcon } from "@heroicons/react/outline"
// import "../js/connection"



function room() {

    useEffect(() => {
        //https://webrtc.org/getting-started/peer-connections

    //DOM elements

    console.log("Holaaaa!");
    const localVideoComponent = document.getElementById('localVideo');
    const remoteVideoComponent  = document.getElementById('remoteVideo');

    //Conexion al API mediante Socket.IO
    const io = require("socket.io-client");
    const socket = io("http://localhost:3030");
    
    joinRoom("123123123");

    // Variables

    let localStream;
    let isRoomCreator;
    let rtcPeerConnection;
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
    audio: false,
    /*
        'audio': {
            sampleSize: 16,
            channelCount: 2,
            echoCancellation: true
        }
        
        */
    };











    // SOCKET EVENT CALLBACKS =====================================================
   

    socket.on('room_created', async () => {
        console.log('Socket event callback: room_created')
    
        await setLocalStream(mediaConstraints)
        isRoomCreator = true
    })
    
    socket.on('room_joined', async () => {
        console.log('Socket event callback: room_joined')
    
        await setLocalStream(mediaConstraints)
        socket.emit('start_call', roomId)
    })
    
    socket.on('full_room', () => {
        console.log('Socket event callback: full_room')
    
        alert('The room is full, please try another one')
    })



    // Funciones ============================

    function joinRoom(room) {
        if (room === '') {
        alert('Please type a room ID')
        } else {
        roomId = room
        socket.emit('join', room)
        }
    }

    async function setLocalStream(mediaConstraints) {
        let stream
        try {
            stream = await navigator.mediaDevices.getUserMedia(mediaConstraints)
        } catch (error) {
            console.error('Could not get user media', error)
        }

        localStream = stream
        localVideoComponent.srcObject = stream
    }


    // SOCKET EVENT CALLBACKS =====================================================
    socket.on('start_call', async () => {
        console.log('Socket event callback: start_call')
    
        if (isRoomCreator) {
        rtcPeerConnection = new RTCPeerConnection(iceServers)
        addLocalTracks(rtcPeerConnection)
        rtcPeerConnection.ontrack = setRemoteStream
        rtcPeerConnection.onicecandidate = sendIceCandidate
        await createOffer(rtcPeerConnection)
        }
    })
    
    socket.on('webrtc_offer', async (event) => {
        console.log('Socket event callback: webrtc_offer')
    
        if (!isRoomCreator) {
        rtcPeerConnection = new RTCPeerConnection(iceServers)
        addLocalTracks(rtcPeerConnection)
        rtcPeerConnection.ontrack = setRemoteStream
        rtcPeerConnection.onicecandidate = sendIceCandidate
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event))
        await createAnswer(rtcPeerConnection)
        }
    })
    
    socket.on('webrtc_answer', (event) => {
        console.log('Socket event callback: webrtc_answer')
    
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event))
    })
    
    socket.on('webrtc_ice_candidate', (event) => {
        console.log('Socket event callback: webrtc_ice_candidate')
    
        // ICE candidate configuration.
        var candidate = new RTCIceCandidate({
        sdpMLineIndex: event.label,
        candidate: event.candidate,
        })
        rtcPeerConnection.addIceCandidate(candidate)
    })
    
    // FUNCTIONS ==================================================================
    function addLocalTracks(rtcPeerConnection) {
        localStream.getTracks().forEach((track) => {
        rtcPeerConnection.addTrack(track, localStream)
        })
    }
    //
    async function createOffer(rtcPeerConnection) {
        let sessionDescription
        try {
        sessionDescription = await rtcPeerConnection.createOffer()
        rtcPeerConnection.setLocalDescription(sessionDescription)
        } catch (error) {
        console.error(error)
        }
    
        socket.emit('webrtc_offer', {
        type: 'webrtc_offer',
        sdp: sessionDescription,
        roomId,
        })
    }
    
    async function createAnswer(rtcPeerConnection) {
        let sessionDescription
        try {
        sessionDescription = await rtcPeerConnection.createAnswer()
        rtcPeerConnection.setLocalDescription(sessionDescription)
        } catch (error) {
        console.error(error)
        }
    
        socket.emit('webrtc_answer', {
        type: 'webrtc_answer',
        sdp: sessionDescription,
        roomId,
        })
    }
    
    //
    function setRemoteStream(event) {
        remoteVideoComponent.srcObject = event.streams[0]
        remoteStream = event.stream
    }
    
    //
    function sendIceCandidate(event) {
        if (event.candidate) {
        socket.emit('webrtc_ice_candidate', {
            roomId,
            label: event.candidate.sdpMLineIndex,
            candidate: event.candidate.candidate,
        })
        }
    }


    }, [])


    return (

        <>
            <div className="flex flex-col bg-dark min-h-screen">
                <div className="flex flex-grow flex-wrap justify-evenly items-center">
                    <div className="flex justify-center w-[825px] h-[464px] bg-dark-light rounded-xl shadow-md overflow-hidden">
                        <video id="localVideo" autoPlay playsInline controls={false}></video>
                    </div>
                    <div className="flex justify-center w-[825px] h-[464px] bg-dark-light rounded-xl shadow-md overflow-hidden">
                        <video id="remoteVideo" autoPlay playsInline controls={false}></video>
                    </div>
                </div>
                <div className="flex mb-12 justify-center items-center">
                    <div className="flex w-72 justify-around">
                        <div className="flex justify-center items-center bg-primary w-14 h-14 rounded-full cursor-pointer hover:opacity-70 active:scale-90 transition ease-out">
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
