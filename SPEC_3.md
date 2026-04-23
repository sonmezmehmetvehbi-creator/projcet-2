# StudySpark — Product Specification

> **Version:** 1.4 (living document — edit freely as the project evolves)  
> **Last updated:** April 2026  
> **Stack:** Next.js 14 · Supabase · Anthropic API (Claude) · Stripe · Vercel

---

## 1. Overview

**StudySpark** is an AI-powered study companion for students of all grade levels (K–12 and college). A student enters their subject, grade, and topic, and the app generates either:

- **Interactive Questions** — multiple choice and free response, fully solvable in-browser, with instant AI-powered feedback
- **Visual Worksheets** — structured, step-by-step study sheets with visuals, explanations, a summary, and practice problems

Everything is printable / downloadable as a clean PDF.

### Core Goals
- Make studying active, not passive
- Give students instant, encouraging, explanation-based feedback
- Support every subject and grade level (K–5, 6–8, 9–12, College) in English
- Require accounts so every session is saved and revisitable from a personal dashboard
- Offer a free tier with daily limits and a Premium tier ($5.99/mo) for unlimited access

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 14 (App Router) | UI, routing, server components |
| Styling | Tailwind CSS | Utility-first styling |
| Backend | Next.js API Routes | AI calls, PDF generation, billing |
| Database | Supabase (PostgreSQL) | Sessions, saved work, user accounts, usage tracking |
| Auth | Supabase Auth | Required login — email/password + Google OAuth |
| AI | Anthropic API — Claude Sonnet | Question & worksheet generation, feedback |
| PDF | @react-pdf/renderer | Clean programmatic PDF export |
| Payments | Stripe | Premium subscription billing ($5.99/mo) |
| Hosting | Vercel | CI/CD via GitHub integration |
| Repo | GitHub | Source control |

---

## 3. User Flows

### 3.1 Main Flow

```
Home Page (public)
  └─► [Start Studying] button
        └─► /login or /signup (if not authenticated)
              └─► /generate — Input Form Page
                    └─► [Generate] button
                          └─► /loading — Loading Page (AI generating...)
                                └─► /questions/[sessionId]  OR  /worksheet/[sessionId]
                                      └─► [Download PDF] button
                                      └─► Session auto-saved to Supabase
```

### 3.2 Auth Flow (required)

```
Home Page  OR  Any protected page
  └─► Redirected to /login if not authenticated
        └─► Supabase Auth (email/password or Google OAuth)
              └─► Redirect to /dashboard on first login
                    └─► All sessions saved automatically to account
                          └─► Dashboard: browse and revisit all past sessions
```

Authentication is **required** to use the app. There is no anonymous mode — every generated session is tied to a user account so students can always come back to their work.

### 3.3 Free vs Premium Flow

```
User hits daily limit (2 questions OR 2 worksheets used)
  └─► Soft gate appears: "You've used your free generations for today"
        └─► [Upgrade to Premium] button → /pricing page
              └─► Stripe Checkout (hosted)
                    └─► On success → Stripe webhook → update profiles.is_premium = true
                          └─► Redirect to /dashboard with "Welcome to Premium!" banner
```

Free users who try to generate while at their limit see a friendly modal — never a hard error page.

### 3.4 Forgot Password Flow

```
/login page
  └─► "Forgot password?" link below the password field
        └─► /forgot-password — user enters their email address
              └─► [Send Reset Link] button
                    └─► Supabase sends a password reset email (built-in)
                          ├─► Email EXISTS → success state shown on same page:
                          │     "Check your inbox — we sent a reset link to [email]"
                          │
                          └─► Email NOT FOUND → same success message shown
                                (never confirm whether an email exists — security best practice)

User clicks the link in their email
  └─► Redirected to /reset-password?token=... (token injected by Supabase)
        └─► Page shows: New Password + Confirm Password fields
              └─► [Reset Password] button
                    ├─► On success → redirect to /login with toast:
                    │     "Password updated! Sign in with your new password."
                    └─► On expired/invalid token → friendly error message:
                          "This link has expired or already been used."
                          + "Request a new link" → back to /forgot-password
```

**Auth pages needed:**
- `/login` — sign in with email or Google; "Forgot password?" link below password field
- `/signup` — create account with email
- `/forgot-password` — single email input field + send link button
- `/reset-password` — new password + confirm password fields (accessed via email link)
- `/auth/callback` — Supabase OAuth redirect handler



---

## 4. Pages

### 4.1 Home Page (`/`)

**Purpose:** Explain what the app does and get users excited to try it.

**Sections:**
1. **Hero** — App name, tagline, animated illustration, big `Start Studying` CTA button
2. **How It Works** — 3-step visual: Input → Generate → Learn
3. **Features** — Cards highlighting: AI Questions, Visual Worksheets, Instant Feedback, PDF Download
4. **Pricing** — Free vs Premium side-by-side cards (see Section 4.6)
5. **Subject Examples** — Sample tags: Math, Biology, History, Literature, Chemistry, etc.
6. **Footer** — minimal

