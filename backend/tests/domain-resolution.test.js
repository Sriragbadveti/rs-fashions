import test from "node:test";
import assert from "node:assert/strict";
import { getResolvedClientUrl } from "../src/controllers/auth.controller.js";

test("getResolvedClientUrl returns canonical https://www.rsfashions25.com when origin is custom domain", () => {
  const req = {
    headers: {
      origin: "https://www.rsfashions25.com",
    },
  };
  const result = getResolvedClientUrl(req);
  assert.equal(result, "https://www.rsfashions25.com");
});

test("getResolvedClientUrl canonicalizes apex rsfashions25.com to www.rsfashions25.com", () => {
  const req = {
    headers: {
      referer: "https://rsfashions25.com/shop?cat=silk",
    },
  };
  const result = getResolvedClientUrl(req);
  assert.equal(result, "https://www.rsfashions25.com");
});

test("getResolvedClientUrl preserves localhost during local development", () => {
  const req = {
    headers: {
      origin: "http://localhost:5173",
    },
  };
  const result = getResolvedClientUrl(req);
  assert.equal(result, "http://localhost:5173");
});

test("getResolvedClientUrl ignores stale vercel.app in production and defaults to canonical domain", () => {
  const prevEnv = process.env.NODE_ENV;
  const prevClient = process.env.CLIENT_URL;

  try {
    process.env.NODE_ENV = "production";
    process.env.CLIENT_URL = "https://rs-fashions-d5h8.vercel.app";

    const req = { headers: {} };
    const result = getResolvedClientUrl(req);
    assert.equal(result, "https://www.rsfashions25.com");
  } finally {
    process.env.NODE_ENV = prevEnv;
    process.env.CLIENT_URL = prevClient;
  }
});
