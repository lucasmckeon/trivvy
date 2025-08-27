> **Note:** This repository is a public showcase of select components and architecture from *Trivvy*, a real-time AI trivia platform. It does not include the full production codebase.

**Trivvy** is a real-time, AI-generated trivia web application designed for trivia lovers, learners, and anyone who enjoys friendly, low-stress competition. Leveraging advanced AI (LLMs), Trivvy generates trivia on virtually **any topic imaginable**, something previously impossible. Users can choose to play solo for personal enjoyment or go head-to-head against friends in real-time matches. Each question is time-sensitive, keeping the game dynamic and exciting. Beyond being just a trivia platform, Trivvy also fosters connections between users with shared interests—Taylor Swift enthusiasts, history buffs, or sports fans alike can discover like-minded players through their trivia passions. Ultimately, Trivvy offers an engaging, social, and endlessly fresh experience thanks to cutting-edge AI technology.
## Demo

🚀 **Try it live:** [https://www.trivvygame.com/](https://www.trivvygame.com/)

### Trivvy Demo: Instant AI Trivia Flow (Landing Page → Solo Gameplay)

**Watch on YouTube Shorts:** https://youtube.com/shorts/PeTi4K7Ayzo
<a href="https://youtube.com/shorts/PeTi4K7Ayzo?feature=share">
  <img src="https://img.youtube.com/vi/PeTi4K7Ayzo/hqdefault.jpg" alt="Trivvy Demo: Instant AI Trivia Flow (Landing Page → Solo Gameplay)" width="420">
</a>

*📺 Click the image above to watch a 60-second demo: anonymous user flow from landing page to solo gameplay.*

**What you’ll see:**
- Instant, AI-generated trivia with zero friction (no signup, no topic selection)
- Landing → Start Solo → Answer in real time → Results

---
### Trivvy Demo: Real-Time Multiplayer Flow (Login → Lobby → Game → Results)

**Watch on YouTube Shorts:** https://youtube.com/shorts/3QnJFppvM5Y
<a href="https://youtube.com/shorts/3QnJFppvM5Y?feature=share">
  <img src="https://img.youtube.com/vi/3QnJFppvM5Y/hqdefault.jpg" alt="Trivvy Demo: Real-Time Multiplayer Flow (Login → Lobby → Game → Results)" width="420">
</a>

*📺 Click the image above to watch a 60-second demo: full end-to-end multiplayer experience.*

**What you’ll see:**
- User login and lobby management
- AI-powered trivia generation
- Another player joins the lobby; real-time gameplay
- Results screen and game completion (coordination & state management under load)

## Motivation & Problem Statement

I built Trivvy because I recognized that real-time, on-demand trivia was an untapped market, especially with recent advancements in AI. Existing trivia apps are fun, but their questions quickly become repetitive since they rely heavily on manually created and recycled content.

Trivvy leverages AI technology to instantly and affordably generate trivia on any topic imaginable. This allows players to engage with fresh, personalized questions every time, whether playing alone or competing with friends. Beyond trivia enthusiasts, Trivvy also appeals to general game lovers and those looking to connect socially. By creating a relaxed, friendly gaming environment, it helps users discover shared interests, fostering connections in a uniquely stress-free way.

## Architecture & Technologies
### 1. "How It Works" Summary

**Trivvy** is built on Next.js, which manages UI rendering, routing, and combines server-side rendering with client-side interactivity. Users can seamlessly play solo games or join multiplayer lobbies, with secure authentication powered by **Auth.js**.

Real-time lobby management and peer discovery are enabled through **Pusher**, while direct player-to-player connections for synchronous gameplay utilize **WebRTC**. When trivia is requested, the **OpenAI API** instantly generates fresh questions and answers, which are securely stored in **Neon Postgres**. The UI is built with SCSS Modules and CSS variables for a consistent, polished experience. The application is hosted on **Vercel**, benefiting from fast deployment, global scalability, and built-in preview environments.

---
### 2. Architecture & Features

- **Stack & Rendering:** Next.js 15 (App Router) + React 18 + TypeScript for fast, type-safe UI.
    
- **Styling & Themes:** SCSS Modules with CSS variables for consistent light/dark, game-like polish.
    
- **Auth:** Auth.js with custom NextAuth + Neon adapter; anonymous→registered upgrades, credentials, magic link, codes.
    
- **Data:** Neon Postgres for users, lobbies, game state, results; strict types end-to-end.
    
- **Validation:** TypeScript + Zod for schema-validated requests, responses, and persisted models.
    
- **AI Generation:** OpenAI-powered trivia with instant start, streaming, **in-flight aborts**, and result validation.
    
- **Real-Time:** Pusher presence + lobby broadcasts for live state and instant UI updates.
    
- **Low-Latency PvP:** WebRTC peer-to-peer matches syncing timers, answers, and opponent interactions.
    
- **APIs & Actions:** Server Actions for authenticated in-app reads and writes tightly coupled to the UI; API Routes for streamable/long-running work and external clients.
    
- **Bot Protection:** Cloudflare Turnstile with invisible challenges guarding generation and gameplay endpoints.
    
- **Observability:** Sentry for error tracking, tracing, and performance monitoring.
    
- **Deployment:** Vercel CI/CD, global edge delivery, and per-branch preview deployments.
    
- **Core Modes:** Solo and multiplayer gameplay with dynamic topics and endless replayability.
    
- **UX & Access:** Responsive, accessible UI (semantic markup, focus states, keyboard navigation).

_Trivvy lets you explore endlessly fresh trivia alone or with friends, making learning and connecting fun, simple, and accessible to everyone._
## Developer Journey & Technical Challenges

### Challenge: Resolving a Complex Race Condition in Trivia Generation Status

**The Challenge:**  
If the host canceled a trivia generation (e.g., NBA), then immediately started a new one (e.g., NFL), network latency could cause out-of-order status updates. Players might see an outdated “cancelled” status after the new game had started, incorrectly resetting their UI to an idle state.

**What Made it Hard:**  
The bug was subtle and intermittent, caused by asynchronous events and ambiguous state tracking. Without unique identifiers for each generation, the client had no way to tell if an incoming status update was current or stale. Debugging was frustrating, as symptoms depended on precise timing.

**How I Solved It:**  
I introduced a unique `submissionId` for every trivia generation attempt. All status updates included this ID, and the client rejected any update whose ID didn’t match the current in-progress generation. I also added explicit error state handling (distinguishing failed generations from cancellations) and set up Sentry for error tracking and observability.

**Key Learnings:**
What this challenge really taught me is just how much I still have to learn as a developer. Before running into this issue, I felt pretty confident in my skills—after all, I could build features, wire up UIs, and handle most “normal” app logic. But getting stuck on race conditions, distributed state, and asynchronous event flows was honestly humbling and something that I needed.

I’ve started looking into more advanced tools and patterns, like XState and state charts, to help me level up. Ultimately, hitting this wall wasn’t just a technical lesson—it was a big push for me to keep growing and a reminder to be humble.

---
### Challenge: Implementing Custom Email/Password Authentication with Auth.js

**The Challenge:**  
Trivvy needed to support traditional email/password login, but Auth.js (NextAuth v5) is primarily designed for OAuth and passwordless flows, with little official support for custom credentials. I had to create my own secure provider for a feature that many users—especially older ones—still expect.

**What Made it Hard:**  
The hardest part was understanding how Auth.js’s internals worked: when and why each callback (`signIn`, `jwt`, `session`) was invoked, and how to safely handle JWT encoding/decoding, custom events, and session tokens. Documentation was limited, so most of my progress came from piecing together advice from scattered posts and reading source code. Debugging the authentication lifecycle required lots of trial and error.

**How I Solved It:**  
I implemented a custom Credentials provider using bcrypt for password hashing and integrated it with a custom Postgres adapter, along with customizing multiple callbacks and JWT handlers to manage sessions and data security.

**Key Learning:**  
Trying to implement custom flows that aren’t officially supported by a framework can be significantly harder than expected—even for something as “standard” as email/password login. Frameworks like Auth.js are opinionated, and choosing to go off the recommended path means you need to deeply understand their inner workings. The needs of your app should drive which framework you pick, and you should always weigh the cost of custom solutions versus going with the default patterns.

---
### Challenge: Incorrect Lobby Status for Late Joiners During Trivia Generation

**The Challenge:**  
When the host started generating trivia with no one else in the lobby, and a guest joined mid-generation, the guest would often see an incorrect lobby state (e.g., “NBA trivia is generated”) even though generation wasn’t finished. This persisted despite prior refactors and highlighted a flaw in how initial lobby `status` and `topic` were derived and communicated.

**What Made it Hard:**  
I was combining `topicRef.current` (current generation) and `triviaInfoRef.current.title` (previous trivia), then using this derived `title` to determine status across host, server, and player logic. The player lobby’s branching logic simply set status to `'generated'` if a title was present, ignoring the case where generation was still in progress. The real issue was a lack of a **single source of truth**, with scattered state and ambiguous logic across multiple locations. Debugging was difficult due to the subtle interplay of three refs and poor visibility into which part was wrong.

**How I Solved It:**  
I created a centralized classifier function, `deriveTopicAndStatus()`, which returns the correct status and topic from all relevant refs. This function made the host lobby the single source of truth, the server a pure relay, and the player lobby a simple consumer of explicit status and topic values. By explicitly distinguishing between “generating,” “generated,” and “waiting,” I eliminated hidden edge cases and subtle bugs.

**Key Learnings:**
What I took away from this is the importance of having a _single source of truth_—and making sure that source is both correct and complete. It’s not enough to just centralize state; I also have to ensure that what’s sent from that source contains everything the consumers need, without making them guess or infer related states.

In my case, I realized the host lobby should always send both the title and status together, since those values are tightly linked and reflect the host’s current reality—not the player’s, and not whatever the server might try to reconstruct. Letting consumers derive state from partial or implicit data is an anti-pattern that causes subtle bugs and confusion.

From now on, I’ll make sure that any “source of truth” actually tells the whole story, so every part of the app stays in sync and doesn’t have to make assumptions.

## Design Decisions & Trade-Offs

**Pusher for Real-Time Signaling**  
I chose Pusher as my signaling server because it’s a mature, widely adopted service with built-in features like presence channels. My use case (signaling for WebRTC connections) doesn’t generate heavy traffic, so I don’t expect to exceed the free tier. Pusher’s stability and ease of setup allowed me to focus on game logic instead of managing my own WebSocket server.

**Next.js 15 App Router and Server Actions**  
I adopted Next.js 15 with the App Router because it’s the modern standard for React apps and offers native support for server actions. This enables fast server-side rendering, streaming HTML for snappy initial loads, and support for skeleton UI states. I value the performance and flexibility this pattern provides, especially for building scalable apps with rich real-time updates.

**Email and Password Authentication**  
Despite trends toward social logins or passwordless auth, my research showed most users (especially older ones) still prefer traditional email/password sign-in. Supporting this familiar flow ensures Trivvy is accessible to the widest possible audience, even if it requires more custom code.

**SCSS Modules & Custom Theming**  
I went with SCSS Modules and custom CSS variables for theming because I already have a strong foundation in vanilla CSS and SCSS. This let me move quickly without learning a design system like Tailwind, Chakra, or MUI. For future projects, I’m open to adopting a component library or utility-first framework if needed, but I wanted to master the fundamentals first.

**Vercel for Hosting & Deployment**  
Vercel’s seamless integration with Next.js made it the obvious choice for hosting. The free tier covers my needs, deployments are simple, and their edge network ensures fast load times. If the project ever outgrows the free plan, I would consider other providers and weigh cost versus scalability.

**Custom Credentials Provider vs. Auth Services**  
I built my own credentials provider (email/password) because it matched my skills and comfort level, and allowed me to get auth working quickly. While managed solutions like Clerk or Auth0 are robust, I prioritized hands-on experience with the basics. If scaling or advanced auth requirements become a priority, I’d re-evaluate using a third-party provider.

## Testing & Quality

Trivvy was primarily tested through extensive manual usage. I verified all critical user flows—solo and multiplayer games, authentication, lobby states, and error scenarios—by running the app in different browsers and on mobile devices. I also leveraged ChatGPT to “mentally” model state transitions and identify edge cases, effectively stress-testing the logic with a state machine approach.

At this stage, I haven’t implemented automated tests, as my main focus was on building and deploying a real-world full stack application. However, I’m eager to adopt automated testing practices in the future and am comfortable learning whatever tools (unit, integration, or E2E) are used by the teams I join.

## Future Roadmap

- **Expand Multiplayer:** Support more than two players per game. This is the most requested feature based on user feedback.
    
- **Timing-Based Tiebreakers:** Add a system where, if players tie on correct answers, the winner is determined by who answered fastest overall.
    
- **Advanced State Management:** Experiment with libraries like XState to manage complex, real-time state flows more reliably.
    
- **End-to-End Testing:** Add automated E2E tests to further improve quality and reliability.
    

Trivvy was created as a capstone project to showcase my full stack development skills and demonstrate that I’m ready to join a team and contribute productively from day one. I am not actively building new features.
## Contact

If you’d like to connect, discuss Trivvy, or learn more about my work, feel free to reach out:

- **LinkedIn:** https://www.linkedin.com/in/lucas-mckeon/
    
- **GitHub:** https://github.com/lucasmckeon
    
- **Email:** lucas.mckeon.dev@gmail.com

_I’m always open to connecting with other developers, recruiters, and anyone interested in building great products!_