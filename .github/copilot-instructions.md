# Copilot instructions for Carzzy Apps

## Repository overview

This repository is a static GitHub Pages site for a collection of small web apps and utilities. The site is not a framework app: it is mostly plain HTML, CSS, and vanilla JavaScript spread across the repo root and feature folders such as `Basketball/`, `Card-Games/`, `Leaderboards/`, `Rhythm-Runner/`, `scymores-games/`, and `trivia/`.

The main site entry points are the root `index.html` and the page folders that each contain their own `index.html` plus optional local `script.js` and `style.css` files. Shared chrome is centralized in `nav-bar.html` and injected by `nav-bar.js`.

## Build, test, and lint commands

No build toolchain, package manifest, test runner, or lint configuration was found in this repository.

- No `package.json` exists.
- No `.github/workflows/*` automation exists.
- No ESLint/Jest/Vitest/Playwright config files were found.
- There are no automated tests to run; there is no single-test command to use.

For manual validation, serve the repo locally from the root and test in a browser:

```bash
cd "C:\Users\avish\carzzyapps-firebase"
python -m http.server 8000
```

Then open `http://localhost:8000/` or the page-specific path you changed (for example `http://localhost:8000/contact-us/`).

## High-level architecture

- `index.html` is the homepage and acts as a catalog page listing the app sections.
- `nav-bar.html` and `nav-bar.js` define the shared navigation and mobile menu; most pages fetch the nav bar dynamically instead of duplicating markup.
- `firebase-config.js` holds the existing site's public Firebase web config; the feedback and contact forms use the admin project's `feedback/firebase-config.js`.
- `contact-us/firebase-contact.js` saves submissions to the admin project's `contactSubmissions` collection, then submits them to Formcarry for email delivery. If the Firestore write fails, it still submits to Formcarry.
- `feedback/index.html` is a modal-sized feedback form that writes to the admin Firebase project; `feedback/firestore.rules` allows public creation and signed-in reads for feedback and contact submissions, but denies updates and deletes.
- `firestore.rules` governs Firestore access for the existing site project; keep feedback-project rules in `feedback/firestore.rules`.
- `api/score.js` is a lightweight in-memory serverless API stub for score submissions and leaderboard data; it is not a durable production backend.
- Most feature pages are self-contained and do not rely on a shared framework or module bundler.

## Key conventions

- Preserve the folder-per-feature pattern: when adding a new section, keep it under its own directory with a local `index.html` and any related assets instead of mixing unrelated code into the repo root.
- Treat `nav-bar.html` as the source of truth for site navigation labels and URLs. If you change the menu, update both the desktop and mobile navigation markup together.
- Many links are intentionally absolute and point to `https://www.carzzyapps.com/...` rather than using relative paths. Keep that pattern when editing navigation, page redirects, or asset URLs unless a page is explicitly being moved to a different hosting setup.
- If you change Firebase behavior, keep both web config files as public client configuration only. Do not add service-account JSON, private keys, or backend credentials to the repo.
- Contact-form changes should preserve Formcarry email delivery in addition to Firestore collection, and must keep the Firebase config public client configuration only.
- Feedback submissions use the admin project's `feedbackSubmissions` collection and the username should match the Rhythm Runner leaderboard; preserve authenticated-read restrictions for both submission collections.
- `feedback-popup.js` displays the feedback form in a popup across the site; the standalone feedback form and separately hosted admin dashboard are excluded.
- Prefer plain HTML/CSS/JavaScript patterns already used across the repo instead of introducing bundlers, frameworks, or new build conventions without an explicit project need.
- For new static pages, follow the current repo style: dark theme, teal accent color (`#00d1b2`), and the existing shared layout patterns used by the homepage and navbar.

## Working style for this repo

- Keep changes minimal and page-scoped; most tasks involve a single HTML page plus optional related CSS/JS.
- Validate browser behavior manually after edits, especially for navigation, contact form flow, and content pages that rely on global shared scripts.
- When a page depends on a Firebase config object, ensure it checks for placeholder values before attempting to initialize Firebase.
- Preserve the static hosting model: GitHub Pages is the deployment target, and client-side code should work without a build step.
