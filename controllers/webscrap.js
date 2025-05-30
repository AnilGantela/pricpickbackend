const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const Product = require("../models/Product");
const Retailer = require("../models/Retailer");
const RetailerDetails = require("../models/RetailerDetails");
const mongoose = require("mongoose");
const chromium = require("@sparticuz/chrome-aws-lambda");
const puppeteer = require("puppeteer-extra");
const NodeCache = require("node-cache");
const dotEnv = require("dotenv");
const Order = require("../models/Order");
dotEnv.config();

// Initialize cache with a 1-hour TTL
const cache = new NodeCache({ stdTTL: 3600 });

// Use Stealth Plugin to avoid detection
puppeteer.use(StealthPlugin());

class ProductScraper {
  constructor(searchQuery) {
    this.searchQuery = searchQuery;
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    try {
      this.browser = await puppeteer.launch({
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--disable-gpu",
        ],
        executablePath: "/usr/bin/google-chrome-stable",
        ignoreDefaultArgs: ["--disable-extensions"],
      });

      this.page = await this.browser.newPage();
      await this.page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
      );

      await this.page.setExtraHTTPHeaders({
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://www.google.com/",
      });

      await this.page.evaluateOnNewDocument(() => {
        navigator.geolocation.getCurrentPosition = (cb) => {
          cb({
            coords: {
              latitude: 17.6868,
              longitude: 83.2185,
              accuracy: 100,
            },
          });
        };
      });

