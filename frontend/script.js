let handOpen = true;
let shakingIntervalId = false;
let bowingIntervalId = false;
window.code = "";

let isBowing = false;

const twistInput = document.getElementById("twist");
const wristInput = document.getElementById("wrist");
const elbowInput = document.getElementById("elbow");
const shoulderInput = document.getElementById("shoulder");
const rotateInput = document.getElementById("rotate");

const handButton = document.getElementById("togglehand");
const shakeButton = document.getElementById("toggleshake");
const bowButton = document.getElementById("togglebow");
function renderActions() {
  handButton.innerHTML = `${handOpen ? "Close" : "Open"} Hand`;
  handButton.classList.remove(handOpen ? "bg-green-500" : "bg-green-600");
  handButton.classList.add(handOpen ? "bg-green-600" : "bg-green-500");

  shakeButton.innerHTML = `${shakingIntervalId ? "stop shaking" : "shake"}`;
  shakeButton.classList.remove(
    shakingIntervalId ? "bg-yellow-500" : "bg-red-500"
  );
  shakeButton.classList.add(shakingIntervalId ? "bg-red-500" : "bg-yellow-500");

  bowButton.innerHTML = `${isBowing ? "Stop Bowing" : "Bow"}`;
  bowButton.classList.remove(isBowing ? "bg-blue-500" : "bg-gray-500");
  bowButton.classList.add(isBowing ? "bg-gray-500" : "bg-blue-500");
}
renderActions();

