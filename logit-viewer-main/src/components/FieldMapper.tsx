import React, { useState } from 'react';
import type { FieldMapping, LogEntry } from '../types';
import { Settings, Plus, RotateCw, X, ShieldAlert } from 'lucide-react';


interface FieldMapperProps {
  mappings: FieldMapping[];
  setMappings: React.Dispatch<React.SetStateAction<FieldMapping[]>>;
  logs: LogEntry[];
  onClose?: () => void;
  showToast?: (msg: string) => void;
}

export const FieldMapper: React.FC<FieldMapperProps> = ({
  mappings,
  setMappings,
  logs,
  onClose,
  showToast,
}) => {
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newType, setNewType] = useState<'string' | 'number' | 'boolean' | 'date'>('string');
  const [errorMsg, setErrorMsg] = useState('');

  const toggleVisibility = (key: string) => {
    setMappings((prev) =>
      prev.map((m) => (m.key === key ? { ...m, visible: !m.visible } : m))
    );
  };

  const updateLabel = (key: string, newLabelVal: string) => {
    setMappings((prev) =>
      prev.map((m) => (m.key === key ? { ...m, label: newLabelVal } : m))
    );
  };

  const handleAddField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim()) return;

    const trimmedKey = newKey.trim();
    // Check if key already exists
    if (mappings.some((m) => m.key === trimmedKey)) {
      setErrorMsg(`Field "${trimmedKey}" is already mapped.`);
      return;
    }

    const newMapping: FieldMapping = {
      key: trimmedKey,
      label: newLabel.trim() || trimmedKey,
      type: newType,
      visible: true,
      isCustom: true,
      path: trimmedKey,
    };

    setMappings((prev) => [...prev, newMapping]);
    setNewKey('');
    setNewLabel('');
    setErrorMsg('');
    if (showToast) {
      showToast(`Added custom column: ${trimmedKey}`);
    }
  };

  const handleDeleteField = (key: string) => {
    setMappings((prev) => prev.filter((m) => m.key !== key));
    if (showToast) {
      showToast(`Deleted column mapping: ${key}`);
    }
  };

  // Helper to extract nested keys (1 level deep) for auto-detection
  const handleAutoDetect = () => {
    const detectedKeys = new Set<string>();
    
    logs.forEach((log) => {
      Object.keys(log).forEach((key) => {
        // Skip standard keys
        if (
          [
            'id',
            'matchId',
            'timestamp',
            'responseSentAt',
            'appName',
            'level',
            'method',
            'url',
            'status',
            'ip',
            'content_length',
            'response_time',
            'message',
          ].includes(key)
        ) {
          return;
        }

        const val = log[key];
        if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
          // It's a nested object, check its keys
          Object.keys(val).forEach((subKey) => {
            detectedKeys.add(`${key}.${subKey}`);
          });
        } else if (val !== undefined) {
          detectedKeys.add(key);
        }
      });
    });

    const newMappingsToAdd: FieldMapping[] = [];
    detectedKeys.forEach((key) => {
      // Check if already mapped
      if (!mappings.some((m) => m.key === key)) {
        // Determine type
        let detectedType: 'string' | 'number' | 'boolean' | 'date' = 'string';
        
        // Let's sample a log entry to guess type
        for (const log of logs) {
          const val = getNestedValue(log, key);
          if (val !== undefined && val !== null) {
            if (typeof val === 'number') {
              detectedType = 'number';
            } else if (typeof val === 'boolean') {
              detectedType = 'boolean';
            }
            break;
          }
        }

        // Format label from key (e.g. metadata.userId -> Metadata User Id)
        const label = key
          .split('.')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');

        newMappingsToAdd.push({
          key,
          label,
          type: detectedType,
          visible: true,
          isCustom: true,
          path: key,
        });
      }
    });

    if (newMappingsToAdd.length > 0) {
      setMappings((prev) => [...prev, ...newMappingsToAdd]);
      if (showToast) {
        showToast(`Scanned logs: Added ${newMappingsToAdd.length} custom columns!`);
      }
    } else {
      if (showToast) {
        showToast('Scanned logs: No new properties detected.');
      }
    }
  };

  return (
    <div className="field-mapper-overlay">
      <div className="field-mapper-panel glassmorphic">
        <div className="field-mapper-header">
          <div className="title-group">
            <Settings className="icon spinner-hover" />
            <h3>Field Mapping Config</h3>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <p className="panel-desc">
          Customize log headers, toggle visible columns, or map custom properties extracted from logs.
        </p>

        <div className="field-mapper-actions">
          <button className="btn-secondary flex-center" onClick={handleAutoDetect}>
            <RotateCw size={14} className="mr-2 animate-spin-hover" />
            Auto-Detect Log Fields
          </button>
        </div>

        <div className="field-list-container">
          <table className="field-mapping-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>Show</th>
                <th>Field Path / Key</th>
                <th>Header Alias</th>
                <th>Type</th>
                <th style={{ width: '60px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {mappings.map((mapping) => (
                <tr key={mapping.key} className={mapping.isCustom ? 'custom-row' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      checked={mapping.visible}
                      onChange={() => toggleVisibility(mapping.key)}
                      className="custom-checkbox"
                    />
                  </td>
                  <td>
                    <code className="path-code">{mapping.key}</code>
                    {mapping.isCustom && <span className="badge-custom">custom</span>}
                  </td>
                  <td>
                    <input
                      type="text"
                      value={mapping.label}
                      onChange={(e) => updateLabel(mapping.key, e.target.value)}
                      className="field-alias-input"
                    />
                  </td>
                  <td>
                    <span className="field-type-badge">{mapping.type}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {mapping.isCustom ? (
                      <button
                        className="delete-field-btn"
                        onClick={() => handleDeleteField(mapping.key)}
                        title="Delete dynamic mapping"
                      >
                        <X size={14} />
                      </button>
                    ) : (
                      <span className="text-muted lock-icon">🔒</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form className="add-field-form" onSubmit={handleAddField}>
          <h4>Add Custom Field Mapping</h4>
          <div className="form-grid">
            <div className="form-group">
              <label>Field Key / Path (e.g. <code>metadata.region</code>)</label>
              <input
                type="text"
                placeholder="metadata.userId"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                required
                className="text-input"
              />
            </div>
            <div className="form-group">
              <label>Header Display Label</label>
              <input
                type="text"
                placeholder="User ID"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="text-input"
              />
            </div>
            <div className="form-group">
              <label>Data Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="select-input"
              >
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="date">Date (Timestamp)</option>
              </select>
            </div>
            <div className="form-group flex-end">
              <button type="submit" className="btn-primary flex-center w-full">
                <Plus size={16} className="mr-1" /> Add Mapping
              </button>
            </div>
          </div>
          {errorMsg && (
            <div className="error-alert">
              <ShieldAlert size={14} className="mr-2" />
              {errorMsg}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

// Helper utility to fetch nested keys
export function getNestedValue(obj: any, path: string): any {
  if (!path) return undefined;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
}
