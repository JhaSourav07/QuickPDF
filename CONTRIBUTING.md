# Contributing to QuickPDF 🚀

> **First off — thank you!** Whether you found a bug, have a feature idea, or just want to write some code, we're genuinely glad you're here. QuickPDF is built on the belief that people deserve powerful PDF tools that *never* compromise their privacy. Every contribution you make helps protect that promise for thousands of users. Welcome aboard. 🎉

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Local Setup Guide](#2-local-setup-guide)
3. [Project Architecture & The Golden Rule](#3-project-architecture--the-golden-rule)
4. [UI/UX Design Guidelines](#4-uiux-design-guidelines)
5. [Contribution Workflow](#5-contribution-workflow)
6. [Commit Message Format](#6-commit-message-format)
7. [Code Quality & Linting](#7-code-quality--linting)
8. [Testing & CI/CD](#8-testing--cicd)
9. [Submitting a Pull Request](#9-submitting-a-pull-request)
10. [Getting Help](#10-getting-help)

---

## 1. Prerequisites

Before you begin, make sure you have the following installed on your machine:

| Tool | Recommended Version | Download |
|------|---------------------|----------|
| **Node.js** | `v22+` (LTS) | [nodejs.org](https://nodejs.org) |
| **npm** | Comes with Node.js | — |
| **Git** | Any recent version | [git-scm.com](https://git-scm.com) |

You'll also need a free **Firebase** project and a **WalletConnect** Project ID. See [Step 5 of the Local Setup](#step-5-configure-environment-variables) for details.

---

## 2. Local Setup Guide

Follow these steps exactly to get a fully working dev environment.

### Step 1 — Fork the Repository

Click **Fork** at the top-right of the GitHub repository page. This creates your own copy of the project under your GitHub account.

### Step 2 — Clone Your Fork

```bash
# Replace YOUR_USERNAME with your actual GitHub username
git clone https://github.com/YOUR_USERNAME/QuickPDF.git
cd QuickPDF
```

### Step 3 — Add the Upstream Remote

This lets you pull in future updates from the main project:

```bash
git remote add upstream https://github.com/JhaSourav07/QuickPDF.git
```

### Step 4 — Install Dependencies

```bash
npm install
```

> This installs all packages including React, Vite, pdf-lib, pdfjs-dist, RainbowKit, Wagmi, and Firebase.

### Step 5 — Configure Environment Variables

The app requires Firebase (for the freemium license system) and WalletConnect (for the crypto paywall). Create a `.env.local` file in the **project root**:

```bash
# Create the file (do NOT commit this file — it's already in .gitignore)
touch .env.local   # macOS/Linux
# OR on Windows PowerShell:
New-Item .env.local
```

Then open `.env.local` in your editor and add the following keys:

```env
# Firebase — Create a free project at https://console.firebase.google.com
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# WalletConnect — Get a free Project ID at https://cloud.walletconnect.com
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Admin Dashboard — Authentication is handled via Firebase Auth. 
# Create an admin user in your Firebase Console → Authentication.
```

> ⚠️ **Never commit `.env.local` or any real API keys to the repository.** The `.gitignore` already excludes it, but please double-check before pushing.

### Step 6 — Start the Development Server

```bash
npm run dev
```

Vite will start a local dev server, typically at `http://localhost:5173`. The app supports Hot Module Replacement (HMR) so your changes will reflect instantly without a full reload.

---

## 3. Project Architecture & The Golden Rule

### ⚡ Tech Stack at a Glance

| Layer | Technology |
|-------|-----------|
| **Framework** | React 19 + Vite |
| **Routing** | React Router v7 |
| **Animations** | Framer Motion |
| **PDF Processing** | `pdf-lib`, `pdfjs-dist` (Web Workers) |
| **Web3 Paywall** | Wagmi + RainbowKit + viem |
| **License Store** | Firebase Firestore |
| **Icons** | Lucide React |

### 🔴 THE GOLDEN RULE — No Backend. Ever.

> **This is the single most important architectural rule of this project, and it is non-negotiable.**

QuickPDF is **100% client-side**. All PDF processing — merging, splitting, compressing, rotating, converting — happens entirely inside the user's browser using Web Workers and WebAssembly. **No PDF data is ever sent to a server.**

**Any Pull Request that routes PDF file data, page content, or binary buffers to an external URL, API route, serverless function, or cloud storage bucket will be closed immediately without review.**

This is not a technical limitation — it is a core privacy guarantee and a founding principle of the project.

#### ✅ Acceptable patterns:
- `pdf-lib` for PDF manipulation (pure JS, runs in-browser)
- `pdfjs-dist` with a dedicated Web Worker for rendering/parsing
- `FileReader` API and `ArrayBuffer` for local file handling
- `URL.createObjectURL()` for generating download links

#### ❌ Unacceptable patterns:
- `fetch('/api/process', { body: pdfData })`
- Uploading to Firebase Storage, S3, or any cloud storage
- Any `FormData` POST containing file content
- Third-party PDF processing APIs (ILovePDF, Smallpdf, etc.)

---

## 4. UI/UX Design Guidelines

QuickPDF has a **premium, dark-theme, glassmorphism aesthetic**. It should feel like a professional product, not a weekend project. When adding or modifying UI components, please adhere to the following:

### Design Language

- **Color Palette**: Dark backgrounds (`#0a0a0f`, `#111118` range), with accent colors in purple/violet/blue tones. Avoid pure black or plain white.
- **Glassmorphism**: Cards and modals use `backdrop-blur`, semi-transparent backgrounds (`bg-white/5`, `bg-white/10`), and subtle borders (`border border-white/10`).
- **Typography**: Clean, modern sans-serif. Use the existing font stack — do not introduce new font families without discussion.
- **Spacing**: Generous padding and breathing room. Avoid cramped layouts.
- **Gradients**: Used purposefully for hero elements, CTAs, and accent highlights. Don't overuse them.

### Interactions & Animations

- All interactive elements must have **hover and focus states**.
- Use **Framer Motion** for entrance animations (`opacity`, `y` translate), transitions, and gesture-based interactions. Do not use raw CSS `@keyframes` for component animations.
- Animations should feel **smooth and intentional** — ~200–400ms for UI transitions, spring physics for gestures.
- Avoid janky or sudden layout shifts.

### Dos and Don'ts

| ✅ Do | ❌ Don't |
|--------|----------|
| Match the existing dark glass card style | Use white/light backgrounds |
| Use `lucide-react` for all icons | Import icons from other libraries |
| Add Framer Motion entrance animations | Add CSS blink/flash animations |
| Test your UI on both desktop and mobile | Submit desktop-only layouts |
| Follow the existing component file structure | Put styles in random inline `style={{}}` objects |

---

## 5. Contribution Workflow

Please follow this workflow for every contribution, regardless of size.

### Step 1 — Sync with Upstream

Before starting any work, make sure your fork is up to date:

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

### Step 2 — Find or Create an Issue

All contributions must be linked to a GitHub Issue.

- **Browse** open issues and find one labelled `good first issue` or `help wanted`.
- **Comment** on the issue to let maintainers know you're working on it — this prevents duplicate effort.
- If you have a new idea, **open an Issue first** and wait for approval before writing code. This saves everyone time.

### Step 3 — Create a Feature Branch

Never work directly on `main`. Create a dedicated branch with a descriptive name:

```bash
git checkout -b <prefix>/<short-description>
```

**Branch naming convention:**

| Prefix | When to Use | Example |
|--------|-------------|---------|
| `feature/` | New functionality | `feature/add-pdf-watermark` |
| `bugfix/` | Fixing a bug | `bugfix/ui-freeze-on-merge` |
| `chore/` | Refactoring, deps, config | `chore/update-pdfjs-dist` |
| `docs/` | Documentation only | `docs/improve-readme` |
| `ui/` | Visual/styling changes only | `ui/redesign-tool-card` |

### Step 4 — Write Your Code

- Keep changes **focused and atomic**. One branch = one feature or bugfix.
- Run `npm run dev` to test your changes locally before pushing.
- Run `npm run lint` and fix all errors before committing (see [Section 7](#7-code-quality--linting)).

### Step 5 — Push and Open a PR

```bash
git push origin feature/your-branch-name
```

Then open a Pull Request on GitHub against the `main` branch of the upstream repository.

---

## 6. Commit Message Format

Use **conventional commits** for all commit messages. This keeps the git history clean and readable.

### Format

```
<type>(<scope>): <short imperative summary>
```

### Types

| Type | Use for |
|------|---------|
| `feat` | A new feature or tool |
| `fix` | A bug fix |
| `ui` | Visual or styling changes |
| `refactor` | Code restructure with no behavior change |
| `perf` | Performance improvements |
| `chore` | Dependency updates, config, tooling |
| `docs` | Documentation only |
| `test` | Adding or updating tests |

### Examples

```
feat(merge): add drag-and-drop reordering for PDF pages
fix(compress): resolve memory leak in Web Worker cleanup
ui(toolbar): redesign action bar with glassmorphism card style
chore(deps): upgrade pdfjs-dist to v5.5.207
docs(contributing): add branch naming convention guide
```

**Rules:**
- Use the **imperative mood** in the summary ("add feature" not "added feature")
- Keep the summary under **72 characters**
- No period at the end of the summary line
- For complex changes, add a blank line after the summary and write a longer description below

---

## 7. Code Quality & Linting

This project uses **ESLint** with strict rules. Please treat linting as mandatory, not optional.

### Run the Linter

```bash
npm run lint
```

Fix all errors before pushing. PRs with lint errors will not be merged.

### Important Rules

- **Do NOT remove `eslint-disable` comments** unless you have been explicitly asked to do so by a maintainer. These suppressions exist for specific, known reasons (often related to pdf-lib or pdfjs-dist interop). Removing them without understanding the context can introduce subtle bugs.

- **Do NOT add new `eslint-disable` comments** without leaving a code comment explaining *why* the rule is being disabled. Blind suppression is not acceptable:

  ```js
  // ❌ Bad
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { ... }, []);

  // ✅ Good
  // Intentionally omitting `processFile` from deps — it's a stable ref created
  // outside the component and would cause an infinite re-render loop if included.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { ... }, []);
  ```

- **Keep components focused.** If a file is growing beyond ~200–300 lines, consider splitting it.
- **No `console.log` left in production code.** Use them during development, but remove or comment them before submitting your PR.

---

## 8. Testing & CI/CD

We rely on **Vitest** for lightning-fast, lightweight unit and integration testing. 

To keep the development environment accessible to all students and contributors, we intentionally **do not** use heavy browser testing frameworks (like Playwright or Cypress). This ensures you won't have to download massive browser binaries just to contribute.

### Running Tests Locally

Before opening a Pull Request, you **must** run the test suite locally to ensure your changes don't break the core PDF logic:

```bash
npm run test
```

### The CI/CD Gatekeeper

We use a GitHub Actions pipeline that acts as an automated gatekeeper. **Any Pull Request that fails linting (`npm run lint`) or unit tests (`npm run test`) will be automatically blocked.** Please save everyone time by verifying your code locally first!

---

## 9. Submitting a Pull Request

When you open a PR, please:

1. **Use the PR template** (if one is provided) — fill every section.
2. **Link the related Issue** in your PR description using GitHub keywords:
   ```
   Closes #42
   ```
3. **Write a clear description** of *what* changed and *why*, not just *how*.
4. **Add screenshots or a short screen recording** for any UI changes. This makes review dramatically faster.
5. **Keep PRs small and focused.** A PR that changes 5 files for one feature is much easier to review than one that changes 30 files for three features.
6. **Be responsive to review comments.** If a maintainer requests changes, please address them within a reasonable time. Stale PRs may be closed.

### PR Checklist

Before clicking "Create Pull Request", verify:

- [ ] My branch is up to date with `upstream/main`
- [ ] `npm run dev` runs without errors
- [ ] `npm run lint` passes with zero errors
- [ ] `npm run test` passes with all tests green
- [ ] I have not removed any `eslint-disable` comments
- [ ] No PDF data is sent to any external server or API
- [ ] My UI changes match the existing dark glassmorphism design
- [ ] My PR is linked to an open Issue (`Closes #XX`)
- [ ] I've included screenshots/recordings for UI changes
- [ ] I have not committed `.env.local` or any real API keys

---

## 10. Getting Help

Stuck? Have a question? Here's how to get support:

- **GitHub Issues** — The best place for bug reports, feature requests, and questions related to the codebase.
- **GitHub Discussions** — Great for broader ideas, "how do I approach this?" questions, or general feedback.
- **PR Comments** — If you're unsure about a specific implementation detail mid-PR, leave a comment in the PR and tag a maintainer.

We understand that many contributors here are students participating in open-source programs like **NSOC**. No question is too basic. If something in this guide is unclear, please open an issue or discussion — that feedback helps us improve the docs for everyone.

---

<div align="center">

**Thank you for contributing to QuickPDF.**
*Every commit helps protect user privacy. That matters.*

</div>
