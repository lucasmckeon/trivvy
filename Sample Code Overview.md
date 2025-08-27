## 🧠 Sample Code Overview

Below are curated source files from the **solo game mode** in Trivvy. These files demonstrate how anonymous users can instantly play an AI-generated trivia game — with a focus on fast gameplay, robust async coordination, and real-time UX.

These files are **not runnable standalone**, but they represent real production logic from a full-stack Next.js app using App Router, TypeScript, SCSS Modules, and server actions.

---

### 📁 `page.tsx`
**What it does:**  
This is the Next.js App Router route for the `/solo-game` page. On first load:
- Verifies that the user passed the CAPTCHA (Turnstile).
- Creates an anonymous account for their IP (if one doesn’t already exist).
- Redirects them into the Solo Game experience.

> 🔐 Uses server actions, anonymous auth, and anti-bot protection.

---

### 📁 `solo-game.tsx`
**What it does:**  
Main React component for the solo game experience. It:
- Automatically generates trivia when the user arrives.
- Starts the game once questions are ready.
- Manages local game state and passes data down to the UI.

> 🎮 Core gameplay logic lives here: generation + orchestration.

---

### 📁 `SoloTriviaQuestionnaire.tsx`
**What it does:**  
Handles the actual in-game trivia experience:
- 5-second countdown before the game begins.
- Automatically advances to the next question after each answer.
- Strict time limit per question — if unanswered in time, it’s marked wrong.

> ⏱️ Tight control over game pacing and feedback.

---

### 📁 `TriviaQuestionDesktop.tsx`
**What it does:**  
Renders a single trivia question optimized for desktop play:
- Shows the question and answer options.
- Allows **keyboard input**: 1, 2, 3, 4 keys trigger answers instantly.
- Shows visual feedback for correct/wrong selections.

> 🎯 Designed for fast-paced play with keyboard shortcut support.

---

### 📁 `useSoloTriviaGeneration.ts`
**What it does:**  
Custom React hook that powers trivia generation logic:
- Validates input (topic, number of questions, submission ID).
- Sends a POST request to `/api/trivia/generate-solo`.
- Exposes detailed async state: `isGenerating`, `isCancelling`, `isAborted`, `error`, `trivia`.

> 🔄 Manages race conditions using submission IDs and cancels previous requests if needed.

---

### 🧩 Diagram: High-Level Flow

```plaintext
page.tsx (Next.js route)
   ↓
<SoloGame />
   ├── useSoloTriviaGeneration()
   └── <SoloTriviaQuestionnaire />
           └── <TriviaQuestionDesktop />
```

---

### 📁 Sample Server Actions

In addition to the solo game frontend, this repo includes a few representative **server actions** used elsewhere in Trivvy to illustrate full-stack capability:

- `isAuthenticatedUser` → Checks whether a valid session exists.  
- `getAuthenticatedUserId` / `getAuthenticatedUserIdOrNull` → Retrieves the logged-in user’s ID safely.  
- `isHost` → Verifies whether a user is the host of a given lobby.  

These actions are not directly tied to solo mode, but they show how Trivvy enforces authentication and authorization in multiplayer flows.
