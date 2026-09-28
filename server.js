import express from "express";
import { chromium } from "playwright";

const app = express();
const PORT = process.env.PORT || 10000;
const TARGET_URL = "https://chatiw.me/";

let browser;
let page;

app.get("/", (_req, res) => {
  res.json({
    service: "chatiw-render-test",
    status: "running",
    target: TARGET_URL,
    endpoints: {
      health: "/health",
      test: "/test"
    }
  });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "chatiw-render-test" });
});

app.get("/test", async (_req, res) => {
  const started = Date.now();

  try {
    if (!browser) {
      browser = await chromium.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage"
        ]
      });
    }

    if (page) {
      await page.close().catch(() => {});
    }

    page = await browser.newPage({
      viewport: { width: 1366, height: 900 },
      userAgent:
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36"
    });

    const consoleErrors = [];
    const requestErrors = [];

    page.on("console", msg => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    page.on("requestfailed", request => {
      requestErrors.push({
        url: request.url(),
        error: request.failure()?.errorText || "unknown"
      });
    });

    const response = await page.goto(TARGET_URL, {
      waitUntil: "domcontentloaded",
      timeout: 45000
    });

    await page.waitForTimeout(3000);

    const title = await page.title();
    const url = page.url();
    const htmlLength = (await page.content()).length;

    const result = {
      ok: true,
      httpStatus: response?.status() ?? null,
      title,
      url,
      htmlLength,
      elapsedMs: Date.now() - started,
      consoleErrors,
      requestErrors
    };

    console.log("[CHatiw TEST]", JSON.stringify(result));
    res.json(result);
  } catch (error) {
    const result = {
      ok: false,
      error: error.message,
      elapsedMs: Date.now() - started
    };

    console.error("[Chatiw TEST]", error);
    res.status(500).json(result);
  }
});

const server = app.listen(PORT, () => {
  console.log(`Chatiw Render test server running on port ${PORT}`);
});

const shutdown = async () => {
  try {
    if (page) await page.close();
    if (browser) await browser.close();
  } finally {
    server.close(() => process.exit(0));
  }
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
