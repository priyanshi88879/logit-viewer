import React from 'react';
import type { FieldMapping } from '../types';
import { Filter, RefreshCw, X, Cpu, Globe, User, Shield, Trash2, Folder, FolderOpen } from 'lucide-react';

interface FilterPanelProps {
  // Data Source config
  selectedServer: string;
  setSelectedServer: (server: string) => void;
  socketUser: string;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  connectionError: string | null;
  onClearBuffer: () => void;

  // Filter config
  selectedMatchId: string | null;
  setSelectedMatchId: (matchId: string | null) => void;
  selectedApps: string[];
  setSelectedApps: (apps: string[]) => void;
  selectedLevels: string[];
  setSelectedLevels: (levels: string[]) => void;
  maxResponseTime: number;
  setMaxResponseTime: (time: number) => void;
  customFilters: Record<string, string>;
  setCustomFilters: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  mappings: FieldMapping[];
  onClearFilters: () => void;
  matches: { id: string; desc: string }[];
}

const APPS = ['DRS', 'BROADCASTER', 'ADMIN'];

const FRIENDLY_LEVELS = [
  { value: 'fatal', label: '🚨 Critical Faults' },
  { value: 'error', label: '❌ System Errors' },
  { value: 'warn', label: '⚠️ Warnings' },
  { value: 'info', label: 'ℹ️ Info Logs' },
  { value: 'http', label: '🌐 Web Traffic' },
];

const SERVERS = [
  { value: 'http://localhost:4000', label: 'Local Ingest Server' },
  { value: 'https://grisly-blowzy-julio.ngrok-free.dev', label: 'Local Test Tunnel (Ngrok)' },
];

