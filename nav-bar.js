// Shared site script: loads the feedback popup and runs the navbar
// (current-page highlight, account dropdown, mobile drawer, sign-in state).
// The navbar markup itself is built into each page by Jekyll from
// _includes/navbar.html, so it shows up without waiting for this script.

const feedbackPopupScript = document.createElement('script');
feedbackPopupScript.src = '/feedback-popup.js';
document.head.appendChild(feedbackPopupScript);

(function () {
    // Same Firebase project the /auth pages sign people in to. The navbar uses
    // its own SDK version so its app never clashes with a page's own
    // initializeApp() call; sign-in state is still shared (same site storage).
    const FIREBASE_VERSION = '10.14.0';
    const FIREBASE_CONFIG = {
        apiKey: 'AIzaSyAgu1uiobgixRWcvIja6bI1l6M2KQ36FL4',
        authDomain: 'www.carzzyapps.com',
        projectId: 'carzzy-apps'
    };
    const CACHE_KEY = 'czNavUser';

    let auth = null;
    let firebaseAuth = null;

    function normalisePath(path) {
        path = decodeURIComponent(path).toLowerCase().replace(/index\.html$/, '');
        return path.endsWith('/') ? path : path + '/';
    }

    function markCurrentPage() {
        const here = normalisePath(location.pathname);
        document.querySelectorAll('.cz-link, .cz-drawer-link').forEach(link => {
            const target = normalisePath(new URL(link.href).pathname);
            const isCurrent = target === '/' ? here === '/' : here.startsWith(target);
            if (isCurrent) link.setAttribute('aria-current', 'page');
        });
    }

    // ---------- Signed-in state ----------

    function readCache() {
        try { return JSON.parse(localStorage.getItem(CACHE_KEY)); } catch (e) { return null; }
    }

    function writeCache(user) {
        try {
            if (user) localStorage.setItem(CACHE_KEY, JSON.stringify(user));
            else localStorage.removeItem(CACHE_KEY);
        } catch (e) { /* storage blocked: the navbar still works, it just can't remember */ }
    }

    function showUser(user) {
        const state = user ? 'in' : 'out';
        document.querySelectorAll('.cz-nav, .cz-drawer-backdrop').forEach(el => { el.dataset.auth = state; });
        if (!user) return;

        const name = user.name || 'Account';
        document.querySelectorAll('[data-cz-name]').forEach(el => { el.textContent = name; });
        document.querySelectorAll('[data-cz-email]').forEach(el => {
            el.textContent = user.email || '';
            el.hidden = !user.email;
        });
        document.querySelectorAll('[data-cz-avatar]').forEach(el => {
            el.textContent = '';
            if (user.photo) {
                const img = document.createElement('img');
                img.src = user.photo;
                img.alt = '';
                img.referrerPolicy = 'no-referrer';
                img.onerror = () => { el.textContent = name.charAt(0); };
                el.appendChild(img);
            } else {
                el.textContent = name.charAt(0);
            }
        });
        const button = document.querySelector('.cz-account-button');
        if (button) button.setAttribute('aria-label', 'Account menu for ' + name);
    }

    function userFromFirebase(u) {
        if (!u || u.isAnonymous) return null;
        // Right after Google sign-in, the Google name is on the profile for a
        // moment until /auth/google.js swaps in the username. That only
        // happens on /auth pages, so hide it there, unless it's also the
        // person's username (remembered by /auth/google.js).
        const google = u.providerData.find(p => p.providerId === 'google.com');
        const onAuthPage = location.pathname.startsWith('/auth/');
        let knownUsername = null;
        try { knownUsername = localStorage.getItem('czUsername:' + u.uid); } catch (e) { /* ignore */ }
        const isGoogleName = google && u.displayName === google.displayName && u.displayName !== knownUsername;
        const name = onAuthPage && isGoogleName ? '' : u.displayName;
        // The Google photo shows only for people who chose it as their
        // picture (saved by /auth/google.js; the navbar can't read Firestore).
        let choseGooglePhoto = false;
        try { choseGooglePhoto = localStorage.getItem('czGooglePhoto:' + u.uid) === '1'; } catch (e) { /* ignore */ }
        const photo = google && u.photoURL === google.photoURL && !choseGooglePhoto ? '' : u.photoURL;
        return {
            name: name || (u.email ? u.email.split('@')[0] : 'Account'),
            email: u.email || '',
            photo: photo || ''
        };
    }

    // Anyone signed in without a username (Google accounts start without one;
    // their Google name is removed on purpose, see /auth/google.js) is sent to
    // choose-username from any page, then brought back to it. Only the pages
    // needed to finish signing in are skipped.
    // (Don't compare against the Google name here: a username can match it,
    // and choose-username would send them straight back, in a loop.)
    const USERNAME_NOT_REQUIRED = ['/auth/sign-in', '/auth/sign-up', '/auth/choose-username', '/auth/action'];

    function needsUsername(u) {
        if (!u || u.isAnonymous || u.displayName) return false;
        const here = location.pathname.toLowerCase();
        return !USERNAME_NOT_REQUIRED.some(path => here.startsWith(path));
    }

    function watchSignIn() {
        const base = 'https://www.gstatic.com/firebasejs/' + FIREBASE_VERSION + '/';
        Promise.all([import(base + 'firebase-app.js'), import(base + 'firebase-auth.js')])
            .then(([appSdk, authSdk]) => {
                const app = appSdk.getApps().length ? appSdk.getApp() : appSdk.initializeApp(FIREBASE_CONFIG);
                firebaseAuth = authSdk;
                // Watch sign-in state only. getAuth() would also handle Google's
                // full-window sign-in and could take the result before the
                // sign-in page does, so leave out the popup/redirect handler.
                try {
                    auth = authSdk.initializeAuth(app, {
                        persistence: [authSdk.indexedDBLocalPersistence, authSdk.browserLocalPersistence, authSdk.browserSessionPersistence]
                    });
                } catch (e) {
                    auth = authSdk.getAuth(app);
                }
                // The /auth pages change the name and photo with their own copy
                // of Firebase; reload and redraw when they say so.
                window.addEventListener('cz-profile-changed', () => {
                    const u = auth.currentUser;
                    if (!u) return;
                    u.reload().catch(() => {}).then(() => {
                        const user = userFromFirebase(auth.currentUser);
                        writeCache(user);
                        showUser(user);
                    });
                });
                authSdk.onAuthStateChanged(auth, u => {
                    if (needsUsername(u)) {
                        try { sessionStorage.setItem('prevPage', location.href); } catch (e) { /* ignore */ }
                        location.replace('/auth/choose-username/');
                        return;
                    }
                    const user = userFromFirebase(u);
                    writeCache(user);
                    showUser(user);
                });
            })
            .catch(error => console.warn('Navbar could not check sign-in state:', error));
    }

    function signOut() {
        const done = () => {
            writeCache(null);
            try { localStorage.removeItem('signIn'); } catch (e) { /* ignore */ }
            if (location.pathname.startsWith('/auth/account')) location.href = '/';
            else location.reload();
        };
        if (auth && firebaseAuth) firebaseAuth.signOut(auth).then(done, done);
        else done();
    }

    // ---------- Menus ----------

    function initializeNavbar() {
        const nav = document.querySelector('.cz-nav');
        const backdrop = document.querySelector('.cz-drawer-backdrop');
        if (!nav || !backdrop || nav.dataset.ready) return;
        nav.dataset.ready = 'true';

        markCurrentPage();
        showUser(readCache());   // instant guess from last visit, confirmed by Firebase below
        watchSignIn();

        // Remember where people were so sign-in can send them back here.
        document.querySelectorAll('[data-cz-auth-link]').forEach(link => {
            link.addEventListener('click', () => {
                if (location.pathname.startsWith('/auth/')) return;
                try { sessionStorage.setItem('prevPage', location.href); } catch (e) { /* ignore */ }
            });
        });
        document.querySelectorAll('[data-cz-sign-out]').forEach(b => b.addEventListener('click', signOut));

        // Account dropdown (desktop) — on small screens the avatar opens the drawer.
        const accountButton = nav.querySelector('.cz-account-button');
        const accountMenu = nav.querySelector('.cz-account-menu');
        const smallScreen = window.matchMedia('(max-width: 1080px)');

        function setAccountMenu(open) {
            accountMenu.hidden = !open;
            accountButton.setAttribute('aria-expanded', String(open));
        }

        accountButton.addEventListener('click', () => {
            if (smallScreen.matches) return openDrawer();
            setAccountMenu(accountMenu.hidden);
        });
        document.addEventListener('click', event => {
            if (!accountMenu.hidden && !event.target.closest('.cz-account')) setAccountMenu(false);
        });

        // Drawer (small screens)
        const menuButton = nav.querySelector('.cz-menu-button');
        const closeButton = backdrop.querySelector('.cz-drawer-close');
        let previousOverflow = '';
        let opener = null;

        function openDrawer() {
            opener = document.activeElement;
            previousOverflow = document.body.style.overflow;
            backdrop.hidden = false;
            menuButton.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden';
            closeButton.focus();
        }

        function closeDrawer() {
            if (backdrop.hidden) return;
            backdrop.hidden = true;
            menuButton.setAttribute('aria-expanded', 'false');
            // Put back whatever the page had, instead of forcing "auto".
            document.body.style.overflow = previousOverflow;
            if (opener && opener.focus) opener.focus();
        }

        menuButton.addEventListener('click', openDrawer);
        closeButton.addEventListener('click', closeDrawer);
        backdrop.addEventListener('click', event => {
            if (event.target === backdrop || event.target.closest('.cz-drawer-link')) closeDrawer();
        });
        smallScreen.addEventListener('change', () => { closeDrawer(); setAccountMenu(false); });

        document.addEventListener('keydown', event => {
            if (event.key !== 'Escape') return;
            if (!accountMenu.hidden) { setAccountMenu(false); accountButton.focus(); }
            closeDrawer();
        });
    }

    // Fallback for a page that loads this script but wasn't built with the
    // include (for example a page missing its front matter): fetch the navbar.
    function ensureNavbar() {
        // Inside an iframe (e.g. the feedback form in the "Send Feedback"
        // popup) the page is part of another page that already has a navbar.
        if (window.self !== window.top) {
            document.documentElement.classList.add('cz-framed');
            document.querySelectorAll('.cz-nav, .cz-drawer-backdrop').forEach(el => el.remove());
            return;
        }
        if (document.querySelector('.cz-nav')) return initializeNavbar();
        fetch('/nav-bar.html')
            .then(response => {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.text();
            })
            .then(html => {
                if (html.includes('{% include')) throw new Error('nav-bar.html was not built by Jekyll');
                document.body.insertAdjacentHTML('afterbegin', html);
                initializeNavbar();
            })
            .catch(error => console.warn('Could not load the site navbar:', error));
    }

    if (document.body) ensureNavbar();
    else document.addEventListener('DOMContentLoaded', ensureNavbar);
})();
