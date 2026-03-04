<p align="center">
  <img src="assets/icons/logo.png" width="100" alt="KronoBar logo" />
</p>

<h1 align="center">KronoBar</h1>

<p align="center">
  A lightweight macOS menu bar app to track time spent on projects and clients.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-macOS-black?style=flat-square&logo=apple" alt="macOS" />
  <img src="https://img.shields.io/badge/Electron-35495E?style=flat-square&logo=electron&logoColor=white" alt="Electron" />
  <img src="https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white" alt="SQLite" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="MIT License" />
</p>

> **Note**: This is a personal project built to experiment with Electron, React, and SQLite. Bug reports and feature suggestions are welcome — I'll do my best to address them, but I make no long-term guarantees. The app and its behavior may change at any time without notice.

<video src="assets/demo.mp4" width="400" autoplay loop muted></video>

## Features

- **Menu bar app** — Always one click away, lives in the macOS tray
- **Time tracking** — Log hours and minutes per project, per client
- **Client & project management** — Color-coded clients, multiple projects per client
- **Today view** — See today's entries at a glance with a progress bar
- **History** — Browse past entries by day, week, month, or year
- **Statistics** — Time totals, revenue, and breakdown by client
- **CSV export** — Export your tracking data for invoicing
- **Global shortcut** — Toggle the window with `Cmd + Shift + T`
- **Launch at login** — Start automatically with macOS
- **Local data** — Everything stays on your machine (SQLite)
- **Dark mode** — Native macOS dark theme

## Installation

### Quick Install

Clone the repository and run the install script:

```bash
git clone https://github.com/yoanbernabeu/KronoBar.git
cd KronoBar
chmod +x install.sh
./install.sh
```

The script will install dependencies, build the app, and copy it to `/Applications`.

### Bypassing macOS Gatekeeper

Since KronoBar is not signed with an Apple Developer certificate, macOS may block the app on first launch. The install script handles this automatically. If you installed manually:

```bash
xattr -cr /Applications/KronoBar.app
```

## Development

```bash
npm start          # Dev mode with hot reload (uses a separate local database)
npm run dev:demo   # Reset dev database with sample data and start the app
npm run lint       # Lint code
```

The dev environment uses its own database (`.dev-data/kronobar.db`) so your production data is never affected.

### Demo mode

`npm run dev:demo` seeds the app with 4 clients, 5 projects, and ~40 time entries spread over 3 weeks — useful for testing, debugging, or recording a demo.

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
