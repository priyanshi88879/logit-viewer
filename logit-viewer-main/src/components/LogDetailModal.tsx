import React, { useState } from 'react';
import type { LogEntry } from '../types';
import { X, Copy, Check, Terminal, Globe, Clock } from 'lucide-react';


interface LogDetailModalProps {
  log: LogEntry | null;
  onClose: () => void;
}

export const LogDetailModal: React.FC<LogDetailModalProps> = ({ log, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!log) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedDate = new Date(log.timestamp).toLocaleString();
  const duration = log.responseSentAt - log.timestamp;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel glassmorphic" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <Terminal className="icon" size={18} />
            <h3>Log Transaction Inspector</h3>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body-scroll">
          {/* Quick stats grid */}
          <div className="stats-grid">
            <div className="stat-box">
              <span className="stat-label">Transaction ID</span>
              <span className="stat-value">{log.id}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Match ID</span>
              <span className="stat-value">{log.matchId}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">App Service</span>
              <span className={`app-badge app-${log.appName}`}>{log.appName}</span>
            </div>
            <div className="stat-box">
              <span className="stat-label">Level</span>
              <span className={`log-level-badge tag-${log.level}`}>{log.level.toUpperCase()}</span>
            </div>
          </div>

          <div className="detail-sections-grid">
            {/* Request info */}
            <div className="detail-section">
              <div className="section-title">
                <Globe size={14} className="mr-2 text-primary" />
                Network Details
              </div>
              <table className="details-info-table">
                <tbody>
                  <tr>
                    <td>Request Method</td>
                    <td><strong>{log.method}</strong></td>
                  </tr>
                  <tr>
                    <td>Target URL</td>
                    <td><code className="path-code">{log.url}</code></td>
                  </tr>
                  <tr>
                    <td>Response Status</td>
                    <td>
                      <span className={`status-badge ${
                        Number(log.status) >= 200 && Number(log.status) < 300 ? 'status-success' : 'status-error'
                      }`}>{log.status}</span>
                    </td>
                  </tr>
                  <tr>
                    <td>Client IP Address</td>
                    <td><code>{log.ip}</code></td>
                  </tr>
                  <tr>
                    <td>Response Size</td>
                    <td>{log.content_length} bytes</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Timings */}
            <div className="detail-section">
              <div className="section-title">
                <Clock size={14} className="mr-2 text-primary" />
                Timing & Performance
              </div>
              <table className="details-info-table">
                <tbody>
                  <tr>
                    <td>Timestamp</td>
                    <td>{formattedDate} <span className="text-muted">({log.timestamp})</span></td>
                  </tr>
                  <tr>
                    <td>Response Sent At</td>
                    <td>{new Date(log.responseSentAt).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>Total Duration</td>
                    <td>
                      <span className={`latency-value ${duration > 500 ? 'latency-slow' : ''}`}>
                        {duration} ms
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Log Message */}
          <div className="message-section">
            <span className="message-section-title">Log Message</span>
            <div className="message-body">
              {log.message}
            </div>
          </div>

          {/* Raw JSON payload */}
          <div className="raw-payload-section">
            <div className="raw-payload-header">
              <span>Full Raw Log JSON Payload</span>
              <button className="copy-btn btn-secondary flex-center" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check size={14} className="mr-1 text-success" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={14} className="mr-1" />
                    Copy Payload
                  </>
                )}
              </button>
            </div>
            <pre className="json-viewer">
              <code>{JSON.stringify(log, null, 2)}</code>
            </pre>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close Inspector</button>
        </div>
      </div>
    </div>
  );
};
