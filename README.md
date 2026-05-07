# Monetra

Monetra is an offline-first personal finance management app built with React Native and Expo. Track income and expenses, set budgets, view spending reports, and get AI-powered financial insights — all stored locally on your device.

## Features

- **Dashboard** — balance overview, quick actions, AI insights, budget progress, recent transactions
- **Transactions** — add/delete income and expense entries with category selection
- **Reports** — donut chart, spending trends, and category breakdown
- **AI Assistant** — chat with Groq AI for financial advice, with offline cache fallback
- **Settings** — manage API key, edit profile, reset data

## Tech Stack

- [React Native](https://reactnative.dev/) + [Expo SDK 54](https://expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/) — file-based navigation
- [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) — local database (no backend)
- [Zustand](https://zustand-demo.pmnd.rs/) — global state management
- [Groq API](https://console.groq.com/) (`llama-3.3-70b-versatile`) — AI assistant
- [react-native-svg](https://github.com/software-mansion/react-native-svg) + [victory-native](https://commerce.nearform.com/open-source/victory-native/) — charts
- [expo-secure-store](https://docs.expo.dev/versions/latest/sdk/securestore/) — secure API key storage

## Getting Started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

3. Open in:
   - [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
   - [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
   - [Expo Go](https://expo.dev/go) on a physical device

## AI Setup

To use the AI assistant, add your [Groq API key](https://console.groq.com/) in the app's **Settings** screen. The key is stored securely using `expo-secure-store`. You can also set it via the `EXPO_PUBLIC_GROQ_API_KEY` environment variable.

## Project Structure

```
app/
  onboarding.tsx          # First-run profile setup
  pengaturan.tsx          # Settings screen
  (tabs)/
    index.tsx             # Dashboard
    transaksi.tsx         # Transaction list & add modal
    laporan.tsx           # Reports & charts
    ai.tsx                # AI chat assistant

components/
  transaksi-card.tsx      # Transaction item (long-press to delete)
  anggaran-progress.tsx   # Budget progress bar
  grafik-pengeluaran.tsx  # SVG donut chart

db/                       # SQLite CRUD modules (transaksi, kategori, profil, anggaran, ai-cache)
services/                 # Groq API client & financial context builder
store/                    # Zustand global state (use-app-store.ts)
hooks/                    # DB init, network status
utils/                    # formatRupiah, formatTanggal, etc.
constants/                # Theme colors, default categories
```

## Notes

- All data is stored locally — no backend or authentication required
- UI language: Bahasa Indonesia
- Default categories are seeded on first launch
