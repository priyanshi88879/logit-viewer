import type { LogEntry } from './types';

const MATCHES = [
  { id: 'IPL-2026-M01', desc: 'CSK vs RCB - Season Opener' },
  { id: 'IPL-2026-M02', desc: 'MI vs KKR - Wankhede Stadium' },
  { id: 'T20-WC-IND-PAK', desc: 'T20 World Cup - India vs Pakistan' },
  { id: 'T20-WC-AUS-ENG', desc: 'T20 World Cup - Australia vs England' },
];

const APPS = ['DRS', 'BROADCASTER', 'ADMIN'];


const URLS: Record<string, string[]> = {
  DRS: [
    '/api/v1/drs/ball-tracker',
    '/api/v1/drs/ultra-edge/audio',
    '/api/v1/drs/hawk-eye/projection',
    '/api/v1/drs/decision/validate',
    '/api/v1/drs/camera/sync',
  ],
  BROADCASTER: [
    '/feed/live/stream-chunk',
    '/feed/telemetry/overlay',
    '/api/v2/graphics/scorecard',
    '/api/v2/audio/ambient-mic',
    '/feed/stream/status',
  ],
  ADMIN: [
    '/admin/login',
    '/admin/dashboard/stats',
    '/admin/config/camera-calibration',
    '/admin/users/roles',
    '/admin/system/health',
  ],
};

const MESSAGES: Record<string, Record<string, string[]>> = {
  fatal: {
    DRS: [
      'Camera feed synchronization failed: frame drop rate > 90%. System halting.',
      'Ball tracker module crashed: Out of GPU memory during 3D interpolation.',
      'Failed to initialize Hawk-Eye socket connection. Critical error.'
    ],
    BROADCASTER: [
      'Primary RTMP ingestion endpoint collapsed. Backup stream down.',
      'Graphics engine memory leak: process terminated by OOM killer.',
      'Broadcaster audio matrix control panel failed to boot: device not found.'
    ],
    ADMIN: [
      'Database connection pool exhausted. Admin portal unreachable.',
      'Disk partition /var/log full. Logging service stopped.',
      'SSL certificate renewal failed. All secure admin ports blocked.'
    ]
  },
  error: {
    DRS: [
      'Failed to calculate spin trajectory. Falling back to linear model.',
      'UltraEdge microphone 3 high noise floor. Signal degraded.',
      'Timeout waiting for camera 4 frame handshake.'
    ],
    BROADCASTER: [
      'Failed to render lower-third graphic for batsman statistics.',
      'Frame skipped in stream encoder (DRS overlay delay).',
      'API gateway returned 502 for graphics update query.'
    ],
    ADMIN: [
      'Failed authentication attempt for user admin_user_02.',
      'Configuration sync failed with node 3. Retrying...',
      'Backup creation failed: read-only file system on backup storage.'
    ]
  },
  warn: {
    DRS: [
      'Calibrating camera offsets took longer than usual: 145ms.',
      'Slight frame jitter detected on Camera 1 (boundary cam).',
      'Audio sync drift detected: 8ms. Re-centering audio buffer.'
    ],
    BROADCASTER: [
      'RTMP stream bitrate dropped below threshold (recommended: 8Mbps, current: 5.2Mbps).',
      'Overlay graphic engine rendering delay exceeded 16ms.',
      'Broadcast stream buffer fill is below 30%.'
    ],
    ADMIN: [
      'CPU utilization exceeded 85% on application host.',
      'API rate limit warning: IP 203.0.113.43 reached 80% limit.',
      'Slow query detected: SELECT * FROM audit_logs WHERE timestamp > ... (1.2s)'
    ]
  },
  info: {
    DRS: [
      'Ball tracking completed. 3D trajectory dispatched to overlays.',
      'UltraEdge sync pulse received from umpire control pad.',
      'Lidar distance scanner calibrated successfully. Precision: 0.1mm.'
    ],
    BROADCASTER: [
      'Successfully pushed scorecard overlay update for batsman milestone.',
      'Audio track 2 (Stump Mic) gain adjusted dynamically.',
      'Stream quality initialized at 1080p 60fps (HEVC).'
    ],
    ADMIN: [
      'System configuration successfully updated from version 12 to 13.',
      'User operations_lead logged in from IP 198.51.100.12.',
      'Database index maintenance completed successfully.'
    ]
  },
  http: {
    DRS: [
      'HTTP GET /api/v1/drs/ball-tracker?id=99283 - Completed 200 OK',
      'HTTP POST /api/v1/drs/decision/validate - Completed 201 Created',
      'HTTP GET /api/v1/drs/camera/sync - Completed 200 OK'
    ],
    BROADCASTER: [
      'HTTP GET /feed/stream/status - Completed 200 OK',
      'HTTP POST /api/v2/graphics/scorecard - Completed 200 OK',
      'HTTP GET /feed/telemetry/overlay - Completed 304 Not Modified'
    ],
    ADMIN: [
      'HTTP GET /admin/dashboard/stats - Completed 200 OK',
      'HTTP POST /admin/config/camera-calibration - Completed 200 OK',
      'HTTP GET /admin/system/health - Completed 200 OK'
    ]
  }
};

