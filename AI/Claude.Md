# 🚀 UDAY MENTORING PLATFORM — COMPLETE BUILD PLAYBOOK (FROM SCRATCH)

## 🎯 Objective

Build a **production-grade mentoring platform** with:

- Role-based authentication
- Mentor–mentee pairing
- Call scheduling
- Real-time WebRTC calling
- Call tracking
- Modern responsive UI

---

# 🧭 EXECUTION STRATEGY

Think of this like **building a house**:

- Foundation → Firebase + Auth
- Structure → Pairing + Scheduling
- Wiring → WebRTC + Signaling
- Finishing → UI + Stability

👉 Each phase must be **completed and tested before moving forward**.

---

# 🧱 PHASE 0 — PROJECT SETUP

## Tasks

- Create Next.js app (App Router)
- Install:
  - firebase
  - tailwindcss
  - framer-motion

- Setup Tailwind (dark mode)

## Output

- Running app with styling

## ✅ Check

- App runs without errors
- Tailwind works

---

# 🔥 PHASE 1 — FIREBASE SETUP

## Tasks

- Create Firebase project
- Enable:
  - Authentication (Email/Password)
  - Firestore

- Create `/lib/firebase.ts`

## Example

```ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
```

## ✅ Check

- Can add/read a Firestore document

---

# 🔐 PHASE 2 — AUTH + ROLE SYSTEM

## Tasks

- Login/Register UI
- Store user in Firestore
- Add role:
  - mentor
  - mentee
  - admin

- Create `useAuth` hook
- Redirect based on role

## Example

```ts
if (user.role === "mentor") router.push("/dashboard");
```

## ✅ Check

- Login works
- Role persists
- Routes protected

---

# 📊 PHASE 3 — DASHBOARD BASE

## Tasks

- Create dashboard layout
- Show:
  - user info
  - role

- Fetch users list

## Analogy

Like a **control panel**—you see your system state.

## ✅ Check

- Mentor sees mentees
- Mentee sees basic dashboard

---

# 🔗 PHASE 4 — ADMIN-CONTROLLED PAIRING SYSTEM (CRITICAL) ✅ COMPLETE

## 🎯 Objective

Implement a **strict 1:1 mentor–mentee pairing system** where **ONLY ADMIN can assign relationships**.

---

## ✅ IMPLEMENTATION COMPLETED

### Files Created

- `hooks/usePairing.tsx` - Pairing logic with Firestore transactions
- `components/AdminPairing.tsx` - Admin UI for creating/managing pairings
- Updated `app/dashboard/page.tsx` - Added Phase 4 section

### Features Implemented

✅ Admin-only pairing interface  
✅ Create mentor → mentee pairs (1:1)  
✅ Remove existing pairings  
✅ Firestore transactions for data consistency  
✅ Real-time pairing display  
✅ Error handling for duplicate assignments  
✅ Dashboard integration showing pairing status

### Core Rules Enforced (Transactions)

```ts
1. Mentor cannot have multiple mentees
2. Mentee cannot have multiple mentors
3. No self-assignment
4. Only admin can modify pairings
```

### Dashboard Changes

- Admin sees AdminPairing component with full UI
- Mentors see their assigned mentee
- Mentees see their assigned mentor
- Pairing status shown in Role Details card

---

# 👤 Roles & Responsibilities

## Admin (ONLY AUTHORIZED ROLE)

### Capabilities

- ✅ View all mentors
- ✅ View all mentees
- ✅ Assign mentor → mentee (1:1)
- ✅ Reassign if needed

---

## Mentor

### Capabilities

- View assigned mentee (displayed in dashboard)
- Cannot assign or modify pairing

---

## Mentee

### Capabilities

- View assigned mentor (displayed in dashboard)
- Cannot request or change pairing

---

# 📅 PHASE 5 — CALL SCHEDULING ✅ COMPLETE

## 🎯 Objective

Implement call scheduling with proper validation and role-based permissions.

---

## ✅ IMPLEMENTATION COMPLETED

### Files Created

