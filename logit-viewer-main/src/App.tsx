import { useState, useEffect, useMemo } from 'react';
import type { LogEntry, FieldMapping } from './types';
import { FilterPanel } from './components/FilterPanel';
import { FieldMapper, getNestedValue } from './components/FieldMapper';
import { LogTable } from './components/LogTable';
import { LogDetailModal } from './components/LogDetailModal';
import { LoginPortal } from './components/LoginPortal';
import { SlidersHorizontal, Search, X, Check, Activity, AlertTriangle, ShieldAlert, Clock, CheckCircle2, LogOut, Folder, ArrowLeft, RefreshCw, Users, Globe, Moon, Sun, Radio, Calendar } from 'lucide-react';
import { io } from 'socket.io-client';

import './App.css';

const DEFAULT_MAPPINGS: FieldMapping[] = [
  { key: 'timestamp', label: 'Timestamp', type: 'date', visible: true, isCustom: false },
  { key: 'appName', label: 'App', type: 'string', visible: true, isCustom: false },
  { key: 'level', label: 'Level', type: 'string', visible: true, isCustom: false },
  { key: 'method', label: 'Method', type: 'string', visible: true, isCustom: false },
  { key: 'url', label: 'URL Path', type: 'string', visible: true, isCustom: false },
  { key: 'status', label: 'Status', type: 'number', visible: true, isCustom: false },
  { key: 'response_time', label: 'Latency', type: 'number', visible: true, isCustom: false },
  { key: 'message', label: 'Message', type: 'string', visible: true, isCustom: false },
  { key: 'ip', label: 'Client IP', type: 'string', visible: false, isCustom: false },
  { key: 'content_length', label: 'Size', type: 'number', visible: false, isCustom: false },
];

interface AdminUser {
  id: string | number;
  name: string;
  email: string;
}

interface MatchItem {
  match_id?: string;
  matchId?: string;
  total_videos?: number;
  user_id?: string | number;
  is_active?: boolean;
  isActive?: boolean;
  [key: string]: any;
}

