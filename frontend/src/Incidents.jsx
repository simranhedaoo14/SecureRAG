import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus, Search, RefreshCw, ShieldAlert, Clock3 } from "lucide-react";
import "./Incidents.css";

const API = "http://localhost:8001";
const NEXT = { new: ["triage"], triage: ["investigating", "false_positive"], investigating: ["contained", "false_positive"], contained: ["eradicated"], eradicated: ["recovered"], reopened: ["investigating"] };
const STATUSES = ["new", "triage", "investigating", "contained", "eradicated", "recovered", "closed", "false_positive", "reopened"];
const SEVERITIES = ["low", "medium", "high", "critical"];
const CATEGORIES = ["phishing", "malware", "account_compromise", "data_exposure", "insider", "cloud_iam", "domain_abuse", "other"];
const SOURCES = ["siem_alert", "user_report", "threat_intel", "typosquatting_scan"];
const IOC_TYPES = ["ip", "domain", "url", "hash", "email"];
const EMPTY_IOC = { type: "ip", value: "", source: "analyst", confidence: "low", tlp: "amber" };
const ACTION_TYPES = ["block_domain", "block_ip", "disable_account", "reset_credentials", "isolate_host", "revoke_sessions", "takedown_request", "other"];
const EMPTY = { title: "", summary: "", severity: "medium", category: "other", source: "siem_alert", tlp: "amber" };
const label = (value) => String(value || "—").replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
const dateLabel = (value) => { if (!value) return "—"; const d = new Date(value); return Number.isNaN(d.getTime()) ? value : d.toLocaleString(); };

