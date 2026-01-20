# The Bradbury Challenge App (Expo / React Native)

The Bradbury Challenge App is a mobile-first, local-first app for logging daily readings, tracking reading stats and streaks, and organizing reading goals via curriculum topics and checklists. The current implementation intentionally avoids a backend: all data is stored on-device using AsyncStorage.

This repository is a portfolio project intended to demonstrate practical React Native architecture, local persistence patterns, UI state management, and incremental feature delivery.

# What is the Bradbury challenge? 

Based on a piece of advice given by author Ray Bradbury to aspiring writers, the Bradbury Challenge is a reading (and, optionally, writing) challenge. Put simply: read one short story, one essay, and one poem everyday for 1,000 days.

# App Highlights

- **Daily reading logs** with metadata: title, author, URL, notes, custom tags, rating system, and estimated word count.
- **Day and calendar views**: log your writing each day and revisit prior readings via the calendar (swipe navigation or modal date picker).
- **Visual streak indicators**: easily track your streak with color coding for incomplete, partially completed, and completed days.
- **Personal curriculum**: create custom curriculum topics, import reading lists (read-it-later style), and mark items finished (w/ autosorting).
- **Local-first persistence**: data is stored in AsyncStorage with one-click import and export; enjoy the app fully offline.

# Tech Stack

- **Expo SDK**: 54.x
- **React**: 19.1.0
- **React Native**: 0.81.5
- **Navigation**: React Navigation
- **Storage**: @react-native-async-storage/async-storage
- **Clipboard Utilities**: expo-clipboard
- **Icons**: @expo/vector-icons (FontAwesome)
- **Safe Area**: react-native-safe-area-context

# Data Model

The primary data unit is a "Reading Entry" stored on-device: 

```js
{
    dayKey: "YYYY-MM-DD",
    category: "essay" | "story" | "poem",
    title: string,
    author: string,
    url?: string,
    notes?: string,
    tags: string[],
    rating: number,
    wordCount: number|null,
    createdAt: number,
    updatedAt: number
}
```

# Getting Started

Prereqs: Node.js, npm, Expo CLI (via npx)

Install (from apps/mobile): npm install
Run (Expo Go): npx expo start --clear

# Backup/Restore

Due to local-first architecture, uninstalling the app may wipe on-device data. The Settings screen includes a backup workflow: 
- **Export**: Copies a JSON snapshot of AsyncStorage keys to the clipboard.
- **Import**: Paste JSON to restore data (merge or replace).
- **Clear**: Clears all existing Bradbury keys from device storage.

# Roadmap (High Level)

- Continue refactoring toward componentized, maintainable screens.
- Improve UX: additional themes, clearer navigation.
- Improve local persistence and data migration.
- Expand reading workflow w/ more robust word count tooling.
- Add progress visualization and streak badges.
- Introduce web app and cloud sync across multiple devices.

# License

This project is licensed under the Creative Commons Attribution 3.0 License. You are free to:
**Share**: Copy and redistribute this material in any medium or format for any purpose, even commercially.
**Adapt**: Remix, transform, and build upon this material for any purpose, even commercially.
Under the following terms: 
**Attribution**: Give appropriate credit and indicate if changes were made to the original material.
**No additional restrictions**: You may not apply legal terms or technological measures that restrict others from doing anything this license permits.