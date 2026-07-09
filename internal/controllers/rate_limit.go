package controllers

import (
	"net"
	"net/http"
	"sync"
	"time"
)

type visitor struct {
	count     int
	windowEnd time.Time
}

type RateLimiter struct {
	mu       sync.Mutex
	visitors map[string]*visitor
	limit    int
	window   time.Duration
}

func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	return &RateLimiter{visitors: make(map[string]*visitor), limit: limit, window: window}
}

func (rl *RateLimiter) Middleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ip, _, err := net.SplitHostPort(r.RemoteAddr)
		if err != nil {
			ip = r.RemoteAddr
		}

		rl.mu.Lock()
		v, ok := rl.visitors[ip]
		now := time.Now()
		if !ok || now.After(v.windowEnd) {
			v = &visitor{count: 0, windowEnd: now.Add(rl.window)}
			rl.visitors[ip] = v
		}
		v.count++
		count := v.count
		rl.mu.Unlock()

		if count > rl.limit {
			http.Error(w, "too many requests", http.StatusTooManyRequests)
			return
		}
		next(w, r)
	}
}