**Design notes:**
- Smooth scroll between sections
- Hero should feel energetic and student-friendly
- `Start Studying` button scrolls to input OR navigates to `/generate`

---

### 4.2 Global Navbar (all pages)

**Purpose:** Persistent top bar present on every page. Behaviour differs based on auth state.

#### Logged-out state
- Left: App logo/name
- Right: "Log In" and "Sign Up" text buttons

#### Logged-in state
- Left: App logo/name
- Right: **User avatar button** — a circular image (40×40px) showing the user's custom profile photo, or a generated initials fallback (e.g. "JS" for Jane Smith) with a brand-color background if no photo is set

**Avatar dropdown menu** — opens when the avatar is clicked. Slides down smoothly (CSS transition). Closes on click-outside or Escape key. Contains:

```
┌──────────────────────────────────┐
│  ● Jane Smith                    │  ← display name + email (non-clickable header)
│    jane@example.com              │
│  ─────────────────────────────── │
│  ⚙  Settings                    │  → /settings
│  👑 Plan: Free  [Upgrade →]     │  → /pricing  (shows "Premium" + crown if premium)
│  🔑 Change Password              │  → /settings/change-password  (or inline modal)
│  📄 My PDFs                     │  → /dashboard?tab=pdfs
│  ─────────────────────────────── │
│  ↪  Sign Out                    │  → Supabase signOut() + redirect to /
└──────────────────────────────────┘
```

**Plan row behaviour:**
- Free users: shows `Plan: Free` with an `[Upgrade →]` link in accent color → `/pricing`
- Premium users: shows `Plan: Premium ⚡` with no upgrade link — just the status

**My PDFs row:** Opens the dashboard filtered to show only sessions that have a downloaded PDF, or links to `/dashboard?tab=pdfs` which renders a dedicated PDF history list (session topic, type, date, re-download button).

**Profile picture:**
- Users can upload a custom photo from the `/settings` page
- Stored in Supabase Storage bucket `avatars/[user_id]`
- Displayed as a circular `<img>` with `object-fit: cover`
- Fallback: coloured circle with 1–2 initials derived from `display_name`
- The dropdown header also shows the avatar at a slightly larger size (48×48px)

---

### 4.3 Input Form Page (`/generate`)

**Purpose:** Collect the study parameters from the user.

**Fields:**

| Field | Type | Required | Notes |
|---|---|---|---|
| Subject | Text input or dropdown | Yes | e.g. "Biology", "Algebra 2", "US History" |
| Grade / Level | Dropdown | Yes | K–5 (Elementary), 6–8 (Middle School), 9–10 (High School), 11–12 (High School), College / University |
| Unit / Topic | Text input | Yes | e.g. "Photosynthesis", "The Civil War", "Quadratic Equations" |
| Specific focus (optional) | Text input | No | e.g. "light-dependent reactions only" |
| Output type | Toggle / radio | Yes | **Questions** or **Worksheet** |
| *(If Questions)* Number of questions | Slider or number input | Yes | Range: 3–20 |
| *(If Questions)* Question types | Checkboxes | Yes | Multiple Choice, Free Response, Mixed |

**Behavior:**
- Fields animate in with stagger on page load
- Validation: required fields highlighted if empty on submit
- On submit → navigate to `/loading` with params passed via URL query or session state
- Session is **always** saved to the user's Supabase account automatically (no toggle needed — auth is required)
- Route is protected: unauthenticated users are redirected to `/login`

---

### 4.4 Loading Page (`/loading`)

**Purpose:** Show progress while Claude generates content. The wait time differs by plan.

#### Wait times by plan

| Plan | Wait time | Why |
|---|---|---|
| Free | 30 seconds (artificial delay + real generation) | Encourages upgrade |
| Premium | 15–20 seconds (real generation time only) | No artificial delay |

The artificial delay for free users is added client-side with a `setTimeout` that holds the redirect even after the API responds. The API call itself fires immediately regardless of plan.

#### Animation — "Pencil & Notebook Drawing Itself" (CSS + SVG, no dependencies)

The loading screen features a **self-drawing pencil and notebook** — the central metaphor of the app. A pencil moves across a notebook page, and lines of text appear as if being written in real time. Everything is pure CSS + inline SVG. No Lottie, no external libraries.

**Visual composition (top to bottom, centered):**

1. **Notebook** — an open notebook SVG with a left page and right page. Ruled lines on the right page animate in one by one using `stroke-dashoffset` (the "drawing itself" effect).
2. **Pencil** — a pencil SVG positioned at the top of the right page. It travels left-to-right across each ruled line in sync with the lines appearing, using `@keyframes pencilWrite`.
3. **Eraser dust** — 3–4 tiny dots that scatter from the pencil tip as it moves, fading out with `@keyframes eraserDust`.
4. **Spiral binding** — small circles along the notebook spine that subtly pulse to feel alive.

