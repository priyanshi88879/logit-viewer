import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, Globe, AlertCircle, User, Lock, Terminal, Database, Server, Cpu, Layers, ArrowRight, Check, Copy, Laptop, X, Moon, Sun } from 'lucide-react';

interface LoginPortalProps {
  onLogin: (email: string, name: string, token: string, server: string) => void;
  defaultServer: string;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const LoginPortal: React.FC<LoginPortalProps> = ({ onLogin, defaultServer, theme, toggleTheme }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [serverUrl, setServerUrl] = useState<string>(() => {
    return defaultServer || 'http://localhost:4000';
  });
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Docs sub-tab state
  const [docsTab, setDocsTab] = useState<'db' | 'backend' | 'frontend' | 'flume'>('backend');

  // Simulated live logs for the hero mockup
  const [mockLogs, setMockLogs] = useState<any[]>([
    { time: '17:05:12', level: 'info', app: 'auth-server', msg: 'JWT session authenticated for user_988' },
    { time: '17:05:15', level: 'warn', app: 'payment-gateway', msg: 'Latency threshold reached: 1.2s' },
    { time: '17:05:22', level: 'info', app: 'web-portal', msg: 'Client bootstrap complete' },
    { time: '17:05:26', level: 'error', app: 'data-engine', msg: 'Flume pipeline retry connection attempt 3' }
  ]);

  // Log simulation loop
  useEffect(() => {
    const apps = ['web-portal', 'auth-server', 'payment-gateway', 'data-engine', 'billing-cron'];
    const levels = ['info', 'warn', 'error', 'debug'];
    const messages = [
      'Successfully synchronized MongoDB replica set.',
      'API query processed in 12ms',
      'Database connection pooled: 14 active',
      'Webhook fired to endpoint: /payments/webhook',
      'Pruning logs: 43 old records removed (FIFO)',
      'Ingestion handler received Flume payload batch: 5 events'
    ];

    const interval = setInterval(() => {
      const randomApp = apps[Math.floor(Math.random() * apps.length)];
      const randomLevel = levels[Math.floor(Math.random() * levels.length)];
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      setMockLogs(prev => [
        { time: timeStr, level: randomLevel, app: randomApp, msg: randomMsg },
        ...prev.slice(0, 3)
      ]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverUrl.trim() || !username.trim() || !password.trim()) {
      setErrorMsg('All fields are required.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    const formattedServerUrl = serverUrl.replace(/\/$/, '');

    try {
      const response = await fetch(`${formattedServerUrl}/logit/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Invalid username or password.');
      }

      setIsLoading(false);
      setShowLoginModal(false);
      onLogin(data.user.email, data.user.name, data.token, formattedServerUrl);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Failed to connect to the Logit server.');
    }
  };

  return (
    <div style={{ background: 'var(--bg-darkest)', color: 'var(--text-primary)', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', overflowX: 'hidden', transition: 'background-color var(--transition-normal), color var(--transition-normal)' }}>
      
      {/* 1. Header / Navigation Bar */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, backdropFilter: 'blur(16px)', background: 'var(--bg-sidebar)', opacity: 0.95, borderBottom: '1px solid var(--border-color)', padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background-color var(--transition-normal), border-color var(--transition-normal)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--primary), var(--primary-hover))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={18} style={{ color: '#fff' }} />
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '1px', margin: 0, color: 'var(--text-primary)' }}>LOGIT</h2>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <a href="#features" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500, transition: 'color 0.2s' }}>Features</a>
          <a href="#docs" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 500, transition: 'color 0.2s' }}>Docs</a>
          
          <button
            className="theme-toggle-btn flex-center"
            onClick={toggleTheme}
            style={{ marginRight: 0 }}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
          </button>

          <button 
            onClick={() => setShowLoginModal(true)} 
            style={{ padding: '8px 16px', background: 'var(--primary)', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', boxShadow: 'var(--shadow-btn)' }}
          >
            Launch Console
          </button>
        </nav>
      </header>

      {/* 2. Hero Section */}
      <section style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '80px 40px 60px 40px', maxWidth: '1280px', margin: '0 auto', gap: '40px' }}>
        
        {/* Hero Left Content */}
        <div style={{ flex: 1.1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <span style={{ display: 'inline-block', fontSize: '0.7rem', color: 'var(--primary)', background: 'var(--primary-glow)', padding: '4px 10px', borderRadius: '20px', fontWeight: 600, textTransform: 'uppercase', border: '1px solid var(--border-color)' }}>Self-Hosted Log Pipeline</span>
            <h1 style={{ fontSize: '3.2rem', fontWeight: 900, lineHeight: 1.1, margin: '12px 0 8px 0', color: 'var(--text-primary)' }}>
              Your Logs. <br />Your Databases.
            </h1>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              An industrial-grade telemetry pipeline for frontend and backend applications. Save to your own MongoDB, prune automatically like a queue, and stream events to a stunning terminal dashboard.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <button 
              onClick={() => setShowLoginModal(true)} 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow-btn-hover)' }}
            >
              Launch Console <ArrowRight size={16} />
            </button>
            <a 
              href="#docs" 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'var(--bg-section)', color: 'var(--text-primary)', textDecoration: 'none', border: '1px solid var(--border-color)', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600 }}
            >
              Read Setup Docs
            </a>
          </div>
        </div>

        {/* Hero Right Mockup Console Dashboard */}
        <div style={{ flex: 0.9, position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-20px', left: '-20px', right: '20px', bottom: '20px', borderRadius: '12px', filter: 'blur(40px)', background: 'var(--primary-glow)', zIndex: 0 }}></div>
          
          <div className="glassmorphic" style={{ position: 'relative', zIndex: 1, border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-card)', padding: '16px', boxShadow: 'var(--shadow-glass)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }}></span>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#eab308' }}></span>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }}></span>
              </div>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>live_feed_broadcaster</span>
            </div>

            {/* Simulating Log Terminal Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '180px', fontFamily: 'monospace', fontSize: '0.65rem' }}>
              {mockLogs.map((log, index) => (
                <div key={index} className="animate-fade-in" style={{ display: 'flex', gap: '8px', padding: '6px 8px', background: 'var(--bg-section)', borderRadius: '4px', borderLeft: `3px solid ${log.level === 'error' ? 'var(--error-color)' : log.level === 'warn' ? 'var(--warn-color)' : 'var(--info-color)'}` }}>
                  <span style={{ color: 'var(--text-muted)' }}>{log.time}</span>
                  <span style={{ textTransform: 'uppercase', fontWeight: 700, color: log.level === 'error' ? 'var(--error-color)' : log.level === 'warn' ? 'var(--warn-color)' : 'var(--info-color)' }}>{log.level}</span>
                  <span style={{ color: 'var(--primary)' }}>[{log.app}]</span>
                  <span style={{ color: 'var(--text-primary)', flex: 1 }}>{log.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </section>

      {/* 3. Features Grid Section */}
      <section id="features" style={{ background: 'var(--bg-editor)', padding: '80px 40px', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>Engineered for Developers</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Everything you need for log ingestion and streaming, out of the box.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <div style={{ padding: '24px', background: 'var(--bg-sidebar)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-glass)' }}>
              <Database size={24} style={{ color: 'var(--primary)', marginBottom: '12px' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 8px 0' }}>MongoDB / Redis Cap</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>Pipes logs directly into your MongoDB databases, dynamically pruning the oldest logs when database capacity matches limits.</p>
            </div>
            <div style={{ padding: '24px', background: 'var(--bg-sidebar)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-glass)' }}>
              <Cpu size={24} style={{ color: 'var(--primary)', marginBottom: '12px' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 8px 0' }}>SaaS Console Dashboard</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>Monitor log servers, filter operators, search match timelines, and review latencies inside the React console.</p>
            </div>
            <div style={{ padding: '24px', background: 'var(--bg-sidebar)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-glass)' }}>
              <Terminal size={24} style={{ color: 'var(--primary)', marginBottom: '12px' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 8px 0' }}>Apache Flume Pipelines</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>Exposes an HTTP source sink receiver mapping Flume events and base64 payloads to database records automatically.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Interactive Setup Documentation (Docs Section) */}
      <section id="docs" style={{ padding: '80px 40px', maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '40px' }}>
          
          {/* Docs Tab Selector Navigation */}
          <div style={{ width: '240px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px' }}>Documentation</h3>
            <button 
              onClick={() => setDocsTab('backend')} 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', border: 'none', borderRadius: '6px', background: docsTab === 'backend' ? 'var(--primary-glow)' : 'transparent', color: docsTab === 'backend' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem' }}
            >
              <Server size={16} /> Backend Server SDK
            </button>
            <button 
              onClick={() => setDocsTab('frontend')} 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', border: 'none', borderRadius: '6px', background: docsTab === 'frontend' ? 'var(--primary-glow)' : 'transparent', color: docsTab === 'frontend' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem' }}
            >
              <Laptop size={16} /> Frontend Client SDK
            </button>
            <button 
              onClick={() => setDocsTab('db')} 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', border: 'none', borderRadius: '6px', background: docsTab === 'db' ? 'var(--primary-glow)' : 'transparent', color: docsTab === 'db' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem' }}
            >
              <Database size={16} /> MongoDB Storage
            </button>
            <button 
              onClick={() => setDocsTab('flume')} 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', border: 'none', borderRadius: '6px', background: docsTab === 'flume' ? 'var(--primary-glow)' : 'transparent', color: docsTab === 'flume' ? 'var(--primary)' : 'var(--text-secondary)', cursor: 'pointer', textAlign: 'left', fontWeight: 600, fontSize: '0.8rem' }}
            >
              <Layers size={16} /> Apache Flume
            </button>
          </div>

          <div style={{ flex: 1, background: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '32px', boxShadow: 'var(--shadow-glass)' }}>
            
            {/* Backend Ingestion Server Docs */}
            {docsTab === 'backend' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Setting up the Ingestion Server</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: 0 }}>Install the unified package and initialize the ingestion pipeline to receive logs, manage databases, and stream WebSockets.</p>
                </div>
                
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '6px', textTransform: 'uppercase', color: 'var(--primary)' }}>1. Standalone Setup</span>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-code)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.8rem', marginBottom: '8px' }}>
                    <code style={{ flex: 1, fontFamily: 'monospace', color: 'var(--text-primary)' }}>npm install logit-logger mongoose express socket.io</code>
                    <button onClick={() => copyToClipboard('npm install logit-logger mongoose express socket.io', 'cb-b1')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}>
                      {copiedText === 'cb-b1' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  <div style={{ position: 'relative', background: 'var(--bg-code)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.75rem' }}>
                    <button onClick={() => copyToClipboard(`import { createLogitServer } from 'logit-logger/server';\n\nconst server = createLogitServer({\n  username: 'admin',\n  password: 'securePassword123',\n  ingestKey: 'secret_ingest_key',\n  mongoUri: 'mongodb://127.0.0.1:27017/logit-logs',\n  port: 4000,\n  maxLogCount: 10000\n});`, 'cb-b2')} style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', zIndex: 10 }}>
                      {copiedText === 'cb-b2' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <pre style={{ margin: 0, fontFamily: 'monospace', color: 'var(--text-primary)', lineHeight: 1.4, overflowX: 'auto' }}>
{`import { createLogitServer } from 'logit-logger/server';

const server = createLogitServer({
  username: 'admin',                          // Login username for the dashboard console
  password: 'securePassword123',              // Login password for the dashboard console
  ingestKey: 'secret_ingest_key',              // Secret header token expected from client SDKs
  mongoUri: 'mongodb://127.0.0.1:27017/logit', // Local or remote MongoDB cluster URI
  port: 4000,                                 // Listening port (runs WebSocket on same port)
  maxLogCount: 10000                          // Queue threshold before FIFO pruning triggers
});`}
                    </pre>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '6px', textTransform: 'uppercase', color: 'var(--primary)' }}>2. Available Configuration Parameters</span>
                  <div style={{ background: 'var(--bg-section)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div><strong>`username`</strong> <span style={{ color: 'var(--text-muted)' }}>(string, required)</span>: Admin credential used to login.</div>
                    <div><strong>`password`</strong> <span style={{ color: 'var(--text-muted)' }}>(string, required)</span>: Admin credential (plain-text, stored in memory/session verification).</div>
                    <div><strong>`ingestKey`</strong> <span style={{ color: 'var(--text-muted)' }}>(string, required)</span>: Handshake key used in SDK payloads. Clients must specify this.</div>
                    <div><strong>`mongoUri`</strong> <span style={{ color: 'var(--text-muted)' }}>(string, required)</span>: MongoDB Connection String (e.g. `mongodb+srv://...`).</div>
                    <div><strong>`port`</strong> <span style={{ color: 'var(--text-muted)' }}>(number, optional)</span>: Server port. Defaults to `4000`.</div>
                    <div><strong>`maxLogCount`</strong> <span style={{ color: 'var(--text-muted)' }}>(number, optional)</span>: Database size ceiling. Defaults to `10000`.</div>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '6px', textTransform: 'uppercase', color: 'var(--primary)' }}>3. API Endpoints Map</span>
                  <div style={{ background: 'var(--bg-section)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.7rem', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div><span style={{ color: '#22c55e', fontWeight: 700 }}>POST</span> /logit/login - Login admin dashboard. Returns JWT token.</div>
                    <div><span style={{ color: '#3b82f6', fontWeight: 700 }}>GET</span>  /logit/me - Validate current session.</div>
                    <div><span style={{ color: '#22c55e', fontWeight: 700 }}>POST</span> /logit/ingest - Endpoint to ingest client logs.</div>
                    <div><span style={{ color: '#22c55e', fontWeight: 700 }}>POST</span> /logit/flume - Target path for Apache Flume HTTP sink payloads.</div>
                    <div><span style={{ color: '#3b82f6', fontWeight: 700 }}>GET</span>  /logit/logs - Fetch paginated logs. Query params: `from`, `to`, `app`, `level`.</div>
                  </div>
                </div>
              </div>
            )}

            {/* Frontend Ingestion Client Docs */}
            {docsTab === 'frontend' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Setting up Frontend SDK</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: 0 }}>Add the logger capture engine to your client app to intercept browser outputs, batch transmissions, and log network failures.</p>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '6px', textTransform: 'uppercase', color: 'var(--primary)' }}>1. Install the SDK package</span>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-code)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                    <code style={{ flex: 1, fontFamily: 'monospace', color: 'var(--text-primary)' }}>npm install logit-logger</code>
                    <button onClick={() => copyToClipboard('npm install logit-logger', 'cb-f1')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}>
                      {copiedText === 'cb-f1' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '6px', textTransform: 'uppercase', color: 'var(--primary)' }}>2. Client Initialization</span>
                  <div style={{ position: 'relative', background: 'var(--bg-code)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.75rem' }}>
                    <button onClick={() => copyToClipboard(`import { LogitClient } from 'logit-logger';\n\nconst logit = new LogitClient({\n  serverUrl: 'http://localhost:4000',\n  ingestKey: 'secret_ingest_key',\n  appName: 'e-commerce-portal',\n  matchId: 'session_v1_operator_22',\n  captureConsole: true,\n  captureErrors: true,\n  batchIntervalMs: 3000,\n  maxBatchSize: 20,\n  debug: false\n});`, 'cb-f2')} style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', zIndex: 10 }}>
                      {copiedText === 'cb-f2' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <pre style={{ margin: 0, fontFamily: 'monospace', color: 'var(--text-primary)', lineHeight: 1.4, overflowX: 'auto' }}>
{`import { LogitClient } from 'logit-logger';

const logit = new LogitClient({
  serverUrl: 'http://localhost:4000',     // Ingestion Server Target URL
  ingestKey: 'secret_ingest_key',         // Must match the server's ingestKey
  appName: 'e-commerce-portal',           // Name identifier of this client source
  matchId: 'session_v1_operator_22',      // Group logs into unique match folders
  captureConsole: true,                   // Intercept console.log/info/warn/error
  captureErrors: true,                    // Catch unhandled runtime page errors
  batchIntervalMs: 3000,                  // Flush logs buffer every 3000ms
  maxBatchSize: 20,                       // Force flush if log buffer hits 20 items
  debug: false                            // Print SDK logging to console (default: false)
});`}
                    </pre>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '6px', textTransform: 'uppercase', color: 'var(--primary)' }}>3. SDK Logging API</span>
                  <div style={{ background: 'var(--bg-section)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <strong>Explicit Log Calls:</strong>
                      <pre style={{ background: 'var(--bg-code)', padding: '8px', borderRadius: '4px', margin: '6px 0 0 0', fontFamily: 'monospace' }}>
{`logit.info('User viewed product', { productId: 456, price: 99.9 });
logit.warn('API Response slow', { latencyMs: 820 });
logit.error('Checkout failed', { error: 'Card Declined', code: 'C_503' });`}
                      </pre>
                    </div>
                    <div>
                      <strong>Custom Event Structure:</strong> All log payloads dynamically collect request details (page URL, response_time, method, IP address, content_length) and client metadata automatically.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DB Configuration Docs */}
            {docsTab === 'db' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>MongoDB Storage & FIFO Pruning</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: 0 }}>Understand document fields and configure self-pruning mechanisms to prevent database growth.</p>
                </div>

                <div style={{ background: 'var(--bg-section)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.75rem' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Rolling FIFO Queue Mechanism</h4>
                  <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    Whenever a batch of logs is written, Logit checks the total number of documents in the database. If it exceeds your configuration threshold (`maxLogCount`, default 10,000):
                  </p>
                  <ol style={{ paddingLeft: '20px', marginTop: '8px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <li>Calculates the excess count: <code>excess = current_count - maxLogCount</code>.</li>
                    <li>Queries the IDs of the oldest <code>excess</code> records sorted by <code>timestamp</code>.</li>
                    <li>Deletes the excess records using a bulk delete operator.</li>
                  </ol>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '6px', textTransform: 'uppercase', color: 'var(--primary)' }}>Log Collection Schema Properties</span>
                  <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem', textAlign: 'left', background: 'var(--bg-sidebar)' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-section)', borderBottom: '1px solid var(--border-color)' }}>
                          <th style={{ padding: '8px 12px' }}>Field</th>
                          <th style={{ padding: '8px 12px' }}>Type</th>
                          <th style={{ padding: '8px 12px' }}>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>timestamp</td>
                          <td style={{ padding: '8px 12px' }}>Date / Number</td>
                          <td style={{ padding: '8px 12px' }}>Time the event was captured</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>appName</td>
                          <td style={{ padding: '8px 12px' }}>String</td>
                          <td style={{ padding: '8px 12px' }}>Name of the app source</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>level</td>
                          <td style={{ padding: '8px 12px' }}>String</td>
                          <td style={{ padding: '8px 12px' }}>info, warn, error, fatal, debug</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>message</td>
                          <td style={{ padding: '8px 12px' }}>String</td>
                          <td style={{ padding: '8px 12px' }}>Main log payload message</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>response_time</td>
                          <td style={{ padding: '8px 12px' }}>Number</td>
                          <td style={{ padding: '8px 12px' }}>Latency of operations in milliseconds</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '6px', textTransform: 'uppercase', color: 'var(--primary)' }}>MongoDB Performance Optimization Sinks</span>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    To ensure instantaneous dashboard filtering at scale, it is highly recommended to run this index creation command in your MongoDB shell:
                  </p>
                  <pre style={{ background: 'var(--bg-code)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.7rem', marginTop: '6px', fontFamily: 'monospace' }}>
                    {`db.logs.createIndex({ matchId: 1, appName: 1, level: 1, timestamp: -1 });`}
                  </pre>
                </div>
              </div>
            )}

            {/* Apache Flume Sink Docs */}
            {docsTab === 'flume' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Piping Events with Apache Flume</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: 0 }}>Enterprise data pipelines can stream syslog files or event buffers directly to the Logit ingest port.</p>
                </div>

                <div style={{ background: 'var(--bg-section)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.75rem', lineHeight: 1.4 }}>
                  <strong>How the HTTP Sink Ingestion Works:</strong>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>
                    Logit exposes an open path <code>POST /logit/flume</code>. This matches Flume's standard JSON format where log payloads are parsed, base64-decoded from the event body, and written to MongoDB as clean, structured records.
                  </p>
                </div>

                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '6px', textTransform: 'uppercase', color: 'var(--primary)' }}>Example Config: Tail Nginx Log to Logit (`flume.conf`)</span>
                  <div style={{ position: 'relative', background: 'var(--bg-code)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.75rem' }}>
                    <button onClick={() => copyToClipboard(`# Define agent components\nlogit-agent.sources = nginx-source\nlogit-agent.sinks = logit-http-sink\nlogit-agent.channels = memory-channel\n\n# Configure Source (tail -F nginx logs)\nlogit-agent.sources.nginx-source.type = exec\nlogit-agent.sources.nginx-source.command = tail -F /var/log/nginx/access.log\n\n# Configure Sink (logit HTTP endpoint)\nlogit-agent.sinks.logit-http-sink.type = http\nlogit-agent.sinks.logit-http-sink.endpoint = http://127.0.0.1:4000/logit/flume\nlogit-agent.sinks.logit-http-sink.contentType = application/json\nlogit-agent.sinks.logit-http-sink.headers.ingest-key = secret_ingest_key\n\n# Configure Channel\nlogit-agent.channels.memory-channel.type = memory\nlogit-agent.channels.memory-channel.capacity = 10000\nlogit-agent.channels.memory-channel.transactionCapacity = 100\n\n# Bind Source and Sink to Channel\nlogit-agent.sources.nginx-source.channels = memory-channel\nlogit-agent.sinks.logit-http-sink.channel = memory-channel`, 'cb-fl')} style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', zIndex: 10 }}>
                      {copiedText === 'cb-fl' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <pre style={{ margin: 0, fontFamily: 'monospace', color: 'var(--text-primary)', lineHeight: 1.4, overflowX: 'auto' }}>
{`# 1. Define agent components
logit-agent.sources = nginx-source
logit-agent.sinks = logit-http-sink
logit-agent.channels = memory-channel

# 2. Configure Source (tails Nginx log stream)
logit-agent.sources.nginx-source.type = exec
logit-agent.sources.nginx-source.command = tail -F /var/log/nginx/access.log

# 3. Configure Sink (Pipes JSON batches to the Logit HTTP flume ingest server)
logit-agent.sinks.logit-http-sink.type = http
logit-agent.sinks.logit-http-sink.endpoint = http://127.0.0.1:4000/logit/flume
logit-agent.sinks.logit-http-sink.contentType = application/json
logit-agent.sinks.logit-http-sink.headers.ingest-key = secret_ingest_key

# 4. Configure Memory Channel
logit-agent.channels.memory-channel.type = memory
logit-agent.channels.memory-channel.capacity = 10000
logit-agent.channels.memory-channel.transactionCapacity = 100

# 5. Bind Source and Sink to Channel
logit-agent.sources.nginx-source.channels = memory-channel
logit-agent.sinks.logit-http-sink.channel = memory-channel`}
                    </pre>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* 5. Sleek Footer credit */}
      <footer style={{ background: 'var(--bg-sidebar)', borderTop: '1px solid var(--border-color)', padding: '40px 80px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', transition: 'background-color var(--transition-normal), border-color var(--transition-normal)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
        <p style={{ margin: 0 }}>Designed & Developed by <strong style={{ color: 'var(--primary)' }}>GROUP-45</strong></p>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <a href="https://github.com/priyanshi88879/logit-viewer.git" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="14" width="14" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"></path>
            </svg> GitHub
          </a>
          <a href="www.linkedin.com/in/priyanshi-gupta-a46baa315" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="14" width="14" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"></path>
            </svg> LinkedIn
          </a>
          <a href="https://www.npmjs.com/package/logit-logger" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="14" width="14" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 0v24h24V0H0zm18 18h-3V9h-3v9H6V6h12v12z"></path>
            </svg> NPM Package
          </a>
        </div>
      </footer>

      {/* 6. Dynamic Glassmorphic Login Connect Modal */}
      {showLoginModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: 'var(--bg-overlay)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          
          <div className="glassmorphic animate-fade-in" style={{ width: '400px', background: 'var(--bg-sidebar)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '32px', boxShadow: 'var(--shadow-modal)' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Connect to Server</h3>
              </div>
              <button 
                onClick={() => { setShowLoginModal(false); setErrorMsg(''); }} 
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                  <Globe size={12} style={{ color: 'var(--primary)' }} /> Server URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="e.g. http://localhost:4000"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  className="text-input"
                  style={{ fontSize: '0.8rem', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                  <User size={12} style={{ color: 'var(--primary)' }} /> Username
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="text-input"
                  style={{ fontSize: '0.8rem', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                  <Lock size={12} style={{ color: 'var(--primary)' }} /> Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-input"
                  style={{ fontSize: '0.8rem', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                />
              </div>

              {errorMsg && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'var(--error-bg)', color: 'var(--error-color)', borderRadius: '6px', fontSize: '0.7rem' }}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {!isLoading ? (
                <button
                  type="submit"
                  style={{ marginTop: '12px', padding: '12px', background: 'var(--primary)', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow-btn)' }}
                >
                  Connect to Server
                </button>
              ) : (
                <div className="login-loader flex-center" style={{ padding: '10px 0' }}>
                  <div className="google-spinner"></div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.6, fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                <ShieldAlert size={12} />
                <span>Authorized credentials verified against your target URL.</span>
              </div>
            </form>
          </div>

        </div>
      )}

    </div>
  );
};
