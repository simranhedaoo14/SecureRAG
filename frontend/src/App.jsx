
import { useState } from "react";
import {
  ShieldCheck, Search, MessageSquare, LayoutDashboard,
  FileText, Activity, Settings, LockKeyhole, Send,
  CheckCircle2, AlertTriangle, ShieldAlert, ChevronDown,
  Menu, Plus, Bot, UserRound, Database, ArrowUpRight
} from "lucide-react";
import "./App.css";
import Login from "./Login";

const tests = [
  "Engineering blocked from HR data",
  "HR user can retrieve HR data",
  "Unknown department denied",
  "Missing document department denied",
  "Unexpected classification denied",
  "Missing user department denied",
  "Salary absent from Engineering context",
  "Salary absent when department is missing",
  "Prompt-injection payload retrieval",
];

const initialMessages = [
  {
    role: "assistant",
    text: "Welcome to SecureRAG. Ask a question about the company knowledge base. Document access is filtered according to your selected demo role.",
  },
];

export default function App() {
  const [role, setRole] = useState("engineering");
  const [page, setPage] = useState("Overview");
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [session, setSession] = useState(null);
  
async function sendMessage(e) {
  e.preventDefault();

  const question = input.trim();
  if (!question) return;

  setMessages((old) => [...old, { role: "user", text: question }]);
  setInput("");
  setPage("Chat");

  try {
    const department = role === "missing" ? "" : role;

    const response = await fetch("http://localhost:8001/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      question,
      department: session.department,
    }),
  });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Request failed");
    }

    const sources = data.sources?.length
      ? data.sources.map((s) => `${s.source} (${s.classification})`).join(", ")
      : "No documents retrieved";

    setMessages((old) => [
  ...old,
  {
    role: "assistant",
    text: data.answer,
    sources: data.sources || [],
  },
]);
} catch (error) {
  setMessages((old) => [
    ...old,
    {
      role: "assistant",
      text: `Backend error: ${error.message}. Check that FastAPI is running on port 8001.`,
    },
  ]);
}
}

  const navigate = (next) => setPage(next);
  if (!session) {
    return <Login onLogin={setSession} />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><ShieldCheck size={24} /></div>
          <div><strong>SecureRAG</strong><span>AI SECURITY LAB</span></div>
        </div>

        <div className="workspace-label">WORKSPACE</div>
        {[
          ["Overview", LayoutDashboard],
          ["Chat", MessageSquare],
          ["Knowledge Base", Database],
          ["Security Tests", ShieldCheck],
          ["Activity Logs", Activity],
        ].map(([name, Icon]) => (
          <button key={name} className={`nav-item ${page === name ? "active" : ""}`} onClick={() => navigate(name)}>
            <Icon size={18} /><span>{name}</span>
          </button>
        ))}

        <div className="sidebar-bottom">
          <div className="system-status"><span className="status-dot" /> Local lab <span className="status-right">Ready</span></div>
          <button className="nav-item" onClick={() => navigate("Settings")}><Settings size={18} /> Settings</button>
          <div className="profile"><div className="avatar">S</div><div><strong>Security Analyst</strong><span>Local demo user</span></div></div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="breadcrumb"><span>SecureRAG</span><span>/</span><strong>{page}</strong></div>
          <div className="top-actions">
            <span className="environment"><span className="status-dot" /> LOCAL ENVIRONMENT</span>
            <label className="role-picker">
              <UserRound size={16} />
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="engineering">Engineering</option>
                <option value="hr">Human Resources</option>
                <option value="finance">Finance (Unknown)</option>
                <option value="missing">No Department</option>
              </select>
              <ChevronDown size={14} />
            </label>
          </div>
        </header>

        {page === "Overview" && (
          <div className="content">
            <div className="welcome-row">
              <div><div className="eyebrow">SECURITY OPERATIONS / OVERVIEW</div><h1>AI Security Overview</h1><p>Monitor retrieval security, access controls, and RAG evaluation results.</p></div>
              <button className="primary-button" onClick={() => navigate("Chat")}><MessageSquare size={16} /> Open Secure Chat</button>
            </div>

            <div className="banner"><div className="banner-icon"><ShieldCheck size={24} /></div><div><strong>Retrieval access controls enabled</strong><p>Department and document classification policies are applied before context is sent to the language model.</p></div><span className="banner-badge">LOCAL DEMO</span></div>

            <section className="stats-grid">
              <Stat icon={ShieldCheck} label="Security regression tests" value="9 / 9" detail="All recorded tests passed" tone="green" />
              <Stat icon={FileText} label="Knowledge documents" value="3" detail="Synthetic test documents" tone="blue" />
              <Stat icon={LockKeyhole} label="Access policy" value="Default deny" detail="Unknown classifications blocked" tone="purple" />
              <Stat icon={Activity} label="Prompt injection" value="Tested" detail="One manual model-response test" tone="amber" />
            </section>

            <div className="section-heading"><div><h2>Security posture</h2><p>Current local lab configuration</p></div><span className="muted-tag">DEVELOPMENT</span></div>
            <div className="lower-grid">
              <div className="panel">
                <div className="panel-title"><div><h3>Access policy</h3><p>Document authorization rules</p></div><LockKeyhole size={19} /></div>
                <PolicyRow title="Shared internal documents" desc="Available to all configured demo users" status="ALLOWED" green />
                <PolicyRow title="Confidential HR documents" desc="HR department only" status="RESTRICTED" />
                <PolicyRow title="Missing or invalid metadata" desc="Does not satisfy allow rules" status="DENIED" />
                <div className="panel-note"><AlertTriangle size={16} /> Demo roles are simulated locally, not authenticated identities.</div>
              </div>
              <div className="panel">
                <div className="panel-title"><div><h3>Recent security checks</h3><p>Authorization regression suite</p></div><button className="icon-button" onClick={() => navigate("Security Tests")}><ArrowUpRight size={17} /></button></div>
                {tests.slice(0, 4).map((test) => <div className="test-row" key={test}><CheckCircle2 size={17} /><span>{test}</span><strong>PASS</strong></div>)}
                <button className="text-button" onClick={() => navigate("Security Tests")}>View all security tests →</button>
              </div>
            </div>
            <div className="footer-note"><ShieldAlert size={15} /> Research prototype · Not production security software</div>
          </div>
        )}

        {page === "Chat" && (
          <div className="chat-layout">
            <div className="chat-header"><div><div className="eyebrow">RETRIEVAL-AUGMENTED GENERATION</div><h1>Secure Chat</h1><p>Ask questions against your authorized knowledge base.</p></div><span className="muted-tag">ROLE: {role.toUpperCase()}</span></div>
    <div className="chat-messages">
      {messages.map((m, i) => (
        <div key={i} className={`message ${m.role}`}>
          <div className="message-avatar">
            {m.role === "assistant" ? (
              <Bot size={18} />
            ) : (
              <UserRound size={18} />
            )}
          </div>

          <div>
            <div className="message-label">
              {m.role === "assistant" ? "SecureRAG Assistant" : "You"}
            </div>

            <div className="message-bubble">{m.text}</div>

            {m.role === "assistant" && m.sources?.length > 0 && (
              <div className="message-sources">
                <div className="sources-label">Retrieved sources</div>
                <div className="source-list">
                  {m.sources.map((source, index) => (
                    <span className="source-chip" key={index}>
                      {typeof source === "string"
                        ? source
                        : `${source.source} (${source.classification})`}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>            <form className="chat-composer" onSubmit={sendMessage}><textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about company policies..." rows="2" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }} /><button className="send-button" type="submit"><Send size={17} /> Send</button></form>
                <p className="chat-disclaimer">Demo interface · Responses use retrieved documents and simulated department access.</p>
              </div>
            )}

        {page === "Security Tests" && (
          <div className="content">
            <div className="welcome-row"><div><div className="eyebrow">VALIDATION / REGRESSION</div><h1>Security Tests</h1><p>Recorded local test results. Run the Python test suite to revalidate.</p></div><span className="success-pill"><CheckCircle2 size={16} /> 9 recorded passes</span></div>
            <div className="panel test-panel">{tests.map((test, i) => <div className="full-test-row" key={test}><div className="test-number">{String(i + 1).padStart(2, "0")}</div><div className="test-info"><strong>{test}</strong><span>{i === 8 ? "Confirms the synthetic injection payload is retrievable; does not test model resistance." : "Recorded pass from the local regression test suite."}</span></div><span className="pass-tag">PASS</span></div>)}</div>
            <div className="panel-note standalone"><AlertTriangle size={17} /> These are recorded results, not live test execution. The injection retrieval test does not establish resistance to all prompt injections.</div>
          </div>
        )}

        {page === "Knowledge Base" && (
          <div className="content"><div className="welcome-row"><div><div className="eyebrow">DATA / DOCUMENTS</div><h1>Knowledge Base</h1><p>Fictional documents indexed in local ChromaDB.</p></div><Database size={26} /></div><div className="panel">{[["company_handbook.txt","Internal","Shared"],["security_notice.txt","Internal","Shared"],["hr_confidential.txt","Confidential","HR only"]].map(([name, cls, access]) => <div className="document-row" key={name}><FileText size={20} /><div><strong>{name}</strong><span>Text document · Synthetic lab data</span></div><span className="muted-tag">{cls}</span><span className={access === "HR only" ? "restricted-tag" : "pass-tag"}>{access}</span></div>)}</div></div>
        )}

        {page === "Activity Logs" && (
          <div className="content"><div className="welcome-row"><div><div className="eyebrow">OBSERVABILITY / EVENTS</div><h1>Activity Logs</h1><p>Illustrative events from your local security lab.</p></div><Activity size={26} /></div><div className="panel"><div className="log-row"><span className="log-time">LOCAL DEMO</span><CheckCircle2 size={17} /><div><strong>Authorization regression tests passed</strong><span>Eight authorization and leakage checks plus one payload retrieval check have been reported as passing.</span></div></div><div className="log-row"><span className="log-time">MANUAL</span><ShieldCheck size={17} /><div><strong>Prompt injection experiment</strong><span>One tested payload was not followed by the model in a manual experiment.</span></div></div><div className="log-row"><span className="log-time">POLICY</span><LockKeyhole size={17} /><div><strong>Default-deny retrieval rules</strong><span>Unexpected document metadata does not match the current allow policy.</span></div></div></div></div>
        )}

        {page === "Settings" && (
          <div className="content"><div className="welcome-row"><div><div className="eyebrow">CONFIGURATION</div><h1>Settings</h1><p>Local demonstration settings.</p></div><Settings size={26} /></div><div className="panel settings-panel"><h3>Simulated user role</h3><p>Choose a role using the selector in the top-right corner. This selection is only for the frontend demonstration and does not authenticate a user or change backend permissions.</p><h3>Backend connection</h3><p>Not connected yet. Chat responses are currently frontend placeholders.</p><h3>Security note</h3><p>Backend authorization must remain the source of truth. Never rely on frontend role selection for confidential document access.</p></div></div>
        )}
      </main>
    </div>
  );
}

function Stat({ icon: Icon, label, value, detail, tone }) {
  return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={19} /></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-detail">{detail}</div></div>;
}
function PolicyRow({ title, desc, status, green }) {
  return <div className="policy-row"><div><strong>{title}</strong><span>{desc}</span></div><span className={green ? "pass-tag" : "restricted-tag"}>{status}</span></div>;
}