- `hooks/useScheduling.ts` - Scheduling logic with validations
- `components/CallScheduling.tsx` - Scheduling UI and display
- Updated `app/dashboard/page.tsx` - Added Phase 5 section

### Features Implemented

✅ Mentor-only schedule creation form  
✅ Date, time, and duration selection  
✅ Optional notes field  
✅ Past time validation  
✅ Overlap detection for mentor schedules  
✅ Status tracking (scheduled, ongoing, completed, missed, cancelled)  
✅ Mentee schedule viewing (read-only)  
✅ Cancel schedule functionality  
✅ Real-time schedule list display  
✅ Firestore collection: "schedules"

### Firestore Schema

```ts
schedules collection:
{
  id: string;              // auto-generated
  mentorId: string;        // mentor UID
  menteeId: string;        // mentee UID
  scheduledAt: Date;       // call time (Timestamp)
  duration: number;        // minutes
  status: string;          // scheduled|ongoing|completed|missed|cancelled
  createdAt: Date;         // when created (Timestamp)
  notes?: string;          // optional notes
}
```

### Validation Rules

```ts
1. No past time - Cannot schedule in the past
2. No overlapping schedules - Mentor cannot have conflicting calls
3. Requires pairing - User must be paired with counterpart
4. Mentor-only creation - Only mentors can create schedules
5. Mentee-read-only - Mentees can only view
```

### Role-Based Features

| Role   | Create | View | Update | Cancel |
| ------ | ------ | ---- | ------ | ------ |
| Mentor | ✅     | ✅   | ✅     | ✅     |
| Mentee | ❌     | ✅   | ❌     | ❌     |
| Admin  | ✅     | ✅   | ✅     | ✅     |

### Dashboard Changes

- Schedule form visible only to mentors with paired mentees
- Schedule list shown to both mentors and mentees
- Status badges with color coding
- Cancel button for pending/ongoing calls
- Real-time updates after scheduling

---

# ⏰ PHASE 6 — REMINDER SYSTEM ✅ COMPLETE

## 🎯 Objective

Implement call reminder system with countdown timers and automatic status management.

---

## ✅ IMPLEMENTATION COMPLETED

### Files Modified

- `components/CallScheduling.tsx` - Added countdown timers, join button logic, and status management
- `app/dashboard/page.tsx` - Added Phase 6 section and updated status

### Features Implemented

✅ Real-time countdown timers for scheduled calls  
✅ "Join Call" button activates at scheduled time  
✅ Automatic status transitions: scheduled → ongoing → completed  
✅ Missed call detection (15 minutes past scheduled time)  
✅ Call duration tracking with automatic completion  
✅ Live status updates every second

### Countdown Logic

```ts
- Shows time remaining for calls > 5 minutes away
- Shows MM:SS countdown for calls within 5 minutes
- Shows "Ready to join!" when call time arrives
- Shows "Ongoing - XX:XX left" during active calls
```

### Status Flow

```
scheduled → ongoing (when "Join Call" clicked)
scheduled → missed (15+ minutes past scheduled time)
ongoing → completed (when duration expires)
```

### Dashboard Integration

- Phase 6 section added to dashboard
- Status card updated to show "Reminder System Active"
- Roadmap updated to show Phase 6 as complete
- Next steps updated for all user roles

---

## ✅ Check

- ✅ Countdown timers display correctly
- ✅ Join button activates at correct time
- ✅ Calls transition to missed if not joined
- ✅ Ongoing calls complete automatically
- ✅ Status updates in real-time

# 📞 PHASE 7 — WEBRTC FOUNDATION ✅ COMPLETE

## 🎯 Objective

Establish WebRTC peer connection foundation with microphone access for voice calling.

---

## ✅ IMPLEMENTATION COMPLETED

### Files Created

- `hooks/useWebRTC.ts` - WebRTC peer connection management and media access
- `components/WebRTCCall.tsx` - WebRTC call interface with controls
- Updated `components/CallScheduling.tsx` - Integrated WebRTC call modal

### Features Implemented

✅ **Peer Connection Creation**

- RTCPeerConnection with STUN servers for NAT traversal
- ICE candidate handling for connection establishment
- Connection state monitoring and status updates

