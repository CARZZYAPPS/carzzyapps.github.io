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

Crema Rush (`/Crema-Rush/`, `/Crema-Rush/no-graphics.html`, and
`/Crema-Rush/yes-graphics.html`) uses the Firebase project configured in
`Crema-Rush/firebase-config.js`, which can differ from the site-wide
`firebase-config.js`. It uses Firebase Authentication and Firestore directly;
Cloud Functions are not required. Enable **Email/Password** and **Anonymous**
under **Authentication > Sign-in method**, then deploy the root
`firestore.rules` file to this project's Firestore database.

When signed out, both games offer three choices: continue as a guest, sign up,
or sign in. Guest mode uses Firebase Anonymous Authentication and claims a
unique username in the public `usernames` collection using a Firestore
transaction. Each username mapping stores the UID, guest flag, and
display-cased username for leaderboard display. Guest progress is saved to
Firestore under the anonymous UID, as
well as locally on the device. Firebase Auth keeps the guest session on that
browser so it can load the same UID after a reload; a guest username is not a
password and cannot sign in on another device. Choosing **Switch account** and
then signing up links the guest session to the new email account without
changing its UID or losing the saves.

Players can also create a registered account with a unique username, email
address, and password. The email is the account's Firebase Authentication
email; sign-in uses that email and password. Username-based sign-in is not
available without a trusted backend, because securely resolving a username to
an email address cannot be done from public client code. Username uniqueness
is enforced by Firestore transactions and the `usernames` security rules.
The sign-in form's **Forgot password?** button sends a reset email to the
account email; player accounts do not need admin access to save usernames or
reset passwords.
Deploy the updated Firestore rules to the Crema Rush project:

```powershell
firebase deploy --only firestore:rules --project carzzy-apps
```

This works on Firebase Spark; no Cloud Functions billing plan or deployment is
needed. The Firebase web config is public client configuration and contains no
server credentials.

The admin workspace's **Crema Rush scores** section uses the same email and
password entered in its single admin sign-in form to sign in to this project;
there is no separate Crema Rush login. Enable Email/Password sign-in and make
sure the same admin email/password can sign in to both Firebase projects.
Firebase Auth users and UIDs are scoped to each project, so allowlist the UID
for this admin login in this project's Firestore console by creating
`adminUsers/{UID}` with `{ "enabled": true }`. Deploy the root rules after
adding the allowlist entry:

```powershell
firebase deploy --only firestore:rules --project carzzy-apps
```

The admin workspace must also be listed under **Authentication → Settings →
Authorized domains** in `carzzy-apps`. The rules allow the allowlisted admin
login to read progress and update only the `best` score and its timestamp;
other players can still edit only their own progress. Admin edits increment a
revision so a corrected score is not replaced by an older local high score the
next time that player opens the game.

Crema Rush saves each player's display username on their progress document and
adds an immutable `cremaRushScoreEvents` record for each successful game save
or admin correction. The admin **Recent score activity** panel shows the latest
20 events, including the player name, score, timestamp, and admin email for
corrections. Score and event writes are committed together, so failed saves
don't produce misleading activity records.

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
registered saves use the new account UID. Sign out and sign in with the account
email, then verify the same saves load. Confirm a different account cannot read
or overwrite either user's documents.

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