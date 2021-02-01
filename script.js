const Peer = window.Peer;
const Peer = require('skyway-js');
const peer = new Peer({key: 'ebd5349b-10aa-4435-8de0-0b2f303e88d7'});

// import
import Peer from 'skyway-js';
const peer = new Peer({key: 'ebd5349b-10aa-4435-8de0-0b2f303e88d7'});

(async function main() {
  const localVideo = document.getElementById('js-local-stream');
  const localId = document.getElementById('js-local-id');
  const localText = document.getElementById('js-local-text');
  const callTrigger = document.getElementById('js-call-trigger');
  const connectTrigger = document.getElementById('js-connect-trigger');
  const closeTrigger = document.getElementById('js-close-trigger');
  const sendTrigger = document.getElementById('js-send-trigger');
  const remoteVideo = document.getElementById('js-remote-stream');
  const remoteId = document.getElementById('js-remote-id');
  const messages = document.getElementById('js-messages');
  const meta = document.getElementById('js-meta');
  const sdkSrc = document.querySelector('script[src*=skyway]');

  meta.innerText = `
    UA: ${navigator.userAgent}
    SDK: ${sdkSrc ? sdkSrc.src : 'unknown'}
  `.trim();

  const localStream = await navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: true,
    })
    .catch(console.error);

  // Render local stream
  localVideo.muted = true;
  localVideo.srcObject = localStream;
  localVideo.playsInline = true;
  await localVideo.play().catch(console.error);

  const peer = (window.peer = new Peer({
    key: window.__SKYWAY_KEY__,
    debug: 3,
  }));

  // Register caller handler
  callTrigger.addEventListener('click', () => {
    // Note that you need to ensure the peer has connected to signaling server
    // before using methods of peer instance.
    if (!peer.open) {
      return;
    }

    const dataConnection = peer.connect(remoteId.value);

    dataConnection.once('open', async () => {
      messages.textContent += `=== DataConnection has been opened ===\n`;

      sendTrigger.addEventListener('click', onClickSend);
    });

    dataConnection.on('data', data => {
      messages.textContent += `Remote: ${data}\n`;
    });

    dataConnection.once('close', () => {
      messages.textContent += `=== DataConnection has been closed ===\n`;
      sendTrigger.removeEventListener('click', onClickSend);
    });

    // Register closing handler
    closeTrigger.addEventListener('click', () => dataConnection.close(true), {
      once: true,
    });

    function onClickSend() {
      const data = localText.value;
      dataConnection.send(data);

      messages.textContent += `You: ${data}\n`;
      localText.value = '';
    }
  });
    
    const mediaConnection = peer.call(remoteId.value, localStream);

    mediaConnection.on('stream', async stream => {
      // Render remote stream for caller
      remoteVideo.srcObject = stream;
      remoteVideo.playsInline = true;
      await remoteVideo.play().catch(console.error);
    });

    mediaConnection.once('close', () => {
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null;
    });

    closeTrigger.addEventListener('click', () => mediaConnection.close(true));
  });

  peer.once('open', id => (localId.textContent = id));

  // Register callee handler
  peer.on('call', mediaConnection => {
    mediaConnection.answer(localStream);

    mediaConnection.on('stream', async stream => {
      // Render remote stream for callee
      remoteVideo.srcObject = stream;
      remoteVideo.playsInline = true;
      await remoteVideo.play().catch(console.error);
    });

    mediaConnection.once('close', () => {
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null;
    });

    closeTrigger.addEventListener('click', () => mediaConnection.close(true));
  });

peer.on('connection', dataConnection => {
    dataConnection.once('open', async () => {
      messages.textContent += `=== DataConnection has been opened ===\n`;
      console.log("DataConnection 接続完了")
      sendTrigger.addEventListener('click', onClickSend);
    });

    dataConnection.on('data', data => {
      console.log(messages.textContent); 
      console.log(data);
      messages.textContent += `Remote: ${data}\n`;
    });

    dataConnection.once('close', () => {
      messages.textContent += `=== DataConnection has been closed ===\n`;
      sendTrigger.removeEventListener('click', onClickSend);
    });

    // Register closing handler
    closeTrigger.addEventListener('click', () => dataConnection.close(true), {
      once: true,
    });

    function onClickSend() {
      const data = localText.value;
      dataConnection.send(data);

      messages.textContent += `You: ${data}\n`;
      localText.value = '';
    }
  });


  peer.on('error', console.error);
})();
