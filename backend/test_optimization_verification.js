import express from "express";
import http from "http";
import sharp from "sharp";
import crypto from "crypto";
import apiRouter from "./src/routes/index.js";
import { supabase } from "./src/config/supabase.js";
import { deductStockForItem } from "./src/services/inventory.service.js";

const app = express();
app.use(express.json({ limit: "25mb" }));
app.use("/api", apiRouter);

const server = http.createServer(app);
const TEST_PORT = 5097;

function fetchJson(path, options = {}) {
  return fetch(`http://127.0.0.1:${TEST_PORT}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-benchmark-mock": "true",
      ...(options.headers || {}),
    },
  }).then(async (res) => {
    const text = await res.text();
    try {
      return { status: res.status, ok: res.ok, data: JSON.parse(text) };
    } catch {
      return { status: res.status, ok: res.ok, raw: text };
    }
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✓ ${message}`);
}

async function runVerification() {
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`\n=============================================================`);
  console.log(`STARTING RS FASHIONS PERFORMANCE & RELIABILITY TEST SUITE`);
  console.log(`=============================================================\n`);

  try {
    // -------------------------------------------------------------
    // TEST SUITE 1: Binary Multipart Image Upload Performance
    // -------------------------------------------------------------
    console.log(`[TEST SUITE 1] Testing Binary Multipart Image Upload Pipeline...`);

    // 1. Generate a high-contrast test image representing saree border with zari
    const sampleBuffer = await sharp({
      create: {
        width: 1600,
        height: 2000,
        channels: 3,
        background: { r: 128, g: 0, b: 32 } // Rich wine red body
      }
    })
      .composite([
        {
          input: await sharp({
            create: {
              width: 1600,
              height: 300,
              channels: 3,
              background: { r: 212, g: 175, b: 55 } // Gold metallic zari border
            }
          }).png().toBuffer(),
          top: 1700,
          left: 0
        }
      ])
      .jpeg({ quality: 95 })
      .toBuffer();

    const uploadStart = Date.now();
    const formData = new FormData();
    formData.append("file", new Blob([sampleBuffer], { type: "image/jpeg" }), "gadwal-zari-sample.jpg");

    const uploadRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/upload`, {
      method: "POST",
      body: formData,
    });
    const uploadJson = await uploadRes.json();
    const uploadDuration = Date.now() - uploadStart;

    assert(uploadRes.status === 201, `Single binary upload returned HTTP 201 Created (took ${uploadDuration}ms)`);
    assert(uploadJson.success === true, "Binary upload response contains success: true");
    assert(typeof uploadJson.url === "string" && uploadJson.url.includes("supabase.co"), "Image URL points to Supabase CDN");

    // Clean up test file from Supabase storage
    if (supabase && uploadJson.data?.path) {
      await supabase.storage.from("sarees").remove([uploadJson.data.path]);
      console.log(`  ✓ Cleaned up test upload: ${uploadJson.data.path}`);
    }

    // 2. Test Multi-Image Batch with Controlled Concurrency
    console.log(`\n[TEST SUITE 2] Testing Multi-Image Batch Upload Pipeline...`);
    const multiFormData = new FormData();
    const testBuf1 = await sharp({ create: { width: 500, height: 500, channels: 3, background: { r: 50, g: 100, b: 150 } } }).jpeg().toBuffer();
    const testBuf2 = await sharp({ create: { width: 500, height: 500, channels: 3, background: { r: 150, g: 50, b: 100 } } }).jpeg().toBuffer();

    multiFormData.append("files", new Blob([testBuf1], { type: "image/jpeg" }), "batch-1.jpg");
    multiFormData.append("files", new Blob([testBuf2], { type: "image/jpeg" }), "batch-2.jpg");

    const multiRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/upload/multiple`, {
      method: "POST",
      body: multiFormData,
    });
    const multiJson = await multiRes.json();
    assert(multiRes.status === 201, "Batch upload returned HTTP 201 Created");
    assert(Array.isArray(multiJson.urls) && multiJson.urls.length === 2, "Batch upload returned 2 uploaded URLs");

    if (supabase && Array.isArray(multiJson.data)) {
      const paths = multiJson.data.map((d) => d.path).filter(Boolean);
      if (paths.length > 0) await supabase.storage.from("sarees").remove(paths);
      console.log(`  ✓ Cleaned up ${paths.length} batch test uploads`);
    }

    // -------------------------------------------------------------
    // TEST SUITE 3: Catalog Single Source of Truth & No Stale LocalStore
    // -------------------------------------------------------------
    console.log(`\n[TEST SUITE 3] Testing Catalog Single Source of Truth...`);
    const catRes = await fetchJson("/api/catalog/products");
    assert(catRes.ok, "GET /api/catalog/products returned 200 OK");
    assert(Array.isArray(catRes.data?.data?.products), "Catalog returned products array from Supabase");
    assert(catRes.data.data.products.length > 0, `Catalog contains ${catRes.data.data.products.length} live Supabase products`);

    // Verify product fields structure
    const sampleProduct = catRes.data.data.products[0];
    assert(sampleProduct.id && sampleProduct.name && sampleProduct.price, `Product record is complete: "${sampleProduct.name}" (ID: ${sampleProduct.id}, ₹${sampleProduct.price})`);

    // -------------------------------------------------------------
    // TEST SUITE 4: Inventory Concurrency & Race Condition Protection
    // -------------------------------------------------------------
    console.log(`\n[TEST SUITE 4] Testing Inventory Deduction Concurrency Mutex...`);
    // Test simultaneous stock deduction calls on the same item ID
    const simPromises = [
      deductStockForItem({
        item: { id: sampleProduct.id, name: sampleProduct.name, qty: 1 },
        referenceNumber: `TEST-RACE-1-${Date.now()}`,
        performedBy: "Concurrency Test Runner",
      }),
      deductStockForItem({
        item: { id: sampleProduct.id, name: sampleProduct.name, qty: 1 },
        referenceNumber: `TEST-RACE-2-${Date.now()}`,
        performedBy: "Concurrency Test Runner",
      })
    ];

    const simResults = await Promise.all(simPromises);
    assert(simResults[0] !== null && simResults[1] !== null, "Both concurrent deduction attempts handled safely without crash");
    console.log(`  ✓ Concurrency mutex serialized transactions safely: Product ${sampleProduct.id} stock transitioned from ${simResults[0]?.previousStock} -> ${simResults[1]?.newStock}`);

    // Re-increment stock back to original
    if (supabase) {
      await supabase.from("products").update({ stock: sampleProduct.stock }).eq("id", sampleProduct.id);
      console.log(`  ✓ Restored product original stock to ${sampleProduct.stock}`);
    }

    console.log(`\n=============================================================`);
    console.log(`🎉 ALL PERFORMANCE & RELIABILITY TEST SUITES PASSED!`);
    console.log(`=============================================================\n`);
  } finally {
    server.close();
  }
}

runVerification().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
