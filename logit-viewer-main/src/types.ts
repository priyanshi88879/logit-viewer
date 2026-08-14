export interface LogEntry {
  id: string;
  matchId: string;
  timestamp: number;
  responseSentAt: number;
  appName: string;
  level: string;
  method: string;
  url: string;
  status: string | number;
  ip: string;
  content_length: string | number;
  response_time: number;
  message: string;
  [key: string]: any; // dynamic indexing for custom/nested mapped fields
}

export type FieldType = 'string' | 'number' | 'boolean' | 'date';

export interface FieldMapping {
  key: string;        // identifier, e.g. 'ip' or 'metadata.userId'
  label: string;      // display label, e.g. 'IP Address' or 'User'
  type: FieldType;    // field data type
  visible: boolean;   // shown in the table by default?
  isCustom: boolean;  // is this a user-defined mapping?
  path?: string;      // optional path selector, e.g. 'metadata.userId'
}
