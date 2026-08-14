const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');

let mainWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Google SSO automated authentication interceptor
ipcMain.handle('google-sign-in', async (event, apiUrl) => {
  const cleanApiUrl = apiUrl.replace(/\/$/, '');
  return new Promise((resolve) => {
    const partitionName = 'persist:google-auth';
    const authSession = session.fromPartition(partitionName);

    // Clear session storage to force Google account chooser
    authSession.clearStorageData({ origin: cleanApiUrl }).catch(console.error);

    const authWindow = new BrowserWindow({
      width: 800,
      height: 900,
      parent: mainWindow,
      modal: true,
      webPreferences: {
        session: authSession,
        nodeIntegration: false,
        contextIsolation: true,
      }
    });

    const authUrl = `${cleanApiUrl}/khel/auth/google?role=admin&prompt=select_account`;
    authWindow.loadURL(authUrl);

    const interval = setInterval(async () => {
      try {
        const cookies = await authSession.cookies.get({
          url: cleanApiUrl,
          name: 'sessionToken'
        });

        if (cookies && cookies.length > 0) {
          clearInterval(interval);
          authWindow.close();
          resolve({ success: true, token: cookies[0].value });
        }
      } catch (err) {
        console.error('Error fetching cookies in Electron:', err);
      }
    }, 400);

    authWindow.on('closed', () => {
      clearInterval(interval);
      resolve({ success: false, message: 'Google Sign-In popup closed by user' });
    });
  });
});

// Verify session token via /khel/me — runs in Node.js main process
// where Cookie headers are NOT forbidden (unlike browser fetch).
// This matches the desktop admin 2.0.6 check-token-session handler exactly.
ipcMain.handle('check-token-session', async (event, apiUrl, token) => {
  const cleanApiUrl = apiUrl.replace(/\/$/, '');
  return new Promise((resolve) => {
    const url = new URL(`${cleanApiUrl}/khel/me`);
    const isHttps = url.protocol === 'https:';
    const mod = isHttps ? require('https') : require('http');

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `sessionToken=${token}`
      }
    };

    const req = mod.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          const result = Array.isArray(data) ? data[0] : data;
          console.log('[check-token-session] /me result:', result);
          resolve(result); // { email, name, ... } or null
        } catch (e) {
          console.error('[check-token-session] JSON parse error:', e);
          resolve(null);
        }
      });
    });

    req.on('error', (err) => {
      console.error('[check-token-session] Request error:', err.message);
      resolve(null);
    });

    req.end();
  });
});

// Generic API proxy — routes any renderer API call through Node.js main process
// so Cookie headers actually reach the server (browser fetch strips them).
ipcMain.handle('api-request', async (event, { url, method, token, body }) => {
  return new Promise((resolve) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const mod = isHttps ? require('https') : require('http');

    const bodyStr = body ? JSON.stringify(body) : null;

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `sessionToken=${token}`
      }
    };

    if (bodyStr) {
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = mod.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log(`[api-request] ${method} ${parsedUrl.pathname} → ${res.statusCode}`);
          resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data: parsed });
        } catch (e) {
          console.error(`[api-request] JSON parse error for ${parsedUrl.pathname}:`, e.message);
          resolve({ ok: false, status: res.statusCode, data: null });
        }
      });
    });

    req.on('error', (err) => {
      console.error(`[api-request] Network error for ${url}:`, err.message);
      resolve({ ok: false, status: 0, data: null, error: err.message });
    });

    if (bodyStr) {
      req.write(bodyStr);
    }
    req.end();
  });
});
