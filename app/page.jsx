"use client";

import { useEffect, useState, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [prompt, setPrompt] = useState("Explain what a token bucket rate limiter is in two sentences.");
  const [apiKey, setApiKey] = useState("demo-standard-key");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch("/api/metrics");
      const data = await res.json();
      setMetrics(data);
    } catch (e) {
      console.error("metrics fetch failed", e);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    const id = setInterval(fetchMetrics, 5000);
    return () => clearInterval(id);
  }, [fetchMetrics]);

  async function handleRun() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, prompt }),
      });
      const data = await res.json();
      setResult({ status: res.status, ...data });
    } catch (e) {
      setResult({ status: 0, error: String(e) });
    } finally {
      setLoading(false);
      fetchMetrics();
    }
  }

  return (
    <div className="wrap">
      <div className="header">
        <div>
          <h1>
            <span className="status-dot" />
            LLM Inference Gateway
          </h1>
          <div className="sub">caching · rate limiting · priority queueing</div>
        </div>
        <div className="sub">refreshes every 5s</div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="label">Requests logged</div>
          <div className="value">{metrics?.total ?? "—"}</div>
        </div>
        <div className="card">
          <div className="label">Cache hit rate</div>
          <div className="value accent">{metrics ? `${metrics.cacheHitRate}%` : "—"}</div>
        </div>
        <div className="card">
          <div className="label">Avg latency</div>
          <div className="value">{metrics ? `${metrics.avgLatencyMs}ms` : "—"}</div>
        </div>
        <div className="card">
          <div className="label">Rate-limited</div>
          <div className="value warn">{metrics?.rateLimitedCount ?? "—"}</div>
        </div>
      </div>

      <div className="panel">
        <h2>Latency over recent requests</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={metrics?.timeline ?? []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#232c37" />
            <XAxis dataKey="time" stroke="#7c8a99" fontSize={11} />
            <YAxis stroke="#7c8a99" fontSize={11} unit="ms" />
            <Tooltip
              contentStyle={{
                background: "#121820",
                border: "1px solid #232c37",
                fontSize: 12,
              }}
            />
            <Line type="monotone" dataKey="latencyMs" stroke="#4fd1a5" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="panel try-it">
        <h2>Try it</h2>
        <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        <div className="row">
          <select value={apiKey} onChange={(e) => setApiKey(e.target.value)}>
            <option value="demo-standard-key">demo-standard-key (standard tier)</option>
            <option value="demo-premium-key">demo-premium-key (premium tier)</option>
          </select>
          <button onClick={handleRun} disabled={loading}>
            {loading ? "Running…" : "Send request"}
          </button>
        </div>
        {result && (
          <div className="result-box">
            {result.error ? (
              <span style={{ color: "var(--error)" }}>{JSON.stringify(result)}</span>
            ) : (
              <>
                {result.text}
                <span className={`tag ${result.cached ? "hit" : "miss"}`}>
                  {result.cached ? "cache hit" : "cache miss"}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="footer-note">
        Seed API keys in MongoDB before testing — see README.md. Rate limits: standard tier
        refills 5 req/min (burst 10), premium tier 20 req/min (burst 40).
      </div>
    </div>
  );
}