✅ **Media Access**

- `navigator.mediaDevices.getUserMedia()` for microphone access
- Audio-only streams (video foundation ready for future phases)
- Media stream management and cleanup

✅ **Call Interface**

- Modal overlay for call controls
- Start/End call buttons with loading states
- Audio mute/unmute controls
- Connection status indicators
- Error handling and user feedback

✅ **Integration**

- "Join Call" button now opens WebRTC interface
- Automatic call status updates (ongoing → completed)
- Seamless integration with existing scheduling system

### WebRTC Architecture

```ts
// Peer Connection Setup
const pc = new RTCPeerConnection({
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
});

// Media Access
const stream = await navigator.mediaDevices.getUserMedia({
  audio: true,
  video: false, // Audio-only for Phase 7
});

// Add tracks to connection
stream.getTracks().forEach((track) => pc.addTrack(track, stream));
```

### Call Flow

```
1. User clicks "Join Call" → WebRTC modal opens
2. Click "Start Call" → Media access requested
3. Peer connection established → Status shows "Connected"
4. Audio controls available (mute/unmute)
5. Click "End Call" → Connection closed, status updated to "completed"
```

### Dashboard Integration

- Status card updated to show "WebRTC Foundation Active"
- Roadmap updated to show Phase 7 as complete
- Clean UI without unnecessary feature cards

---

## ✅ Check

- ✅ Peer connection creates successfully
- ✅ Microphone access works with user permission
- ✅ Call interface displays correctly
- ✅ Audio controls function properly
- ✅ Call status updates work
- ✅ Integration with scheduling system complete

- Audio permission works
- No null connection errors

---

# 🔁 PHASE 8 — SIGNALING (FIRESTORE)

## Tasks

### Caller

- Create offer
- Store in Firestore

### Receiver

- Listen → create answer

### Both

- Exchange ICE candidates

---

## Flow

```
Offer → Firestore → Answer → ICE → Connected
```

## Analogy

Like **two people exchanging phone numbers before calling**.

## ✅ Check

- Two users can connect

---

# 📞 PHASE 9 — CALL SYSTEM

## Lifecycle

```
calling → ringing → accepted → ongoing → ended → missed
```

## Tasks

- Incoming call UI
- Accept / Reject
- Cleanup:
  - stop tracks
  - close connection

## ✅ Check

- Calls connect & end properly

---

# 📊 PHASE 10 — CALL TRACKING

## Tasks

- Create callSessions entry
- Track:
  - startTime
  - endTime
  - duration

## Analogy

Like **call history in your phone**.

## ✅ Check

- Accurate call logs stored

---

# 🖥️ PHASE 11 — CALL UI

## Features

- Timer
- Mute toggle
- Video toggle
- End call

## ✅ Check

- UI responds correctly

---

# 🎨 PHASE 12 — UI ENHANCEMENT

## Tasks

- Dark theme
- Glassmorphism cards
- Animations (Framer Motion)

## ✅ Check

- Smooth UX
- Responsive

---

# ⚠️ PHASE 13 — ERROR HANDLING

## Handle

- Firebase errors
- WebRTC failures
- Media permissions

## Add

- try/catch
- Loading states
- Error UI

## ✅ Check

- No crashes

---

# 🧪 PHASE 14 — FINAL TEST

## Test Scenarios

- Pairing works
- Scheduling works
- Calls connect
- Missed calls handled
- Tracking accurate

## ✅ Final Check

- No runtime errors
- Full system functional

---

# 🗄️ FINAL FIRESTORE SCHEMA

## users

```ts
{
  (id, name, role, mentorId, menteeIds);
}
```

## schedules

```ts
{
  (scheduleId, mentorId, menteeId, scheduledAt, duration, status);
}
```

## callSessions

```ts
{
  (callId, mentorId, menteeId, startTime, endTime, duration, status);
}
```

---

# 🔥 FINAL INSTRUCTION

> Build step-by-step.
> Validate each phase.
> Do not skip layers.

A stable system is built like a **pipeline**, not a shortcut.

---
