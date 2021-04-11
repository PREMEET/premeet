/*
*  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
*
*  Use of this source code is governed by a BSD-style license
*  that can be found in the LICENSE file in the root of the source
*  tree.
*/

// This code is adapted from
// https://rawgit.com/Miguelao/demos/master/mediarecorder.html

'use strict';

/* globals MediaRecorder */
var date = new Date();
var cap;
let mediaRecorder;
let recordedBlobs;
let frame;
let gumVideo;
const canvas = document.getElementById("canvas");
const captureVideo = document.getElementById("capturedVideo");
const errorMsgElement = document.querySelector('span#errorMsg');
const recordedVideo = document.querySelector('video#recorded');
const recordButton = document.querySelector('button#record');
recordButton.addEventListener('click', () => {
    if (recordButton.textContent === 'Start Recording') {
        startRecording();
    } else {
        stopRecording();
        recordButton.textContent = 'Start Recording';
        playButton.disabled = false;
        downloadButton.disabled = false;
    }
});

const playButton = document.querySelector('button#play');
playButton.addEventListener('click', () => {
    const superBuffer = new Blob(recordedBlobs, {type: 'video/webm'});
    recordedVideo.src = null;
    recordedVideo.srcObject = null;
    recordedVideo.src = window.URL.createObjectURL(superBuffer);
    recordedVideo.controls = true;
    recordedVideo.play();
});

const downloadButton = document.querySelector('button#download');
downloadButton.addEventListener('click', () => {
    const blob = new Blob(recordedBlobs, {type: 'video/webm'});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    // a.download = 'test.webm';
    document.body.appendChild(a);
    uploadToServer(blob);
    // a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);
});
function uploadToServer(blob) {
    var fd = new FormData();
    fd.append('file', blob);
    $.ajax({
        url : "/save",
        type : "POST",
        data : fd,
        processData : false,
        contentType : false,
        success : function (response) {
            alert(response);
        },
        error : function (jqXHR, textStaut, errorMesssage) {
            alert('Error' + JSON.stringify(errorMesssage));
        }
    });
}
function handleDataAvailable(event) {
    console.log('handleDataAvailable', event);
    if (event.data && event.data.size > 0) {
        recordedBlobs.push(event.data);
    }
}

function startRecording() {
    recordedBlobs = [];
    let options = {mimeType: 'video/webm;codecs=vp9,opus'};
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.error(`${options.mimeType} is not supported`);
        options = {mimeType: 'video/webm;codecs=vp8,opus'};
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            console.error(`${options.mimeType} is not supported`);
            options = {mimeType: 'video/webm'};
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                console.error(`${options.mimeType} is not supported`);
                options = {mimeType: ''};
            }
        }
    }

    try {
        mediaRecorder = new MediaRecorder(window.stream, options);
    } catch (e) {
        console.error('Exception while creating MediaRecorder:', e);
        errorMsgElement.innerHTML = `Exception while creating MediaRecorder: ${JSON.stringify(e)}`;
        return;
    }

    console.log('Created MediaRecorder', mediaRecorder, 'with options', options);
    recordButton.textContent = 'Stop Recording';
    playButton.disabled = true;
    downloadButton.disabled = true;
    mediaRecorder.onstop = (event) => {
        console.log('Recorder stopped: ', event);
        console.log('Recorded Blobs: ', recordedBlobs);
    };
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start();
    console.log('MediaRecorder started', mediaRecorder);
   cap = setInterval(function (){capture()}, 10);
}

function stopRecording() {
    clearInterval(cap)
    mediaRecorder.stop();
}

function handleSuccess(stream) {
    recordButton.disabled = false;
    console.log('getUserMedia() got stream:', stream);
    window.stream = stream;

    gumVideo = document.querySelector('video#gum');
    gumVideo.srcObject = stream;

    //webrtc stream 캡쳐
    //frame단위로!!

    // gumVideo.onplay = function (){
    //     frame = gumVideo.captureStream();
    //     captureVideo.srcObject = frame;
    // }

 streamcapture();
}

function capture() {
    canvas.width = gumVideo.videoWidth;
    canvas.height = gumVideo.videoHeight;

    canvas.getContext('2d').drawImage(gumVideo,0,0);

    var dataUri = canvas.toDataURL('image/png', 0.92);
    var d = dataUri.split(',')[1];
    var mimeType = dataUri.split(';')[0].slice(5);

    var bytes = window.atob(d);
    var buf = new ArrayBuffer(bytes.length);
    var arr = new Uint8Array(buf);

    for(var i =0; i <bytes.length; i++) {
        arr[i] = bytes.charCodeAt(i);
    }
    var capBlob = new Blob([arr], {type:mimeType});
    uploadToServerCapture(capBlob);
}
function streamcapture() {
    frame = gumVideo.captureStream();
    captureVideo.srcObject = frame;
}

function uploadToServerCapture(c) {
    var fdata = new FormData();
    fdata.append('capture',c);
    $.ajax({
        url : "/cap",
        type : "POST",
        data : fdata,
        processData : false,
        contentType : false,
        success : function (response) {
            console.log(date.toLocaleString());
        },
        error : function (jqXHR, textStaut, errorMesssage) {
            alert('Error' + JSON.stringify(errorMesssage));
        }
    });
}
async function init(constraints) {
    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        handleSuccess(stream);
    } catch (e) {
        console.error('navigator.getUserMedia error:', e);
        errorMsgElement.innerHTML = `navigator.getUserMedia error:${e.toString()}`;
    }
}

document.querySelector('button#start').addEventListener('click', async () => {
    const hasEchoCancellation = document.querySelector('#echoCancellation').checked;
    const constraints = {
        audio: {
            echoCancellation: {exact: hasEchoCancellation}
        },
        video: {
            width: 1280, height: 720
        }
    };
    console.log('Using media constraints:', constraints);
    await init(constraints);
});