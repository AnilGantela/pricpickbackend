const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const chromium = require("@sparticuz/chrome-aws-lambda");
const puppeteer = require("puppeteer-core");
const RetailerDetails = require("../models/RetailerDetails");
const Product = require("../models/Product");

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
        headless: "new",
        executablePath:
          process.env.PUPPETEER_EXECUTABLE_PATH ||
          "/opt/render/.cache/puppeteer/chrome/linux-133.0.6943.98/chrome",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      if (!this.browser) throw new Error("Puppeteer failed to launch");

      this.page = await this.browser.newPage();
      if (!this.page) throw new Error("Failed to create a new page");

      console.log("✅ Browser initialized successfully.");
    } catch (error) {
      console.error("❌ Failed to launch Puppeteer:", error);
      throw error; // Propagate the error to prevent further execution
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

    console.log(`⌨️ Searching for '${this.searchQuery}' on Flipkart...`);
    await this.page.type(".Pke_EE", this.searchQuery, { delay: 200 });
    await this.page.click("._2iLD__");

    console.log("⏳ Waiting for search results...");
    try {
      await this.page.waitForSelector(".col-12-12", { timeout: 10000 });
    } catch (error) {
      console.log("⚠️ No products found on Flipkart.");
      return [];
    }

    console.log("📜 Scrolling to load more products...");
    await this.scrollPage();

    console.log("🔎 Extracting Flipkart product details...");
    return await this.page.evaluate(() => {
      return Array.from(document.querySelectorAll(".col-12-12"))
        .map((item) => {
          const title = item.querySelector(".KzDlHZ")?.innerText.trim();
          const price = item
            .querySelector(".Nx9bqj._4b5DiR")
            ?.innerText.replace(/[^0-9]/g, "");
          const productLink = item
            .querySelector(".CGtC98")
            ?.getAttribute("href");

          return title
            ? {
                title,
                price: price ? parseFloat(price) : "Price not available",
                retailer: "Flipkart",
                productLink: productLink
                  ? `https://www.flipkart.com${productLink}`
                  : "No link available",
              }
            : null;
        })
        .filter((product) => product);
    });
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

    results.push(...(await this.searchAmazon()));
    results.push(...(await this.searchFlipkart()));
    results.push(...(await this.searchCroma()));
    results.push(...(await this.searchJiomart()));
    results.push(...(await this.searchRelianceDigital()));

    await this.browser.close();
    return results;
  }
}

const getProducts = async (req, res) => {
  try {
    const { searchName } = req.params;

    if (!searchName) {
      return res
        .status(400)
        .json({ success: false, message: "Search term is required" });
    }

    const scraper = new ProductScraper(searchName);
    const results = await scraper.scrapeAll();

    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getRetailersProducts = async (req, res) => {
  try {
    const { searchName } = req.params;

    if (!searchName) {
      return res
        .status(400)
        .json({ success: false, message: "Search term is required" });
    }

    // Fetch products with a case-insensitive search
    const featuredProducts = await Product.find(
      { name: { $regex: searchName, $options: "i" } },
      "name price discount retailerId" // Fetch only required fields
    ).populate("retailerId", "name address"); // Fetch shop name & address

    if (featuredProducts.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No products found." });
    }

    // Format response to include only required details
    const productsWithShops = featuredProducts.map((product) => ({
      name: product.name,
      shopName: product.retailerId ? product.retailerId.name : "Unknown Shop",
      price: product.price,
      discount: product.discount,
      address: product.retailerId
        ? product.retailerId.address
        : "Unknown Address",
    }));

    res.status(200).json({ success: true, products: productsWithShops });
  } catch (error) {
    console.error("Error fetching products:", error.message);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = {
  getProducts,
  getRetailersProducts,
};
