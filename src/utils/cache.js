/**
 * Bounded LRU Cache with Time-To-Live (TTL) support.
 * Uses JavaScript Map insertion order for O(1) eviction and retrieval.
 */
export class LRUCache {
    constructor(maxSize = 1000, defaultTtlMs = 1000 * 60 * 60) {
        this.maxSize = maxSize;
        this.defaultTtlMs = defaultTtlMs;
        this.cache = new Map();
    }

    get(key) {
        if (!this.cache.has(key)) return null;

        const entry = this.cache.get(key);
        const now = Date.now();

        // Expired check
        if (entry.expiry && entry.expiry < now) {
            this.cache.delete(key);
            return null;
        }

        // Refresh LRU order (delete & re-set moves to end of Map in O(1))
        this.cache.delete(key);
        this.cache.set(key, entry);

        return entry.value;
    }

    set(key, value, ttlMs = this.defaultTtlMs) {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxSize) {
            // Evict oldest (first key in Map)
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey !== undefined) {
                this.cache.delete(oldestKey);
            }
        }

        const expiry = ttlMs ? Date.now() + ttlMs : null;
        this.cache.set(key, { value, expiry });
    }

    has(key) {
        return this.get(key) !== null;
    }

    delete(key) {
        return this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
    }

    get size() {
        return this.cache.size;
    }
}

// Global shared instances
export const geocodeCache = new LRUCache(2000, 1000 * 60 * 60 * 24); // 24 hours TTL for coordinates
export const apiResponseCache = new LRUCache(500, 1000 * 60 * 5); // 5 minutes TTL for common queries
