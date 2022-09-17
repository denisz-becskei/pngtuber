let audioCtx;
const canvas = document.getElementById("canvas");
const canvas2 = document.getElementById("underCanvas");
const bg_color = document.getElementById("bg-color");
const output_background = document.getElementById("output-background");
const precision_element = document.getElementById("voice-activity-precision");
const ctx = canvas.getContext("2d");
const ctx2 = canvas2.getContext("2d");
const STARTING_THRESHOLD = 0.1;
precision_element.value = STARTING_THRESHOLD;
let threshold = STARTING_THRESHOLD;

const nathria_idle = "Nathria_Idle.gif";
const nathria_talking = ["Nathria_Talking1.png", "Nathria_Talking2.png", "Nathria_Talking3.png", "Nathria_Talking4.png"];

const sanctum_idle = "Sanctum_Idle.gif";
const sanctum_talking = ["Sanctum_Talking1.png", "Sanctum_Talking2.png", "Sanctum_Talking3.png", "Sanctum_Talking4.png"];

const idle = sanctum_idle;
const talking = sanctum_talking;

const videoFeed = document.getElementById("videoFeed");
let distance;

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
  faceapi.nets.faceExpressionNet.loadFromUri('./models')
]).then(startVideo)

function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    stream => videoFeed.srcObject = stream,
    err => console.error(err)
  )
}

videoFeed.addEventListener('play', () => {
  const canvasElement = faceapi.createCanvasFromMedia(videoFeed);
  document.getElementById("facial").append(canvasElement);
  canvasElement.style.position = "absolute";
  const displaySize = { width: videoFeed.width, height: videoFeed.height }
  faceapi.matchDimensions(canvasElement, displaySize);
  setInterval(async () => {
    let skip = false;
    const detections = await faceapi.detectSingleFace(videoFeed, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions(); 
    let resizedDetections;
    try {
      resizedDetections = faceapi.resizeResults(detections, displaySize);
    } catch (error) {
      skip = true;
    }
    
    if (skip === false) {
      const ctx = canvasElement.getContext("2d");
      ctx.fillStyle = "black";
      ctx.rect(0, 0, canvasElement.width, canvasElement.height);
      ctx.fill();
      //faceapi.draw.drawDetections(canvasElement, resizedDetections);

      const positions = resizedDetections.landmarks._positions;
      distance = Math.sqrt(Math.pow(positions[62]._x - positions[66]._x, 2) + Math.pow(positions[62]._y - positions[66]._y, 2));
      console.log(distance);
  
      faceapi.draw.drawFaceLandmarks(canvasElement, resizedDetections);
      //faceapi.draw.drawFaceExpressions(canvasElement, resizedDetections);
    }
  }, 100)
})

const gif = document.getElementById("gif");
resetGif();
let activated = false;
let visualize = false;

let continuous = false;
let continuousImg;

const start_check = setInterval(() => {
  if(activated === true) {
    start();
    clearInterval(start_check);
  }
}, 1000);

function start() {
  // Ask user for access to the microphone.
  if (navigator.mediaDevices) {
    navigator.mediaDevices.getUserMedia({
      "audio": true,
    }).then((stream) => {

      // Instantiate the media recorder.
      var microphone = audioCtx.createMediaStreamSource(stream);
      var analyser = audioCtx.createAnalyser();
      microphone.connect(analyser);
      let isPaused = false;
      setInterval(() => {
        max = getVolume(ctx, canvas, analyser);
        if (max > threshold && !isPaused && distance > 5) {
          ctx.beginPath();
          ctx.fillStyle = 'red';
          ctx.arc(30, 30, 15, 0, 2 * Math.PI);
          ctx.fill();
          isPaused = true;
          if (!continuous) {
            continuousImg = talking[[Math.floor(Math.random() * talking.length)]];
          }
          gif.src = continuousImg;
          continuous = true;
          setTimeout(() => {
            isPaused = false;
          }, 1250);
        } else if (!isPaused) {
          ctx.beginPath();
          ctx.fillStyle = 'blue';
          ctx.arc(30, 30, 15, 0, 2 * Math.PI);
          ctx.fill();
          continuous = false;
          if (gif.src.includes("Talking")) {
            gif.src = idle;
          }
        }
      }, 1000 / 30);

      function getVolume(ctx, canvas, analyser) {
        const dataArray = new Float32Array(analyser.frequencyBinCount);
        analyser.getFloatTimeDomainData(dataArray);

        ctx.beginPath();
        ctx.rect(0, 45, canvas.width, canvas.height);
        ctx.fillStyle = 'black';
        ctx.fill();
        ctx.strokeStyle = 'yellow';
        ctx.moveTo(0, canvas.height / 2);
        for (let i = 0; i < dataArray.length; i++) {
          ctx.lineTo(canvas.width * i / dataArray.length, canvas.height / 2 + dataArray[i] * 100);
        }
        ctx.stroke();

        if(visualize && threshold !== 1) {
          ctx2.beginPath();
          ctx2.clearRect(0, 45, canvas.width, canvas.height);
          ctx2.strokeStyle = 'yellow';
          ctx2.moveTo(0, canvas.height / 2);
          for (let i = 0; i < dataArray.length; i++) {
            ctx2.lineTo(canvas2.width * i / dataArray.length, canvas2.height / 2 + dataArray[i] * 100);
          }
          ctx2.stroke();
        } else {
          ctx2.beginPath();
          ctx2.clearRect(0, 45, canvas.width, canvas.height);
        }
        return Math.max(...dataArray);
      }

    }).catch((err) => {
      console.log(err);
    });
  } else {
    // Throw alert when the browser cannot access any media devices.
    alert("Oh no! Your browser cannot access your computer's microphone. Please update your browser.");
  }
}

function resetGif() {
  gif.src = "";
  gif.src = idle;
};



document.getElementById("caliBtn").onclick = function () {
  // Set up the AudioContext.
  audioCtx = new AudioContext();
  audioCtx.resume();
  activated = true;
};

var muteBtn = document.getElementById("muteBtn");
var visualBtn = document.getElementById("visualBtn");
var bgBtn = document.getElementById("bgBtn");
var precBtn = document.getElementById("precBtn");

muteBtn.onclick = function () {
  if (threshold !== 1) {
    threshold = 1;
    muteBtn.value = "Unmute";
  } else {
    threshold = STARTING_THRESHOLD;
    muteBtn.value = "Mute";
  }
}

visualBtn.onclick = function () {
  visualize = !visualize;
  if (visualize) {
    visualBtn.value = "Unvisualize Waves";
  } else {
    visualBtn.value = "Visualize Waves";
  }
}

bgBtn.onclick = function () {
  output_background.style.background = bg_color.value;
}

precBtn.onclick = function () {
  var number = Number(precision_element.value);
  if (number >= 0 && number <= 1) {
    threshold = number;
  } else {
    threshold = STARTING_THRESHOLD;
    precision_element.value = STARTING_THRESHOLD;
  }
}