export const FilterPanel: React.FC<FilterPanelProps> = ({
  selectedServer,
  setSelectedServer,
  socketUser,
  connectionStatus,
  connectionError,
  onClearBuffer,
  selectedMatchId,
  setSelectedMatchId,
  selectedApps,
  setSelectedApps,
  selectedLevels,
  setSelectedLevels,
  maxResponseTime,
  setMaxResponseTime,
  customFilters,
  setCustomFilters,
  mappings,
  onClearFilters,
  matches,
}) => {

  const serverOptions = [...SERVERS];
  if (!SERVERS.some(s => s.value === selectedServer)) {
    serverOptions.push({ value: selectedServer, label: `Custom: ${selectedServer}` });
  }

  const handleAppChange = (app: string) => {
    if (selectedApps.includes(app)) {
      setSelectedApps(selectedApps.filter((a) => a !== app));
    } else {
      setSelectedApps([...selectedApps, app]);
    }
  };

  const handleLevelChange = (level: string) => {
    if (selectedLevels.includes(level)) {
      setSelectedLevels(selectedLevels.filter((l) => l !== level));
    } else {
      setSelectedLevels([...selectedLevels, level]);
    }
  };

  const handleCustomFilterChange = (key: string, value: string) => {
    setCustomFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearCustomFilter = (key: string) => {
    setCustomFilters((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const activeCustomFields = mappings.filter((m) => m.isCustom && m.visible);

  // Check if any filters are active
  const hasActiveFilters =
    selectedMatchId !== null ||
    selectedApps.length > 0 ||
    selectedLevels.length > 0 ||
    maxResponseTime < 2000 ||
    Object.keys(customFilters).length > 0;

  return (
    <div className="filter-panel">
      {/* Live Stream Settings Section */}
      <div className="filter-panel-header">
        <div className="flex-center">
          <Globe size={14} className="mr-2 text-primary" />
          <h5>Connection Details</h5>
        </div>
      </div>

      <div className="filter-panel-body" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '4px' }}>
        <div className="socket-config-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Status Display badge */}
          <div className="flex-between" style={{ fontSize: '0.7rem' }}>
            <span className="text-muted">Connection Status:</span>
            <div className="flex-center">
              <span className={`status-indicator-dot dot-${connectionStatus}`}></span>
              <span style={{ fontWeight: 600, textTransform: 'capitalize' }} className={`text-status-${connectionStatus}`}>
                {connectionStatus}
              </span>
            </div>
          </div>

          {/* Error Message alert */}
          {connectionError && (
            <div className="error-alert" style={{ fontSize: '0.65rem', padding: '6px 10px', marginTop: '4px' }}>
              {connectionError}
            </div>
          )}

          {/* Server endpoint select */}
          <div className="form-group" style={{ marginTop: '4px' }}>
            <label style={{ fontSize: '0.65rem', display: 'flex', alignItems: 'center' }}>
              <Shield size={10} className="mr-1 text-primary" /> Server Endpoint
            </label>
            <select
              value={selectedServer}
              onChange={(e) => setSelectedServer(e.target.value)}
              className="match-select-element"
              style={{ marginTop: '4px' }}
            >
              {serverOptions.map((srv) => (
                <option key={srv.value} value={srv.value}>
                  {srv.label}
                </option>
              ))}
            </select>
          </div>

          {/* User query parameter auth (Read-only from Google session) */}
          <div className="form-group" style={{ marginTop: '4px' }}>
            <label style={{ fontSize: '0.65rem', display: 'flex', alignItems: 'center' }}>
              <User size={10} className="mr-1 text-primary" /> Logged In As
            </label>
            <div style={{
              background: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 10px',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              fontFamily: 'monospace',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {socketUser}
            </div>
          </div>

          {/* Clear stream log buffer button */}
          <button
            type="button"
            className="btn-secondary flex-center w-full"
            onClick={onClearBuffer}
            style={{ marginTop: '6px', justifyContent: 'center', fontSize: '0.7rem', padding: '6px' }}
          >
            <Trash2 size={12} className="mr-2 text-error" /> Clear Log Screen
          </button>
        </div>
      </div>

      {/* Stream Filters Section */}
      <div className="filter-panel-header" style={{ borderTop: 'none' }}>
        <div className="flex-center">
          <Filter size={14} className="mr-2 text-primary" />
          <h5>Filters</h5>
        </div>
        {hasActiveFilters && (
          <button className="clear-all-btn flex-center" onClick={onClearFilters}>
            <RefreshCw size={10} className="mr-1" /> Reset
          </button>
        )}
      </div>

      <div className="filter-panel-body">
        {/* Match selector (Folders-like vertical list) */}
        <div className="filter-section">
          <label className="section-label">Match Folders</label>
          <div className="sidebar-folder-list">
            <button
              type="button"
              className={`sidebar-folder-item ${selectedMatchId === null ? 'active' : ''}`}
              onClick={() => setSelectedMatchId(null)}
            >
              <FolderOpen size={13} className="mr-2 text-primary flex-shrink-0" />
              <span>📁 All Matches</span>
            </button>
            {matches.map((m) => {
              const isActive = selectedMatchId === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  className={`sidebar-folder-item ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedMatchId(m.id)}
                >
                  <Folder size={13} className="mr-2 text-primary flex-shrink-0" />
                  <span title={m.desc}>{m.id}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Applications checkboxes */}
        <div className="filter-section">
          <label className="section-label">Server Services</label>
          <div className="apps-button-group">
            {APPS.map((app) => {
              const isChecked = selectedApps.includes(app);
              return (
                <button
                  key={app}
                  type="button"
                  className={`app-toggle-btn app-${app} ${isChecked ? 'active' : ''}`}
                  onClick={() => handleAppChange(app)}
                >
                  {app}
                </button>
              );
            })}
          </div>
        </div>

        {/* Log Levels checklist */}
        <div className="filter-section">
          <label className="section-label">Alert Severity</label>
          <div className="level-pills-group">
            {FRIENDLY_LEVELS.map((level) => {
              const isChecked = selectedLevels.includes(level.value);
              return (
                <button
                  key={level.value}
                  type="button"
                  className={`level-pill-btn friendly-level level-${level.value} ${isChecked ? 'active' : ''}`}
                  onClick={() => handleLevelChange(level.value)}
                >
                  {level.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Max Latency slider */}
        <div className="filter-section">
          <div className="slider-header flex-between">
            <label className="section-label">Response Delay</label>
            <span className="slider-value">{maxResponseTime === 2000 ? 'Show All' : `Under ${maxResponseTime}ms`}</span>
          </div>
          <input
            type="range"
            min="0"
            max="2000"
            step="50"
            value={maxResponseTime}
            onChange={(e) => setMaxResponseTime(parseInt(e.target.value))}
            className="custom-range-slider"
          />
        </div>

        {/* Custom fields filters */}
        {activeCustomFields.length > 0 && (
          <div className="filter-section custom-fields-filters">
            <label className="section-label">Special Filters</label>
            <div className="custom-fields-grid">
              {activeCustomFields.map((field) => (
                <div key={field.key} className="custom-field-filter-group">
                  <label className="custom-field-label">{field.label}</label>
                  <div className="search-input-wrapper">
                    <Cpu size={12} className="search-icon text-muted" />
                    <input
                      type="text"
                      placeholder={`Filter by ${field.label}...`}
                      value={customFilters[field.key] || ''}
                      onChange={(e) => handleCustomFilterChange(field.key, e.target.value)}
                      className="search-input compact"
                    />
                    {customFilters[field.key] && (
                      <button
                        className="clear-search-btn"
                        onClick={() => clearCustomFilter(field.key)}
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
