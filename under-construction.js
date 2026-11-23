// "Under construction" gate for pages that only site admins may use for now.
//
// Usage: put this right after the navbar script, near the top of <body>:
//   <script src="/under-construction.js" data-feature="Jeopardy"></script>
//
// Everyone sees an "Under construction" screen over the page. Accounts with
// siteAdmins/{uid} { enabled: true } in Firestore (managed through
// .github/site-admins.json) can use the page normally. The navbar stays usable.
(function () {
    if (window.self !== window.top) return;

    const script = document.currentScript;
    const feature = (script && script.dataset.feature) || 'This page';
    const FIREBASE_VERSION = '10.14.0';
    const FIREBASE_CONFIG = {
        apiKey: 'AIzaSyAgu1uiobgixRWcvIja6bI1l6M2KQ36FL4',
        authDomain: 'carzzy-apps.firebaseapp.com',
        projectId: 'carzzy-apps'
    };

    const style = document.createElement('style');
    style.textContent = `
        #uc-gate { position: fixed; inset: 0; z-index: 998; display: flex; align-items: center; justify-content: center;
            padding: 96px 16px 16px; background: rgba(10, 10, 10, 0.97); color: #fff; text-align: center;
            font-family: 'Segoe UI', system-ui, sans-serif; }
        #uc-gate[hidden] { display: none; }
        #uc-gate .uc-box { max-width: 440px; padding: 30px 26px; border: 1px solid #00d1b2; border-radius: 16px;
            background: #111; box-shadow: 0 0 40px rgba(0, 209, 178, 0.15); }
        #uc-gate .uc-icon { font-size: 34px; line-height: 1; margin-bottom: 10px; }
        #uc-gate h2 { margin: 0 0 12px; color: #00d1b2; letter-spacing: 2px; font-size: 24px; }
        #uc-gate p { margin: 0 0 20px; line-height: 1.5; color: #ddd; }
        #uc-gate p.uc-warn { color: #ff6b6b; }
        #uc-gate .uc-actions { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
        #uc-gate a { display: inline-block; padding: 10px 20px; border-radius: 999px; font-weight: 700;
            text-decoration: none; border: 1.5px solid #00d1b2; }
        #uc-gate a.uc-primary { background: #00d1b2; color: #0a0a0a; }
        #uc-gate a.uc-secondary { color: #00d1b2; }
        #uc-gate a:hover { box-shadow: 0 0 18px rgba(0, 209, 178, 0.45); }
    `;
    document.head.appendChild(style);

    const gate = document.createElement('div');
    gate.id = 'uc-gate';
    gate.setAttribute('role', 'dialog');
    gate.setAttribute('aria-modal', 'true');
    gate.setAttribute('aria-labelledby', 'uc-gate-title');
    gate.innerHTML = `
        <div class="uc-box">
            <div class="uc-icon" aria-hidden="true">🚧</div>
            <h2 id="uc-gate-title">UNDER CONSTRUCTION</h2>
            <p id="uc-gate-message">Checking access…</p>
            <div class="uc-actions">
                <a class="uc-primary" id="uc-gate-signin" href="/auth/sign-in/" hidden>Sign in</a>
                <a class="uc-secondary" href="/">Back to home</a>
            </div>
        </div>`;

    const previousOverflow = document.documentElement.style.overflow;
    function show() {
        gate.hidden = false;
        document.documentElement.style.overflow = 'hidden';
    }
    function hide() {
        gate.hidden = true;
        document.documentElement.style.overflow = previousOverflow;
    }

    function mount() {
        document.body.appendChild(gate);
        show();
        const message = gate.querySelector('#uc-gate-message');
        const signIn = gate.querySelector('#uc-gate-signin');
        signIn.addEventListener('click', () => {
            try { sessionStorage.setItem('prevPage', location.href); } catch (e) { /* ignore */ }
        });

        function signedOut() {
            message.className = '';
            message.textContent = feature + ' is being worked on. Sign in with an admin account to use it.';
            signIn.textContent = 'Sign in';
            signIn.hidden = false;
        }
        function notAdmin() {
            message.className = 'uc-warn';
            message.textContent = "You're signed in, but your account is not an admin. " + feature + ' is only available to admins while it’s under construction.';
            signIn.textContent = 'Sign in with a different account';
            signIn.hidden = false;
        }

        const base = 'https://www.gstatic.com/firebasejs/' + FIREBASE_VERSION + '/';
        Promise.all([import(base + 'firebase-app.js'), import(base + 'firebase-auth.js'), import(base + 'firebase-firestore.js')])
            .then(([appSdk, authSdk, fsSdk]) => {
                const app = appSdk.getApps().length ? appSdk.getApp() : appSdk.initializeApp(FIREBASE_CONFIG);
                const db = fsSdk.getFirestore(app);
                authSdk.onAuthStateChanged(authSdk.getAuth(app), async user => {
                    if (!user || user.isAnonymous) { show(); return signedOut(); }
                    try {
                        const snap = await fsSdk.getDoc(fsSdk.doc(db, 'siteAdmins', user.uid));
                        if (snap.exists() && snap.data().enabled === true) return hide();
                    } catch (error) {
                        console.warn('Could not check admin status.', error);
                    }
                    show();
                    notAdmin();
                });
            })
            .catch(error => {
                console.warn('Could not check access:', error);
                signedOut();
            });
    }

    if (document.body) mount();
    else document.addEventListener('DOMContentLoaded', mount);
})();
