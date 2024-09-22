const puppeteer = require("puppeteer-extra");
const axios = require("axios");
const cheerio = require("cheerio");
require("dotenv").config();

const extractLinksFromSitemap = async (sitemapUrl) => {
  try {
    const { data } = await axios.get(sitemapUrl);
    const $ = cheerio.load(data, { xmlMode: true });

    const links = [];
    $("url").each((index, element) => {
      const loc = $(element).find("loc").text();
      links.push(loc);
    });
    //console.log(links.length);
    return links;
  } catch (error) {
    console.error("An error occurred:", error);
    return [];
  }
};

/*
const checkIfIndexed = async (page, link) => {
  const searchUrl = `https://www.google.com/search?q=site:${encodeURIComponent(
    link
  )}`;

  try {
    await page.goto(searchUrl, { waitUntil: "networkidle2" });
    await page.waitForTimeout(2000);
    const isRecaptchaPresent = await page.evaluate(() => {
      return document.querySelector('iframe[src*="recaptcha"]') !== null;
    });
 
    
    if (isRecaptchaPresent) {
      console.log("reCAPTCHA detected, solving...");
      const { captchas, solutions, solved, error } =
        await page.solveRecaptchas();
      if (error) {
        console.error("Error solving reCAPTCHA:", error);
      } else {
        console.log("reCAPTCHA solved:", solved);
      }
      await page.waitForTimeout(2000); // Wait for the page to reload after solving CAPTCHA
    }
    await page.waitForTimeout(2000); // Wait for a short time to allow results to load with infinite scroll.
    const isIndexed = await page.evaluate(() => {
      const results = Array.from(document.querySelectorAll(".tF2Cxc"));
      return results.length > 0;
    });
    return isIndexed;
  } catch (error) {
    console.error(
      "An error occurred while checking if link is indexed:",
      error
    );
    return false;
  }
};
*/
const checkIfIndexed = async (page, link) => {
  const searchUrl = `https://www.google.com/search?q=site:${encodeURIComponent(link)}`;

  // Helper function to simulate wait
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  try {
    await page.goto(searchUrl, { waitUntil: "networkidle2" });

    // Replace waitForTimeout with a manual timeout
    await wait(2000);

    const isRecaptchaPresent = await page.evaluate(() => {
      return document.querySelector('iframe[src*="recaptcha"]') !== null;
    });

    if (isRecaptchaPresent) {
      console.log("reCAPTCHA detected, solving...");
      const { captchas, solutions, solved, error } = await page.solveRecaptchas();
      if (error) {
        console.error("Error solving reCAPTCHA:", error);
      } else {
        console.log("reCAPTCHA solved:", solved);
      }

      // Wait for the page to reload after solving CAPTCHA
      await wait(2000);
    }

    // Wait for a short time to allow results to load with infinite scroll
    await wait(2000);

    const isIndexed = await page.evaluate(() => {
      const results = Array.from(document.querySelectorAll(".tF2Cxc"));
      return results.length > 0;
    });

    return isIndexed;
  } catch (error) {
    console.error("An error occurred while checking if link is indexed:", error);
    return false;
  }
};

const findLink = async (sitemapUrl) => {
  const sitemapLinks = await extractLinksFromSitemap(sitemapUrl);

  const indexedLinks = [];
  const nonIndexedLinks = sitemapLinks.slice();

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Check if the links are indexed
    for (const link of sitemapLinks) {
      const isIndexed = await checkIfIndexed(page, link);
      if (isIndexed) {
        indexedLinks.push(link);
        const index = nonIndexedLinks.indexOf(link);
        if (index !== -1) {
          nonIndexedLinks.splice(index, 1);
        }
      }
    }
  } catch (error) {
    console.error("An error occurred during checking:", error);
  } finally {
    await browser.close();
  }

  return { indexedLinks, nonIndexedLinks };
};

module.exports = {
  extractLinksFromSitemap,
  findLink,
  checkIfIndexed,
};