      console.log("✅ Browser initialized successfully.");
    } catch (error) {
      console.error("❌ Failed to launch Puppeteer:", error);
    }
  }

  async searchFlipkart() {
    const URL = "https://www.flipkart.com/";
    console.log("🚀 Opening Flipkart...");
    await this.page.goto(URL, { waitUntil: "domcontentloaded" });
    try {
      await this.page.waitForSelector("button._2KpZ6l._2doB4z", {
        timeout: 5000,
      });
      await this.page.click("button._2KpZ6l._2doB4z");
    } catch (e) {
      console.log("ℹ️ No login popup found.");
    }

    // Make sure page loads completely
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Selectors
    const selectors = {
      searchBox: ".Pke_EE",
      productList: ".col-12-12",
      title: ".KzDlHZ",
      price: ".Nx9bqj._4b5DiR",
      productLink: "a",
    };
    console.log(`⌨️ Searching for '${this.searchQuery}' on flipkart...`);

    try {
      await this.page.waitForSelector(selectors.searchBox, { timeout: 10000 });

      // Clear the input
      await this.page.click(selectors.searchBox, { clickCount: 3 });
      await this.page.keyboard.press("Backspace");

      // Type query and search
      await this.page.type(selectors.searchBox, this.searchQuery, {
        delay: 100,
      });
      await this.page.keyboard.press("Enter");

      console.log("⏳ Waiting for search results...");
      await this.page.waitForSelector(selectors.productList, {
        timeout: 30000,
      });

      console.log("📜 Scrolling to load more products...");
      await this.scrollPage();

      console.log("🔎 Extracting product details...");
      return await this.page.evaluate((selectors) => {
        return Array.from(document.querySelectorAll(selectors.productList))
          .map((item) => {
            const titleElement = item.querySelector(selectors.title);
            const priceElement = item.querySelector(selectors.price);
            const productLinkElement = item.querySelector(
              selectors.productLink
            );

            return {
              title: titleElement
                ? titleElement.innerText.trim()
                : "No title found",
              price: priceElement
                ? priceElement.innerText.replace(/[^\d]/g, "")
                : "Price not available",
              retailer: "Flipkart",
              productLink: productLinkElement
                ? "https://www.flipkart.com" +
                  productLinkElement.getAttribute("href")
                : "No link available",
            };
          })
          .filter((product) => product.title !== "No title found");
      }, selectors);
    } catch (error) {
      console.log("⚠️ No products found or site blocking automation.");
      return [];
    }
  }

  async searchRelianceDigital() {
    const URL = "https://www.reliancedigital.in/";
    console.log("🚀 Opening Reliance Digital...");
    await this.page.goto(URL, { waitUntil: "domcontentloaded" });

    // Make sure page loads completely
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Selectors

    const selectors = {
      searchBox: ".search-input",
      searchButton: ".input-search-icon",
      productList: ".product-card",
      title: ".product-card-title",
      price: ".price",
      productLink: "a.details-container",
    };

    console.log(
      `⌨️ Searching for '${this.searchQuery}' on Reliance Digital...`
    );

    try {
      await this.page.waitForSelector(selectors.searchBox, { timeout: 10000 });

      // Clear the input
      await this.page.click(selectors.searchBox, { clickCount: 3 });
      await this.page.keyboard.press("Backspace");

      // Type query and search
      await this.page.type(selectors.searchBox, this.searchQuery, {
        delay: 100,
      });
      await this.page.keyboard.press("Enter");

      console.log("⏳ Waiting for search results...");
      await this.page.waitForSelector(selectors.productList, {
        timeout: 30000,
      });

      console.log("📜 Scrolling to load more products...");
      await this.scrollPage();

      console.log("🔎 Extracting product details...");
      return await this.page.evaluate((selectors) => {
        return Array.from(document.querySelectorAll(selectors.productList))
          .map((item) => {
            const titleElement = item.querySelector(selectors.title);
            const priceElement = item.querySelector(selectors.price);
            const productLinkElement = item.querySelector(
              selectors.productLink
            );

            return {
              title: titleElement
                ? titleElement.innerText.trim()
                : "No title found",
              price: priceElement
                ? priceElement.innerText.replace(/[^\d]/g, "")
                : "Price not available",
              retailer: "Reliance Digital",
              productLink: productLinkElement
                ? "https://www.reliancedigital.in" +
                  productLinkElement.getAttribute("href")
                : "No link available",
            };
          })
          .filter((product) => product.title !== "No title found");
      }, selectors);
    } catch (error) {
      console.log("⚠️ No products found or site blocking automation.");
      return [];
    }
  }

  async searchCroma() {
    const URL = "https://www.croma.com/";
    console.log("🚀 Opening Croma...");
    await this.page.goto(URL, { waitUntil: "domcontentloaded" });

    // Make sure page loads completely
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Selectors
    const selectors = {
      searchBox: "#searchV2",
      productList: ".product-item",
      title: ".product-title",
      price: ".amount",
      productLink: "a",
    };

    console.log(`⌨️ Searching for '${this.searchQuery}' on Croma...`);

    try {
      await this.page.waitForSelector(selectors.searchBox, { timeout: 10000 });

      // Clear the input
      await this.page.click(selectors.searchBox, { clickCount: 3 });
      await this.page.keyboard.press("Backspace");

      // Type query and search
      await this.page.type(selectors.searchBox, this.searchQuery, {
        delay: 100,
      });
      await this.page.keyboard.press("Enter");

      console.log("⏳ Waiting for search results...");
      await this.page.waitForSelector(selectors.productList, {
        timeout: 30000,
      });

      console.log("📜 Scrolling to load more products...");
      await this.scrollPage();

      console.log("🔎 Extracting product details...");
      return await this.page.evaluate((selectors) => {
        return Array.from(document.querySelectorAll(selectors.productList))
          .map((item) => {
            const titleElement = item.querySelector(selectors.title);
            const priceElement = item.querySelector(selectors.price);
            const productLinkElement = item.querySelector(
              selectors.productLink
            );

            return {
              title: titleElement
                ? titleElement.innerText.trim()
                : "No title found",
              price: priceElement
                ? priceElement.innerText.replace(/[^\d]/g, "")
                : "Price not available",
              retailer: "Croma",
              productLink: productLinkElement
                ? "https://www.croma.com" +
                  productLinkElement.getAttribute("href")
                : "No link available",
            };
          })
          .filter((product) => product.title !== "No title found");
      }, selectors);
    } catch (error) {
      console.log("⚠️ No products found or site blocking automation.");
      return [];
    }
  }

  async searchJiomart() {
    const URL = "https://www.jiomart.com/";
    console.log("🚀 Opening jiomart...");
    await this.page.goto(URL, { waitUntil: "domcontentloaded" });

    // Make sure page loads completely
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Selectors
    const selectors = {
      searchBox: ".search_input",
      productList: ".ais-InfiniteHits-item",
      title: ".plp-card-details-name",
      price: ".plp-card-details-price>span",
      productLink: "a",
    };

    console.log(`⌨️ Searching for '${this.searchQuery}' on jiomart...`);

    try {
      await this.page.waitForSelector(selectors.searchBox, { timeout: 10000 });

      // Clear the input
      await this.page.click(selectors.searchBox, { clickCount: 3 });
      await this.page.keyboard.press("Backspace");

      // Type query and search
      await this.page.type(selectors.searchBox, this.searchQuery, {
        delay: 100,
      });
      await this.page.keyboard.press("Enter");

      console.log("⏳ Waiting for search results...");
      await this.page.waitForSelector(selectors.productList, {
        timeout: 30000,
      });

      console.log("📜 Scrolling to load more products...");
      await this.scrollPage();

      console.log("🔎 Extracting product details...");
      return await this.page.evaluate((selectors) => {
        return Array.from(document.querySelectorAll(selectors.productList))
          .map((item) => {
            const titleElement = item.querySelector(selectors.title);
            const priceElement = item.querySelector(selectors.price);
            const productLinkElement = item.querySelector(
              selectors.productLink
            );

            return {
              title: titleElement
                ? titleElement.innerText.trim()
                : "No title found",
              price: priceElement
                ? priceElement.innerText.trim().replace(/(\.\d+)?$/, "")
                : "Price not available",
              retailer: "jiomart",
              productLink: productLinkElement
                ? "https://www.jiomart.com/" +
                  productLinkElement.getAttribute("href")
                : "No link available",
            };
          })
          .filter((product) => product.title !== "No title found");
      }, selectors);
    } catch (error) {
      console.log("⚠️ No products found or site blocking automation.");
      return [];
    }
  }

  async searchSnapdeal() {
    const URL = "https://www.snapdeal.com/";
    console.log("🚀 Opening snapdeal...");
    await this.page.goto(URL, { waitUntil: "domcontentloaded" });

    // Make sure page loads completely
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Selectors
    const selectors = {
      searchBox: "#inputValEnter",
      productList: ".col-xs-6",
      title: ".product-title",
      price: ".product-price",
      productLink: "a",
    };

    console.log(`⌨️ Searching for '${this.searchQuery}' on snapdeal...`);

    try {
      await this.page.waitForSelector(selectors.searchBox, { timeout: 10000 });

      // Clear the input
      await this.page.click(selectors.searchBox, { clickCount: 3 });
      await this.page.keyboard.press("Backspace");

      // Type query and search
      await this.page.type(selectors.searchBox, this.searchQuery, {
        delay: 100,
      });
      await this.page.keyboard.press("Enter");

      console.log("⏳ Waiting for search results...");
      await this.page.waitForSelector(selectors.productList, {
        timeout: 30000,
      });

      console.log("📜 Scrolling to load more products...");
      await this.scrollPage();

      console.log("🔎 Extracting product details...");
      return await this.page.evaluate((selectors) => {
        return Array.from(document.querySelectorAll(selectors.productList))
          .map((item) => {
            const titleElement = item.querySelector(selectors.title);
            const priceElement = item.querySelector(selectors.price);
            const productLinkElement = item.querySelector(
              selectors.productLink
            );

            return {
              title: titleElement
                ? titleElement.innerText.trim()
                : "No title found",
              price: priceElement
                ? priceElement.innerText.trim().replace(/(\.\d+)?$/, "")
                : "Price not available",
              retailer: "snapdeal",
              productLink: productLinkElement
                ? "https://www.snapdeal.com" +
                  productLinkElement.getAttribute("href")
                : "No link available",
            };
          })
          .filter((product) => product.title !== "No title found");
      }, selectors);
    } catch (error) {
      console.log("⚠️ No products found or site blocking automation.");
      return [];
    }
  }

  async searchAmazon() {
    const URL = "https://www.amazon.in/";
    const selectors = {
      searchBox: "#twotabsearchtextbox",
      searchButton: "#nav-search-submit-button",
      productList: ".s-result-item[role='listitem']",
      title: ".a-size-medium.a-spacing-none.a-color-base.a-text-normal",
      priceWhole: ".a-price-whole",
      priceFraction: ".a-price-fraction",
      productLink: ".a-link-normal.s-line-clamp-2.s-link-style.a-text-normal",
    };

    console.log("🚀 Opening Amazon...");
    await this.page.goto(URL, { waitUntil: "domcontentloaded" });

    console.log(`⌨️ Typing '${this.searchQuery}' in search...`);
    await this.page.type(selectors.searchBox, this.searchQuery, { delay: 200 });
    await this.page.click(selectors.searchButton);

    console.log("⏳ Waiting for search results...");
    try {
      await this.page.waitForSelector(selectors.productList, {
        timeout: 15000,
      });
    } catch (error) {
      console.log("⚠️ No products found on Amazon.");
      return [];
    }

    console.log("📜 Scrolling to load more products...");
    await this.scrollPage();

    console.log("🔎 Extracting product details...");
    return await this.page.evaluate((selectors) => {
      return Array.from(document.querySelectorAll(selectors.productList))
        .map((item) => {
          const titleElement = item.querySelector(selectors.title);
          const priceWholeElement = item.querySelector(selectors.priceWhole);
          const priceFractionElement = item.querySelector(
            selectors.priceFraction
          );
          const productLinkElement = item.querySelector(selectors.productLink);

          let priceText = priceWholeElement
            ? priceWholeElement.innerText.replace(/[^0-9]/g, "")
            : "";
          let fractionText = priceFractionElement
            ? priceFractionElement.innerText.replace(/[^0-9]/g, "")
            : "00";
          let price = priceText
            ? parseFloat(`${priceText}.${fractionText}`)
            : null;

          return {
            title: titleElement
              ? titleElement.innerText.trim()
              : "No title found",
            price: price !== null ? price : "Price not available",
            retailer: "Amazon",
            productLink: productLinkElement
              ? "https://www.amazon.in" +
                productLinkElement.getAttribute("href")
              : "No link available",
          };
        })
        .filter((product) => product.title !== "No title found");
    }, selectors);
  }

  async scrollPage() {
    let previousHeight = 0;
    while (true) {
      let newHeight = await this.page.evaluate(
        () => document.body.scrollHeight
      );
      if (newHeight === previousHeight) break;
      previousHeight = newHeight;
      await this.page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  async scrapeAll() {
    await this.initialize();
    let results = [];

    // results.push(...(await this.searchSnapdeal()));
    results.push(...(await this.searchFlipkart()));
    results.push(...(await this.searchCroma()));
    results.push(...(await this.searchJiomart()));
    results.push(...(await this.searchAmazon()));
    results.push(...(await this.searchRelianceDigital()));

    await this.browser.close();
    return results;
  }
}

class PriceHistoryScraper {
  constructor(searchQuery) {
    this.searchQuery = searchQuery;
    this.browser = null;
    this.page = null;
  }

  async initialize() {
    try {
      this.browser = await puppeteer.launch({
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--disable-gpu",
        ],
        executablePath: "/usr/bin/google-chrome-stable",
        ignoreDefaultArgs: ["--disable-extensions"],
      });

      this.page = await this.browser.newPage();
      await this.page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
      );

      await this.page.setExtraHTTPHeaders({
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://www.google.com/",
      });

      await this.page.evaluateOnNewDocument(() => {
        navigator.geolocation.getCurrentPosition = (cb) => {
          cb({
            coords: {
              latitude: 17.6868,
              longitude: 83.2185,
              accuracy: 100,
            },
          });
        };
      });

      console.log("✅ Browser initialized successfully.");
    } catch (error) {
      console.error("❌ Failed to launch Puppeteer:", error);
    }
  }

  async scrapePriceHistory() {
    try {
      if (!this.browser || !this.page) {
        await this.initialize();
      }

      const searchURL = `https://pricehistoryapp.com/search?q=${encodeURIComponent(
        this.searchQuery
      )}`;
      console.log(`🔍 Searching for price history : ${this.searchQuery}`);

      await this.page.goto(searchURL, { waitUntil: "domcontentloaded" });
      await new Promise((resolve) => setTimeout(resolve, 4000));

      try {
        await this.page.waitForSelector("a.gs-title", { timeout: 10000 });
      } catch (error) {
        console.log("❌ No search results found!");
        return null;
      }

      const productLinks = await this.page.evaluate(() => {
        return Array.from(document.querySelectorAll("a.gs-title")).map(
          (el) => ({
            title: el.innerText.trim(),
            link: el.href,
          })
        );
      });

      if (productLinks.length < 2) {
        console.log("❌ Less than two search results found!");
        return null;
      }

      const matchedProduct = productLinks.find((product) =>
        product.title.toLowerCase().includes(this.searchQuery.toLowerCase())
      );

      if (!matchedProduct) {
        console.log(`❌ No product found matching: "${this.searchQuery}"`);
        return null;
      }

      console.log(`✅ Match found: ${matchedProduct.title}`);
      console.log(`🔗 Navigating to: ${matchedProduct.link}`);

      await this.page.goto(matchedProduct.link, { waitUntil: "networkidle2" });

      try {
        await this.page.waitForSelector("h1", { timeout: 10000 });
      } catch (error) {
        console.log("❌ Product page failed to load!");
        return null;
      }

      try {
        const buttonSelector =
          ".px-4.py-2.bg-gray-400.text-white.font-medium.rounded.hidden.md\\:block";
        await this.page.waitForSelector(buttonSelector, { timeout: 5000 });
        await this.page.click(buttonSelector);
        console.log("✅ Clicked the button successfully!");
        await new Promise((resolve) => setTimeout(resolve, 4000));
      } catch (error) {
        console.log("⚠️ Button not found or not clickable!");
      }

      let extractedText = null;
      try {
        extractedText = await this.page.$eval(".hljs-string", (el) =>
          el.innerText.trim()
        );
        console.log(`📜 Extracted Text (hljs-string): ${extractedText}`);
      } catch (error) {
        console.log("⚠️ No element found with class 'hljs-string'!");
      }

      return extractedText ? extractedText : null;
    } catch (error) {
      console.error("❌ Error in scrapePriceHistory:", error);
      return null;
    } finally {
      await this.closeBrowser();
    }
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      console.log("✅ Browser closed successfully.");
    }
  }
}

