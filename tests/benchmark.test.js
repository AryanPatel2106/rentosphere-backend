import http from "node:http";
import zlib from "node:zlib";
import dotenv from "dotenv";
import mongoose from "mongoose";
import app from "../src/app.js";
import connectDB from "../src/db/index.js";
import { LRUCache } from "../src/utils/cache.js";

dotenv.config({ path: "./.env" });

async function runBenchmark() {
    console.log("===============================================================");
    console.log("  RENTOSPHERE NON-FUNCTIONAL PERFORMANCE & BENCHMARK SUITE");
    console.log("===============================================================\n");

    if (mongoose.connection.readyState === 0) {
        await connectDB();
    }

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    const baseUrl = `http://localhost:${port}`;

    try {
        // ── 1. Latency & Percentiles Benchmark ──────────────────────────────
        console.log("▶ [Test 1] Measuring Latency & Percentiles (100 Requests)...");
        const latencies = [];
        const ITERATIONS = 100;

        for (let i = 0; i < ITERATIONS; i++) {
            const start = performance.now();
            const res = await fetch(`${baseUrl}/health`);
            await res.text();
            const duration = performance.now() - start;
            latencies.push(duration);
        }

        latencies.sort((a, b) => a - b);
        const p50 = latencies[Math.floor(ITERATIONS * 0.50)].toFixed(2);
        const p95 = latencies[Math.floor(ITERATIONS * 0.95)].toFixed(2);
        const p99 = latencies[Math.floor(ITERATIONS * 0.99)].toFixed(2);
        const avg = (latencies.reduce((sum, val) => sum + val, 0) / ITERATIONS).toFixed(2);
        const min = latencies[0].toFixed(2);
        const max = latencies[latencies.length - 1].toFixed(2);

        console.log(`  ✓ Minimum Latency:  ${min} ms`);
        console.log(`  ✓ Average Latency:  ${avg} ms`);
        console.log(`  ✓ p50 (Median):     ${p50} ms`);
        console.log(`  ✓ p95 Latency:      ${p95} ms`);
        console.log(`  ✓ p99 Latency:      ${p99} ms`);
        console.log(`  ✓ Maximum Latency:  ${max} ms\n`);

        // ── 2. Concurrency & Throughput Benchmark ────────────────────────────
        console.log("▶ [Test 2] Testing Concurrency (50 Concurrent Requests)...");
        const concStart = performance.now();
        const concurrentPromises = Array.from({ length: 50 }).map(() =>
            fetch(`${baseUrl}/health`).then((r) => r.json())
        );
        const results = await Promise.all(concurrentPromises);
        const concTotal = performance.now() - concStart;
        const throughput = ((50 / concTotal) * 1000).toFixed(0);

        console.log(`  ✓ Processed 50 concurrent requests in: ${concTotal.toFixed(2)} ms`);
        console.log(`  ✓ Estimated Throughput:                ${throughput} req/sec\n`);

        // ── 3. Response Compression Efficacy (Gzip) ─────────────────────────
        console.log("▶ [Test 3] Testing HTTP Response Compression (Gzip)...");
        const getRawWireBytes = (encoding) =>
            new Promise((resolve) => {
                const req = http.request(
                    `${baseUrl}/api/v1/property/get-properties?limit=10`,
                    { headers: { "Accept-Encoding": encoding } },
                    (res) => {
                        let totalBytes = 0;
                        res.on("data", (chunk) => {
                            totalBytes += chunk.length;
                        });
                        res.on("end", () => resolve({ bytes: totalBytes, encoding: res.headers["content-encoding"] }));
                    }
                );
                req.end();
            });

        const uncompressed = await getRawWireBytes("identity");
        const compressed = await getRawWireBytes("gzip");
        const uncompressedSize = uncompressed.bytes;
        const compressedSize = compressed.bytes;
        const compressionRatio = (((uncompressedSize - compressedSize) / (uncompressedSize || 1)) * 100).toFixed(1);

        console.log(`  ✓ Raw uncompressed size: ${uncompressedSize} bytes`);
        console.log(`  ✓ Gzip compressed size:  ${compressedSize} bytes (encoding: ${compressed.encoding})`);
        console.log(`  ✓ Bandwidth Reduction:   ${compressionRatio}% savings\n`);

        // ── 4. Algorithmic Cache Lookup Speed (O(1)) ────────────────────────
        console.log("▶ [Test 4] Algorithmic LRU Cache Lookup Benchmark (100,000 ops)...");
        const cache = new LRUCache(5000);
        for (let i = 0; i < 5000; i++) {
            cache.set(`key-${i}`, { lat: 12.97, lng: 77.59, label: `City ${i}` });
        }

        const cacheStart = performance.now();
        for (let i = 0; i < 100000; i++) {
            const randomKey = `key-${i % 5000}`;
            cache.get(randomKey);
        }
        const cacheDuration = performance.now() - cacheStart;
        const opTime = ((cacheDuration / 100000) * 1000).toFixed(4); // microsec

        console.log(`  ✓ 100,000 O(1) Cache lookups executed in: ${cacheDuration.toFixed(2)} ms`);
        console.log(`  ✓ Average lookup time per item:           ${opTime} µs (< 0.001 ms)\n`);

        console.log("===============================================================");
        console.log("  ALL NON-FUNCTIONAL BENCHMARKS COMPLETED SUCCESSFULLY!");
        console.log("===============================================================\n");
    } finally {
        server.close();
        await mongoose.disconnect();
    }
}

runBenchmark().catch((err) => {
    console.error("Benchmark failed:", err);
    process.exit(1);
});
