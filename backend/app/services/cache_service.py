import time
import json
import hashlib
from typing import Any, Optional, Dict

class SimpleCache:
    """In-memory thread-safe TTL cache with hit/miss statistics for Athena & API results."""
    def __init__(self, default_ttl: int = 300):
        self.default_ttl = default_ttl
        self._cache: Dict[str, Dict[str, Any]] = {}
        self.hits: int = 0
        self.misses: int = 0

    def _generate_key(self, prefix: str, **kwargs) -> str:
        serialized = json.dumps(kwargs, sort_keys=True, default=str)
        hash_digest = hashlib.sha256(serialized.encode("utf-8")).hexdigest()[:16]
        return f"{prefix}:{hash_digest}"

    def get(self, key: str) -> Optional[Any]:
        if key in self._cache:
            entry = self._cache[key]
            if time.time() < entry["expires_at"]:
                self.hits += 1
                return entry["data"]
            else:
                del self._cache[key]
        self.misses += 1
        return None

    def set(self, key: str, data: Any, ttl: Optional[int] = None) -> None:
        duration = ttl if ttl is not None else self.default_ttl
        self._cache[key] = {
            "data": data,
            "expires_at": time.time() + duration,
            "created_at": time.time()
        }

    def clear(self) -> None:
        self._cache.clear()
        self.hits = 0
        self.misses = 0

    def stats(self) -> Dict[str, Any]:
        total_requests = self.hits + self.misses
        hit_rate = (self.hits / total_requests * 100) if total_requests > 0 else 0.0
        return {
            "cached_entries": len(self._cache),
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate_pct": round(hit_rate, 1)
        }

# Global cache instance
cache_service = SimpleCache()
