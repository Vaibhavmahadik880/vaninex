<context>
You are working on a Next.js + Firebase (Auth + Firestore) application for an NGO mentoring platform called "Uday".

Current status:

* Authentication is implemented
* Role-based login exists (mentor, mentee, admin)
* Basic UI exists

Missing features:

* Mentor cannot assign mentees
* No pairing system
* No video/audio calling integration
* App is not yet fully functional end-to-end

Your task is to complete the application so that it becomes fully functional. </context>

---

<tasks>

1. Mentor–Mentee Pairing System (CRITICAL)

Implement a pairing system:

* Mentor should be able to:

  * View list of mentees
  * Assign one or multiple mentees
  * See assigned mentees

* Mentee should:

  * See their assigned mentor

Firestore structure:

users/

* id
* name
* role (mentor | mentee | admin)
* mentorId (for mentee)
* menteeIds (for mentor)

Ensure:

* Proper updates on assignment
* No duplicate assignments
* Real-time updates using Firestore

---

2. Call System (WebRTC Integration)

Implement full calling system:

* Features:

  * Start call (mentor → mentee)
  * Incoming call (ringing UI)
  * Accept / Reject
  * Audio-first (video optional toggle)

* Call lifecycle:
  calling → ringing → accepted → ongoing → ended → missed

* Use:

  * WebRTC for peer-to-peer connection
  * Firebase Firestore for signaling

* Handle:

  * ICE candidates
  * Offer/Answer exchange
  * Proper cleanup (stop tracks, close connection)

---

3. Call Tracking (IMPORTANT)

Store each call session:

callSessions/

* callId
* mentorId
* menteeId
* startTime
* endTime
* duration
* status (completed | missed)
* createdAt

---

4. UI Flow (End-to-End)

Mentor:

* Dashboard → see mentees → click “Call”
* Call screen with controls

Mentee:

* Dashboard → see mentor
* Incoming call popup
* Accept / Reject

Include:

* Call timer
* Mute toggle
* Video toggle (optional)

---

5. Fix Existing Errors

Before adding features:

* Fix:

  * Firebase auth/config errors
  * WebRTC null PeerConnection issues
  * media permission errors
  * async issues (useEffect timing)

* Add:

  * try/catch for async operations
  * safe Firestore reads (check exists)
  * proper error UI

---

6. UI Enhancement (Modern Look)

Upgrade UI to modern design:

* Dark theme
* Tailwind CSS
* Framer Motion animations

Include:

* Clean dashboard layout
* Glassmorphism cards
* Smooth transitions
* Responsive design

---

7. Code Quality

* Organize into:

  * components/
  * lib/
  * hooks/
  * app/

* Keep code clean and modular

* Avoid unnecessary complexity

---

<output_format>

Provide:

* Updated Firestore schema
* Key components (pairing + call system)
* Working WebRTC integration code
* Updated dashboard pages
* Explanation of data flow

Ensure the app becomes fully functional end-to-end.
</output_format>
