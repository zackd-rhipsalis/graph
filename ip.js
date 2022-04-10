const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

app.get("/", (req, res) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.connection.socket.remoteAddress || req.socket.remoteAddress || '0.0.0.0', 
  str = (ip.match(/[^0-9.]/g)) ? ip.replace(/[^0-9.]/g, "") : ip;
  console.log(`IP: ${str}`);
  res.sendStatus(200);
});

app.listen(port, () => console.log("listening on " + port));