**CSS animations to implement:**
```css
/* Each ruled line draws itself left-to-right */
@keyframes drawLine {
  from { stroke-dashoffset: 200; }
  to   { stroke-dashoffset: 0; }
}

/* Pencil moves across the page, then jumps to next line */
@keyframes pencilWrite {
  0%   { transform: translate(30px, 40px); }
  22%  { transform: translate(180px, 40px); }
  25%  { transform: translate(30px, 60px); }   /* jump to next line */
  47%  { transform: translate(180px, 60px); }
  50%  { transform: translate(30px, 80px); }
  72%  { transform: translate(180px, 80px); }
  75%  { transform: translate(30px, 100px); }
  97%  { transform: translate(180px, 100px); }
  100% { transform: translate(30px, 40px); }   /* reset */
}

/* Tiny dots scatter from pencil tip */
@keyframes eraserDust {
  0%   { opacity: 0.8; transform: translate(0, 0) scale(1); }
  100% { opacity: 0; transform: translate(8px, -6px) scale(0.3); }
}

/* Spiral binding dots pulse gently */
@keyframes spiralPulse {
  0%, 100% { r: 3; opacity: 0.6; }
  50%       { r: 4; opacity: 1; }
}

/* Notebook itself has a very subtle breathing scale */
@keyframes notebookBreath {
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.015); }
}
```

Each ruled line gets a staggered `animation-delay` so they appear sequentially. The pencil animation loop duration matches the time it takes to "write" all four lines, then resets seamlessly.

**Color palette for the animation:**
- Notebook cover: brand primary color (deep green or chosen brand color)
- Page: off-white `#FAFAF8`
- Ruled lines: light blue `#C8D8E8` (classic notebook lines)
- Pencil body: yellow `#F5C842`, ferrule silver `#B0B0B0`, eraser pink `#F4A0A0`
- Eraser dust: soft gray dots
- Spiral binding: brand accent color

#### Rotating loading messages

Messages rotate every 3 seconds with a smooth crossfade (`opacity` transition, not slide):

**For Questions mode:**
- "Reading up on your topic..."
- "Writing your first question..."
- "Mixing in some tricky ones..."
- "Double-checking the answers..."
- "Almost ready for you!"

**For Worksheet mode:**
- "Opening the textbooks..."
- "Sketching out your worksheet..."
- "Building the step-by-step guide..."
- "Adding visuals and examples..."
- "Polishing the final touches..."

#### Progress bar

- A full-width bar at the bottom of the loading card, fills left to right
- **Free:** fills over exactly 30 seconds using a CSS `animation: fillBar 30s linear forwards`
- **Premium:** fills over 18 seconds using `animation: fillBar 18s linear forwards`
- Subtle shimmer effect (`@keyframes shimmer`) scrolls across the filled portion
- Color: brand accent color

#### Countdown timer (free users only)

Displayed prominently below the progress bar, **only for free users**:

```
⏱ Ready in 28 seconds
```

- Counts down from 30 to 0 using a `setInterval` in React state
- Updates every second: "Ready in 27 seconds", "Ready in 26 seconds", etc.
- At 5 seconds: text changes color to accent/green and reads "Almost there! 5 seconds..."
- At 0: message changes to "Your content is ready! ✓" and redirects immediately
- Premium users see **no timer** — just the progress bar and a message like "Generating your content..."
- Timer sits below the progress bar in a small muted font — informative but not alarming

#### Free user — upgrade nudge

While waiting, free users see a soft inline message below the timer:
> ⚡ **Premium members load in half the time.** $5.99/mo — [Upgrade now →]

This is a quiet text link, not a modal. It doesn't interrupt the experience.

This is a quiet text link, not a modal. It doesn't interrupt the experience.

**Behavior:**
- On mount, immediately calls `/api/generate` with the form params
- Free users: wait for `max(apiResponseTime, 30000ms)` before redirecting
- Premium users: redirect as soon as API responds
- On success → redirect to `/questions/[sessionId]` or `/worksheet/[sessionId]`
- On error → show friendly error card with "Try again" button and link back to `/generate`
- No back button during loading (prevent double-generation)

---

### 4.5 Questions Page (`/questions/[sessionId]`)

**Purpose:** Let students answer AI-generated questions with instant feedback.

#### Layout

- **Header bar:** Topic name, grade, subject, question count, score tracker (X / N correct)
- **Progress bar** at top: fills as questions are answered
- **Question cards:** one per question, stacked vertically or paginated (TBD — start with paginated, one at a time)
- **Navigation:** Previous / Next buttons between questions
- **Bottom bar:** "Download PDF" button, "Start Over" button

#### Multiple Choice Questions

Each MC question card contains:
- Question number + question text
- 4 answer options (A, B, C, D) as clickable buttons
- On selection:
  - **Correct:** Selected option turns **green**, shows ✓ icon
    - Feedback box appears below: "Excellent!!! 🎉" + 1–2 motivational sentences + 2–3 sentences explaining *why* the answer is correct, step by step
  - **Wrong:** Selected option turns **red**, correct option turns **green**
    - Feedback box appears below: A clear, encouraging paragraph explaining the correct answer step by step. Never say "you're wrong" — always reframe constructively (e.g., "The correct answer is B. Here's how to think about it...")
- Once answered, options are locked (no re-selecting)

#### Free Response Questions

