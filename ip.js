const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

app.get("/", (req, res) => {
  const resData = [];
  const ip = req.ip || req.headers['x-forworded-for'] || req.connection.remoteAddress || undefined
  console.log(ip);
  resData.push(ip);
  res.send(JSON.stringify(resData));
});

app.listen(port, () => console.log("listening on " + port));