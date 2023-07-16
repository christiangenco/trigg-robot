const { SerialPort } = require("serialport");
const http = require("http");
const url = require("url");

// // TODO: automatically find the port
// SerialPort.list().then((ports) => {
//   console.log("nice");
//   ports.forEach((port) => {
//     console.log(port.path);
//   });
// });

const port = new SerialPort({
  path: "/dev/cu.usbserial-0001",
  // path: "/dev/cu.usbserial-AB7XYDB2",
  baudRate: 9600,
});

const authCode = process.argv[2];

let lastMessage = "";
let buffer = "";
port.on("data", function (data) {
  console.log("message ");
  process.stdout.write(data.toString());

  buffer += data.toString();
  if (buffer.includes("\r\n")) {
    lastMessage = buffer;
    buffer = "";
  }
});

// Open errors will be emitted as an error event
port.on("error", function (err) {
  console.log("Error: ", err.message);
});

const FRAME_HEADER = 0x55;
const CMD_SERVO_MOVE = 0x03;
// const CMD_ACTION_GROUP_RUN = 0x06;
// const CMD_ACTION_GROUP_STOP = 0x07;
// const CMD_ACTION_GROUP_SPEED = 0x0b;
// const CMD_GET_BATTERY_VOLTAGE = 0x0f;
// const BATTERY_VOLTAGE = 0x0f;
// const ACTION_GROUP_RUNNING = 0x06;
// const ACTION_GROUP_STOPPED = 0x07;
// const ACTION_GROUP_COMPLETE = 0x08;

const extremes = {
  hand: { min: 300, max: 750, normal: 500, id: 1 },

  twist: { min: 100, max: 900, normal: 500, id: 2 },
  wrist: { min: 800, max: 500, normal: 500, id: 3 },
  elbow: { min: 260, max: 500, normal: 500, id: 4 },
  shoulder: { min: 640, max: 500, normal: 500, id: 5 },
  rotate: { min: 290, max: 1000, normal: 489, id: 6 },
};

function moveServos(servos, time) {
  if (
    servos.length < 1 ||
    servos.length > Object.keys(extremes).length ||
    !(time > 0)
  ) {
    console.error("Invalid parameters", servos, time);
    return;
  }

  let buffer = Buffer.alloc(servos.length * 3 + 7);
  buffer.writeUInt8(FRAME_HEADER, 0); // Fill in frame header
  buffer.writeUInt8(FRAME_HEADER, 1);
  buffer.writeUInt8(servos.length * 3 + 5, 2); // Data length = number of servos to control * 3 + 5
  buffer.writeUInt8(CMD_SERVO_MOVE, 3); // Fill in servo move command
  buffer.writeUInt8(servos.length, 4); // Number of servos to control
  buffer.writeUInt8(time & 0xff, 5); // Fill in the low eight bits of time
  buffer.writeUInt8(time >> 8, 6); // Fill in the high eight bits of time

  let index = 7;
  for (let i = 0; i < servos.length; i++) {
    // const servoExtremes = extremes[servos[i].id];
    let position = servos[i].position;
    // position = Math.min(position, servoExtremes.max);
    // position = Math.max(position, servoExtremes.min);

    // Fill in each servo ID and its corresponding target position
    buffer.writeUInt8(servos[i].id, index++); // Fill in servo ID
    buffer.writeUInt8(position & 0xff, index++); // Fill in low eight bits of target position
    buffer.writeUInt8(position >> 8, index++); // Fill in high eight bits of target position
  }

  port.write(buffer, function (err) {
    if (err) {
      console.log("Error on write: ", err.message);
    } else {
      console.log("Command sent");
    }
  });
}
// ex: moveServos({ id: 1, position: 500 }, 2000);

function map(value, start1, stop1, start2, stop2) {
  return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
}

function executeCommand(command, time = 250) {
  const servos = [];
  // const time = 250;
  Object.entries(command).forEach(([key, value]) => {
    const { min, max, normal, id } = extremes[key];
    console.log(value, map(value, 0, 100, min, max));
    servos.push({ id, position: map(value, 0, 100, min, max) });
  });
  // console.log(servos);
  moveServos(servos, time);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let isBowing = false;
async function bow() {
  executeCommand(
    { twist: 50, shoulder: 53, elbow: 93, wrist: 74, rotate: 30, hand: 100 },
    1000
  );
  await sleep(1400);
  executeCommand(
    { twist: 50, shoulder: 53, elbow: 28, wrist: 0, rotate: 30, hand: 0 },
    1000
  );
  await sleep(2000);
  if (isBowing) bow();
}

async function snatch() {
  executeCommand(
    { twist: 0, shoulder: -40, elbow: 20, wrist: 50, rotate: 30, hand: 20 },
    1000
  );
  await sleep(1000);
  executeCommand(
    { twist: 0, shoulder: -40, elbow: 140, wrist: 140, rotate: 30, hand: 50 },
    50
  );
}

const server = http.createServer(function (req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Request-Method", "*");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET");
  res.setHeader("Access-Control-Allow-Headers", "*");
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  const query = url.parse(req.url, true).query;
  console.log(query);
  if (query["magicCatch"] === "69") {
    // isBowing = bowing;
    // if (isBowing) bow();
    snatch();
    res.write(JSON.stringify({ magicCatch: 420 }));
    res.end();
    return;
  }

  if (authCode && query["auth"] !== authCode) {
    res.write(JSON.stringify({ error: `invalid auth code ${query["auth"]}` }));
    res.end();
    return;
  }

  const bowing = query["bowing"] === "1";
  if (bowing !== isBowing) {
    isBowing = bowing;
    if (isBowing) bow();
    res.write(JSON.stringify({ isBowing }));
    res.end();
    return;
  }

  const command = {
    hand: query["hand"],
    twist: query["twist"],
    wrist: query["wrist"],
    elbow: query["elbow"],
    shoulder: query["shoulder"],
    rotate: query["rotate"],
  };
  Object.keys(command).forEach((key) => {
    if (command[key] === undefined) {
      delete command[key];
    } else {
      command[key] = parseInt(command[key]);
    }
  });

  if (Object.keys(command).length > 0) {
    console.log(command);
    executeCommand(command);
  }

  res.write(JSON.stringify({ command, lastMessage }));
  res.end();
});

const webport = 5001;
server.listen(webport);

console.log(
  `Node.js web server at http://localhost:${webport} is running with authCode=${authCode}`
);
