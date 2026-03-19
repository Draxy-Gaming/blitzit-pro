# Blitzit

Focus-first task manager. Built with Electron + React + TypeScript.

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Run in dev mode (hot reload)
npm run dev

# 3. Type check
npm run typecheck
```

## Build

```bash
# Build for your current platform
npm run package

# Build for specific platform
npm run package:mac
npm run package:win
npm run package:linux
```

## Release

Push a tag starting with `v` to trigger a GitHub release with all platform builds:

```bash
git tag v0.1.0
git push origin v0.1.0
```

## Project structure

```
src/
  main/         → Electron main process (Node.js)
  preload/      → Secure IPC bridge
  renderer/
    src/
      types/    → TypeScript data models
      store/    → Zustand state management
      components/ → React components (coming soon)
```
