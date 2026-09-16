# NSARly

> **Attendance Management & Timetable System**
> Built for students to track attendance and maintain subject target compliance.

---

## Overview

**NSARly** is a React Native application (Expo SDK 57) designed to solve attendance tracking challenges for college students. The application evaluates attendance **per subject**, handles elective course choices, aggregates tutorial classes into parent theory subjects, and enforces semester start date boundaries.

---

## Key Features

* **Per-Subject Target Engine**
  * Evaluates attendance individually per subject.
  * Calculates safe-to-miss and required recovery counts per subject and flags overall status (SAFE, AT_RISK, SHORTAGE).

* **Elective Course Choice Selector**
  * Supports elective groups (e.g., choosing 1 course out of Advanced Algorithms vs Natural Language Processing).
  * Excludes unselected elective courses from weekly schedules, occurrence logs, and percentage calculations.

* **Combined Tutorial Class Aggregation**
  * Automatically links tutorial classes to parent theory subjects.
  * Combines attended and conducted counts without duplicating subjects in the interface.

* **Custom Timetable Builder**
  * Add, edit, or delete custom weekly class slots.
  * Start a custom timetable from scratch or restore default college published schedules.

* **Start Date Boundary & Backfill**
  * Prevents occurrence generation prior to the official college start date.
  * Allows recording mid-semester untracked previous attendance counts.

* **Reminders & Notifications**
  * Integrated inside Settings tab.
  * Create class-linked or custom date-time reminders with optional device push notifications.

---

## Technology Stack

* **Framework**: React Native (Expo SDK 57 / Expo Router v4)
* **Language**: TypeScript
* **State & Persistence**: `@react-native-async-storage/async-storage` + Firebase Auth & Firestore
* **Icons**: `lucide-react-native`
* **Testing**: Jest (`npx jest`)

---

## Setup & Running

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

## Testing & Verification

```bash
# Run TypeScript typecheck
npx tsc --noEmit

# Run Jest unit test suite
npx jest

# Export web production bundle
EXPO_NO_TELEMETRY=1 npx expo export --platform web
```

---

## License
MIT License © 2026 NSARly Project.
