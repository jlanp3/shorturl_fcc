require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const dns = require("node:dns");
const bodyParser = require("body-parser");
const db = require("./db");

app.use(bodyParser.urlencoded({ extended: false }));

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.post("/api/shorturl", (req, res) => {
  const { url } = req.body;
  let reg = /^https:\/\/\w.+|^http:\/\/\w.+/;
  if (reg.test(url)) {
    dns.lookup(url.replace("https://", ""), (err, address, family) => {
      if (!url) {
        res.status(400).send("Url required");
      } else {
        const sql = "INSERT INTO links (url) VALUES (?)";
        db.run(sql, [url], function (err) {
          if (err) {
            console.error(err.message);
            res.redirect("/");
          } else {
            const id = this.lastID;
            res.status(201).send({ original_url: url, short_url: id });
          }
        });
      }
    });
  } else {
    res.json({ error: "invalid url" });
  }
});

app.get("/api/shorturl/:num?", (req, res) => {
  console.log(req.params.num);
  const { num } = req.params;
  db.get("SELECT url FROM links WHERE id = ?", [num], (err, row) => {
    if (err) {
      console.error(err.message);
      res.status(500).send("Internal server error");
    } else if (!row) {
      res.status(404).json({ error: "No short URL found for the given input" });
    } else {
      res.status(301).redirect(row.url);
      //res.json(row.url);
    }
  });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
