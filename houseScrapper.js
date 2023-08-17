const fs = require("fs");
const jsYaml = require("js-yaml");
const cheerio = require("cheerio");
//const xlsx = require("xlsx");
const url = "https://www.legis.state.pa.us/cfdocs/admin/ld/gen_search.cfm?office=All&agency=HSE";
const puppeteer = require('puppeteer');
require("dotenv").config();

const callScrapper = async (res) => {
    const browser = await puppeteer.launch({
        headless: "new",
        /*args: [
          "--disable-setuid-sandbox",
          "--no-sandbox",
          "--single-process",
          "--no-zygote",
        ],*/
        executablePath:
          process.env.NODE_ENV === "production"
            ? process.env.PUPPETEER_EXECUTABLE_PATH
            : puppeteer.executablePath(),
      });
    try {

    const page = await browser.newPage();

    await page.goto(url, {
      waitUntil: "networkidle2"
    });

    await page.waitForTimeout(2000);
    await page.hover("#getEmail button");
    await page.waitForTimeout(1000);
    await page.click("#getEmail button");

    await page.waitForTimeout(3000);

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
    })

    /*fs.writeFile("house_output.yaml", yamlData, (err) => {
      if (err) {
        console.error("Error writing YAML file:", err);
      } else {
        console.log("YAML file generated successfully!");
      }
    });

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(output);

    xlsx.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const excelFilePath = "house_output.xlsx";
    xlsx.writeFile(workbook, excelFilePath);

    console.log("Excel file generated successfully:", excelFilePath);*/

    //await browser.close();

    // Add the following line to require and run the senateWebScraper.js
    //require("./senateWebScraper.js");

  } catch (err) {
    console.error("Error:", err);
    res.send(`Something went wrong: ${err}`);
  } finally {
    await browser.close();
  }
}

module.exports = {
  callScrapper,
}