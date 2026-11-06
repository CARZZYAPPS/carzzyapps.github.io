const feedbackPopupScript = document.createElement('script');
feedbackPopupScript.src = '/feedback-popup.js';
document.head.appendChild(feedbackPopupScript);

fetch('https://www.carzzyapps.com/nav-bar.html')
    .then(response => response.text())
    .then(navbar => {
        document.body.insertAdjacentHTML('afterbegin', navbar);
        // Re-initialize menu after fetch
        initializeMenu();
    });

function initializeMenu() {
    const menuIcon = document.querySelector('.menu-icon');
    const menuOverlay = document.querySelector('.menu-overlay');

    menuIcon.addEventListener('click', () => {
        menuOverlay.style.display = 'block';
        document.body.style.overflow = 'hidden';
    });

    menuOverlay.addEventListener('click', () => {
        menuOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    });
}

// Counts one site visit per browser session (feeds Lazer Arcade creator earnings).
(function countVisit() {
    try { if (sessionStorage.getItem('cz.visit')) return; sessionStorage.setItem('cz.visit', '1'); } catch (e) { return; }
    var doc = 'projects/carzzy-apps/databases/(default)/documents/arcadeStats/site';
    fetch('https://firestore.googleapis.com/v1/projects/carzzy-apps/databases/(default)/documents:commit?key=AIzaSyAgu1uiobgixRWcvIja6bI1l6M2KQ36FL4', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true,
        body: JSON.stringify({ writes: [{ transform: { document: doc, fieldTransforms: [{ fieldPath: 'plays', increment: { integerValue: '1' } }] } }] })
    }).catch(function () {});
})();
