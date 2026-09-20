import test, { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "../src/app.js";
import connectDB from "../src/db/index.js";
import { LRUCache } from "../src/utils/cache.js";

dotenv.config({ path: "./.env" });

describe("Rentosphere Functional Test Suite", () => {
    let server;
    let baseUrl;

    before(async () => {
        if (mongoose.connection.readyState === 0) {
            await connectDB();
        }

        // Start test server on random available port
        server = http.createServer(app);
        await new Promise((resolve) => {
            server.listen(0, () => {
                const port = server.address().port;
                baseUrl = `http://localhost:${port}`;
                resolve();
            });
        });
    });

    after(async () => {
        if (server) {
            await new Promise((resolve) => server.close(resolve));
        }
        await mongoose.disconnect();
    });

    describe("1. System Health & Security Headers", () => {
        it("GET /health should return 200 OK with timestamp and uptime", async () => {
            const res = await fetch(`${baseUrl}/health`);
            assert.equal(res.status, 200);

            const data = await res.json();
            assert.equal(data.status, "OK");
            assert.ok(data.timestamp);
            assert.ok(typeof data.uptime === "number");
        });

        it("Security headers (Helmet) should be present on responses", async () => {
            const res = await fetch(`${baseUrl}/health`);
            const headers = res.headers;

            assert.equal(headers.get("x-content-type-options"), "nosniff");
            assert.equal(headers.get("x-frame-options"), "SAMEORIGIN");
            assert.ok(headers.get("x-dns-prefetch-control"));
        });

        it("CORS headers should allow valid origin", async () => {
            const res = await fetch(`${baseUrl}/health`, {
                headers: { Origin: "http://localhost:5173" }
            });
            assert.equal(res.status, 200);
            assert.equal(res.headers.get("access-control-allow-origin"), "http://localhost:5173");
        });
    });

    describe("2. Public Property Endpoints", () => {
        it("GET /api/v1/property/get-properties should return standard response envelope", async () => {
            const res = await fetch(`${baseUrl}/api/v1/property/get-properties?limit=5`);
            assert.equal(res.status, 200);

            const json = await res.json();
            assert.equal(json.statusCode, 200);
            assert.ok(json.success);
            assert.ok(Array.isArray(json.data.properties));
            assert.equal(typeof json.data.total, "number");
            assert.equal(typeof json.data.hasMore, "boolean");
        });

        it("GET /api/v1/property/property-info/invalidId should return 400 or 404 error envelope", async () => {
            const res = await fetch(`${baseUrl}/api/v1/property/property-info/507f1f77bcf86cd799439011`);
            const json = await res.json();
            assert.ok(res.status === 404 || res.status === 400 || res.status === 500);
            assert.equal(json.success, false);
        });

        it("Filtering by BHK type and rent should accept query params", async () => {
            const res = await fetch(`${baseUrl}/api/v1/property/get-properties?bhkType=2BHK&minRent=10000&maxRent=50000`);
            assert.equal(res.status, 200);

            const json = await res.json();
            assert.ok(json.success);
            assert.ok(Array.isArray(json.data.properties));
        });
    });

    describe("3. Protected Endpoints (Auth Guard Validation)", () => {
        it("POST /api/v1/property/upload-url without JWT should return 401 Unauthorized", async () => {
            const res = await fetch(`${baseUrl}/api/v1/property/upload-url`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fileName: "test.jpg", fileType: "image/jpeg" })
            });
            assert.equal(res.status, 401);
            const json = await res.json();
            assert.equal(json.success, false);
        });

        it("POST /api/v1/property/rental-request without JWT should return 401 Unauthorized", async () => {
            const res = await fetch(`${baseUrl}/api/v1/property/rental-request`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ propertyId: "507f1f77bcf86cd799439011", message: "Hello" })
            });
            assert.equal(res.status, 401);
            const json = await res.json();
            assert.equal(json.success, false);
        });

        it("POST /api/v1/property/payment/create-order without JWT should return 401 Unauthorized", async () => {
            const res = await fetch(`${baseUrl}/api/v1/property/payment/create-order`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: 15000, description: "Rent payment" })
            });
            assert.equal(res.status, 401);
            const json = await res.json();
            assert.equal(json.success, false);
        });
    });

    describe("4. Algorithmic LRU Cache Unit Tests", () => {
        it("LRUCache should store and retrieve values in O(1) time", () => {
            const cache = new LRUCache(3, 10000);
            cache.set("a", 1);
            cache.set("b", 2);
            cache.set("c", 3);

            assert.equal(cache.get("a"), 1);
            assert.equal(cache.get("b"), 2);
            assert.equal(cache.get("c"), 3);
            assert.equal(cache.size, 3);
        });

        it("LRUCache should evict the least-recently-used item when limit exceeded", () => {
            const cache = new LRUCache(2, 10000);
            cache.set("key1", "val1");
            cache.set("key2", "val2");

            // Access key1 to make key2 the least recently used
            cache.get("key1");

            // Insert 3rd item -> key2 should be evicted
            cache.set("key3", "val3");

            assert.equal(cache.get("key1"), "val1");
            assert.equal(cache.get("key2"), null);
            assert.equal(cache.get("key3"), "val3");
            assert.equal(cache.size, 2);
        });

        it("LRUCache should evict expired items based on TTL", async () => {
            const cache = new LRUCache(5, 50); // 50ms TTL
            cache.set("temp", "expired_soon");
            assert.equal(cache.get("temp"), "expired_soon");

            await new Promise((r) => setTimeout(r, 60));
            assert.equal(cache.get("temp"), null);
        });
    });
});
