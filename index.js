const express = require('express');
const bodyParser = require('body-parser');
const dns = require('dns');
const shortid = require('shortid');
require('dotenv').config();

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static('public'));

// Store URLs
const urlDatabase = {"1": "https://github.com/laabousse"};

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// POST endpoint to shorten URL
app.post('/api/shorturl', (req, res) => {
  const originalUrl = req.body.url;

  // Validate URL format
  const urlPattern = /^https?:\/\/([\w.-]+)/;
  const match = originalUrl.match(urlPattern);
  if (!match) {
    return res.json({ error: 'invalid url' });
  }

  const hostname = match[1];

  // Check DNS lookup
  dns.lookup(hostname, (err) => {
    if (err) {
      return res.json({ error: 'invalid url' });
    }

    const shortUrl = shortid.generate();
    urlDatabase[shortUrl] = originalUrl;

    res.json({ original_url: originalUrl, short_url: shortUrl });
  });
});

// GET endpoint to redirect to original URL
app.get('/api/shorturl/:shortUrl', (req, res) => {
  const shortUrl = req.params.shortUrl;

  const originalUrl = urlDatabase[shortUrl];
  if (!originalUrl) {
    return res.status(404).json({ error: 'No short URL found' });
  }

  res.redirect(originalUrl);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
