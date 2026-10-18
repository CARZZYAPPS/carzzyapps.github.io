# Firebase setup

The site remains hosted on GitHub Pages. Firebase is used as the backend for
contact submissions, so no Firebase Hosting migration is required. Feedback
uses a separate Firebase project and configuration.

## Existing site/contact project

1. Open the [Firebase Console](https://console.firebase.google.com/), create or select a project, and add a Web App.
2. Copy the Web App configuration into `firebase-config.js`.
3. In **Firestore Database**, create a database and choose the region closest to your users.
4. Deploy the rules from `firestore.rules` in the Firestore Rules editor.

The Firebase web configuration is safe to publish. Do not put service-account
JSON, private keys, or other server credentials in this repository.

Replace each `REPLACE_WITH_...` value in the root `firebase-config.js` with the
values from the existing site's Firebase Web App configuration. Until then,
the contact form continues to use its existing Formcarry endpoint.

## Separate feedback project

1. In Firebase Console, create or select the separate project for feedback and add a Web App.
2. Copy that project's Web App config into `feedback/firebase-config.js`.
3. Create a Firestore database in the feedback project and deploy `feedback/firestore.rules` in that project's Firestore Rules editor.
4. Enable **Email/Password** under **Authentication > Sign-in method** for the separate admin app. Create admin accounts through the Firebase console or a trusted administrative process; do not add a public sign-up flow.

The feedback page at `/feedback/` uses only `feedback/firebase-config.js`; changing it
does not change the existing site's Firebase project or contact form.

## Verify

After publishing the files to GitHub Pages, submit the contact form once and
confirm a document appears under `contactSubmissions` in the existing site
project. Submit feedback at `/feedback/` and confirm a document with the username,
email, rating, reason, and timestamp appears under `feedbackSubmissions` in the
separate feedback project. The username should match the one shown on the
Rhythm Runner leaderboard.

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