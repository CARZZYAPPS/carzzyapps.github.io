// Shared site script: loads the feedback popup and wires up the navbar menu.
// The navbar markup itself is built into each page by Jekyll from
// _includes/navbar.html, so it shows up without waiting for this script.

const feedbackPopupScript = document.createElement('script');
feedbackPopupScript.src = '/feedback-popup.js';
document.head.appendChild(feedbackPopupScript);

(function () {
    function initializeMenu() {
        const button = document.querySelector('.cz-menu-button');
        const overlay = document.querySelector('.cz-menu-overlay');
        if (!button || !overlay || overlay.dataset.ready) return;
        overlay.dataset.ready = 'true';

        const closeButton = overlay.querySelector('.cz-menu-close');
        let previousOverflow = '';

        function openMenu() {
            previousOverflow = document.body.style.overflow;
            overlay.hidden = false;
            button.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden';
            if (closeButton) closeButton.focus();
        }

        function closeMenu() {
            if (overlay.hidden) return;
            overlay.hidden = true;
            button.setAttribute('aria-expanded', 'false');
            // Put back whatever the page had, instead of forcing "auto".
            document.body.style.overflow = previousOverflow;
            button.focus();
        }

        button.addEventListener('click', openMenu);
        // Clicking the dim background, the × or a link closes the menu.
        overlay.addEventListener('click', event => {
            if (event.target === overlay || event.target.closest('.cz-menu-close, .cz-menu-link')) closeMenu();
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') closeMenu();
        });
    }

    // Fallback for a page that loads this script but wasn't built with the
    // include (for example a page missing its front matter): fetch the navbar.
    function ensureNavbar() {
        if (document.querySelector('.cz-nav')) return initializeMenu();
        fetch('/nav-bar.html')
            .then(response => {
                if (!response.ok) throw new Error('HTTP ' + response.status);
                return response.text();
            })
            .then(html => {
                if (html.includes('{% include')) throw new Error('nav-bar.html was not built by Jekyll');
                document.body.insertAdjacentHTML('afterbegin', html);
                initializeMenu();
            })
            .catch(error => console.warn('Could not load the site navbar:', error));
    }

    if (document.body) ensureNavbar();
    else document.addEventListener('DOMContentLoaded', ensureNavbar);
})();
