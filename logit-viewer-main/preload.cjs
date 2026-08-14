const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  googleSignIn: (apiUrl) => ipcRenderer.invoke('google-sign-in', apiUrl),
  checkTokenSession: (apiUrl, token) => ipcRenderer.invoke('check-token-session', apiUrl, token),
  apiRequest: (opts) => ipcRenderer.invoke('api-request', opts)
});
