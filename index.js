const express = require("express");
const bodyParser = require("body-parser");
const dns = require("dns");
const url = require("url");

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("public"));

// In-memory database
const urlDatabase = {};
let urlCounter = 1;

// Home Page
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// API Endpoint: Shorten URL
app.post("/api/shorturl", (req, res) => {
  const originalUrl = req.body.url;

  // Validate URL format
  const parsedUrl = url.parse(originalUrl);
  if (!parsedUrl.protocol || !parsedUrl.hostname) {
    return res.json({ error: "invalid url" });
  }

  // Check if the hostname resolves
  dns.lookup(parsedUrl.hostname, (err) => {
    if (err) {
      return res.json({ error: "invalid url" });
    }

    // Check if URL is already in the database
    const existingEntry = Object.entries(urlDatabase).find(
      ([key, value]) => value.original_url === originalUrl
    );

    if (existingEntry) {
      return res.json({
        original_url: existingEntry[1].original_url,
        short_url: parseInt(existingEntry[0]),
      });
    }

    // Add new entry to the database
    urlDatabase[urlCounter] = { original_url: originalUrl };
    res.json({
      original_url: originalUrl,
      short_url: urlCounter,
    });
    urlCounter++;
  });
});

// API Endpoint: Redirect to Original URL
app.get("/api/shorturl/:shortUrl", (req, res) => {
  const shortUrl = req.params.shortUrl;

  // Check if the short URL exists in the database
  const entry = urlDatabase[shortUrl];
  if (!entry) {
    return res.status(404).json({ error: "No short URL found" });
  }

  // Redirect to the original URL
  res.redirect(entry.original_url);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
