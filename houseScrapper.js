const fs = require("fs");
const jsYaml = require("js-yaml");
const cheerio = require("cheerio");
//const xlsx = require("xlsx");
const url = "https://www.legis.state.pa.us/cfdocs/admin/ld/gen_search.cfm?office=All&agency=HSE";
// const puppeteer = require('puppeteer');
// require("dotenv").config();
const puppeteer = require("puppeteer-extra");
//require("dotenv").config();

// Add stealth plugin and use defaults (all tricks to hide puppeteer usage)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

// Add adblocker plugin to block all ads and trackers (saves bandwidth)
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

const callScrapper = async (res) => {
    const browser = await puppeteer.launch({
        headless: "new",
        // args: [
        //   "--disable-setuid-sandbox",
        //   "--no-sandbox",
        //   "--single-process",
        //   "--no-zygote",
        // ],
        // defaultViewport: {
        //     width: 1280,
        //     height: 1024
        // },
        executablePath:
          process.env.NODE_ENV === "production"
            ? process.env.PUPPETEER_EXECUTABLE_PATH
            : puppeteer.executablePath(),
    });
    const page = await browser.newPage();
      
    await page.goto(url, {
        waitUntil: "networkidle2"
    });
    // await page.waitForTimeout(2000);
    
    console.log('First step');
    await page.waitForSelector('body');
    await page.hover("#getEmail button");
    await page.waitForTimeout(3000);
    await page.click("#getEmail button");
    console.log('Second step');
      
    await page.waitForTimeout(3000);
      
    await page.waitForSelector('body');
    const html = await page.evaluate(() => document.body.innerHTML);
      
    const $ = cheerio.load(html);
    let output = [];
    const emailRegex = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
      
    $(".mediumfont", html).each(function () {
        let tableData = $(this).find("td");
        const email = tableData.eq(6).text().trim().match(emailRegex);
        let data = {
            name: tableData.eq(0).text().trim(),
            position: tableData.eq(1).text().trim(),
            office: tableData.eq(2).text().trim(),
            location: tableData.eq(3).text().trim(),
            phone: tableData.eq(4).text().trim(),
            fax: tableData.eq(5).text().trim(),
            email: email ? email[0] : null
        };
        
        output.push(data);
    });

    const yamlData = jsYaml.dump(output);
    res.status(200).json({
        data: yamlData,
    });
}

module.exports = {
  callScrapper,
}