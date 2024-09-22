const fs = require('fs');
const puppeteer = require("puppeteer-extra");
const request = require('request');
const RecaptchaPlugin = require("puppeteer-extra-plugin-recaptcha");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const axios = require("axios");
const { google } = require("googleapis");
const { findLink } = require("./index.js");
const key = require("./service_account.json");


app.use(cors());
app.use(express.json());

const jwtClient = new google.auth.JWT(
  key.client_email,
  null,
  key.private_key,
  ["https://www.googleapis.com/auth/indexing"],
  null
);

// Authorize JWT Client
jwtClient.authorize((err, tokens) => {
  if (err) {
    console.error("Error authorizing JWT client:", err);
    return;
  }
  console.log("JWT client authorized");
});

// Function to send URLs to Indexing API
const sendUrlsToIndexingAPI = (urls, tokens, callback) => {
  const items = urls.map(url => {
    return {
      'Content-Type': 'application/http',
      'Content-ID': '',
      body: `POST /v3/urlNotifications:publish HTTP/1.1\nContent-Type: application/json\n\n${JSON.stringify({
        url: url,
        type: 'URL_UPDATED'
      })}`
    };
  });

  const options = {
    url: 'https://indexing.googleapis.com/batch',
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/mixed'
    },
    auth: { bearer: tokens.access_token },
    multipart: items
  };

  request(options, (err, resp, body) => {
    if (err) {
      return callback(err, null);
    }
    callback(null, body);
  });
};

app.post('/index-links', (req, res) => {
  const { links } = req.body;  // Accessing array of URLs from request body

  if (!links || !Array.isArray(links)) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  jwtClient.authorize((err, tokens) => {
    if (err) {
      console.error('Authorization error:', err);
      return res.status(500).json({ error: 'Authorization error', details: err });
    }

    sendUrlsToIndexingAPI(links, tokens, (error, response) => {
      if (error) {
        console.error('Failed to send URLs to Google Indexing API:', error);
        return res.status(500).json({ error: 'Failed to send URLs to Google Indexing API', details: error.message });
      }

      console.log('Indexing API response:', response);
      res.json({   success: true,
        message: 'Your request has been successfully processed.',
        response });
    });
  });
});


//check 2captcha key
const check2CaptchaKey = async (apiKey) => {
  try {
    const response = await axios.get(
      `http://2captcha.com/res.php?key=${apiKey}&action=getbalance&json=1`
    );

    if (response.data.status === 1) {
      return { success: true, balance: response.data.request };
    } else {
      return { success: false, message: response.data.request };
    }
  } catch (error) {
    return { success: false, message: "Error verifying 2Captcha key" };
  }
};


//check links
app.post("/send-links", async (req, res) => {
 const siteMap = req.body.sitemapLink;
  const captchaKey = req.body.captchaKey;
  puppeteer.use(
    RecaptchaPlugin({
      provider: {
        id: "2captcha",
        token: captchaKey, // REPLACE THIS WITH YOUR OWN 2CAPTCHA API KEY ⚡
      },
      visualFeedback: true, // colorize reCAPTCHAs (violet = detected, green = solved)
    })
  );
  // Check the 2Captcha key
  const captchaCheck = await check2CaptchaKey(captchaKey);

  if (!captchaCheck.success) {
    return res
      .status(400)
      .send({ error: "Invalid 2Captcha key", message: captchaCheck.message });
  }
  const results = await findLink(siteMap);

  res.send({ results });
});
app.listen(process.env.PORT, () => {
  console.log(`app listening on port ${process.env.PORT}`);
});
