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
site's `carzzy-apps` Firebase project. The shared web config is in
`firebase-config.js`. Enable **Email/Password** under
**Authentication > Sign-in method**, then deploy the root `firestore.rules`
file to this project's Firestore database.

Players create or sign in with a unique username and password. Username
accounts use Firebase Email/Password Authentication with an internal
`@players.carzzyapps.com` address; players do not need to provide an email.
Existing anonymous save sessions can be upgraded to a username without
changing their Firebase UID. Existing Carzzy email accounts can continue
signing in from the site's email sign-in page.

Tycoon saves are stored at `cremaTycoonSaves/{uid}`. Original Crema Rush best
score and shift summaries are stored at `cremaRushProgress/{uid}`. Both
collections can only be read or changed by the matching authenticated user.
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

Open `/Crema-Rush/better.html`, create a username, start a café, and confirm a
document appears in `cremaTycoonSaves` with the account UID as its document ID.
Sign out, reload, and sign in with that username to confirm the same café
progress loads. Then play a shift in `/Crema-Rush/` and confirm a document
appears in `cremaRushProgress` under that UID. Sign out and sign in on either
game to confirm the username accesses its saved data. Confirm a different
username cannot read or overwrite either document.

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