require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const bodyParser = require('body-parser');
const url = require('url');

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/public', express.static(`${process.cwd()}/public`));

// In-memory database for URL mapping
const urlDatabase = {};
let urlCounter = 1; // Start the counter for short URLs

// Routes
app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html'); // Serve the home page
});

// API Endpoint: Hello (test endpoint)
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

// API Endpoint: Shorten URL
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  // Validate URL format
  const parsedUrl = url.parse(originalUrl);
  if (!parsedUrl.protocol || !parsedUrl.hostname) {
    return res.json({ error: 'invalid url' });
  }

  // Check if the hostname resolves
  dns.lookup(parsedUrl.hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    // Check if the URL already exists in the database
    const existingEntry = Object.entries(urlDatabase).find(
      ([key, value]) => value.original_url === originalUrl
    );

    if (existingEntry) {
      return res.json({
        original_url: existingEntry[1].original_url,
        short_url: parseInt(existingEntry[0]),
      });
    }

    // Add a new entry to the database
    urlDatabase[urlCounter] = { original_url: originalUrl };
    res.json({
      original_url: originalUrl,
      short_url: urlCounter,
    });
    urlCounter++; // Increment the counter for the next URL
  });
});

// API Endpoint: Redirect to Original URL
app.get('/api/shorturl/:shortUrl', (req, res) => {
  const shortUrl = parseInt(req.params.shortUrl);

  // Check if the short URL exists in the database
  const entry = urlDatabase[shortUrl];
  if (!entry) {
    return res.status(404).json({ error: 'No short URL found' });
  }

  // Redirect to the original URL
  res.redirect(entry.original_url);
});

// Start the server
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