Each FR question card contains:
- Question number + question text
- A text area for the student's answer
- A "Check My Answer" button
- On submit:
  - Claude evaluates the response (another API call to `/api/evaluate`)
  - Shows feedback: score (e.g. "Good answer! 3/4 points"), specific praise, and a model answer walkthrough step by step
  - Feedback box styled the same as MC feedback (green for good, amber for partial, red for missing key points)

#### Score Summary

After the last question is answered, a summary card slides up:
- Total score (e.g. "14 / 20")
- Encouragement message based on score
- List of questions with ✓ or ✗
- Options: "Try Again", "New Topic", "Download PDF"

---

### 4.6 Worksheet Page (`/worksheet/[sessionId]`)

**Purpose:** Display a rich, visual, structured study sheet the student can read, interact with, and print.

#### Worksheet Structure (always in this order):

**1. Introduction**
- Topic title, subject, grade level badge
- 2–3 sentence friendly intro explaining what this topic is and why it matters
- Key vocabulary list (3–6 terms) with short definitions

**2. Step-by-Step Explanation**
- Minimum 3 steps, each containing:
  - Step number + title
  - Clear explanation paragraph (plain language, grade-appropriate)
  - A **visual**: diagram, labeled illustration, table, timeline, or formula display — rendered as SVG or structured HTML. Claude is prompted to always include a visual for every step.
  - A "Key Takeaway" callout box for each step

**3. Summary**
- Bullet-point summary of the whole topic (5–8 bullets)
- A "Quick Check" box: 2–3 rapid-fire true/false or fill-in-the-blank mini questions (not graded, just for self-check)

**4. Practice Questions**
- 3–5 practice questions (mix of MC and FR)
- On the web app: fully interactive, same behavior as the Questions page
- On the PDF: printed with an answer key on the last page

### 4.7 Pricing Page (`/pricing`)

**Purpose:** Convert free users to Premium. Shown both as a standalone page and embedded in the home page. The full standalone `/pricing` page is reached from the navbar avatar dropdown, the daily limit modal, and the upgrade nudge on the loading screen.

#### Plan comparison cards

Two side-by-side cards — Free on the left, Premium on the right.

**Free card (left):**
- Label: "Free"
- Price: "$0 / month"
- Subtle outlined border, no background tint
- CTA button (disabled / greyed out if already on free): "Your current plan"

**Premium card (right):**
- Label: "Premium" with a ⚡ icon
- Price: "$5.99 / month" in large type, "Billed monthly · Cancel anytime" in small muted text below
- Highlighted accent border (2px brand color)
- "Most Popular" badge above the card
- Subtle warm background tint
- CTA button: "Upgrade to Premium →" — clicking triggers Stripe Checkout

**Feature comparison rows** (shown inside both cards, side by side):

| Feature | Free | Premium |
|---|---|---|
| Questions generations / day | 2 | Unlimited |
| Worksheet generations / day | 2 | Unlimited |
| Generation wait time | 30 seconds ⏱ | 15–20 seconds ⚡ |
| Session history | ✓ | ✓ |
| PDF download | ✓ | ✓ |
| All subjects & grade levels | ✓ | ✓ |
| Custom profile picture | ✓ | ✓ |
| Priority support | ✗ | ✓ |
| Early access to new features | ✗ | ✓ |

**Design details:**
- Each row alternates a very faint background stripe for readability
- ✓ rendered in green, ✗ in muted grey (never red — not punishing)
- The "wait time" row has extra visual emphasis — it's the biggest pain point for free users
- Below the cards: a trust line — "🔒 Secure payment via Stripe · Cancel any time from your account"

**Already-premium state:** If a logged-in premium user visits `/pricing`, both cards render but the Premium card shows "Your current plan ✓" instead of the upgrade button, and a small "Manage subscription" link appears below (links to Stripe Customer Portal).

#### Daily limit gate modal (also lives here logically)

When a free user hits their daily limit mid-session, a modal overlays the current page:

```
┌──────────────────────────────────────────────┐
│  🎓 You've used today's free generations     │
│                                              │
│  Come back tomorrow — or go Premium and      │
│  generate as many as you want, faster.       │
│                                              │
│  Free         →      Premium                 │
│  2/day               Unlimited               │
│  30 sec wait         ~15 sec wait            │
│                                              │
│  [ Upgrade for $5.99/mo ]  [ Maybe Tomorrow ]│
└──────────────────────────────────────────────┘
```

- Modal is warm and encouraging — never punishing
- "Upgrade" → `/pricing`
- "Maybe Tomorrow" → close modal, stay on current page

---

### 4.8 Settings Page (`/settings`)

**Purpose:** Let users manage their account details, profile photo, and password. Reached from the avatar dropdown.

**Sections:**

**1. Profile**
- Display name (editable text field + Save button)
- Email (read-only — changing email requires re-verification, not supported in v1)
- Profile picture:
  - Shows current circular photo (or initials fallback)
  - "Upload photo" button → opens file picker → accepts JPG/PNG up to 2MB
  - Photo uploaded to Supabase Storage at `avatars/[user_id]`
  - `profiles.avatar_url` updated on upload
  - "Remove photo" link appears if a custom photo is set — reverts to initials fallback