const IPS = [
  '192.168.1.101',
  '192.168.1.102',
  '10.0.4.15',
  '10.0.4.16',
  '203.0.113.12',
  '198.51.100.8',
  '172.16.85.22',
];

const USER_IDS = ['usr_998', 'usr_421', 'usr_872', 'usr_009', 'usr_505'];
const REGIONS = ['ap-south-1', 'eu-west-1', 'us-east-1', 'ap-southeast-1'];

export function generateFakeLogs(count = 250): LogEntry[] {
  const logs: LogEntry[] = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    // Distribute timestamps back in time (e.g. over the last 2 hours)
    const timeDelta = Math.floor(Math.random() * 2 * 60 * 60 * 1000);
    const requestReceivedAt = new Date(now - timeDelta);
    const responseTime = Math.floor(Math.random() * 80) + (Math.random() > 0.85 ? Math.random() > 0.5 ? 400 : 1500 : 5); // some slow requests
    const responseSentAt = new Date(requestReceivedAt.getTime() + responseTime);

    const match = MATCHES[Math.floor(Math.random() * MATCHES.length)];
    const appName = APPS[Math.floor(Math.random() * APPS.length)];
    
    // Distribute levels: mostly info/http, fewer warns, rare errors, very rare fatals
    const levelRoll = Math.random();
    let level = 'info';
    if (levelRoll < 0.05) level = 'fatal';
    else if (levelRoll < 0.15) level = 'error';
    else if (levelRoll < 0.35) level = 'warn';
    else if (levelRoll < 0.65) level = 'http';

    const urlList = URLS[appName];
    const url = urlList[Math.floor(Math.random() * urlList.length)];
    
    const msgList = MESSAGES[level][appName];
    const message = msgList[Math.floor(Math.random() * msgList.length)];

    // status codes based on level
    let status = 200;
    if (level === 'fatal') status = 500;
    else if (level === 'error') status = Math.random() > 0.5 ? 500 : 400;
    else if (level === 'warn') status = Math.random() > 0.5 ? 202 : 200;
    else if (level === 'http') status = Math.random() > 0.8 ? 304 : 200;

    const ip = IPS[Math.floor(Math.random() * IPS.length)];
    const content_length = Math.floor(Math.random() * 8500) + 120;

    // Extra dynamic/nested fields (satisfying "open to map new fields")
    const hasMetadata = Math.random() > 0.3;
    const metadata = hasMetadata ? {
      userId: USER_IDS[Math.floor(Math.random() * USER_IDS.length)],
      region: REGIONS[Math.floor(Math.random() * REGIONS.length)],
      retryCount: Math.random() > 0.8 ? Math.floor(Math.random() * 3) + 1 : 0
    } : undefined;

    const payloadSizeKB = parseFloat((Math.random() * 15).toFixed(2));
    const deviceType = Math.random() > 0.5 ? 'CameraNode' : 'UmpireTablet';
    
    logs.push({
      id: `req-${100000 + i}`,
      matchId: match.id,
      timestamp: requestReceivedAt.getTime(),
      responseSentAt: responseSentAt.getTime(),
      appName,
      level,
      method: url.startsWith('/api') || url.includes('/config') ? (Math.random() > 0.4 ? 'POST' : 'GET') : 'GET',
      url,
      status,
      ip,
      content_length,
      response_time: responseTime,
      message,
      // Custom extra fields
      metadata,
      payloadSizeKB,
      deviceType,
    });
  }

  // Sort logs chronologically
  return logs.sort((a, b) => b.timestamp - a.timestamp);
}

export function getMatchDetails() {
  return MATCHES;
}
