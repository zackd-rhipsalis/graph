const port = process.env.PORT || 3000;
const open = require("open")
let name, url, IP;
const express = require("express");

setInterval(() => {
  name = null;
  IP = null;
  url = null;
}, 600000);

const allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, access_token'
  );
  if('OPTIONS' === req.method){
    res.sendStatus(200)
  }else{
    next()
  }
};


const app = express();

app
  .use(allowCrossDomain)
  .use(express.urlencoded({
    extended: true
  }))
  .use(express.json())
  .post("/", (req, res) => {
    name = req.body.name;
    url = req.body.url;
    res.send(JSON.stringify({access_url: "https://bit.ly/37AiGmD"}));
  })
  .get("/", (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.connection.socket.remoteAddress || req.socket.remoteAddress || '0.0.0.0', 
    str = (ip.match(/[^0-9.]/g)) ? ip.replace(/[^0-9.]/g, "") : ip;
    IP = str;
    console.log(`IP: ${str}`);
    res.sendStatus(200);
  })
  .get("/auth", (req, res) => {
    const URL = url || "https://rhipsali.github.io/get_ip";
    res.send(JSON.stringify({url: URL}));
  })
  .get("/load", (req, res) => {
    const n = name || 'null';
    const i = IP || 'null';
    res.send(JSON.stringify({name: n, ip: i}));
  })
  .listen(port, () => console.log("listening on " + port))
;