**2. Change Password** (sub-section at `/settings/change-password` or inline)
- Current Password field
- New Password field
- Confirm New Password field
- [Update Password] button
- On success: toast — "Password updated successfully"
- On wrong current password: inline error — "Current password is incorrect"
- Password requirements shown as live validation hints below the new password field:
  - ✓ At least 8 characters
  - ✓ At least one number
  - ✓ At least one special character

**3. Plan & Billing**
- Shows current plan (Free / Premium)
- Free users: "Upgrade to Premium →" button → `/pricing`
- Premium users: "Manage subscription" link → Stripe Customer Portal (cancel, update card)

**4. Danger Zone**
- "Delete my account" — requires typing "DELETE" to confirm; calls Supabase to delete user + cascade deletes all sessions

---

### 4.9 Dashboard (`/dashboard`)

**Purpose:** Home base for logged-in users — see past sessions, track usage, and access downloaded PDFs.

**Sections:**
- **Usage bar** (free users only): shows "2/2 questions used today" and "1/2 worksheets used today" with a reset countdown to midnight. Premium users see "Unlimited ✓" instead.
- **Tabs:** "All Sessions" | "My PDFs" — switching filters the session grid without a page reload
- **Session grid (All Sessions tab):** cards for each past generation — shows subject, topic, type (Questions/Worksheet), date, and score if applicable. Click any card to revisit that session.
- **My PDFs tab:** shows only sessions where a PDF was downloaded. Each card shows the topic, type, date downloaded, and a "Download again" button that re-calls `/api/export-pdf`.
- **Upgrade banner** (free users only): subtle persistent banner at top of page — "⚡ Go Premium — unlimited generations for $5.99/mo → [Upgrade]"

---

## 5. API Routes

### `POST /api/generate`

Generates questions or a worksheet using Claude.

**Request body:**
```json
{
  "subject": "Biology",
  "grade": "9-10",
  "topic": "Photosynthesis",
  "focus": "light-dependent reactions",
  "outputType": "questions",
  "questionCount": 10,
  "questionTypes": ["mc", "fr"]
}
```

**Response:**
```json
{
  "sessionId": "uuid",
  "outputType": "questions",
  "questions": [
    {
      "id": 1,
      "type": "mc",
      "question": "Where do the light-dependent reactions take place?",
      "options": ["A. Stroma", "B. Thylakoid membrane", "C. Cytoplasm", "D. Nucleus"],
      "correctAnswer": "B",
      "explanation": "The light-dependent reactions occur in the thylakoid membrane..."
    },
    {
      "id": 2,
      "type": "fr",
      "question": "Explain the role of ATP synthase in the light-dependent reactions.",
      "modelAnswer": "ATP synthase uses the proton gradient..."
    }
  ]
}
```

**For worksheets**, response contains a structured `worksheet` object (see Section 4.5 structure).

**Pre-generation checks (server-side):**
1. Verify user is authenticated (JWT from Supabase)
2. Check `profiles.is_premium` — if false, count today's sessions of this `output_type`
3. If count ≥ 2 → return `429` with `{ error: "daily_limit_reached", resetAt: "<midnight UTC>" }`
4. If count < 2 → proceed with Claude API call and save session to Supabase

---

### `POST /api/evaluate`

Evaluates a free-response answer.

**Request body:**
```json
{
  "question": "Explain the role of ATP synthase...",
  "modelAnswer": "...",
  "studentAnswer": "ATP synthase makes ATP by...",
  "grade": "9-10",
  "subject": "Biology"
}
```

**Response:**
```json
{
  "score": "3/4",
  "feedback": "Great start! You correctly identified that ATP synthase produces ATP...",
  "stepByStep": ["Step 1: ...", "Step 2: ..."]
}
```

---

### `POST /api/export-pdf`

Generates and returns a clean PDF of the questions or worksheet.

**Request body:**
```json
{ "sessionId": "uuid" }
```

**Response:** PDF file streamed as `application/pdf` with `Content-Disposition: attachment; filename="studyspark-[topic].pdf"`

---

### `POST /api/stripe/checkout`

Creates a Stripe Checkout session for Premium upgrade.

**Request body:** *(authenticated — user id comes from JWT)*
```json
{ "returnUrl": "https://yourdomain.com/dashboard" }
```

**Response:**
```json
{ "checkoutUrl": "https://checkout.stripe.com/..." }
```

Frontend redirects the user to `checkoutUrl`. Stripe handles the entire payment UI.

---

### `POST /api/stripe/webhook`

Receives Stripe events after payment. This route must be publicly accessible (no auth) and must verify the Stripe webhook signature.

**Events to handle:**

| Event | Action |
|---|---|
| `checkout.session.completed` | Set `profiles.is_premium = true`, save `stripe_customer_id` and `stripe_subscription_id` |
| `customer.subscription.deleted` | Set `profiles.is_premium = false` (subscription cancelled) |
| `invoice.payment_failed` | Set `profiles.is_premium = false` after grace period (optional) |

**Security:** Always verify `stripe-signature` header using `stripe.webhooks.constructEvent()` before processing.