function App() {
  // Authentication & Server Configuration State
  const [selectedServer, setSelectedServer] = useState<string>(() => {
    return localStorage.getItem('drs_selected_server') || 'http://localhost:4000';
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('session-token');
  });

  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [isVerifyingSession, setIsVerifyingSession] = useState<boolean>(!!localStorage.getItem('session-token'));

  // Navigation Level State: 'users' (Level 1) | 'matches' (Level 2) | 'stream' (Level 3) | 'master' (all logs)
  const [activeLevel, setActiveLevel] = useState<'users' | 'matches' | 'stream' | 'master'>('users');

  // Selected contexts for hierarchy drill-down
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  // Data collections fetched from target API server
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState<boolean>(false);
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [isMatchesLoading, setIsMatchesLoading] = useState<boolean>(false);

  // Log Stream Table Data
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [mappings, setMappings] = useState<FieldMapping[]>(DEFAULT_MAPPINGS);

  // Connection Lifecycle Status
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Unified Dashboard filters
  const [selectedApps, setSelectedApps] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [maxResponseTime, setMaxResponseTime] = useState<number>(2000);
  const [customFilters, setCustomFilters] = useState<Record<string, string>>({});

  // Overlay components modaling
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Master Logs sub-mode: 'live' (real-time socket) or 'timestamp' (historical query)
  const [masterMode, setMasterMode] = useState<'live' | 'timestamp'>('live');
  const [tsFrom, setTsFrom] = useState<string>('');
  const [tsTo, setTsTo] = useState<string>('');
  const [isTsLoading, setIsTsLoading] = useState<boolean>(false);

  // Theme toggle state (persisted in localStorage)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('drs_theme') as 'light' | 'dark') || 'light';
  });

  // Apply theme to <html> element so CSS [data-theme] selector works
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('drs_theme', theme);
  }, [theme]);

  // Handle dynamic body scroll and height behavior depending on authentication status
  // Landing page: scrollable (auto); Dashboard: viewport locked (hidden, 100vh)
  useEffect(() => {
    if (!user || !token) {
      document.body.style.overflow = 'auto';
      document.body.style.height = 'auto';
    } else {
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.height = '';
    };
  }, [user, token]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // Dynamic user query parameter routing for Socket connection:
  // Use selected operator email if viewing user match context, otherwise fallback to admin email.
  const socketUser = selectedUser?.email || user?.email || 'himanshu.kr@khel.ai';

  // 1. Verify session token on startup/mount
  useEffect(() => {
    const verifySession = async () => {
      const savedToken = localStorage.getItem('session-token');
      if (!savedToken) {
        setIsVerifyingSession(false);
        return;
      }
      setIsVerifyingSession(true);
      try {
        const serverUrl = selectedServer.replace(/\/$/, '');
        const res = await fetch(`${serverUrl}/logit/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${savedToken}`
          }
        });

        if (res.ok) {
          const result = await res.json();
          if (result && result.email) {
            setUser({
              email: result.email,
              name: result.name || result.email.split('@')[0]
            });
            setToken(savedToken);
          } else {
            handleLogout();
          }
        } else {
          handleLogout();
        }
      } catch (err) {
        console.warn('Session verification failed:', err);
      } finally {
        setIsVerifyingSession(false);
      }
    };

    verifySession();
  }, [selectedServer]);

  // 2. Fetch Users (Level 1) — GET /logit/admin_plane_user
  const fetchUsers = async () => {
    if (!token) return;
    setIsUsersLoading(true);
    try {
      const serverUrl = selectedServer.replace(/\/$/, '');
      const response = await fetch(`${serverUrl}/logit/admin_plane_user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const raw = await response.json();
      
      // Parse response format: [{ status: true, data: [...] }, 200]
      const result = Array.isArray(raw) ? raw[0] : raw;
      if (result && result.status && Array.isArray(result.data)) {
        setUsers(result.data);
      } else {
        const directList = Array.isArray(raw) ? raw : (raw.data || []);
        setUsers(directList);
      }
    } catch (err: any) {
      console.error('Failed to fetch admin users:', err.message);
      setUsers([]);
    } finally {
      setIsUsersLoading(false);
    }
  };

  useEffect(() => {
    if (user && token && activeLevel === 'users') {
      fetchUsers();
    }
  }, [user, token, activeLevel]);

  // 3. Fetch User Matches (Level 2) — POST /logit/user_match_list
  const fetchUserMatches = async (userId: string | number) => {
    if (!token) return;
    setIsMatchesLoading(true);
    try {
      const serverUrl = selectedServer.replace(/\/$/, '');
      const response = await fetch(`${serverUrl}/logit/user_match_list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: String(userId),
          matchId: ''
        })
      });

      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const raw = await response.json();
      
      // Parse response format: [{ status: true, data: [...] }, 200]
      const result = Array.isArray(raw) ? raw[0] : raw;
      if (result && result.status && Array.isArray(result.data)) {
        setMatches(result.data);
      } else {
        const directList = Array.isArray(raw) ? raw : (raw.data || []);
        setMatches(directList);
      }
    } catch (err: any) {
      console.error('Failed to fetch user match list:', err.message);
      setMatches([]);
    } finally {
      setIsMatchesLoading(false);
    }
  };

  // 4. Socket.io Telemetry Client Lifecycle Manager (runs for 'stream' or 'master-live' mode)
  useEffect(() => {
    // Only connect socket for stream mode or master+live mode
    const shouldConnect = activeLevel === 'stream' || (activeLevel === 'master' && masterMode === 'live');
    if (!user || !shouldConnect) {
      setConnectionStatus('disconnected');
      setConnectionError(null);
      return;
    }

    setConnectionStatus('connecting');
    setConnectionError(null);

    // In master mode, connect without user filter to receive ALL logs
    const socketQuery = activeLevel === 'master'
      ? { master: 'true' }
      : { user: socketUser };

    const socket = io(selectedServer, {
      query: socketQuery,
      auth: { token: token },
      transports: ['websocket', 'polling'],
      timeout: 12000,
    });

    socket.on('connect', () => {
      setConnectionStatus('connected');
      showToast(`Socket Connected! Streaming logs for ${socketUser}`);
      console.log(`Connected to socket server for user ${socketUser}`);
    });

    socket.on('connect_error', (err) => {
      setConnectionStatus('disconnected');
      setConnectionError(err.message || 'WebSocket connection error');
      showToast(`Connection failed: ${err.message}`);
    });

    socket.on('app_log', (incomingLog: any) => {
      if (!incomingLog) return;

      console.log("\n🔥 Log received via WebSocket:");
      console.log(JSON.stringify(incomingLog, null, 2));

      // Ensure normalized structure for log details grid
      // IMPORTANT: Spread incomingLog first, then override with safe defaults
      // so that null/undefined fields from the server don't break .toLowerCase() calls
      const normalizedLog: LogEntry = {
        ...incomingLog,
        id: incomingLog.id || `ws-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        matchId: incomingLog.matchId || incomingLog.match_id || 'LIVE-STREAM',
        timestamp: incomingLog.timestamp || Date.now(),
        responseSentAt: incomingLog.responseSentAt || Date.now(),
        appName: incomingLog.appName || 'DRS',
        level: incomingLog.level || 'info',
        method: incomingLog.method || '',
        url: incomingLog.url || '',
        status: incomingLog.status !== undefined && incomingLog.status !== null ? incomingLog.status : 200,
        ip: incomingLog.ip || '',
        content_length: incomingLog.content_length !== undefined && incomingLog.content_length !== null ? incomingLog.content_length : 0,
        response_time: incomingLog.response_time !== undefined && incomingLog.response_time !== null ? incomingLog.response_time : 0,
        message: incomingLog.message || '',
      };

      setLogs((prev) => {
        const list = [normalizedLog, ...prev];
        return list.slice(0, 500); // Prevent browser memory leak by capping logs buffer at 500
      });
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
      console.log('Socket disconnected from server.');
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedServer, socketUser, user, activeLevel, masterMode]);

  // 4b. Fetch historical logs by timestamp range (master timestamp mode)
  const fetchTimestampLogs = async () => {
    if (!token || !tsFrom || !tsTo) {
      showToast('Please select both From and To timestamps');
      return;
    }
    setIsTsLoading(true);
    setLogs([]);
    try {
      const serverUrl = selectedServer.replace(/\/$/, '');
      const response = await fetch(`${serverUrl}/logit/logs?from=${encodeURIComponent(tsFrom)}&to=${encodeURIComponent(tsTo)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const raw = await response.json();
      const result = Array.isArray(raw) ? raw[0] : raw;
      const logList = result?.data || result?.logs || (Array.isArray(raw) ? raw : []);

      const normalized = logList.map((l: any, i: number) => ({
        ...l,
        id: l.id || `ts-${i}-${Date.now()}`,
        matchId: l.matchId || l.match_id || '',
        timestamp: l.timestamp || Date.now(),
        responseSentAt: l.responseSentAt || Date.now(),
        appName: l.appName || 'DRS',
        level: l.level || 'info',
        method: l.method || '',
        url: l.url || '',
        status: l.status ?? 200,
        ip: l.ip || '',
        content_length: l.content_length ?? 0,
        response_time: l.response_time ?? 0,
        message: l.message || '',
      }));

      setLogs(normalized);
      showToast(`Fetched ${normalized.length} historical logs`);
    } catch (err: any) {
      console.error('Failed to fetch timestamp logs:', err.message);
      showToast(`Failed: ${err.message}`);
    } finally {
      setIsTsLoading(false);
    }
  };

  const handleLogin = (email: string, name: string, userToken: string, serverUrl: string) => {
    setUser({ email, name });
    setToken(userToken);
    setSelectedServer(serverUrl);
    localStorage.setItem('session-token', userToken);
    localStorage.setItem('drs_selected_server', serverUrl);
    setActiveLevel('users');
    showToast(`Session authenticated successfully`);
  };

  const handleLogout = async () => {
    setUser(null);
    setToken(null);
    setSelectedUser(null);
    setSelectedMatchId(null);
    setLogs([]);
    setUsers([]);
    setMatches([]);
    setActiveLevel('users');
    localStorage.removeItem('session-token');
    showToast('Logged out of Logit session');
  };

  const handleClearBuffer = () => {
    setLogs([]);
    showToast('Telemetry screen logs buffer cleared');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleClearFilters = () => {
    setSelectedMatchId(null);
    setSelectedApps([]);
    setSelectedLevels([]);
    setSearchQuery('');
    setMaxResponseTime(2000);
    setCustomFilters({});
    showToast('Dashboard stream filters reset');
  };

  // Compute filtered logs matching filter panel parameters
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. Match ID folder boundary
      if (selectedMatchId) {
        const match = log.matchId || log.match_id || '';
        if (match !== selectedMatchId) return false;
      }
      // 2. Client Apps
      if (selectedApps.length > 0 && !selectedApps.includes(log.appName || '')) {
        return false;
      }
      // 3. Log Severity levels
      if (selectedLevels.length > 0 && !selectedLevels.includes(log.level || '')) {
        return false;
      }
      // 4. Maximum Latency limit
      if ((log.response_time || 0) > maxResponseTime) {
        return false;
      }
      // 5. Custom key/value inputs
      for (const [key, value] of Object.entries(customFilters)) {
        if (value.trim()) {
          const val = getNestedValue(log, key);
          if (val === undefined || val === null || !String(val).toLowerCase().includes(value.toLowerCase())) {
            return false;
          }
        }
      }
      // 6. Global Search String — search across ALL known fields and custom fields
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();

        // Safe string accessor
        const s = (v: any) => (v !== undefined && v !== null ? String(v).toLowerCase() : '');

        // Check all standard fields
        const found =
          s(log.message).includes(q) ||
          s(log.url).includes(q) ||
          s(log.ip).includes(q) ||
          s(log.method).includes(q) ||
          s(log.status).includes(q) ||
          s(log.id).includes(q) ||
          s(log.appName).includes(q) ||
          s(log.level).includes(q) ||
          s(log.matchId || log.match_id).includes(q) ||
          s(log.response_time).includes(q);

        if (found) return true;

        // Check all custom-mapped visible fields
        const customFound = mappings
          .filter((m) => m.isCustom && m.visible)
          .some((m) => {
            const val = getNestedValue(log, m.key);
            return val !== undefined && val !== null && String(val).toLowerCase().includes(q);
          });

        if (customFound) return true;

        // Deep search: check ALL keys on the log object for a match
        const deepFound = Object.values(log).some((val) => {
          if (val === undefined || val === null) return false;
          if (typeof val === 'object') {
            try {
              return JSON.stringify(val).toLowerCase().includes(q);
            } catch { return false; }
          }
          return String(val).toLowerCase().includes(q);
        });

        if (!deepFound) return false;
      }

      return true;
    });
  }, [logs, selectedMatchId, selectedApps, selectedLevels, searchQuery, maxResponseTime, customFilters, mappings]);

  // Telemetry stream stats metrics
  const stats = useMemo(() => {
    const total = filteredLogs.length;
    const errors = filteredLogs.filter((l) => l.level === 'error').length;
    const fatals = filteredLogs.filter((l) => l.level === 'fatal').length;
    const incidents = errors + fatals;

    const avgLatency = total > 0
      ? Math.round(filteredLogs.reduce((acc, curr) => acc + curr.response_time, 0) / total)
      : 0;

    const statusLogs = filteredLogs.filter((l) => l.status !== undefined && l.status !== null);
    const successLogs = statusLogs.filter((l) => {
      const s = Number(l.status);
      return s > 0 && s < 400;
    });
    const successRate = statusLogs.length > 0
      ? Math.round((successLogs.length / statusLogs.length) * 100)
      : 100;

    return { total, incidents, avgLatency, successRate };
  }, [filteredLogs]);

  // Loading Splash Screen while checking localStorage sessions
  if (isVerifyingSession) {
    return (
      <div className="login-viewport">
        <div className="login-glow-bg"></div>
        <div className="login-card glassmorphic flex-center" style={{ flexDirection: 'column', padding: '40px', gap: '16px' }}>
          <div className="google-spinner"></div>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Validating Active User Session...</span>
        </div>
      </div>
    );
  }

  // Render Login Portal
  if (!user || !token) {
    return (
      <LoginPortal
        onLogin={handleLogin}
        defaultServer={selectedServer}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  const userInitials = user.name
    ? user.name.split(' ').map(p => p[0]).join('').toUpperCase().substring(0, 2)
    : 'AD';

  return (
    <div className="app-container animate-fade-in">
      {/* Toast notifications */}
      {toastMessage && (
        <div className="toast-alert flex-center glassmorphic animate-fade-in" style={{
          position: 'fixed',
          top: '65px',
          right: '24px',
          padding: '10px 16px',
          zIndex: 1000,
          borderLeft: '4px solid var(--primary)',
          fontSize: '0.75rem',
          borderRadius: 'var(--radius-sm)',
        }}>
          <Check size={14} className="text-success mr-2 animate-pulse" />
          {toastMessage}
        </div>
      )}

      {/* Main App Navigation Header */}
      <header className="app-header-simple">
        <div className="header-brand">
          <Activity size={18} className="text-primary animate-pulse mr-2" />
          <h2>Logit Stream</h2>
          <span className="live-badge badge-live">
            <span className="live-dot-pulse dot-socket"></span>
            LIVE
          </span>
        </div>

        {(activeLevel === 'stream' || activeLevel === 'master') && (
          <div className="header-search-wrapper">
            <Search size={14} className="search-icon-header" />
            <input
              type="text"
              placeholder={activeLevel === 'master' ? 'Search across all master logs...' : 'Search matching logs, paths, methods, or JSON fields...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input-header"
            />
            {searchQuery && (
              <button className="clear-search-header-btn" onClick={() => setSearchQuery('')}>
                <X size={12} />
              </button>
            )}
          </div>
        )}

        <div className="header-actions-simple">
          <div className="connection-status-pill flex-center glassmorphic" title={`Query Email: ${socketUser}`}>
            <span className={`status-indicator-dot dot-${connectionStatus}`}></span>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'capitalize' }}>
              {connectionStatus === 'connected' ? 'Streaming' : connectionStatus}
            </span>
          </div>

          {(activeLevel === 'stream' || activeLevel === 'master') && (
            <button
              className={`btn-primary flex-center ${isSettingsOpen ? 'active-btn' : ''}`}
              onClick={() => setIsSettingsOpen(true)}
            >
              <SlidersHorizontal size={12} className="mr-1" />
              Choose Columns
            </button>
          )}

          {/* Logged in admin controls */}
          <div className="user-profile-menu flex-center">
            {/* Theme Toggle */}
            <button
              className="theme-toggle-btn flex-center"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
            </button>

            <div className="user-avatar" title={`${user.name} (${user.email})`}>
              {userInitials}
            </div>
            <div className="user-details-header">
              <span className="user-name-header">{user.name}</span>
              <span className="user-email-header">{user.email}</span>
            </div>
            <button className="logout-btn flex-center" onClick={handleLogout} title="Sign Out">
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </header>

      {/* Workspace Dashboard Layout */}
      <div className="dashboard-grid">
        {/* Sidebar Filters */}
        <aside className="dashboard-sidebar glassmorphic">
          <FilterPanel
            selectedServer={selectedServer}
            setSelectedServer={setSelectedServer}
            socketUser={socketUser}
            connectionStatus={connectionStatus}
            connectionError={connectionError}
            onClearBuffer={handleClearBuffer}
            selectedMatchId={selectedMatchId}
            setSelectedMatchId={(matchId) => {
              setSelectedMatchId(matchId);
              if (matchId) {
                setActiveLevel('stream');
              } else {
                setActiveLevel('matches');
              }
            }}
            selectedApps={selectedApps}
            setSelectedApps={setSelectedApps}
            selectedLevels={selectedLevels}
            setSelectedLevels={setSelectedLevels}
            maxResponseTime={maxResponseTime}
            setMaxResponseTime={setMaxResponseTime}
            customFilters={customFilters}
            setCustomFilters={setCustomFilters}
            mappings={mappings}
            onClearFilters={handleClearFilters}
            matches={matches.map(m => {
              const id = m.match_id || m.matchId || '';
              return { id, desc: `${m.total_videos || 0} Videos assigned` };
            })}
          />
        </aside>

        {/* Dynamic Drill Down Main Panel Area */}
        <main className="dashboard-main">
          {/* Universal Clickable Breadcrumbs Strip */}
          <div className="breadcrumb-nav-strip flex-between">
            <div className="breadcrumb-trail flex-center">
              <span 
                className="breadcrumb-part clickable-breadcrumb" 
                onClick={() => {
                  setSelectedUser(null);
                  setSelectedMatchId(null);
                  setLogs([]);
                  setActiveLevel('users');
                }}
              >
                <Users size={12} className="inline-icon mr-1" /> Home
              </span>

              {activeLevel === 'master' && (
                <>
                  <span className="breadcrumb-separator">/</span>
                  <span className="breadcrumb-part active-match-part">
                    <Globe size={12} className="inline-icon mr-1" /> Master Logs
                  </span>
                </>
              )}

              {selectedUser && (
                <>
                  <span className="breadcrumb-separator">/</span>
                  <span 
                    className="breadcrumb-part clickable-breadcrumb" 
                    onClick={() => {
                      setSelectedMatchId(null);
                      setActiveLevel('matches');
                    }}
                  >
                    👤 {selectedUser.name || selectedUser.email}
                  </span>
                </>
              )}
              {selectedMatchId && activeLevel === 'stream' && (
                <>
                  <span className="breadcrumb-separator">/</span>
                  <span className="breadcrumb-part active-match-part">
                    📂 Match {selectedMatchId}
                  </span>
                </>
              )}
            </div>

            {activeLevel === 'master' && (
              <button
                className="btn-secondary flex-center back-to-folders-btn"
                onClick={() => {
                  setLogs([]);
                  setActiveLevel('users');
                }}
              >
                <ArrowLeft size={12} className="mr-2" />
                Back to Home
              </button>
            )}

            {activeLevel === 'matches' && (
              <button
                className="btn-secondary flex-center back-to-folders-btn"
                onClick={() => {
                  setSelectedUser(null);
                  setActiveLevel('users');
                }}
              >
                <ArrowLeft size={12} className="mr-2" />
                Back to Operators
              </button>
            )}

            {activeLevel === 'stream' && (
              <button
                className="btn-secondary flex-center back-to-folders-btn"
                onClick={() => {
                  setSelectedMatchId(null);
                  setActiveLevel('matches');
                }}
              >
                <ArrowLeft size={12} className="mr-2" />
                Back to Matches
              </button>
            )}
          </div>

          {activeLevel === 'users' && (
            /* Level 1: Users/Operators Grid Selector */
            <div className="folders-view-container">
              <div className="folders-view-header flex-between">
                <div>
                  <h3>Operator Folders</h3>
                  <p>Choose an operator profile below to inspect their match allocations, or open <strong>Master Logs</strong> to see everything.</p>
                </div>
                <button
                  className="btn-secondary flex-center"
                  onClick={fetchUsers}
                  disabled={isUsersLoading}
                >
                  <RefreshCw size={12} className={`mr-2 ${isUsersLoading ? 'animate-spin' : ''}`} />
                  Refresh Operators
                </button>
              </div>

              {isUsersLoading ? (
                <div className="loading-container flex-center" style={{ padding: '80px 0' }}>
                  <div className="google-spinner"></div>
                </div>
              ) : (
                <div className="folders-grid animate-fade-in">
                  {/* Master Logs — special card at the top */}
                  <div
                    className="folder-card glassmorphic master-logs-card"
                    onClick={() => {
                      setSelectedUser(null);
                      setSelectedMatchId(null);
                      setLogs([]);
                      setActiveLevel('master');
                    }}
                  >
                    <div className="folder-card-content">
                      <div className="master-logs-icon-circle">
                        <Globe size={24} />
                      </div>
                      <span className="folder-name">🌐 Master Logs</span>
                      <span className="folder-user-email">All users • All matches</span>
                      <p className="folder-description" style={{ marginTop: '4px' }}>
                        Stream every log across all operators and matches in real-time.
                      </p>
                    </div>
                  </div>

                  {/* User folders */}
                  {users.map((u) => {
                    const initials = u.name
                      ? u.name.split(' ').map(p => p[0]).join('').toUpperCase().substring(0, 2)
                      : 'OP';
                    return (
                      <div
                        key={u.id}
                        className="folder-card glassmorphic user-folder-card"
                        onClick={() => {
                          setSelectedUser(u);
                          setActiveLevel('matches');
                          fetchUserMatches(u.id);
                        }}
                      >
                        <div className="folder-card-content">
                          <div className="user-folder-avatar-circle">
                            {initials}
                          </div>
                          <span className="folder-name">📁 {u.name || u.email}</span>
                          <span className="folder-user-email">{u.email}</span>
                          <p className="folder-description" style={{ marginTop: '4px' }}>
                            Inspect matches assigned to {(u.name || u.email || '').split(' ')[0]}.
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeLevel === 'matches' && selectedUser && (
            /* Level 2: Match Folder Grid for Selected Operator */
            <div className="folders-view-container">
              <div className="folders-view-header flex-between">
                <div>
                  <h3>Matches Assigned to {selectedUser.name}</h3>
                  <p>Select a match session to enter the live telemetry console.</p>
                </div>
                <button
                  className="btn-secondary flex-center"
                  onClick={() => fetchUserMatches(selectedUser.id)}
                  disabled={isMatchesLoading}
                >
                  <RefreshCw size={12} className={`mr-2 ${isMatchesLoading ? 'animate-spin' : ''}`} />
                  Refresh Matches
                </button>
              </div>

              {isMatchesLoading ? (
                <div className="loading-container flex-center" style={{ padding: '80px 0' }}>
                  <div className="google-spinner"></div>
                </div>
              ) : (
                <div className="folders-grid animate-fade-in">
                  {matches.length === 0 ? (
                    <div className="empty-notice glassmorphic flex-center" style={{ gridColumn: '1 / -1', padding: '40px', flexDirection: 'column', gap: '12px' }}>
                      <Folder size={32} className="text-muted" />
                      <span className="text-secondary" style={{ fontSize: '0.8rem' }}>No matches assigned to this operator.</span>
                      <button className="btn-secondary" onClick={() => fetchUserMatches(selectedUser.id)}>
                        Retry Fetch
                      </button>
                    </div>
                  ) : (
                    matches.map((m) => {
                      const matchIdStr = m.match_id || m.matchId || 'Match';
                      const videoCount = m.total_videos !== undefined ? m.total_videos : 0;
                      const isActive = m.is_active || m.isActive || false;
                      
                      return (
                        <div
                          key={matchIdStr}
                          className="folder-card glassmorphic match-folder-card"
                          onClick={() => {
                            setSelectedMatchId(matchIdStr);
                            setActiveLevel('stream');
                          }}
                        >
                          <div className="folder-card-content">
                            <Folder size={44} className={`folder-icon-large ${isActive ? 'text-success animate-pulse' : 'text-primary'}`} />
                            <span className="folder-name">{matchIdStr}</span>
                            <span className="folder-video-count">{videoCount} total videos</span>
                            <div style={{ marginTop: '4px' }}>
                              <span className={`status-badge ${isActive ? 'status-active' : 'status-completed'}`}>
                                {isActive ? '● Active stream' : 'Completed'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}

          {(activeLevel === 'stream' || activeLevel === 'master') && (
            /* Level 3 / Master: Active Live Log Streams */
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', flex: 1, height: 'calc(100% - 43px)', overflow: 'hidden' }}>

              {/* Master Mode Toggle: Live vs Timestamp */}
              {activeLevel === 'master' && (
                <div className="master-mode-strip">
                  <div className="master-mode-tabs">
                    <button
                      className={`master-mode-tab ${masterMode === 'live' ? 'active' : ''}`}
                      onClick={() => { setMasterMode('live'); setLogs([]); }}
                    >
                      <Radio size={13} className="mr-1" />
                      Live Stream
                    </button>
                    <button
                      className={`master-mode-tab ${masterMode === 'timestamp' ? 'active' : ''}`}
                      onClick={() => { setMasterMode('timestamp'); setLogs([]); }}
                    >
                      <Calendar size={13} className="mr-1" />
                      By Timestamp
                    </button>
                  </div>

                  {masterMode === 'timestamp' && (
                    <div className="timestamp-picker-row">
                      <div className="ts-field">
                        <label>From</label>
                        <input
                          type="datetime-local"
                          value={tsFrom}
                          onChange={(e) => setTsFrom(e.target.value)}
                          className="ts-input"
                        />
                      </div>
                      <div className="ts-field">
                        <label>To</label>
                        <input
                          type="datetime-local"
                          value={tsTo}
                          onChange={(e) => setTsTo(e.target.value)}
                          className="ts-input"
                        />
                      </div>
                      <button
                        className="btn-primary flex-center ts-fetch-btn"
                        onClick={fetchTimestampLogs}
                        disabled={isTsLoading || !tsFrom || !tsTo}
                      >
                        {isTsLoading ? (
                          <><RefreshCw size={12} className="mr-1 animate-spin" /> Fetching...</>
                        ) : (
                          <><Search size={12} className="mr-1" /> Fetch Logs</>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
              {/* Metrics cards */}
              <div className="metrics-strip">
                {/* Metric 1 */}
                <div className="metric-card glassmorphic">
                  <div className="metric-card-info">
                    <span className="metric-card-label">{activeLevel === 'master' ? 'Master Logs Buffer' : 'Active Logs Buffer'}</span>
                    <span className="metric-card-value">{stats.total} <code className="metric-sub-label">/ {logs.length}</code></span>
                  </div>
                  <div className="metric-card-icon-wrapper bg-primary-glow text-primary">
                    <Activity size={18} />
                  </div>
                </div>

                {/* Metric 2 */}
                <div className={`metric-card glassmorphic ${stats.incidents > 0 ? 'incident-warning' : ''}`}>
                  <div className="metric-card-info">
                    <span className="metric-card-label">System Alerts / Faults</span>
                    <span className="metric-card-value">{stats.incidents}</span>
                  </div>
                  <div className={`metric-card-icon-wrapper ${stats.incidents > 0 ? 'bg-error-glow text-error' : 'bg-success-glow text-success'}`}>
                    {stats.incidents > 0 ? <AlertTriangle size={18} className="animate-pulse" /> : <CheckCircle2 size={18} />}
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="metric-card glassmorphic">
                  <div className="metric-card-info">
                    <span className="metric-card-label">Average Response Delay</span>
                    <span className="metric-card-value">{stats.avgLatency} <code className="metric-sub-label">ms</code></span>
                  </div>
                  <div className="metric-card-icon-wrapper bg-warn-glow text-warn">
                    <Clock size={18} />
                  </div>
                </div>

                {/* Metric 4 */}
                <div className="metric-card glassmorphic">
                  <div className="metric-card-info">
                    <span className="metric-card-label">API Delivery Success</span>
                    <span className="metric-card-value">{stats.successRate}%</span>
                  </div>
                  <div className="metric-card-icon-wrapper bg-success-glow text-success">
                    <ShieldAlert size={18} />
                  </div>
                </div>
              </div>

              {/* Table List logs container */}
              <div className="stream-table-wrapper" style={{ flex: 1, minHeight: 0 }}>
                <LogTable
                  logs={filteredLogs}
                  mappings={mappings}
                  onSelectLog={setSelectedLog}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Live status footer bar */}
      <footer className="dashboard-footer">
        <div className="footer-left">
          <span>Target: <strong style={{ fontFamily: 'monospace' }}>{selectedServer}</strong></span>
          <span className="footer-separator">•</span>
          <span>Logged Operator: <strong style={{ color: 'var(--primary-hover)' }}>{socketUser}</strong></span>
        </div>
        <div className="footer-right">
          <a href="https://github.com/priyanshi88879/logit-viewer" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', color: 'inherit', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>
            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="12" width="12" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"></path>
            </svg> GitHub
          </a>
          <span className="footer-separator">•</span>
          <a href="https://www.linkedin.com/in/priyanshi-gupta-a46baa315" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', color: 'inherit', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>
            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" height="12" width="12" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"></path>
            </svg> LinkedIn
          </a>
          <span className="footer-separator">•</span>
          <a href="https://www.npmjs.com/package/logit-logger-priyanshi" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', color: 'inherit', transition: 'color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'} onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}>
            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="12" width="12" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 0v24h24V0H0zm18 18h-3V9h-3v9H6V6h12v12z"></path>
            </svg> NPM
          </a>
          <span className="footer-separator">•</span>
          <span>SSO Mode: <strong style={{ color: 'var(--text-secondary)' }}>Google Session</strong></span>
          <span className="footer-separator">•</span>
          <span>Timezone: <strong>Local Browser</strong></span>
        </div>
      </footer>

      {/* Settings Column Mapping drawer */}
      {isSettingsOpen && (
        <FieldMapper
          mappings={mappings}
          setMappings={setMappings}
          logs={logs}
          onClose={() => setIsSettingsOpen(false)}
          showToast={showToast}
        />
      )}

      {/* Details Inspector modal popup */}
      {selectedLog && (
        <LogDetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}

export default App;

