const SerialPort = require("serialport");
const http = require("http");
const url = require("url");

// TODO: automatically find the port
const port = new SerialPort("/dev/tty.usbserial-AI03Y3S1");
const authCode = process.argv[2];

function write(cmd) {
  port.write(JSON.stringify(cmd), function (err) {
    if (err) {
      return console.log("Error on write: ", err.message);
    }
    // console.log("message written");
  });
}

// write({'rangeud': 50, 'rangelr': 180, 'rangefb': 50, 'rangeg': 100, 'rangew1': 0})

// Switches the port into "flowing mode"
let lastMessage = "";
let buffer = "";
port.on("data", function (data) {
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
  if (authCode && query["auth"] !== authCode) {
    res.write(JSON.stringify({ error: `invalid auth code ${query["auth"]}` }));
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
  Object.keys(command).forEach(key => {
    if (command[key] === undefined) {
      delete command[key];
    } else {
      command[key] = parseInt(command[key]);
    }
  });

  if (Object.keys(command).length > 0) {
    console.log(command);
    write(command);
  }

  res.write(JSON.stringify({ command, lastMessage }));
  res.end();
});

server.listen(5000);

console.log(
  `Node.js web server at port 5000 is running with authCode=${authCode}`
);
