# NSARly ⚡

> **Anti-Attendance Shortage & Timetable Intelligence App**
> Built for students to track, predict, and guarantee 75% per-subject attendance compliance.

---

## 🚀 Overview

**NSARly** is a high-contrast, brutalist-kinetic React Native application (Expo SDK 57) designed to solve the real-world attendance tracking challenges faced by college students. Unlike generic attendance trackers that average attendance across all subjects combined, NSARly enforces **strict per-subject 75% target evaluation**, handles complex elective course choices, aggregates tutorial classes into parent theory subjects, and respects official college semester start date boundaries.

---

## ✨ Key Features

* 🎯 **Strict 75% Per-Subject Target Engine**
  * Evaluates attendance **individually per subject** (preventing shortage in one subject from being masked by 100% in another).
  * Dynamically calculates `Safe To Miss` and `Classes Needed To Recover` per subject and flags overall status (`SAFE`, `AT_RISK`, `SHORTAGE`).

* 🔀 **Elective Course Choice Selector**
  * Supports elective groups (e.g., choosing 1 course out of *Advanced Algorithms* vs *Natural Language Processing*).
  * Automatically filters out unselected elective courses from weekly schedules, occurrence logs, and percentage calculations.

* 📚 **Combined Tutorial Class Aggregation**
  * Automatically links tutorial classes (e.g., `22CS52T TOC Tutorial`) directly to parent theory subjects (`22CS52 Theory of Computation`).
  * Combines attended/conducted counts without cluttering the UI with redundant standalone subjects.

* 📅 **Custom Timetable Builder & Management**
  * Easily add, edit, or delete custom weekly class slots.
  * Start a blank custom timetable from scratch or restore published college seeds (e.g., RVCE 5th Sem CSE).

* ⏳ **College Start Date Boundary & Past Backfill**
  * Blocks occurrence generation and navigation prior to the official college start date.
  * Allows recording mid-semester untracked previous attendance counts for instant accuracy.

* 🔔 **Smart Reminders & Push Notifications**
  * Integrated inside **Settings** tab.
  * Create class-linked or custom date-time reminders with optional device push notifications.

---

## 🛠️ Technology Stack

* **Framework**: React Native (Expo SDK 57 / Expo Router v4)
* **Language**: TypeScript
* **State & Persistence**: `@react-native-async-storage/async-storage` + Firebase Auth & Firestore
* **Design System**: Brutalist-Kinetic aesthetic (`COLORS.acidYellow`, `KineticCard`, `KineticText`)
* **Icons**: `lucide-react-native`
* **Testing**: Jest (`npx jest`)

---

## ⚙️ Getting Started

### Prerequisites
* Node.js (v18+)
* npm or yarn
* Expo Go app or Android / iOS Emulator

### Installation

```bash
# Clone repository
git clone git@github.com:vaibhav-rm/NSARly.git
cd NSARly

# Install dependencies
npm install

# Start development server
npx expo start
```

---

## 🧪 Testing & Verification

```bash
# Run TypeScript typecheck
npx tsc --noEmit

# Run Jest unit test suite
npx jest

# Export web production bundle
EXPO_NO_TELEMETRY=1 npx expo export --platform web
```

---

## 📄 License
MIT License © 2026 NSARly Project.
