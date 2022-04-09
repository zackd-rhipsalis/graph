const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

app.get("/", (req, res) => {
  const resData = [];
  const ip = req.ip || req.headers['x-forworded-for'] || req.connection.remoteAddress || undefined;
  const str = (ip.match(/[^0-9\.]/)) ? ip.replace(/[^0-9\.]/g, "") : ip;
  console.log(str);
  resData.push(str);
  res.send(JSON.stringify(resData));
});

app.listen(port, () => console.log("listening on " + port));