const getProducts = async (req, res) => {
  try {
    const { searchName } = req.params;

    if (!searchName || typeof searchName !== "string" || !searchName.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid search term" });
    }

    const sanitizedQuery = searchName
      .trim()
      .replace(/[^\w\s\-\+\.]/g, "")
      .toLowerCase();

    // Check cache first
    const cachedData = cache.get(sanitizedQuery);
    if (cachedData !== undefined) {
      return res.json({ success: true, ...cachedData });
    }

    const scraper = new ProductScraper(sanitizedQuery);
    const pricehistory = new PriceHistoryScraper(sanitizedQuery);

    // Run both scrapers concurrently
    const [results, history] = await Promise.all([
      scraper.scrapeAll(),
      pricehistory.scrapePriceHistory(),
    ]);

    // Close browser for price history scraper
    await pricehistory.closeBrowser();

    if (!results || results.length === 0) {
      const emptyCacheData = {
        success: true,
        message: "No products found",
        averagePrice: null,
        priceThreshold: null,
        history: history || null,
        results: [],
      };
      cache.set(sanitizedQuery, emptyCacheData, 3600);
      return res.json(emptyCacheData);
    }

    // Step 1: Filter out products with missing prices & convert price strings to numbers
    const filteredResults = results.map((product) => {
      let cleanedPrice = null;

      if (typeof product.price === "string") {
        cleanedPrice = product.price
          .replace(/[,₹Rs]/g, "") // Remove currency symbols & commas
          .trim();

        cleanedPrice = parseFloat(cleanedPrice) || null;
      } else {
        cleanedPrice = product.price;
      }

      return {
        ...product,
        price: cleanedPrice,
      };
    });

    if (filteredResults.length === 0) {
      const noValidPricesData = {
        success: true,
        message: "No valid prices found",
        averagePrice: null,
        priceThreshold: null,
        history: history || null,
        results: [],
      };
      cache.set(sanitizedQuery, noValidPricesData, 3600);
      return res.json(noValidPricesData);
    }

    // Step 2: Calculate the Average Price
    const totalPrice = filteredResults.reduce(
      (sum, product) => sum + product.price,
      0
    );
    const averagePrice = totalPrice / filteredResults.length;

    // Step 3: Compute Threshold (Prevent Unrealistic Thresholds)
    const priceThreshold = Math.max(averagePrice / 3, 1000);

    // Step 4: Remove Products Below the Threshold
    const finalResults = filteredResults.filter(
      (product) => product.price >= priceThreshold
    );

    if (finalResults.length === 0) {
      const noThresholdData = {
        success: true,
        message: "No products met the threshold",
        averagePrice,
        priceThreshold,
        history: history || null,
        results: [],
      };
      cache.set(sanitizedQuery, noThresholdData, 3600);
      return res.json(noThresholdData);
    }

    // Cache full response object
    const responseData = {
      success: true,
      averagePrice,
      priceThreshold,
      history,
      results: finalResults,
    };

    cache.set(sanitizedQuery, responseData, 3600);

    res.json(responseData);
  } catch (error) {
    console.error("❌ Error in getProducts:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
};

const getRetailersProducts = async (req, res) => {
  try {
    const { searchName } = req.params;
    const { city } = req.body;

    // Validate input
    if (!searchName || !searchName.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Search term is required." });
    }

    if (!city || !city.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "City is required." });
    }

    const sanitizedQuery = searchName.trim().replace(/[^\w\s\-\+\.]/g, "");
    const sanitizedCity = city.trim().replace(/[^\w\s\-\+\.]/g, "");

    // Fetch products and populate retailer & retailerDetails
    const products = await Product.find({
      name: { $regex: sanitizedQuery, $options: "i" },
    })
      .populate({
        path: "retailerId",
        populate: { path: "retailerDetailsId" },
      })
      .lean();

    if (!products || products.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No products found." });
    }

    // Filter products by city
    const filteredProducts = products.filter((product) =>
      product.retailerId?.retailerDetailsId?.address?.city
        ?.toLowerCase()
        .includes(sanitizedCity.toLowerCase())
    );

    if (filteredProducts.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No products found in this city." });
    }

    const formattedProducts = filteredProducts.map((product) => ({
      title: product.name,
      shopname: product.retailerId?.retailerDetailsId?.shopname || "N/A",
      price: product.price - (product.price * (product.discount || 0)) / 100,
      discount: product.discount || 0,
      _id: product._id,
    }));

    res.status(200).json({ success: true, products: formattedProducts });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const getAllRetailersProducts = async (req, res) => {
  try {
    const { city } = req.body;

    if (!city || !city.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "City is required." });
    }

    const sanitizedCity = city.trim().replace(/[^\w\s\-\+\.]/g, "");

    const products = await Product.find({})
      .populate({
        path: "retailerId",
        populate: { path: "retailerDetailsId" },
      })
      .lean();

    const filteredProducts = products.filter((product) =>
      product.retailerId?.retailerDetailsId?.address?.city
        ?.toLowerCase()
        .includes(sanitizedCity.toLowerCase())
    );

    if (filteredProducts.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No products found in this city." });
    }

    const formattedProducts = filteredProducts.map((product) => ({
      _id: product._id,
      title: product.name,
      shopname: product.retailerId?.retailerDetailsId?.shopname || "N/A",
      price: product.price - (product.price * (product.discount || 0)) / 100,
      discount: product.discount || 0,
      images: product.images || [],
      category: product.category || "Others",
    }));

    res.status(200).json({ success: true, products: formattedProducts });
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const getProductById = async (req, res) => {
  try {
    const productId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID." });
    }

    const product = await Product.findById(productId).populate({
      path: "retailerId",
      select: "username email retailerDetailsId",
      populate: {
        path: "retailerDetailsId",
        model: "RetailerDetails",
        select: "shopname phoneNumber address shoptime photo", // 👈 includes the shop photo
      },
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const retailer = product.retailerId;
    const retailerDetails = retailer?.retailerDetailsId;

    res.status(200).json({
      message: "Product fetched successfully.",
      product: {
        _id: product._id,
        name: product.name,
        description: product.description,
        price: product.price,
        images: product.images,
        category: product.category,
        stock: product.stock,
        discount: product.discount,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      },
      retailer: {
        _id: retailer._id,
        username: retailer.username,
        email: retailer.email,
        shopname: retailerDetails?.shopname,
        phoneNumber: retailerDetails?.phoneNumber,
        address: retailerDetails?.address,
        shoptime: retailerDetails?.shoptime,
        photo: retailerDetails?.photo, // ✅ Retailer image here
      },
    });
  } catch (error) {
    console.error("Error fetching product:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};

const getAllProductsByRetailerId = async (req, res) => {
  try {
    const { retailerId } = req.params;

    if (!retailerId) {
      return res
        .status(400)
        .json({ success: false, message: "Retailer ID is required." });
    }

    // Fetch all products by retailerId
    const products = await Product.find({ retailerId })
      .populate({
        path: "retailerId",
        populate: { path: "retailerDetailsId" },
      })
      .lean();

    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No products found for this retailer.",
      });
    }

    // Format the product data for response
    const formattedProducts = products.map((product) => ({
      _id: product._id,
      title: product.name,
      shopname: product.retailerId?.retailerDetailsId?.shopname || "N/A",
      price: product.price - (product.price * (product.discount || 0)) / 100,
      discount: product.discount || 0,
      images: product.images || [],
      category: product.category || "Others",
    }));

    res.status(200).json({ success: true, products: formattedProducts });
  } catch (error) {
    console.error("Error fetching products by retailer:", error.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

const createOrder = async (req, res) => {
  try {
    const { userId, username, products, shippingAddress, paymentMethod } =
      req.body;

    // Calculate total amount and product total
    let totalAmount = 0;
    products.forEach((product) => {
      totalAmount +=
        product.price * product.quantity -
        (product.price * product.discount * product.quantity) / 100;
    });

    // Create the order
    const newOrder = new Order({
      userId,
      username,
      products,
      shippingAddress,
      totalAmount,
      paymentMethod,
    });

    await newOrder.save();

    res.status(201).json({
      success: true,
      message: "Order created successfully.",
      order: newOrder,
    });
  } catch (error) {
    console.error("Error creating order:", error.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

// webscrap.js

getCityCategoryProducts = async (req, res) => {
  try {
    const { city, category } = req.body;

    if (!city || !category) {
      return res
        .status(400)
        .json({ success: false, message: "City and category are required." });
    }

    const products = await Product.find({ category })
      .populate({
        path: "retailerId",
        populate: {
          path: "retailerDetailsId",
          match: { "address.city": city },
        },
      })
      .exec();

    // Filter out products where retailerDetailsId was not matched (null)
    const filteredProducts = products.filter(
      (product) => product.retailerId && product.retailerId.retailerDetailsId
    );

    if (filteredProducts.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No products found." });
    }

    return res.status(200).json({ success: true, products: filteredProducts });
  } catch (err) {
    console.error("Error in getCityCategoryProducts:", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

module.exports = {
  getProducts,
  getRetailersProducts,
  getAllRetailersProducts,
  getProductById,
  getAllProductsByRetailerId,
  createOrder,
  getCityCategoryProducts,
};
