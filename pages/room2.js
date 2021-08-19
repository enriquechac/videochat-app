
import React, {useEffect} from "react";
import { VideoCameraIcon, MicrophoneIcon, PhoneMissedCallIcon } from "@heroicons/react/outline"
// import "../js/connection"



function room() {

    useEffect(() => {
        
    const io = require("socket.io-client");
    const socket = io("http://localhost:3030");

    var localVideo;
    var firstPerson = false;
    var socketCount = 0;
    var socketId;
    var localStream;
    var connections = [];
    var remoteVideo;

    var peerConnectionConfig = {
        'iceServers': [
            {'urls': 'stun:stun.services.mozilla.com'},
            {'urls': 'stun:stun.l.google.com:19302'},
        ]
    };

    function pageReady() {

        localVideo = document.getElementById('localVideo');
        remoteVideo = document.getElementById('remoteVideo');

        var constraints = {
            video: true,
            audio: false,
        };

        if(navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia(constraints)
                .then(getUserMediaSuccess)
                .then(function(){

                    socket = io.connect(config.host, {secure: true});
                    socket.on('signal', gotMessageFromServer);    

                    socket.on('connect', function(){

                        socketId = socket.id;

                        socket.on('user-left', function(id){
                            var video = document.querySelector('[data-socket="'+ id +'"]');
                            var parentDiv = video.parentElement;
                            video.parentElement.parentElement.removeChild(parentDiv);
                        });


                        socket.on('user-joined', function(id, count, clients){
                            clients.forEach(function(socketListId) {
                                if(!connections[socketListId]){
                                    connections[socketListId] = new RTCPeerConnection(peerConnectionConfig);
                                    //Wait for their ice candidate       
                                    connections[socketListId].onicecandidate = function(){
                                        if(event.candidate != null) {
                                            console.log('SENDING ICE');
                                            socket.emit('signal', socketListId, JSON.stringify({'ice': event.candidate}));
                                        }
                                    }

                                    //Wait for their video stream
                                    connections[socketListId].onaddstream = function(){
                                        gotRemoteStream(event, socketListId)
                                    }    

                                    //Add the local video stream
                                    connections[socketListId].addStream(localStream);                                                                
                                }
                            });

                            //Create an offer to connect with your local description
                            
                            if(count >= 2){
                                connections[id].createOffer().then(function(description){
                                    connections[id].setLocalDescription(description).then(function() {
                                        // console.log(connections);
                                        socket.emit('signal', id, JSON.stringify({'sdp': connections[id].localDescription}));
                                    }).catch(e => console.log(e));        
                                });
                            }
                        });                    
                    })       
            
                }); 
        } else {
            alert('Your browser does not support getUserMedia API');
        } 
    }

    function getUserMediaSuccess(stream) {
        localStream = stream;
        localVideo.src = stream;
    }

    function gotRemoteStream(event, id) {

        var videos = document.querySelectorAll('video'),
            video  = document.createElement('video'),
            div    = document.createElement('div')

        video.setAttribute('data-socket', id);
        video.src         = window.URL.createObjectURL(event.stream);
        video.autoplay    = true; 
        video.muted       = true;
        video.playsinline = true;
        
        div.appendChild(video);      
        document.querySelector('.videos').appendChild(div);      
    }

    function gotMessageFromServer(fromId, message) {

        //Parse the incoming signal
        var signal = JSON.parse(message)

        //Make sure it's not coming from yourself
        if(fromId != socketId) {

            if(signal.sdp){            
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(function() {                
                    if(signal.sdp.type == 'offer') {
                        connections[fromId].createAnswer().then(function(description){
                            connections[fromId].setLocalDescription(description).then(function() {
                                socket.emit('signal', fromId, JSON.stringify({'sdp': connections[fromId].localDescription}));
                            }).catch(e => console.log(e));        
                        }).catch(e => console.log(e));
                    }
                }).catch(e => console.log(e));
            }
        
            if(signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e));
            }                
        }
    }
    
    pageReady()
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