function shake() {
  twistInput.value = 40;
  shoulderInput.value = 80;
  elbowInput.value = 80;
  wristInput.value = 50;
  rotateInput.value = 50;
  changed.flush();
  changed();
  setTimeout(() => {
    twistInput.value = 40;
    shoulderInput.value = 20;
    elbowInput.value = 50;
    wristInput.value = 50;
    rotateInput.value = 50;
    changed.flush();
    changed();
  }, 250);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function bow() {
  twistInput.value = 50;
  shoulderInput.value = 53;
  elbowInput.value = 93;
  wristInput.value = 74;
  rotateInput.value = 30;
  changed.flush();
  changed();
  setTimeout(async () => {
    elbowInput.value = 64;
    changed.flush();
    changed();
    await sleep(300);

    elbowInput.value = 55;
    changed.flush();

    await sleep(300);
    elbowInput.value = 46;
    changed.flush();

    await sleep(300);
    elbowInput.value = 37;
    changed.flush();
    changed();
  }, 1000);
}

const changed = throttle(async (id) => {
  console.log("changed");
  if (id === "togglehand") {
    handOpen = !handOpen;
  } else if (id === "toggleshake") {
    if (shakingIntervalId) {
      clearInterval(shakingIntervalId);
      shakingIntervalId = null;
    } else {
      shakingIntervalId = setInterval(shake, 250 * 2);
      clearInterval(bowingIntervalId);
    }
  } else if (id === "togglebow") {
    isBowing = !isBowing;
    // if (bowingIntervalId) {
    //   clearInterval(bowingIntervalId);
    //   bowingIntervalId = null;
    // } else {
    //   bowingIntervalId = setInterval(bow, 1000 * 2);
    //   clearInterval(shakingIntervalId);
    // }
    // toggleBowing
  }

  renderActions();

  // return;

  // const el = document.getElementById(id);
  // const value = el.value;
  // const url = `https://triggmagic.ngrok.io/?${id}=${value}`;
  let url = `https://triggmagic.ngrok.io/?`;

  // cruise ship mode
  if (window.location.port === "8000") {
    url = `http://${window.location.hostname}:5001/?`;
  }

  document.querySelectorAll("input").forEach((el) => {
    // console.log(el)
    url += `${el.id}=${el.value}&`;
  });

  url += `hand=${handOpen ? "0" : "100"}`;
  url += `&auth=${window.code}`;
  url += `&bowing=${isBowing ? "1" : "0"}`;

  // console.log(url);
  // alert(url);
  try {
    const res = await fetch(url).then((res) => res.json());
    console.log({ res });
  } catch (e) {
    console.error(e.message);
  }
}, 250);

function setCode() {
  window.code = document.getElementById("code").value;
}

function map(value, low1, high1, low2, high2) {
  const newValue = low2 + ((high2 - low2) * (value - low1)) / (high1 - low1);
  return Math.min(high2, Math.max(low2, newValue));
}
// max movement in percentage points per second
const v = 30;
let vx = 0,
  vy = 0;

// console.log("making joystick");
const joy = new JoyStick(
  "joyDiv",
  { width: window.innerWidth - 64, height: window.innerWidth - 64 },
  ({ x, y }) => {
    // vx = -map(x, -100, 100, -1, 1) * v;
    vx = map(x, -100, 100, -1, 1) * v;
    vy = map(y, -100, 100, -1, 1) * v;
    // console.log({ x, y, vx, vy });
  }
);

const updatesPerSecond = 10;
console.log("hi");
function joystickMove() {
  // twistInput;
  // wristInput;
  // elbowInput;
  // shoulderInput;
  // rotateInput;
  wristInput.value = Math.max(
    10,
    parseInt(wristInput.value) + vy / updatesPerSecond
  );
  console.log("wristInput", wristInput.value);
  elbowInput.value = Math.max(
    10,
    parseInt(elbowInput.value) + vy / updatesPerSecond
  );
  shoulderInput.value = Math.max(
    10,
    parseInt(shoulderInput.value) + vy / updatesPerSecond
  );

  rotateInput.value = parseInt(rotateInput.value) + vx / updatesPerSecond;
  if (vy !== 0 || vx !== 0) changed();
}
setInterval(joystickMove, 1000 / updatesPerSecond);

const advancedDiv = document.getElementById("advanced");
const advancedButton = document.getElementById("toggleadvanced");
let showAdvanced = false;
function toggleAdvanced() {
  if (showAdvanced) {
    advancedDiv.classList.add("hidden");
    advancedButton.innerHTML = "show controls";
  } else {
    advancedDiv.classList.remove("hidden");
    advancedButton.innerHTML = "hide controls";
  }
  showAdvanced = !showAdvanced;
}

/*
const debug = document.getElementById("debug");
const elbow = document.getElementById("elbow");
const wrist = document.getElementById("wrist");
const rotate = document.getElementById("twist");
let startingYaw = null;

const startTrackingButton = document.getElementById("startTracking");

debug.innerText = "setting up";
if (window.DeviceOrientationEvent) {
  debug.innerText = "has DeviceOrientationEvent";

  function setup() {
    debug.innerText = "setup()";
    startTrackingButton.remove();
    window.addEventListener(
      "deviceorientation",
      ({ alpha: yaw, beta: pitch, gamma: roll }) => {
        debug.innerText = `pitch=${pitch.toFixed(2)}, roll=${roll.toFixed(
          2
        )}, yaw=${yaw.toFixed(2)}`;

        // startingYaw || (startingYaw = yaw);
        // const yawDiff = startingYaw - yaw;

        elbow.value = map(pitch, 90, -90, 0, 100);
        wrist.value = map(roll, -90, 90, 0, 100);
        // rotate.value = map(yaw, 0, 360, 0, 100);
        changed();
      }
    );
  }

  if (typeof DeviceOrientationEvent.requestPermission !== "function") {
    // on non-iOS 13 phones you can just start using tracking
    setup();
  }
} else {
  alert("Cannot use accelerometer.");
}

function startTracking() {
  DeviceOrientationEvent.requestPermission().then(permissionState => {
    debug.innerText = `permissionState = ${permissionState}`;

    if (permissionState === "granted") {
      setup();
    } else {
      alert("You didn't allow orientation events :(");
    }
  });
}
*/