---

## 6. Database Schema (Supabase)

### `sessions`
```sql
id               uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
subject          text NOT NULL
grade            text NOT NULL  -- 'K-5' | '6-8' | '9-10' | '11-12' | 'college'
topic            text NOT NULL
focus            text
output_type      text NOT NULL  -- 'questions' | 'worksheet'
content          jsonb NOT NULL  -- full generated content
pdf_downloaded   boolean DEFAULT false
pdf_downloaded_at timestamptz   -- timestamp of first download
created_at       timestamptz DEFAULT now()
```

### `question_responses`
```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
session_id   uuid REFERENCES sessions(id)
question_id  int NOT NULL
student_answer text
is_correct   boolean
score        text  -- for FR: "3/4"
answered_at  timestamptz DEFAULT now()
```

### `profiles`
```sql
id                     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
display_name           text
email                  text
avatar_url             text            -- from Google OAuth if used
is_premium             boolean DEFAULT false
stripe_customer_id     text            -- set after first Stripe checkout
stripe_subscription_id text            -- set after subscription created
premium_since          timestamptz     -- when they first upgraded
created_at             timestamptz DEFAULT now()
```

> **Note:** Create a Supabase trigger to auto-insert a row into `profiles` whenever a new user signs up via `auth.users`.

### `daily_usage`
```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
date         date NOT NULL DEFAULT CURRENT_DATE  -- UTC date
questions    int DEFAULT 0   -- count of question sets generated today
worksheets   int DEFAULT 0   -- count of worksheets generated today
UNIQUE(user_id, date)
```

> **Usage logic:** On each generation, `INSERT INTO daily_usage ... ON CONFLICT (user_id, date) DO UPDATE SET questions = questions + 1` (or worksheets). Check the count before calling Claude — reject with 429 if free user is at limit (≥ 2). Premium users bypass this check entirely.

---

## 7. Claude Prompt Strategy

### General principles
- Always pass `subject`, `grade`, `topic`, and `focus` in every prompt
- Use a **system prompt** that sets Claude's role as a patient, encouraging tutor
- Request **strict JSON output** so parsing is reliable
- For worksheets, explicitly instruct Claude to include a visual description per step (which the frontend renders as SVG/HTML)

### System prompt (shared)
```
You are StudySpark, an expert educational tutor. You create engaging, 
accurate, and age-appropriate study materials. Always match your language 
complexity to the student's grade level. Be encouraging and clear.
Always respond in valid JSON only — no markdown, no preamble.
```

### Question generation prompt template
```
Generate {count} study questions about "{topic}" in {subject} for a {grade} 
student. {focus ? `Focus specifically on: ${focus}.` : ''}

Include a mix of: {questionTypes}.

For each MC question provide: question, 4 options (A-D), correctAnswer, 
and a step-by-step explanation (3-5 sentences, plain language).

For each FR question provide: question and a modelAnswer (3-5 sentences).

Return as JSON: { questions: [...] }
```

### Worksheet generation prompt template
```
Create a complete study worksheet about "{topic}" in {subject} for a {grade} student.
{focus ? `Focus on: ${focus}.` : ''}

Structure:
1. introduction: { text, vocabulary: [{term, definition}] }
2. steps: [ { title, explanation, visualDescription, keyTakeaway } ] (min 3 steps)
3. summary: { bullets: [...], quickCheck: [...] }
4. practiceQuestions: [ same format as question generation above ] (3-5 questions)

For visualDescription: describe a simple diagram or table that illustrates the step.
The frontend will render this as an SVG or HTML visual.

Return as JSON only.
```

### Feedback prompt template (MC)
```
A {grade} student answered a {subject} question about "{topic}" correctly/incorrectly.

Question: {question}
Correct answer: {correctAnswer}
Student selected: {studentAnswer}

Write feedback (2-3 sentences) that:
- If correct: celebrates them warmly and reinforces WHY the answer is right, step by step
- If incorrect: never says "wrong" — reframes constructively, explains the correct answer 
  step by step in plain language

Return as JSON: { feedback: "..." }
```

---

## 8. PDF Export

**Strategy:** Use `@react-pdf/renderer` to generate PDFs programmatically from session JSON on the server side. This is the most reliable approach on Vercel (no cold-start issues, no headless browser).

**PDF contents — Questions:**
- Cover page: subject, grade, topic, date generated
- One question per section with options (MC) or blank answer lines (FR)
- Answer key as the final page (correct answers + full explanations)

**PDF contents — Worksheet:**
- Cover page: topic, subject, grade, date
- Introduction section with vocabulary table
- Each step with explanation text + visual (simplified SVG or ASCII diagram for PDF)
- Summary bullets
- Practice questions with blank answer lines
- Answer key as the final page

**API route:** `POST /api/export-pdf` accepts `{ sessionId }`, fetches the session from Supabase, builds the PDF with `@react-pdf/renderer`, and streams it back as `application/pdf` with `Content-Disposition: attachment; filename="studyspark-[topic].pdf"`. Also sets `pdf_downloaded = true` and `pdf_downloaded_at = now()` on the session row so it appears in the "My PDFs" dashboard tab.

