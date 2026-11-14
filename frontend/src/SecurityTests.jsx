import { useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, ShieldCheck, XCircle } from "lucide-react";

const API = "http://localhost:8001";

export default function SecurityTests({ token, role }) {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const allowed = role === "soc_analyst" || role === "soc_lead";

  async function run() {
    if (running || !allowed) return;
    setRunning(true);
    setError("");
    setResults(null);
    try {
      const response = await fetch(`${API}/api/security-tests/run`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof data.detail === "string" ? data.detail : `Test run failed (${response.status}).`);
      setResults(data);
    } catch (e) {
      setError(e.message || "Unable to run tests.");
    } finally {
      setRunning(false);
    }
  }

  return <div className="content">
    <div className="welcome-row">
      <div><div className="eyebrow">VALIDATION / REGRESSION</div><h1>Security Tests</h1>
        <p>Run the existing policy, authorization, incident, and API regression tests.</p></div>
      {allowed && <button className="primary-button" type="button" disabled={running} onClick={run}>
        <ShieldCheck size={17} /> {running ? "Running tests…" : "Run Security Tests"}
      </button>}
    </div>
    {!allowed && <div className="panel-note standalone"><AlertTriangle size={17} /> Only SOC analysts and SOC leads may run tests.</div>}
    {running && <div className="panel-note standalone" role="status"><Activity size={17} /> Running pytest in a separate temporary test environment. This can take up to two minutes.</div>}
    {error && <div className="panel scan-error" role="alert"><AlertTriangle size={18}/><div><strong>Test run failed</strong><p>{error}</p></div></div>}
    {results && <>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">Tests executed</div><div className="stat-value">{results.total}</div></div>
        <div className="stat-card"><div className="stat-label">Passed</div><div className="stat-value">{results.passed}</div></div>
        <div className="stat-card"><div className="stat-label">Failed</div><div className="stat-value">{results.failed}</div></div>
        <div className="stat-card"><div className="stat-label">Skipped</div><div className="stat-value">{results.skipped}</div></div>
      </div>
      <div className="panel test-panel">
        <div className="section-heading"><div><h2>Actual pytest results</h2><p>Duration: {results.duration}s · Exit code: {results.exit_code}</p></div>
          <span className="muted-tag">{results.complete ? "RUN FINISHED" : "INCOMPLETE"}</span></div>
        {(results.tests || []).map((test, index) => <div className="full-test-row" key={`${test.suite}-${test.name}-${index}`}>
          <div className="test-number">{String(index + 1).padStart(2, "0")}</div>
          <div className="test-info"><strong>{test.name.replaceAll("_", " ")}</strong>
            <span>{test.suite} · {test.duration}s</span>
            {test.details && <details><summary>View {test.status} details</summary><pre style={{whiteSpace:"pre-wrap", overflowWrap:"anywhere", maxHeight:220, overflow:"auto"}}>{test.details}</pre></details>}
          </div>
          <span className={test.status === "passed" ? "pass-tag" : test.status === "failed" ? "restricted-tag" : "muted-tag"}>
            {test.status === "passed" ? <CheckCircle2 size={13}/> : test.status === "failed" ? <XCircle size={13}/> : null} {test.status.toUpperCase()}
          </span>
        </div>)}
      </div>
      <div className="panel-note standalone"><AlertTriangle size={17}/> {results.note}</div>
    </>}
    {!results && !running && !error && <div className="panel-note standalone"><AlertTriangle size={17}/> No live results yet. Click Run Security Tests to execute the allowlisted pytest suite.</div>}
  </div>;
}
