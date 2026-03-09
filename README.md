<p align="center">
  <img src="assets/icons/logo.png" width="100" alt="KronoBar logo" />
</p>

<h1 align="center">KronoBar</h1>

<p align="center">
  A lightweight menu bar app for macOS & Windows to track time spent on projects and clients.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-macOS-black?style=flat-square&logo=apple" alt="macOS" />
  <img src="https://img.shields.io/badge/platform-Windows-0078D4?style=flat-square&logo=windows&logoColor=white" alt="Windows" />
  <img src="https://img.shields.io/badge/Electron-35495E?style=flat-square&logo=electron&logoColor=white" alt="Electron" />
  <img src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white" alt="SQLite" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="MIT License" />
</p>

> **Note**: This is a personal project built to experiment with Electron, React, and SQLite. Bug reports and feature suggestions are welcome — I'll do my best to address them, but I make no long-term guarantees. The app and its behavior may change at any time without notice


https://github.com/user-attachments/assets/13161de8-df31-4d25-b885-219cbc227b1a

## Features

- **Menu bar / System tray app** — Always one click away, lives in the macOS menu bar or Windows system tray
- **Time tracking** — Log hours and minutes per project, per client
- **Client & project management** — Color-coded clients, multiple projects per client
- **Today view** — See today's entries at a glance with a progress bar
- **History** — Browse past entries by day, week, month, or year
- **Statistics** — Time totals, revenue, and breakdown by client
- **CSV export** — Export your tracking data for invoicing
- **Global shortcut** — Toggle the window with `Cmd + Shift + T` (macOS) or `Ctrl + Shift + T` (Windows)
- **Launch at login** — Start automatically with your OS
- **Auto-update** — The app checks for updates automatically (Windows)
- **Local data** — Everything stays on your machine (SQLite)
- **Dark & light mode** — Adapts to your system theme, with native vibrancy (macOS) and acrylic (Windows) effects

<p align="center"><img src="assets/screenshot-1.png" width="150" alt="Today" /><img src="assets/screenshot-2.png" width="150" alt="New entry" /><img src="assets/screenshot-3.png" width="150" alt="History" /><img src="assets/screenshot-4.png" width="150" alt="Stats" /><img src="assets/screenshot-5.png" width="150" alt="Settings" /></p>

## Installation

Download the latest version from the [Releases](https://github.com/splyy/KronoBar/releases) page:

| Platform | File | Notes |
|----------|------|-------|
| macOS (Apple Silicon) | `KronoBar-darwin-arm64-x.x.x.zip` | Extract and move to `/Applications` |
| Windows | `KronoBar-x.x.x.Setup.exe` | Run the installer |
| Windows | `KronoBar-win32-x64-x.x.x.zip` | Portable version, no install needed |

### macOS — Bypassing Gatekeeper

Since KronoBar is not signed with an Apple Developer certificate, macOS may block the app on first launch. To fix this:

```bash
xattr -cr /Applications/KronoBar.app
```

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v20+)
- [Git](https://git-scm.com/)

### Getting started

```bash
git clone https://github.com/splyy/KronoBar.git
cd KronoBar
npm install
npm start
```

### Commands

```bash
npm start          # Dev mode with hot reload (uses a separate local database)
npm run dev:demo   # Reset dev database with sample data and start the app
npm run make       # Build distributable for your current platform
npm run lint       # Lint code
```

The dev environment uses its own database (`.dev-data/kronobar.db`) so your production data is never affected.

### Demo mode

`npm run dev:demo` seeds the app with 4 clients, 5 projects, and ~40 time entries spread over 3 weeks — useful for testing, debugging, or recording a demo.

### Publishing a release

Releases are built automatically by CI when a tag is pushed:

```bash
# 1. Update the version in package.json
# 2. Commit, tag, and push
git tag v1.1.0
git push --tags
```

The GitHub Actions workflow builds for macOS and Windows, then creates a release with all artifacts.

<details>
<summary>Manual publish (local)</summary>

1. Create a `.env` file at the project root with your GitHub token: `GITHUB_TOKEN=ghp_...`
2. Run `npm run publish` — this builds and uploads the release as a draft on GitHub
3. Go to [Releases](https://github.com/splyy/KronoBar/releases) and publish the draft

</details>

## Tech Stack

| Component | Technology                                                                               |
|-----------|------------------------------------------------------------------------------------------|
| Desktop   | [Electron](https://www.electronjs.org/)                                                  |
| Tooling   | [Electron Forge](https://www.electronforge.io/)                                          |
| UI        | [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)              |
| Build     | [Vite](https://vitejs.dev/)                                                              |
| Database  | SQLite ([sql.js](https://github.com/sql-js/sql.js) — WASM, no native deps)               |
| Styling   | CSS Modules                                                                              |
| Icons     | [Solar](https://icon-sets.iconify.design/solar/) via [IconBuddy](https://iconbuddy.com/) |

## Inspiration

- [GitLabBar](https://github.com/yoanbernabeu/GitLabBar) — for the architecture
- [ClaudeBar](https://github.com/tddworks/ClaudeBar) — for UX/UI pattern

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
