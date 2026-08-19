# Logit Viewer

The official dashboard and presentation portal for the **Logit** logging ecosystem. Logit Viewer runs as a dual-compatible application (both in modern Web browsers and as a standalone desktop application via Electron).

🔗 **Quick Links:**
- **Live Hosted Dashboard (Logit Viewer)**: [https://logit-viewer.vercel.app](https://logit-viewer.vercel.app)
- **GitHub Repository**: [https://github.com/priyanshi88879/logit-viewer.git](https://github.com/priyanshi88879/logit-viewer.git)
- **LinkedIn Profile**: [https://www.linkedin.com/in/priyanshi-gupta-a46baa315]([https://www.linkedin.com/in/priyanshi-gupta-a46baa315])
- **NPM Package**: [https://www.npmjs.com/package/logit-logger](https://www.npmjs.com/package/logit-logger)

## Features

- **Premium Presentation Landing Page**: Interactive console live-feed mockup showing simulated logs, detailed installation documentation for frontend/backend pipelines, and authorized connection handshake controls.
- **Dynamic CSS Theme Toggler**: Clean system integration for Light/Dark mode styling.
- **Telemetry Live-Feeds**: Real-time log streaming using Socket.io subscriptions.
- **Advanced Filtering Panels**: Filter logs by severity level, source service names, custom log fields, request paths/HTTP methods, and response latencies.
- **Historical Queries**: Query MongoDB log collections directly within custom start/end timestamp parameters.

## Getting Started

### Local Setup
1. Clone this repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server (starts Vite + Electron concurrently):
   ```bash
   npm run dev
   ```

### Production Build
To build the static web bundle and bundle Electron:
```bash
npm run build
```
The compiled browser assets will be output to the `dist` directory.
