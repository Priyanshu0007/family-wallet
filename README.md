# ✦ Tijori — Modern Family Wallet & Card Vault

**A high-performance, offline-first personal finance and credit card management app built with Next.js App Router, React 19, and Tailwind CSS 4. Features zero-knowledge client-side encryption and a real-time Gemini AI card advisor.**

[![Live Site](https://img.shields.io/badge/🚀_Live_Site-mytijori.vercel.app-6c63ff?style=for-the-badge&logo=vercel&logoColor=white)](https://mytijori.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Dexie](https://img.shields.io/badge/Database-Dexie.js-007acc?style=for-the-badge&logo=indexeddb&logoColor=white)](https://dexie.org)

---

[![Home Page](https://cdn.jsdelivr.net/gh/Priyanshu0007/CDN@c115d5f46c2c28cef3cea7fcc8bc3583c26e85ba/tijori/tijori-home-screen.png)](https://mytijori.vercel.app/)

*Home page — featuring a premium glassmorphic credit card grid, filter chips, and alert panels*

---

## 📋 Table of Contents

- [Live URLs](#-live-urls)
- [Screenshots](#-screenshots)
- [Tech Stack](#-tech-stack)
- [Architecture Overview](#-architecture-overview)
- [Cryptographic & Security Workflows](#-cryptographic--security-workflows)
- [Project Structure](#-project-structure)
- [Pages & Screens](#-pages--screens)
- [Database Schema](#-database-schema)
- [Key Features](#-key-features)
- [Environment Variables](#-environment-variables)
- [Getting Started](#-getting-started)
- [Design System](#-design-system)

---

## 🌐 Live URLs

| Platform | URL | Purpose |
|-------------|-----|---------|
| 🟢 **Vercel Production** | [mytijori.vercel.app](https://mytijori.vercel.app/) | Live production vault app |
| 🟡 **Vercel Development** | [tijorimein.vercel.app](https://tijorimein.vercel.app/) | Active development & staging environment |

---

## 📸 Screenshots

### 🏠 Home / Landing Page
[![Landing Page](https://cdn.jsdelivr.net/gh/Priyanshu0007/CDN@c115d5f46c2c28cef3cea7fcc8bc3583c26e85ba/tijori/tijori-home-screen.png)](https://mytijori.vercel.app/)

*Dashboard displaying the visual card stack, alerts panel for high utilization, and filter tags.*

### 📱 Mobile Home & Pinned Favorites
[![Mobile Home Page](https://cdn.jsdelivr.net/gh/Priyanshu0007/CDN@c115d5f46c2c28cef3cea7fcc8bc3583c26e85ba/tijori/tijori-mobile-home-screen.png)](https://mytijori.vercel.app/)

*Mobile Home view — optimized for touch gestures with responsive sidebar, quick action floating button, and pinned favorites shelf.*

### 🤖 AI Card Advisor & Chat View
[![AI Advisor Page](https://cdn.jsdelivr.net/gh/Priyanshu0007/CDN@c115d5f46c2c28cef3cea7fcc8bc3583c26e85ba/tijori/tijori-ai-screen.png)](https://mytijori.vercel.app/)

*AI Card Advisor page — chat interface powered by Gemini 2.5 Flash and Google Search to find real-time rewards structures and bank devaluations.*

### 📊 Card Stats & Credit Analytics
[![Stats Page](https://cdn.jsdelivr.net/gh/Priyanshu0007/CDN@c115d5f46c2c28cef3cea7fcc8bc3583c26e85ba/tijori/tijori-stats-screen.png)](https://mytijori.vercel.app/)

*Stats Screen — analytics graphs showing total limit utilization, upcoming bill due trackers, and points value indicators.*

### ⚙️ App Security & Settings
[![Settings Page](https://cdn.jsdelivr.net/gh/Priyanshu0007/CDN@c115d5f46c2c28cef3cea7fcc8bc3583c26e85ba/tijori/tijori-setting-screen.png)](https://mytijori.vercel.app/)

*Settings Page — secure database maintenance controls including master PIN modification, automated lockout timeout configuration, and password-protected encrypted data export/import utilities.*

---

## 🛠️ Tech Stack

### Core Framework

| Technology | Version | Role |
|------------|---------|------|
| [Next.js](https://nextjs.org) | `16.2.6` | React Framework (App Router) |
| [React](https://react.dev) | `19.2.4` | UI Library |
| TypeScript | `5.x` | Strict typing and schema integrity |

### Styling & Animations

| Technology | Version | Role |
|------------|---------|------|
| [Tailwind CSS](https://tailwindcss.com) | `4.0.0` | Utility-first styling framework |
| [Framer Motion](https://www.framer.com/motion/) | `12.38.0` | Premium smooth micro-animations |
| Lucide React | `1.16.0` | Modern vector icons |
| Google Fonts | — | `Sora` (headings and UI text), `Space Mono` (monospaced metrics) |

### Database & State Management

| Technology | Version | Role |
|------------|---------|------|
| [Dexie.js](https://dexie.org) | `4.4.2` | Minimalistic IndexedDB wrapper for local database storage |
| [Zustand](https://zustand-demo.pmnd.rs/) | `5.0.13` | High-performance client-side global state store |
| Dexie Encrypted | `2.0.0` | local database schema encryption hooks |

### Security & AI

| Technology | Version | Role |
|------------|---------|------|
| [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) | Native | Client-side PBKDF2 key derivation and AES-GCM 256-bit encryption |
| [@google/genai](https://github.com/google/generative-ai-js) | `2.4.0` | Server-side Gemini API client supporting real-time streaming and Google search grounding |
| React Markdown | `10.1.0` | Renders streamable markdown responses |

---

## 🏗️ Architecture Overview

```
                        ┌────────────────────────────────────────┐
                        │             Client Browser             │
                        │   (PWA Standalone Mode / Offline First)│
                        └───────────────────┬────────────────────┘
                                            │
                             User Interaction / Form Actions
                                            ▼
                        ┌────────────────────────────────────────┐
                        │             Zustand Stores             │
                        │      (cardStore, pinStore, uiStore)    │
                        └───────────┬────────────────┬───────────┘
                                    │                │
            Save Sensitive Data     │                │ Query AI Adviser
            (Encrypted via          │                │ (Fetch API Request)
            Web Crypto AES-GCM)     │                │
                                    ▼                ▼
                        ┌───────────┴────┐   ┌───────┴───────────┐
                        │    IndexedDB   │   │   Next.js API     │
                        │  (Dexie Local) │   │   (/api/chat)     │
                        └────────────────┘   └───────┬───────────┘
                                                     │
                                                     │ Streaming Response via
                                                     │ Gemini 2.5 Flash + Search
                                                     ▼
                                             ┌───────────────┐
                                             │  Google AI    │
                                             │  Gemini API   │
                                             └───────────────┘
```

### Key Architectural Decisions

- **Offline-First Storage**: User wallets are kept exclusively on their device inside IndexedDB via Dexie. No remote cloud database is used.
- **Zero-Knowledge Security**: AES-GCM encryption key is derived directly from the user's master PIN using PBKDF2 on their browser. Plaintext card credentials never leave the browser.
- **Streamed AI Advisor Responses**: Next.js route handler hosts the Gemini integration securely. It streams recommendations to the client browser in real time while leveraging Google Search to check live devaluations and terms.
- **PWA Capabilities**: App includes a custom service worker registrar and manifest file, providing immediate installability and offline caching capability.

---

## 🔐 Cryptographic & Security Workflows

To ensure client-side isolation, data processes follow strict cryptographic flows managed in [crypto.ts](file:///Users/priyanshugupta/Coding-filles/next/family-wallet/store/crypto.ts):

### 1. Key Derivation from PIN
1. User supplies their 6-digit Master PIN.
2. A 16-byte random salt is generated (or fetched from `localStorage`).
3. PBKDF2 with **310,000 iterations** and **SHA-256** derives a 256-bit AES-GCM encryption key.
4. An independent verification hash of the PIN is computed using `SHA-256` and saved in `localStorage` under `pin_hash`.
5. The active derived `CryptoKey` is exported to Base64 and cached in `sessionStorage` (`crypto_key`) to avoid reprompting the user on page refresh.

### 2. Client-Side Record Encryption
1. Sensitive fields (`number`, `cvv`, `holder`, and `notes`) are encrypted before database insertion.
2. Since IndexedDB transactions auto-commit on microtask breaks, async encryption is completed in the store layer in [cardStore.ts](file:///Users/priyanshugupta/Coding-filles/next/family-wallet/store/cardStore.ts) before initiating Dexie DB operations.
3. Every encryption uses a unique, random 12-byte initialization vector (IV) producing standard `IV:Ciphertext` base64 strings.
4. A regex check (`looksEncrypted`) prevents double-encryption during record edits.

### 3. Password-Protected Backup Export
1. User provides a separate backup password.
2. A salt and IV are randomly generated.
3. PBKDF2 with **100,000 iterations** derives a 256-bit AES-GCM backup key from the password.
4. The application reads all cards, decrypts them with the session master key, and encrypts the plaintext payload using the backup key.
5. The payload is written to a JSON file containing metadata, salt, IV, and ciphertext.

---

## 📁 Project Structure

```
family-wallet/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts          # Server-side Gemini AI Chat Streaming endpoint
│   │   └── scan/
│   │       └── route.ts          # Optional scanner integration route
│   ├── globals.css               # Global Tailwind directives, @theme definitions, and markdown rules
│   ├── icon.svg                  # Application favicon
│   ├── layout.tsx                # Root layout importing Sora & Space Mono fonts
│   ├── manifest.ts               # Progressive Web App (PWA) configuration
│   └── page.tsx                  # Main router mounting Setup, PinLock, or Dashboard
│
├── components/
│   ├── cards/
│   │   ├── CardDetail.tsx        # Detail view drawer showing CVV/numbers with copy tools
│   │   ├── CardForm.tsx          # Full screen card insertion/updating UI
│   │   ├── CardItem.tsx          # Card summaries list item
│   │   ├── CardList.tsx          # Scrollable layout container of wallet cards
│   │   ├── CardVisual.tsx        # Realistic mockup credit card representation with live colors
│   │   └── FavoritesShelf.tsx    # Horizontal carousel of pinned/starred favorites
│   │
│   ├── layout/
│   │   ├── BottomNav.tsx         # Mobile tab bar navigation buttons
│   │   ├── Sidebar.tsx           # Large screen menu sidebar navigation
│   │   └── TopBar.tsx            # Header showing active user profile and search tools
│   │
│   ├── onboarding/
│   │   └── Walkthrough.tsx       # Interactive step-by-step introduction modal
│   │
│   ├── pin/
│   │   ├── ChangePinModal.tsx    # Modal to change the master locking PIN
│   │   ├── PinDots.tsx           # Graphic circles displaying PIN input progress
│   │   ├── PinLock.tsx           # Full-screen lock overlay for vault validation
│   │   ├── PinNumpad.tsx         # Responsive security keypad for PIN entries
│   │   └── PinSetup.tsx          # Interactive setup screen for first-time launch
│   │
│   ├── pwa/
│   │   └── ServiceWorkerRegistrar.tsx # Handles background service worker hooks
│   │
│   ├── screens/
│   │   ├── AiScreen.tsx          # Conversational chatbot to request credit card advice
│   │   ├── HomeScreen.tsx        # Dashboard showing cards list, search, and warnings
│   │   ├── SettingsScreen.tsx    # Security settings, database reset, and data import/export
│   │   └── StatsScreen.tsx       # Graph visualizations of card usage, limits, and points value
│   │
│   └── ui/
│       ├── BottomSheet.tsx       # Reusable responsive drawers
│       ├── ConfirmModal.tsx      # Modal to handle critical deletions/resets
│       ├── FilterChips.tsx       # Multi-member/network card filter controls
│       ├── SortModal.tsx         # Ordering selector for bank name, date, limit
│       ├── TijoriLogo.tsx        # Elegant custom vault branding component
│       └── Toast.tsx             # Notification bubble alerts provider
│
├── lib/
│   ├── cardUtils.ts              # Bill due calculations, card network regexes, and security masking
│   ├── config.ts                 # Server configuration reader
│   ├── constants.ts              # Bank lists, network categories, and default benefits
│   └── seedData.ts               # Sample seeds to instantiate demo data
│
├── store/
│   ├── cardStore.ts              # CRUD handlers managing card states and db updates
│   ├── crypto.ts                 # Low level Web Crypto encrypt/decrypt and base64 exporters
│   ├── db.ts                     # Dexie instance mapping local Tables & upgrade schemas
│   ├── familyStore.ts            # Member states linking user relations to cards
│   ├── pinStore.ts               # Setup, verify, lock timer, and cryptokey storage
│   └── uiStore.ts                # App drawer visibility and alert providers
│
├── next.config.ts                # Next.js configurations
├── tailwind.config.js            # Tailwind structure rules
├── tsconfig.json                 # Strict TypeScript configurations
└── package.json                  # Dependencies scripts references
```

---

## 🗺️ Pages & Screens

| Route / Screen | Mode | Description |
|-------|------|-------------|
| `/` | Client-Side Page | Root entry point containing PWA handlers and onboarding walkthrough checks |
| `HomeScreen` | Dash Screen | Pinned cards shelf, quick filters, bank categorization, search, and warning notifications |
| `AiScreen` | Advise Screen | Interactive streaming chat interface to compare benefits, search devaluations, and request payment advice |
| `StatsScreen` | Analytics Screen | Visual gauge meters tracking credit card limit utilizations and points-worth charts |
| `SettingsScreen`| Configuration | PIN modifiers, automatic security lock timeout intervals, and encrypted export/import file helpers |
| `/api/chat` | Server API Route | Streaming REST endpoint using Google GenAI to handle AI messages server-side |

---

## 🗄️ Database Schema

The IndexedDB database is handled locally via [db.ts](file:///Users/priyanshugupta/Coding-filles/next/family-wallet/store/db.ts):

### `cards` Table

| Field | Type | Description |
|--------|------|-------------|
| `id` | `String` | Unique random UUID |
| `bank` | `String` | Card provider bank name (indexed) |
| `variant` | `String` | Card tier/product variant |
| `type` | `String` | Category value (`Credit` or `Debit`, indexed) |
| `number` | `String (Encrypted)` | 16-digit credit card number |
| `expiry` | `String` | Date string (MM/YY) |
| `cvv` | `String (Encrypted)` | 3-digit CVV number |
| `holder` | `String (Encrypted)` | Full name printed on card |
| `network` | `String` | Issuer network brand (`Visa`, `Mastercard`, `Amex`, `RuPay`, indexed) |
| `color` | `String` | Hex/CSS styling code for credit card face |
| `limit` | `Number (Optional)` | Card total credit limit |
| `usedCredit` | `Number (Optional)` | Card currently utilized balance |
| `dueDateDay` | `Number (Optional)` | Numeric day of month for bill payment (1 - 31) |
| `isPinned` | `Boolean (Optional)` | Flag indicating card is pinned to the top favorite shelf |
| `rewardPoints` | `Number (Optional)` | Points balance accumulated on card |
| `pointValue` | `Number (Optional)` | Calculated cash value per point |
| `notes` | `String (Encrypted)` | User security details or benefits |
| `benefits` | `String[]` | List of manual perks added to the card |
| `addedAt` | `Number` | Creation timestamp |

### `family` Table

| Field | Type | Description |
|--------|------|-------------|
| `id` | `String` | Unique random UUID |
| `name` | `String` | Member display name (indexed) |
| `relation` | `String` | Relation type label (`Self`, `Spouse`, `Father`, `Mother`, etc., indexed) |
| `color` | `String` | Hex color tag matching member components |
| `addedAt` | `Number` | Creation timestamp |

---

## 🚀 Key Features

- **Master PIN Security System**: 3-strike lockout blocks (5 minutes) and configurable auto-lock timeout intervals.
- **Glassmorphic Interactive UI**: Realistic CSS-constructed card mockups featuring magnetic stripe overlays, chip icons, and active utilization gauges.
- **Smart Pinned Favorites Shelf**: Pinned card carousel displayed at the top of the dashboard for single-tap credentials access.
- **AI Card Advisor**: Leverages **Gemini 2.5 Flash** with Google Search Grounding to evaluate real-time bank deals, benefit changes, and lounge regulations.
- **Credit alerts**: Intelligent warning notices highlight high utilization ratios (>75%) and upcoming bill deadlines.
- **Multi-Member Wallet Sharing**: Easily label cards under different family members' names with quick tab filtering.
- **30-Second Clipboard Autoclear**: When copying card details or CVVs, clipboard content automatically wipes after 30 seconds for protection.
- **Encrypted Data Portability**: Full data migration using secure, password-protected JSON backup files.

---

## 🔑 Environment Variables

To run the AI advisor, create a `.env.local` file in the root folder:

```bash
# Gemini API Key (required for AI Card Advisor)
# Get your key at: https://aistudio.google.com/apikey
# IMPORTANT: Do NOT use NEXT_PUBLIC_ prefix — this key must stay server-side only
GEMINI_API_KEY=your_api_key_here
```

---

## 💻 Getting Started

### Prerequisites

- Node.js `>= 20.0`
- [Bun](https://bun.sh) (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/Priyanshu0007/family-wallet.git
cd family-wallet

# Install dependencies
bun install
# or
npm install

# Run the development server with Next.js Turbopack
bun dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) on your PWA-supported mobile browser or desktop browser to explore the vault app.

---

## 🎨 Design System

- **Glassmorphism Theme**: Uses deep backgrounds (`#0a0a0d`), dark surfaces (`#111115`), neon primary highlights (`#6c63ff`), and thin translucent boundaries (`#2a2a35`).
- **Typography Guidelines**:
  - Headings & Labels: Google Fonts `Sora` for readable, clean layout structures.
  - Numbers & Limits: Google Fonts `Space Mono` to alignment-align numeric card values.
- **Interactive Gestures**: Cards and list overlays utilize Framer Motion spring physics with hover scale ratios.
- **Responsive Layouts**: Fixed sidebar configuration for screens larger than `768px` which shifts into bottom navigation panels for mobile viewport devices.

---

**Built with ♥ by [Priyanshu Gupta](https://priyanshu0007.vercel.app)**

[![GitHub](https://img.shields.io/badge/GitHub-Priyanshu0007-181717?style=flat-square&logo=github)](https://github.com/Priyanshu0007)
[![Portfolio](https://img.shields.io/badge/Portfolio-Live-22c55e?style=flat-square&logo=vercel)](https://priyanshu0007.vercel.app)