**Library:** `@react-pdf/renderer` — install with `npm install @react-pdf/renderer`

---

## 8b. Avatar Storage (Supabase Storage)

**Bucket name:** `avatars` (public read bucket — avatar URLs used directly in `<img>` tags)

**Upload flow:**
1. User picks a file on `/settings` — JPG or PNG, max 2MB, validated client-side before upload
2. Frontend calls `POST /api/avatar/upload` with the image as `multipart/form-data`
3. Server uploads to Supabase Storage at `avatars/[user_id]/avatar.[ext]`
4. Server updates `profiles.avatar_url` with the new public URL
5. Frontend receives new URL and updates the navbar avatar immediately (optimistic UI update)

**Remove flow:**
- User clicks "Remove photo" on `/settings`
- Server deletes the file from Supabase Storage
- `profiles.avatar_url` set to `null`
- Navbar avatar reverts to the initials fallback automatically

**Initials fallback logic (`UserAvatar.tsx`):**
```typescript
// Up to 2 initials from display_name
const initials = name
  .split(' ')
  .map(n => n[0])
  .slice(0, 2)
  .join('')
  .toUpperCase()

// Deterministic color based on user id so it never randomly changes
const palette = ['#4A7A28', '#2D6A8F', '#8B4A9E', '#C4612A', '#2A7A6A']
const bgColor = palette[userId.charCodeAt(0) % palette.length]
```

---

## 9. Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=avatars   # public bucket for user avatars
ANTHROPIC_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Stripe
STRIPE_SECRET_KEY=                    # sk_live_... or sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=   # pk_live_... or pk_test_...
STRIPE_WEBHOOK_SECRET=                # whsec_... (from Stripe dashboard)
STRIPE_PREMIUM_PRICE_ID=              # price_... (the $5.99/mo price object ID)
```

> **Tip:** Use Stripe test keys (`sk_test_...`) during development. Switch to live keys only before launch. Use `stripe listen --forward-to localhost:3000/api/stripe/webhook` locally to test webhooks.

---

## 10. Folder Structure

```
/app
  /page.tsx                              ← Home page (public) — hero, features, pricing, footer
  /login/page.tsx                        ← Sign in + "Forgot password?" link
  /signup/page.tsx                       ← Create account
  /forgot-password/page.tsx             ← Enter email to receive reset link
  /reset-password/page.tsx              ← Set new password (reached via email link)
  /auth/callback/route.ts               ← Supabase OAuth redirect handler
  /pricing/page.tsx                     ← Full pricing page (public)
  /settings/page.tsx                    ← Profile, avatar, change password, plan & billing
  /dashboard/page.tsx                   ← Session history + My PDFs tabs (protected)
  /generate/page.tsx                    ← Input form (protected)
  /loading/page.tsx                     ← Loading screen (protected)
  /questions/[sessionId]/page.tsx       ← Questions page (protected)
  /worksheet/[sessionId]/page.tsx       ← Worksheet page (protected)

/api
  /generate/route.ts                    ← AI content generation (checks daily limits)
  /evaluate/route.ts                    ← FR answer evaluation
  /export-pdf/route.ts                  ← PDF generation and download
  /avatar/upload/route.ts              ← Handles avatar image upload to Supabase Storage
  /stripe/
    checkout/route.ts                   ← Creates Stripe Checkout session
    webhook/route.ts                    ← Handles Stripe events (payment, cancellation)

/components
  /ui/                                  ← Buttons, inputs, cards, badges, modals, toasts
  /auth/
    LoginForm.tsx
    SignupForm.tsx
    ForgotPasswordForm.tsx
    ResetPasswordForm.tsx
    AuthGuard.tsx
  /layout/
    Navbar.tsx                          ← Logo + avatar button (logged in) or login/signup (logged out)
    AvatarDropdown.tsx                  ← Dropdown menu with settings, plan, PDFs, sign out
    UserAvatar.tsx                      ← Circular avatar image or initials fallback
    Footer.tsx
  /settings/
    ProfileForm.tsx                     ← Display name + avatar upload
    ChangePasswordForm.tsx             ← Current + new + confirm password fields
    PlanBilling.tsx                     ← Plan display + upgrade/manage button
    DangerZone.tsx                      ← Delete account with confirmation
  /premium/
    PricingCards.tsx                    ← Free vs Premium side-by-side comparison cards
    UpgradeModal.tsx                    ← Daily limit gate modal
    UsageBar.tsx                        ← Today's usage tracker (dashboard)
    PremiumBadge.tsx                    ← ⚡ badge shown on premium accounts
  /loading/
    LoadingScreen.tsx                   ← Full animation + messages + progress bar + timer
    PencilNotebookAnimation.tsx        ← CSS animated pencil/notebook SVG illustration
  /questions/
    QuestionCard.tsx
    MCOption.tsx
    FRInput.tsx
    FeedbackBox.tsx
    ScoreSummary.tsx
  /worksheet/
    WorksheetIntro.tsx
    StepCard.tsx
    VisualBlock.tsx
    SummarySection.tsx
    PracticeSection.tsx
  /dashboard/
    SessionCard.tsx
    SessionGrid.tsx
    PDFHistoryList.tsx