async function call(token, path, method = "GET", body) {
  const res = await fetch(`${API}${path}`, { method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const detail = data.detail; throw new Error(typeof detail === "string" ? detail : `Request failed (${res.status}).`); }
  return data;
}

export function CreateIncidentFromScan({ token, scan }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const picked = (scan?.results || []).filter((r) => r.registration_status === "dns_records_found").map((r) => r.domain).slice(0, 50);
  if (!scan || !picked.length) return null;
  const create = async () => { setBusy(true); setMessage(""); try { const r = await call(token, "/api/soc/typosquatting-scan/incident", "POST", { domain: scan.original_domain, candidates: picked }); setMessage(`Created ${r.incident_id}. Open Incidents to review.`); } catch (e) { setMessage(e.message); } finally { setBusy(false); } };
  return <div className="incident-scan-action"><button className="incident-btn" disabled={busy} onClick={create}>{busy ? "Creating…" : `Create incident from ${picked.length} DNS candidates`}</button>{message && <span role="status">{message}</span>}</div>;
}

export default function Incidents({ token, role }) {
  const isLead = role === "soc_lead";
  const isSoc = role === "soc_analyst" || isLead;
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("list");
  const [filters, setFilters] = useState({ status: "", severity: "" });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [draft, setDraft] = useState({ ...EMPTY });
  const [note, setNote] = useState("");
  const [ioc, setIoc] = useState({ ...EMPTY_IOC });
  const [showIoc, setShowIoc] = useState(false);
  const [statusTo, setStatusTo] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [showStatus, setShowStatus] = useState(false);
  const [actionType, setActionType] = useState("");
  const [actionReason, setActionReason] = useState("");
  const [actionDecision, setActionDecision] = useState(null);
  const [decisionReason, setDecisionReason] = useState("");
  const [resolution, setResolution] = useState({ reason: "", root_cause: "", lessons_learned: "" });
  const [showResolution, setShowResolution] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
      q.set("limit", "50");
      const data = await call(token, `/api/incidents?${q}`);
      setRows(Array.isArray(data.incidents) ? data.incidents : []);
      setError("");
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [token, filters]);
  useEffect(() => { load(); }, [load]);
  const visible = useMemo(() => rows.filter((r) => [r.incident_id, r.title, ...(r.scope?.affected_assets || []).map((a) => a.id)].join(" ").toLowerCase().includes(search.toLowerCase())), [rows, search]);
  const stats = useMemo(() => ({ total: rows.length, open: rows.filter((r) => !["closed", "false_positive"].includes(r.status)).length, critical: rows.filter((r) => r.severity === "critical").length, closed: rows.filter((r) => r.status === "closed").length }), [rows]);

  const open = async (id) => {
    setError(""); setNotice("");
    try {
      const data = await call(token, `/api/incidents/${encodeURIComponent(id)}`);
      setSelected(data.incident); setView("detail"); setIoc({ ...EMPTY_IOC }); setShowIoc(false); setNote(""); setStatusReason(""); setStatusTo(""); setShowStatus(false); setShowResolution(false); setActionDecision(null);
    } catch (e) { setError(e.message); }
  };
  const back = () => { setView("list"); setSelected(null); setError(""); setShowStatus(false); setActionDecision(null); };
  const mutate = async (path, body, success) => {
    if (busy) return false;
    setBusy(true); setError(""); setNotice("");
    try {
      await call(token, path, "POST", body);
      await load();
      if (selected) { const data = await call(token, `/api/incidents/${encodeURIComponent(selected.incident_id)}`); setSelected(data.incident); }
      setNotice(success || "Changes saved.");
      return true;
    } catch (e) { setError(e.message); return false; } finally { setBusy(false); }
  };
  const base = selected ? `/api/incidents/${encodeURIComponent(selected.incident_id)}` : "";
  const create = async (e) => {
    e.preventDefault(); if (busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const r = await call(token, "/api/incidents", "POST", { ...draft, title: draft.title.trim(), summary: draft.summary.trim() });
      setDraft({ ...EMPTY }); setFilters({ status: "", severity: "" }); setSearch("");
      const detail = await call(token, `/api/incidents/${encodeURIComponent(r.incident_id)}`);
      setSelected(detail.incident); setView("detail"); setNotice(`Incident ${r.incident_id} created successfully.`);
      await load();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const updateStatus = async (e) => { e.preventDefault(); if (!statusTo || !statusReason.trim()) return; if (await mutate(`${base}/status`, { to: statusTo, reason: statusReason.trim() }, "Status updated and recorded in timeline.")) { setShowStatus(false); setStatusReason(""); setStatusTo(""); } };
  const addNote = async (e) => { e.preventDefault(); if (!note.trim()) return; if (await mutate(`${base}/notes`, { note: note.trim() }, "Investigation note saved.")) setNote(""); };
  const addIoc = async (e) => {
    e.preventDefault();
    if (!ioc.value.trim() || !ioc.source.trim()) return;
    const payload = { ...ioc, value: ioc.value.trim(), source: ioc.source.trim() };
    if (await mutate(`${base}/indicators`, payload, "Indicator added to incident.")) {
      setIoc({ ...EMPTY_IOC });
      setShowIoc(false);
    }
  };
  const propose = async (e) => { e.preventDefault(); if (!actionType || !actionReason.trim()) return; if (await mutate(`${base}/actions`, { action_type: actionType, reason: actionReason.trim() }, "Response action proposed. Approval does not execute the action.")) { setActionType(""); setActionReason(""); } };
  const decide = async (e) => { e.preventDefault(); if (!actionDecision || !decisionReason.trim()) return; if (await mutate(`${base}/actions/${encodeURIComponent(actionDecision.id)}/${actionDecision.decision}`, { reason: decisionReason.trim() }, "Action decision recorded.")) { setActionDecision(null); setDecisionReason(""); } };
  const finish = async (e) => { e.preventDefault(); if (!resolution.reason.trim()) return; const closing = selected.status !== "closed"; const path = closing ? "close" : "reopen"; const body = closing ? { reason: resolution.reason.trim(), root_cause: resolution.root_cause.trim(), lessons_learned: resolution.lessons_learned.trim() } : { reason: resolution.reason.trim() }; if (await mutate(`${base}/${path}`, body, closing ? "Incident closed." : "Incident reopened.")) { setShowResolution(false); setResolution({ reason: "", root_cause: "", lessons_learned: "" }); } };
  const reportSuspected = async (e) => { e.preventDefault(); if (busy) return; setBusy(true); setError(""); try { const r = await call(token, "/api/incidents/report", "POST", { title: draft.title.trim(), summary: draft.summary.trim() }); setDraft({ ...EMPTY }); setNotice(`Report ${r.incident_id} submitted.`); setView("list"); await load(); } catch (err) { setError(err.message); } finally { setBusy(false); } };
  const canClose = isLead && ["recovered", "false_positive"].includes(selected?.status);
  const canReopen = isLead && selected?.status === "closed";

  return <div className="incidents-page">
    {view === "list" && <>
      <div className="incidents-heading"><div><div className="incidents-eyebrow">SECURITY OPERATIONS</div><h1>Security Incidents</h1><p>Track investigations, response actions, and incident outcomes.</p></div>{(isSoc || role === "employee") && <button className="incident-btn incident-btn-primary" onClick={() => { setDraft({ ...EMPTY }); setError(""); setNotice(""); setView("create"); }}><Plus size={16}/> {isSoc ? "New Incident" : "Report Incident"}</button>}</div>
      <div className="incident-stats">{[["Visible incidents", stats.total], ["Open", stats.open], ["Critical", stats.critical], ["Closed", stats.closed]].map(([k,v]) => <div className="incident-stat" key={k}><span>{k}</span><strong>{v}</strong></div>)}</div>
      <div className="incident-panel"><div className="incident-toolbar"><label className="incident-search"><Search size={17}/><input aria-label="Search incidents" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ID, title, or asset" /></label><select aria-label="Filter status" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}><option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select><select aria-label="Filter severity" value={filters.severity} onChange={(e) => setFilters((f) => ({ ...f, severity: e.target.value }))}><option value="">All severities</option>{SEVERITIES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select><button className="incident-btn incident-btn-icon" title="Refresh incidents" aria-label="Refresh incidents" onClick={load} disabled={loading}><RefreshCw size={17}/></button></div>
        <div className="incident-table-wrap"><table className="incident-table"><thead><tr><th>Incident ID</th><th>Title</th><th>Severity</th><th>Status</th><th>Updated</th><th></th></tr></thead><tbody>{visible.map((r) => <tr key={r.incident_id}><td className="incident-id">{r.incident_id}</td><td><strong>{r.title || "Untitled incident"}</strong></td><td><span className={`incident-pill severity-${r.severity}`}>{label(r.severity)}</span></td><td><span className="incident-pill incident-status-pill">{label(r.status)}</span></td><td>{dateLabel(r.audit?.updated_at)}</td><td><button className="incident-link" onClick={() => open(r.incident_id)}>View details</button></td></tr>)}</tbody></table>{loading && <div className="incident-empty">Loading incidents…</div>}{!loading && !error && !visible.length && <div className="incident-empty"><ShieldAlert size={24}/><strong>No incidents found</strong><span>Try adjusting your filters or create a new incident.</span></div>}</div>
      </div><p className="incident-footnote">Counts reflect the currently loaded, authorized records (up to 50), not necessarily all incidents in the database.</p>
    </>}
    {view === "create" && <><button className="incident-back" onClick={back}><ArrowLeft size={17}/> All incidents</button><div className="incidents-heading"><div><div className="incidents-eyebrow">INCIDENT INTAKE</div><h1>{isSoc ? "Create Incident" : "Report Suspected Incident"}</h1><p>Record observed facts. Do not present unverified hypotheses as confirmed.</p></div></div><form className="incident-panel incident-form" onSubmit={isSoc ? create : reportSuspected}><div className="incident-form-grid"><label className="incident-field incident-wide">Title<input required minLength={3} maxLength={200} value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} placeholder="e.g. Suspicious VPN login"/></label><label className="incident-field incident-wide">Description / observed evidence<textarea required rows={5} maxLength={4000} value={draft.summary} onChange={(e) => setDraft((d) => ({ ...d, summary: e.target.value }))} placeholder="What was observed? Include timestamps and affected systems when known."/></label>{isSoc && <><label className="incident-field">Severity<select value={draft.severity} onChange={(e) => setDraft((d) => ({ ...d, severity: e.target.value }))}>{SEVERITIES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select></label><label className="incident-field">Category<select value={draft.category} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}>{CATEGORIES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select></label><label className="incident-field">Detection source<select value={draft.source} onChange={(e) => setDraft((d) => ({ ...d, source: e.target.value }))}>{SOURCES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select></label><label className="incident-field">Traffic Light Protocol (TLP)<select value={draft.tlp} onChange={(e) => setDraft((d) => ({ ...d, tlp: e.target.value }))}>{["white", "green", "amber", "red"].map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}</select></label></>}</div><div className="incident-form-actions"><button type="button" className="incident-btn" onClick={back}>Cancel</button><button type="submit" className="incident-btn incident-btn-primary" disabled={busy || !draft.title.trim() || !draft.summary.trim()}>{busy ? "Saving…" : isSoc ? "Create Incident" : "Submit Report"}</button></div></form></>}
    {view === "detail" && selected && <><button className="incident-back" onClick={back}><ArrowLeft size={17}/> All incidents</button><div className="incidents-heading"><div><div className="incidents-eyebrow">{selected.incident_id}</div><h1>{selected.title}</h1><p>Created {dateLabel(selected.audit?.created_at)} · Last updated {dateLabel(selected.audit?.updated_at)}</p><div className="incident-badges"><span className={`incident-pill severity-${selected.severity}`}>{label(selected.severity)} severity</span><span className="incident-pill incident-status-pill">{label(selected.status)}</span><span className="incident-pill">TLP {String(selected.tlp || "—").toUpperCase()}</span></div></div><button className="incident-btn" onClick={() => open(selected.incident_id)}><RefreshCw size={16}/> Refresh</button></div>
      <div className="incident-detail-grid"><div className="incident-detail-main"><section className="incident-panel incident-section"><h2>Overview</h2><div className="incident-metadata"><div><span>Category</span><strong>{label(selected.category)}</strong></div><div><span>Source</span><strong>{label(selected.detection?.source)}</strong></div><div><span>Assigned analyst</span><strong>{selected.assignment?.owner || "Unassigned"}</strong></div><div><span>Priority</span><strong>{selected.priority || "—"}</strong></div></div><h3>Summary</h3><p className="incident-pre">{selected.summary || "No summary available."}</p></section>
      <section className="incident-panel incident-section"><h2>Investigation</h2><h3>Affected assets</h3>{selected.scope?.affected_assets?.length ? <ul className="incident-plain-list">{selected.scope.affected_assets.map((a,i) => <li key={i}>{a.id} · {label(a.type)} · {label(a.criticality)} criticality</li>)}</ul> : <p className="incident-muted">No affected assets recorded.</p>}<h3>Indicators</h3>{selected.indicators?.length ? <ul className="incident-plain-list">{selected.indicators.map((i,n) => <li key={n}><strong>{label(i.type)}</strong> · {i.value} · {label(i.confidence)} confidence · Source: {i.source || "—"} · TLP {String(i.tlp || "amber").toUpperCase()}</li>)}</ul> : <p className="incident-muted">No indicators recorded.</p>}{isSoc && !["closed", "false_positive"].includes(selected.status) && <div className="incident-subform">
        <button type="button" className="incident-btn" onClick={() => setShowIoc((v) => !v)}>{showIoc ? "Cancel Add Indicator" : "+ Add Indicator"}</button>
        {showIoc && <form className="incident-subform" onSubmit={addIoc}>
          <h3>Add indicator of compromise</h3>
          <div className="incident-form-grid">
            <label className="incident-field">Indicator type<select value={ioc.type} onChange={(e) => setIoc((v) => ({ ...v, type: e.target.value }))}>{IOC_TYPES.map((t) => <option key={t} value={t}>{label(t)}</option>)}</select></label>
            <label className="incident-field">Confidence<select value={ioc.confidence} onChange={(e) => setIoc((v) => ({ ...v, confidence: e.target.value }))}>{["low", "medium", "high"].map((c) => <option key={c} value={c}>{label(c)}</option>)}</select></label>
            <label className="incident-field incident-wide">Indicator value<input required maxLength={2048} value={ioc.value} onChange={(e) => setIoc((v) => ({ ...v, value: e.target.value }))} placeholder="IP, domain, URL, hash, or email" /></label>
            <label className="incident-field">Source<input required maxLength={100} value={ioc.source} onChange={(e) => setIoc((v) => ({ ...v, source: e.target.value }))} placeholder="analyst, SIEM, threat intel" /></label>
            <label className="incident-field">TLP<select value={ioc.tlp} onChange={(e) => setIoc((v) => ({ ...v, tlp: e.target.value }))}>{["white", "green", "amber", "red"].map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}</select></label>
          </div>
          <button type="submit" className="incident-btn incident-btn-primary" disabled={busy || !ioc.value.trim() || !ioc.source.trim()}>{busy ? "Saving…" : "Save Indicator"}</button>
        </form>}
      </div>}{isSoc && <form className="incident-subform" onSubmit={addNote}><label className="incident-field">Add investigation note<textarea rows={3} maxLength={2000} required value={note} onChange={(e) => setNote(e.target.value)} placeholder="Document observations, evidence, analysis, or next steps."/></label><button className="incident-btn incident-btn-primary" disabled={busy || !note.trim()}>Save Note</button></form>}</section>
      <section className="incident-panel incident-section"><h2>Response Actions</h2><p className="incident-muted">Actions are proposals and approvals only. SecureRAG does not execute containment commands.</p>{selected.actions?.length ? <div className="incident-action-list">{selected.actions.map((a) => <div className="incident-action" key={a.id}><div><strong>{a.id} · {label(a.type)}</strong><p>{label(a.state)}{a.reason ? ` · ${a.reason}` : ""}</p></div><div className="incident-action-controls">{isLead && a.state === "proposed" && <><button className="incident-btn" onClick={() => { setActionDecision({ id: a.id, decision: "approve" }); setDecisionReason(""); }}>Approve</button><button className="incident-btn" onClick={() => { setActionDecision({ id: a.id, decision: "reject" }); setDecisionReason(""); }}>Reject</button></>}{isSoc && a.state === "approved" && <button className="incident-btn" onClick={() => { setActionDecision({ id: a.id, decision: "executed" }); setDecisionReason(""); }}>Mark manually executed</button>}</div></div>)}</div> : <p className="incident-muted">No response actions proposed.</p>}{actionDecision && <form className="incident-subform" onSubmit={decide}><strong>{label(actionDecision.decision)} {actionDecision.id}</strong><label className="incident-field">Reason<textarea required maxLength={1000} rows={2} value={decisionReason} onChange={(e) => setDecisionReason(e.target.value)}/></label><div className="incident-form-actions"><button type="button" className="incident-btn" onClick={() => setActionDecision(null)}>Cancel</button><button className="incident-btn incident-btn-primary" disabled={busy || !decisionReason.trim()}>Confirm</button></div></form>}{isSoc && !["closed", "false_positive"].includes(selected.status) && <form className="incident-subform" onSubmit={propose}><h3>Propose response action</h3><label className="incident-field">Action type<select required value={actionType} onChange={(e) => setActionType(e.target.value)}><option value="">Select action</option>{ACTION_TYPES.map((a) => <option key={a} value={a}>{label(a)}</option>)}</select></label><label className="incident-field">Justification<textarea required rows={2} maxLength={1000} value={actionReason} onChange={(e) => setActionReason(e.target.value)}/></label><button className="incident-btn" disabled={busy || !actionType || !actionReason.trim()}>Submit Proposal</button></form>}</section>
      <section className="incident-panel incident-section"><h2>Activity Timeline</h2>{selected.timeline?.length ? <ol className="incident-timeline">{[...selected.timeline].reverse().map((t,i) => <li key={`${t.ts}-${i}`}><div className="incident-timeline-date"><Clock3 size={14}/>{dateLabel(t.ts)} · {label(t.kind)}</div><p className="incident-pre">{t.event}</p><small>{t.actor || "System"}</small></li>)}</ol> : <p className="incident-muted">No activity recorded.</p>}</section></div>
      <aside className="incident-detail-side"><section className="incident-panel incident-section"><h2>Incident Status</h2><div className="incident-current-status">{label(selected.status)}</div>{isSoc && (NEXT[selected.status] || []).length > 0 && <><button className="incident-btn incident-btn-primary incident-full" onClick={() => { setShowStatus((v) => !v); setStatusTo(""); setStatusReason(""); }}>{showStatus ? "Cancel Status Update" : "Update Status"}</button>{showStatus && <form className="incident-subform" onSubmit={updateStatus}><label className="incident-field">Move to<select required value={statusTo} onChange={(e) => setStatusTo(e.target.value)}><option value="">Select next status</option>{NEXT[selected.status].map((s) => <option key={s} value={s}>{label(s)}</option>)}</select></label><label className="incident-field">Reason for change<textarea required rows={3} maxLength={1000} value={statusReason} onChange={(e) => setStatusReason(e.target.value)} placeholder="Explain what evidence supports this transition."/></label><button className="incident-btn incident-btn-primary incident-full" disabled={busy || !statusTo || !statusReason.trim()}>Confirm Status Change</button></form>}</>}{!NEXT[selected.status]?.length && !canClose && !canReopen && <p className="incident-muted">No status transitions available for your role.</p>}</section>
      {(canClose || canReopen) && <section className="incident-panel incident-section"><h2>Resolution</h2><p className="incident-muted">{canClose ? "Close only after investigation and recovery requirements are met." : "Reopen this incident for further investigation."}</p><button className="incident-btn incident-full" onClick={() => setShowResolution((v) => !v)}>{canClose ? "Close Incident" : "Reopen Incident"}</button>{showResolution && <form className="incident-subform" onSubmit={finish}><label className="incident-field">Reason<textarea required rows={2} maxLength={1000} value={resolution.reason} onChange={(e) => setResolution((r) => ({ ...r, reason: e.target.value }))}/></label>{canClose && <><label className="incident-field">Root cause<textarea rows={2} maxLength={2000} value={resolution.root_cause} onChange={(e) => setResolution((r) => ({ ...r, root_cause: e.target.value }))}/></label><label className="incident-field">Lessons learned<textarea rows={2} maxLength={2000} value={resolution.lessons_learned} onChange={(e) => setResolution((r) => ({ ...r, lessons_learned: e.target.value }))}/></label></>}<button className="incident-btn incident-btn-primary incident-full" disabled={busy || !resolution.reason.trim()}>Confirm {canClose ? "Closure" : "Reopening"}</button></form>}</section>}
      {selected.resolution?.closed_at && <section className="incident-panel incident-section"><h2>Recorded Resolution</h2><p className="incident-muted">Closed {dateLabel(selected.resolution.closed_at)}</p><p><strong>Root cause:</strong> {selected.resolution.root_cause || "Not recorded"}</p><p><strong>Lessons learned:</strong> {selected.resolution.lessons_learned || "Not recorded"}</p></section>}
      {selected.ai_provenance?.generated_sections?.length > 0 && !selected.ai_provenance.human_verified && <div className="incident-ai-warning">AI-generated sections have not been independently verified. Verification is handled separately from routine incident updates.</div>}
      </aside></div>
    </>}
    {error && <div className="incident-feedback incident-error" role="alert">{error}</div>}
    {notice && <div className="incident-feedback incident-success" role="status">{notice}</div>}
  </div>;
}
