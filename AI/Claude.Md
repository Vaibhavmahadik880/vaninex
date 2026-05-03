# 🚀 UDAY MENTORING PLATFORM — COMPLETE BUILD PLAYBOOK (FROM SCRATCH)

## 🎯 Objective

Build a **production-grade mentoring platform** with:

* Role-based authentication
* Mentor–mentee pairing
* Call scheduling
* Real-time WebRTC calling
* Call tracking
* Modern responsive UI

---

# 🧭 EXECUTION STRATEGY

Think of this like **building a house**:

* Foundation → Firebase + Auth
* Structure → Pairing + Scheduling
* Wiring → WebRTC + Signaling
* Finishing → UI + Stability

👉 Each phase must be **completed and tested before moving forward**.

---

# 🧱 PHASE 0 — PROJECT SETUP

## Tasks

* Create Next.js app (App Router)
* Install:

  * firebase
  * tailwindcss
  * framer-motion
* Setup Tailwind (dark mode)

## Output

* Running app with styling

## ✅ Check

* App runs without errors
* Tailwind works

---

# 🔥 PHASE 1 — FIREBASE SETUP

## Tasks

* Create Firebase project
* Enable:

  * Authentication (Email/Password)
  * Firestore
* Create `/lib/firebase.ts`

## Example

```ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
```

## ✅ Check

* Can add/read a Firestore document

---

# 🔐 PHASE 2 — AUTH + ROLE SYSTEM

## Tasks

* Login/Register UI
* Store user in Firestore
* Add role:

  * mentor
  * mentee
  * admin
* Create `useAuth` hook
* Redirect based on role

## Example

```ts
if(user.role === "mentor") router.push("/dashboard");
```

## ✅ Check

* Login works
* Role persists
* Routes protected

---

# 📊 PHASE 3 — DASHBOARD BASE

## Tasks

* Create dashboard layout
* Show:

  * user info
  * role
* Fetch users list

## Analogy

Like a **control panel**—you see your system state.

## ✅ Check

* Mentor sees mentees
* Mentee sees basic dashboard

---

# 🔗 PHASE 4 — ADMIN-CONTROLLED PAIRING SYSTEM (CRITICAL)

## 🎯 Objective
Implement a **strict 1:1 mentor–mentee pairing system** where **ONLY ADMIN can assign relationships**.

---

# 👤 Roles & Responsibilities

## Admin (ONLY AUTHORIZED ROLE)

### Capabilities
- View all mentors
- View all mentees
- Assign mentor → mentee (1:1)
- Reassign if needed

---

## Mentor

### Capabilities
- View assigned mentee ONLY
- Cannot assign or modify pairing

---

## Mentee

### Capabilities
- View assigned mentor ONLY
- Cannot request or change pairing

---

# ⚠️ CORE RULES (STRICT)

- One mentor → one mentee
- One mentee → one mentor
- No duplicate assignments
- No self-assignment
- Only admin can write pairing data

---

# 🧠 DATA CONSISTENCY LOGIC (MANDATORY)

Use **Firestore Transaction** to ensure atomic updates:

```ts
// Transaction Logic

1. Check mentor already has mentee?
   → if yes, block

2. Check mentee already has mentor?
   → if yes, block

3. Update mentor:
   menteeIds = [menteeId]

4. Update mentee:
   mentorId = mentorId

# 📅 PHASE 5 — CALL SCHEDULING

## Tasks

* Create schedule form:

  * Date
  * Time
  * Duration

### Mentor

* Schedule call
* Cancel / Reschedule

### Mentee

* View schedules

---

## Firestore Schema

```ts
{
  mentorId,
  menteeId,
  scheduledAt,
  duration,
  status
}
```

---

## Rules

* No past time
* No overlapping schedules

## Analogy

Like **booking a meeting room**—time must be valid and free.

## ✅ Check

* Schedule visible to both users instantly

---

# ⏰ PHASE 6 — REMINDER SYSTEM

## Tasks

* Countdown timer
* Enable "Join Call" button at correct time
* Mark missed if not joined

## Flow

```
scheduled → ongoing → completed
scheduled → missed
```

## ✅ Check

* Join button activates correctly

---

# 📞 PHASE 7 — WEBRTC FOUNDATION

## Tasks

* Create peer connection
* Get microphone access

## Example

```ts
navigator.mediaDevices.getUserMedia({ audio: true })
```

## Analogy

Like **opening a communication channel** before speaking.

## ✅ Check

* Audio permission works
* No null connection errors

---

# 🔁 PHASE 8 — SIGNALING (FIRESTORE)

## Tasks

### Caller

* Create offer
* Store in Firestore

### Receiver

* Listen → create answer

### Both

* Exchange ICE candidates

---

## Flow

```
Offer → Firestore → Answer → ICE → Connected
```

## Analogy

Like **two people exchanging phone numbers before calling**.

## ✅ Check

* Two users can connect

---

# 📞 PHASE 9 — CALL SYSTEM

## Lifecycle

```
calling → ringing → accepted → ongoing → ended → missed
```

## Tasks

* Incoming call UI
* Accept / Reject
* Cleanup:

  * stop tracks
  * close connection

## ✅ Check

* Calls connect & end properly

---

# 📊 PHASE 10 — CALL TRACKING

## Tasks

* Create callSessions entry
* Track:

  * startTime
  * endTime
  * duration

## Analogy

Like **call history in your phone**.

## ✅ Check

* Accurate call logs stored

---

# 🖥️ PHASE 11 — CALL UI

## Features

* Timer
* Mute toggle
* Video toggle
* End call

## ✅ Check

* UI responds correctly

---

# 🎨 PHASE 12 — UI ENHANCEMENT

## Tasks

* Dark theme
* Glassmorphism cards
* Animations (Framer Motion)

## ✅ Check

* Smooth UX
* Responsive

---

# ⚠️ PHASE 13 — ERROR HANDLING

## Handle

* Firebase errors
* WebRTC failures
* Media permissions

## Add

* try/catch
* Loading states
* Error UI

## ✅ Check

* No crashes

---

# 🧪 PHASE 14 — FINAL TEST

## Test Scenarios

* Pairing works
* Scheduling works
* Calls connect
* Missed calls handled
* Tracking accurate

## ✅ Final Check

* No runtime errors
* Full system functional

---

# 🗄️ FINAL FIRESTORE SCHEMA

## users

```ts
{
  id,
  name,
  role,
  mentorId,
  menteeIds
}
```

## schedules

```ts
{
  scheduleId,
  mentorId,
  menteeId,
  scheduledAt,
  duration,
  status
}
```

## callSessions

```ts
{
  callId,
  mentorId,
  menteeId,
  startTime,
  endTime,
  duration,
  status
}
```

---

# 🔥 FINAL INSTRUCTION

> Build step-by-step.
> Validate each phase.
> Do not skip layers.

A stable system is built like a **pipeline**, not a shortcut.

---
