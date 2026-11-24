# Instructions for Claude

## Git
- Always commit and push directly to the `main` branch. Never create or push to any other branch unless I explicitly ask.
- If a session starts on a different branch, switch to `main` (`git checkout main && git pull`) before committing.

## Shared auth scripts
- Pages import `/auth/google.js` and `/auth/username.js` with a version tag (e.g. `/auth/google.js?v=2`) so browsers don't use a stale cached copy. When you change either file, bump the `?v=` number everywhere it's imported (including inside `google.js`).
- To remove a name or photo from a Firebase profile, use `clearProfileFields` in `/auth/google.js`. `updateProfile(user, { displayName: null })` does not remove anything: the server treats null as "unchanged".
