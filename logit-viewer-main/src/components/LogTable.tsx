import React, { useState } from 'react';
import type { LogEntry, FieldMapping } from '../types';

import { getNestedValue } from './FieldMapper';
import { ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';

interface LogTableProps {
  logs: LogEntry[];
  mappings: FieldMapping[];
  onSelectLog: (log: LogEntry) => void;
}

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
} | null;

export const LogTable: React.FC<LogTableProps> = ({ logs, mappings, onSelectLog }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'timestamp', direction: 'desc' });

  // Get only visible mappings
  const visibleFields = mappings.filter((m) => m.visible);

  // Sorting handler
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Sort logs accordingly
  const sortedLogs = React.useMemo(() => {
    if (!sortConfig) return logs;
    const sorted = [...logs];
    sorted.sort((a, b) => {
      let valA = getNestedValue(a, sortConfig.key);
      let valB = getNestedValue(b, sortConfig.key);

      // Handle fallback values if undefined
      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [logs, sortConfig]);

  // Format rendering based on field mapping configuration
  const renderCellValue = (log: LogEntry, mapping: FieldMapping) => {
    const rawVal = getNestedValue(log, mapping.key);

    if (rawVal === undefined || rawVal === null) {
      return <span className="text-muted">—</span>;
    }

    if (mapping.key === 'level') {
      return (
        <span className={`log-level-badge tag-${rawVal}`}>
          {String(rawVal).toUpperCase()}
        </span>
      );
    }

    if (mapping.key === 'appName') {
      return (
        <span className={`app-badge app-${rawVal}`}>
          {String(rawVal)}
        </span>
      );
    }

    if (mapping.key === 'status') {
      const statusCode = Number(rawVal);
      let statusColor = 'status-info';
      if (statusCode >= 200 && statusCode < 300) statusColor = 'status-success';
      else if (statusCode >= 300 && statusCode < 400) statusColor = 'status-redirect';
      else if (statusCode >= 400 && statusCode < 500) statusColor = 'status-warning';
      else if (statusCode >= 500) statusColor = 'status-error';

      return <span className={`status-badge ${statusColor}`}>{statusCode}</span>;
    }

    if (mapping.key === 'response_time') {
      const ms = Number(rawVal);
      const isSlow = ms > 500;
      return (
        <span className={`latency-value ${isSlow ? 'latency-slow' : ''}`}>
          {ms} ms
        </span>
      );
    }

    if (mapping.key === 'content_length') {
      const bytes = Number(rawVal);
      if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      if (bytes > 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${bytes} B`;
    }

    // Generic formatting by type
    if (mapping.type === 'date') {
      const dateVal = new Date(rawVal);
      if (isNaN(dateVal.getTime())) return String(rawVal);
      // Format: HH:MM:SS.SSS
      const pad = (n: number, size = 2) => String(n).padStart(size, '0');
      const hours = pad(dateVal.getHours());
      const minutes = pad(dateVal.getMinutes());
      const seconds = pad(dateVal.getSeconds());
      const ms = pad(dateVal.getMilliseconds(), 3);
      return (
        <span className="timestamp-cell" title={dateVal.toLocaleString()}>
          {hours}:{minutes}:{seconds}.{ms}
        </span>
      );
    }

    if (mapping.type === 'boolean') {
      return rawVal ? (
        <span className="bool-true">true</span>
      ) : (
        <span className="bool-false">false</span>
      );
    }

    return <span className="cell-text-ellipsis">{String(rawVal)}</span>;
  };

  return (
    <div className="log-table-container glassmorphic">
      <div className="table-wrapper">
        <table className="log-viewer-table">
          <thead>
            <tr>
              {visibleFields.map((field) => {
                const isSorted = sortConfig && sortConfig.key === field.key;
                const isAsc = isSorted && sortConfig!.direction === 'asc';

                return (
                  <th
                    key={field.key}
                    onClick={() => handleSort(field.key)}
                    className="sortable-header"
                  >
                    <div className="header-cell-content">
                      <span>{field.label}</span>
                      <span className="sort-icon-wrapper">
                        {isSorted ? (
                          isAsc ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                        ) : (
                          <ArrowUp size={12} className="inactive-sort" />
                        )}
                      </span>
                    </div>
                  </th>
                );
              })}
              <th style={{ width: '40px' }} className="non-sortable"></th>
            </tr>
          </thead>
          <tbody>
            {sortedLogs.length === 0 ? (
              <tr>
                <td colSpan={visibleFields.length + 1} className="no-logs-cell">
                  <div className="no-logs-content">
                    <p className="no-logs-title">No matching log entries found</p>
                    <p className="no-logs-subtitle">Try adjusting your filters or active match context</p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedLogs.map((log) => (
                <tr
                  key={log.id}
                  onClick={() => onSelectLog(log)}
                  className={`log-row row-level-${log.level}`}
                >
                  {visibleFields.map((field) => (
                    <td key={field.key}>
                      {renderCellValue(log, field)}
                    </td>
                  ))}
                  <td className="row-action-cell">
                    <ExternalLink size={12} className="row-action-icon" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        <span>Showing {sortedLogs.length} of {logs.length} logs</span>
      </div>
    </div>
  );
};
