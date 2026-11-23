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
