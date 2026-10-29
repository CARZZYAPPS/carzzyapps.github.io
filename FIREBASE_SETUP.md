# Firebase setup

The site remains hosted on GitHub Pages. Contact submissions are stored in the
Firebase project used by the feedback form so they appear in the admin dashboard;
the existing Formcarry service continues to email each submission.

## Shared contact and feedback project

1. Select the Firebase project used by the admin dashboard and configure its Web App in `feedback/firebase-config.js`.
2. Create a Firestore database in that project and deploy `feedback/firestore.rules` in that project's Firestore Rules editor. These rules allow public submissions, signed-in reads, and deny updates and deletes for both collections.
3. Enable **Email/Password** under **Authentication > Sign-in method** for the admin app. Create admin accounts through the Firebase console or a trusted administrative process; do not add a public sign-up flow.
4. Sign in to `admin.carzzyapps.com` and open the **Contact Form** tab to view documents from `contactSubmissions`.

Each valid contact submission is first saved to Firestore, then submitted to Formcarry for email delivery. If the Firestore save fails, the form still submits to Formcarry and shows a warning.

The Firebase web configuration is public client configuration. Do not put service-account JSON, private keys, or other server credentials in this repository.

## Crema Rush cloud saves

Crema Rush (`/Crema-Rush/` and `/Crema-Rush/better.html`) saves progress to the
Firebase project configured in `Crema-Rush/firebase-config.js`. Both game pages
load this game-specific config, so it can differ from the site-wide
`firebase-config.js`. Enable **Email/Password** and **Anonymous** under
**Authentication > Sign-in method**, then deploy the root `firestore.rules`
file to this project's Firestore database.

When signed out, both games offer three choices: continue as a guest, sign up,
or sign in. Guest mode uses Firebase Anonymous Authentication and a server
function generates a unique guest username, saved in the public `usernames`
collection. Guest progress is saved to Firestore under the anonymous UID, as
well as locally on the device. Firebase Auth keeps the guest session on that
browser so it can load the same UID after a reload; a guest username is not a
password and cannot sign in on another device. Choosing **Switch account** and
then signing up links the guest session to the new email account without
changing its UID or losing the saves.

Players can also create a registered account with a unique username, email
address, and password. The email is the account's Firebase Authentication
email; players can sign in with either their username or email. The
email-to-username lookup is kept in the server-only `usernameAuthLookup`
collection and is never exposed through public Firestore reads.

Username registration and username sign-in require the Firebase callable
functions in `functions/`. Enable Firebase Authentication Email/Password and
the Identity Toolkit API, select the Blaze plan for Cloud Functions, then
install and deploy the functions:

```powershell
cd "C:\path\to\CARZZYAPPS.github.io\functions"
npm install
cd ..
firebase deploy --only functions --project YOUR_FIREBASE_PROJECT_ID
```

Replace `YOUR_FIREBASE_PROJECT_ID` with the `projectId` value in
`Crema-Rush/firebase-config.js`. During first deploy, set
`FIREBASE_WEB_API_KEY` to the public `apiKey` value from that same config when
prompted. This key is not a private credential.
Deploy Firestore rules separately with
`firebase deploy --only firestore:rules --project YOUR_FIREBASE_PROJECT_ID`.

Sign-in has an optional **Stay signed in on this device** choice. When selected,
Firebase Auth uses browser-local persistence and the site records
`localStorage.signIn` as `"true"`. When unchecked, Firebase Auth uses
browser-session persistence and the site removes that local-storage marker.
Firebase Auth remains the source of truth for authentication. Signed-in
username accounts can change their username after confirming their password.
The rename updates the Firestore username mappings while retaining the same
Firebase Auth email, UID, and saved game progress.

Tycoon saves are stored at `cremaTycoonSaves/{uid}`. Original Crema Rush best
score and shift summaries are stored at `cremaRushProgress/{uid}`. This includes
anonymous guest UIDs. Both collections can only be read or changed by the
matching authenticated user.
Local browser saves remain available as an offline fallback; Tycoon saves are
isolated by account on the same device, and Crema Rush progress is namespaced
by account. Username password recovery is not available yet, so players should
keep their password safe.

## Verify

After publishing the files to GitHub Pages and deploying the rules, submit the
contact form once and confirm a document appears under `contactSubmissions` in
the admin dashboard and an email is delivered by Formcarry. Submit feedback at
`/feedback/` and confirm a document with the username, email, rating, reason,
and timestamp appears under `feedbackSubmissions`. The username should match
the one shown on the Rhythm Runner leaderboard.

Open either game while signed out and verify the three choices are shown.
Continue as a guest and confirm a generated username appears in `usernames`.
Play each game and confirm documents appear in `cremaTycoonSaves` and
`cremaRushProgress` under the guest's anonymous UID. Reload and verify the same
guest session and saves load. Use **Switch account**, sign up, and verify
registered saves use the new account UID. Sign out and sign in with its
username, then verify the same saves load. Confirm a different account cannot
read or overwrite either user's documents.

## Feedback admin access

Feedback documents are created publicly and can be read only by signed-in users.
Updates and deletes are denied. The separate admin app should use the feedback
project's Firebase Authentication email/password sign-in only
(`signInWithEmailAndPassword`), with no public sign-up UI. Create accounts
through the Firebase console or another trusted process, and use the feedback
project's Firebase config in the admin app.

## Next backend candidates

The repository also contains an in-memory `api/score.js` implementation, but no
checked-in frontend currently calls it. A Firestore leaderboard should be added
once the target game and its score submission contract are identified.