const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const chromium = require("@sparticuz/chrome-aws-lambda");
const puppeteer = require("puppeteer-extra");
const RetailerDetails = require("../models/RetailerDetails");
const Product = require("../models/Product");
const NodeCache = require("node-cache");
const dotEnv = require("dotenv");
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
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage", // Prevents Chrome from using /dev/shm, reducing memory
          "--disable-gpu", // Disables GPU acceleration to save memory
          "--single-process", // Runs Chrome in a single process
          "--disable-software-rasterizer",
        ],
        executablePath: "/usr/bin/google-chrome-stable",
        ignoreDefaultArgs: ["--disable-extensions"],
      });

      this.page = await this.browser.newPage();
      await this.page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
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
                ? "https://www.flipkart.com/" +
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

  async safeGoto(url) {
    let attempts = 3;
    while (attempts > 0) {
      try {
        console.log(`🚀 Navigating to ${url} (Attempts left: ${attempts})`);
        await this.page.goto(url, {
          waitUntil: "networkidle2",
          timeout: 30000,
        });
        return;
      } catch (error) {
        console.log(`⚠️ Navigation failed: ${error.message}`);
        attempts--;
      }
    }
    throw new Error("❌ Failed to load page after multiple attempts.");
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
                ? "https://www.croma.com/" +
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
      searchBox: "input[name='field-keywords']", // More stable selector
      searchButton: "#nav-search-submit-button",
      productList: ".s-result-item[role='listitem']",
      title: ".a-size-medium.a-spacing-none.a-color-base.a-text-normal",
      priceWhole: ".a-price-whole",
      priceFraction: ".a-price-fraction",
      productLink: ".a-link-normal.s-line-clamp-2.s-link-style.a-text-normal",
    };

    console.log("🚀 Opening Amazon...");
    await this.safeGoto(URL, { waitUntil: "networkidle2" });

    console.log("🔎 Checking search box...");
    const isSearchBoxPresent = await this.page.evaluate(() => {
      return !!document.querySelector("input[name='field-keywords']");
    });
    console.log("Search box found:", isSearchBoxPresent);

    if (!isSearchBoxPresent) {
      console.log("⚠️ Search box not found. Exiting...");
      return [];
    }

    console.log(`⌨️ Typing '${this.searchQuery}' in search...`);
    await this.page.waitForSelector(selectors.searchBox, {
      visible: true,
      timeout: 10000,
    });
    await this.page.click(selectors.searchBox, { delay: 200 });
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

    //results.push(...(await this.searchCroma()));
    results.push(...(await this.searchAmazon()));
    results.push(...(await this.searchSnapdeal()));
    results.push(...(await this.searchFlipkart()));
    results.push(...(await this.searchJiomart()));
    results.push(...(await this.searchRelianceDigital()));

    await this.browser.close();

    return results;
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

    const sanitizedQuery = searchName.trim().replace(/[^\w\s\-\+\.]/g, "");

    // Check cache first
    const cachedResults = cache.get(sanitizedQuery);
    if (cachedResults !== undefined) {
      return res.json({ success: true, results: cachedResults });
    }

    const scraper = new ProductScraper(sanitizedQuery);
    let results = await scraper.scrapeAll();

    if (!results || results.length === 0) {
      cache.set(sanitizedQuery, null, 3600); // Cache empty results for 1 hour
      return res.json({ success: true, results: [] });
    }

    // Step 1: Filter Out Non-Phone Products Using Keyword Matching
    const filteredResults = results.filter((product) =>
      product.name.toLowerCase().includes(searchName)
    );

    if (filteredResults.length === 0) {
      return res.json({ success: true, results: [] }); // No valid phones found
    }

    // Step 2: Calculate the Average Price
    const totalPrice = filteredResults.reduce(
      (sum, product) => sum + (product.price || 0),
      0
    );
    const averagePrice = totalPrice / filteredResults.length;

    // Step 3: Compute the Threshold (Average / 2)
    const priceThreshold = averagePrice / 2;

    // Step 4: Remove Products Below the Threshold
    const finalResults = filteredResults.filter(
      (product) => product.price >= priceThreshold
    );

    // Cache results
    cache.set(sanitizedQuery, finalResults, 3600);

    res.json({
      success: true,
      averagePrice,
      priceThreshold,
      results: finalResults,
    });
  } catch (error) {
    console.error("Error in getProducts:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
};

const getRetailersProducts = async (req, res) => {
  try {
    const { searchName } = req.params;

    // Validate input
    if (!searchName || !searchName.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Search term is required." });
    }

    const sanitizedQuery = searchName.trim().replace(/[^\w\s\-\+\.]/g, "");

    // Fetch products with a case-insensitive search
    let featuredProducts = await Product.find(
      { name: { $regex: sanitizedQuery, $options: "i" } },
      "name price discount retailerId" // Fetch only required fields
    ).lean(); // Convert to plain JavaScript objects for better performance

    if (!featuredProducts || featuredProducts.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No products found." });
    }

    // Step 1: Remove non-phone products
    featuredProducts = featuredProducts.filter((product) =>
      product.name.toLowerCase().includes("iphone")
    );

    if (featuredProducts.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No relevant products found." });
    }

    // Step 2: Calculate the average price
    const totalPrice = featuredProducts.reduce(
      (sum, product) => sum + (product.price || 0),
      0
    );
    const averagePrice = totalPrice / featuredProducts.length;

    // Step 3: Compute threshold (Average / 2)
    const priceThreshold = averagePrice / 2;

    // Step 4: Remove products priced below the threshold
    featuredProducts = featuredProducts.filter(
      (product) => product.price >= priceThreshold
    );

    res.status(200).json({
      success: true,
      averagePrice,
      priceThreshold,
      products: featuredProducts,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = {
  getProducts,
  getRetailersProducts,
};