/lib
  supabase.ts                           ← Supabase browser client
  supabase-server.ts                    ← Supabase server client (for API routes)
  anthropic.ts                          ← Anthropic client + prompt builders
  pdf.ts                                ← PDF generation with @react-pdf/renderer
  stripe.ts                             ← Stripe client instance
  usage.ts                              ← Daily usage check/increment helpers
  avatar.ts                             ← Avatar upload/delete helpers (Supabase Storage)

/middleware.ts                          ← Auth guard: redirect unauthenticated users to /login

/types
  index.ts                              ← Shared TypeScript types
```

---

## 11. Scope & Phases

### Phase 1 — MVP (build first)
- [ ] Home page (public) — hero, how it works, features, pricing section, footer
- [ ] Sign up / login pages (Supabase Auth — email + Google)
- [ ] Forgot password flow — `/forgot-password` + `/reset-password` pages
- [ ] `middleware.ts` auth guard for protected routes
- [ ] Global Navbar — logo, avatar button, dropdown menu (settings, plan, PDFs, sign out)
- [ ] User avatar — custom photo upload via Supabase Storage; initials fallback
- [ ] Settings page — profile info, avatar upload, change password, plan & billing, danger zone
- [ ] Input form (`/generate`)
- [ ] Loading page — pencil/notebook drawing animation, rotating messages, progress bar
- [ ] Countdown timer on loading page (free users only)
- [ ] Questions page — MC only first
- [ ] Sessions saved to Supabase on generation (with `pdf_downloaded` tracking)
- [ ] Dashboard — "All Sessions" + "My PDFs" tabs, usage bar
- [ ] `daily_usage` table + limit checking in `/api/generate`
- [ ] Daily limit gate modal (upgrade prompt)

### Phase 2
- [ ] Stripe integration — `/pricing` page, `/api/stripe/checkout`, `/api/stripe/webhook`
- [ ] Premium badge + plan display in navbar dropdown and settings
- [ ] Already-premium state on `/pricing` page (shows "Your current plan ✓")
- [ ] Stripe Customer Portal link (manage/cancel subscription)
- [ ] FR questions + AI evaluation (`/api/evaluate`)
- [ ] Worksheet page with step-by-step visuals
- [ ] Score tracking + progress bar on questions page
- [ ] Score summary slide-up at end of question set

### Phase 3
- [ ] Clean PDF export via `@react-pdf/renderer` (questions + worksheets)
- [ ] "Download again" button in My PDFs dashboard tab
- [ ] Dashboard improvements — filter by subject, delete sessions, performance stats
- [ ] Mobile optimization
- [ ] Grade-adaptive language tuning in prompts
- [ ] Subject-specific visual templates for worksheets
- [ ] Cancelled Premium — grace period handling via Stripe `customer.subscription.deleted` webhook

---

## 12. Decisions Log & Open Questions

### ✅ Decided
- **Auth:** Required (not optional). Email/password + Google OAuth via Supabase.
- **PDF strategy:** `@react-pdf/renderer` — programmatic, no Puppeteer.
- **Grade range:** All levels — K–5, 6–8, 9–10, 11–12, College.
- **Questions layout:** Paginated (one at a time), not all-scrollable.
- **Subjects:** All subjects supported (open text input).
- **Language:** English only for now.
- **Payments:** Stripe — hosted Checkout, webhook to update `profiles.is_premium`.
- **Loading animation:** "Pencil & Notebook Drawing Itself" — pure CSS + inline SVG, no Lottie.
- **Free user countdown timer:** Yes — counts down from 30s with live seconds display. Changes tone at 5s. Hidden for Premium users.
- **Monetization:** Free tier (2 questions/day, 2 worksheets/day, 30s wait) vs Premium ($5.99/mo, unlimited, 15–20s wait).
- **Forgot password:** Full reset flow — `/forgot-password` → Supabase email → `/reset-password` token page. Always shows success message regardless of whether email exists.
- **Navbar avatar dropdown:** Circular avatar (custom photo or initials fallback) in top-right of all pages. Dropdown shows: name/email, Settings, Plan + upgrade link, Change Password, My PDFs, Sign Out.
- **Profile photo:** User-uploadable via `/settings`. Stored in Supabase Storage `avatars/` bucket. Fallback = branded initials circle.
- **Pricing page:** Full standalone `/pricing` page with side-by-side Free vs Premium cards, feature comparison table, and trust line. Also embedded in home page. Modal version shown when free users hit daily limit.

### ❓ Still Open
- [ ] Should the dashboard show performance stats per topic (average score, questions attempted)?
- [ ] Should worksheets support PDF/image uploads so students can base content on their own notes? → Phase 3 consideration
- [ ] Rate limiting beyond daily counts — e.g. per-minute abuse prevention?
- [ ] Should cancelled Premium users keep access until end of billing period, or lose access immediately?

---

*This document is the source of truth for StudySpark. Paste it into any AI conversation when asking for help building a feature. Update the Decisions Log as choices get made.*
