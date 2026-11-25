// Carzzy Apps: legal pages (Privacy Policy, Terms of Use).
// - numbers each section and adds a "copy link" anchor to its heading
// - highlights the section you're reading in the "On this page" list
// - fills the reading-progress bar and the "N min read" chip
// - keeps the list open on wide screens, collapsed by default on phones
(function () {
    var body = document.querySelector('.pp-body');
    var toc = document.querySelector('.pp-toc');
    if (!body || !toc) return;

    var sections = Array.prototype.slice.call(body.querySelectorAll('section[id]'));
    var links = {};
    toc.querySelectorAll('ol a[href^="#"]').forEach(function (a) {
        links[a.getAttribute('href').slice(1)] = a;
    });

    // Section numbers + heading anchors
    sections.forEach(function (sec, i) {
        var h = sec.querySelector('h2');
        if (!h) return;
        var num = document.createElement('span');
        num.className = 'pp-num';
        num.setAttribute('aria-hidden', 'true');
        num.textContent = String(i + 1).padStart(2, '0');
        h.insertBefore(num, h.firstChild);

        var a = document.createElement('a');
        a.className = 'pp-anchor';
        a.href = '#' + sec.id;
        a.setAttribute('aria-label', 'Link to this section');
        a.textContent = '#';
        a.addEventListener('click', function () {
            var url = location.href.split('#')[0] + '#' + sec.id;
            if (navigator.clipboard) navigator.clipboard.writeText(url).catch(function () {});
            a.classList.add('is-copied');
            setTimeout(function () { a.classList.remove('is-copied'); }, 1400);
        });
        h.appendChild(a);
    });

    // Reading time
    var chip = document.querySelector('[data-pp="readtime"]');
    if (chip) {
        var words = (body.textContent || '').trim().split(/\s+/).length;
        chip.textContent = Math.max(1, Math.round(words / 220)) + ' min read';
        chip.hidden = false;
    }

    // Open on wide screens, collapsed on phones
    var box = toc.querySelector('details');
    var wide = window.matchMedia('(min-width: 901px)');
    function syncOpen() { if (box) box.open = wide.matches; }
    syncOpen();
    if (wide.addEventListener) wide.addEventListener('change', syncOpen);
    else if (wide.addListener) wide.addListener(syncOpen);
    // On phones, close the list after jumping to a section
    toc.querySelectorAll('ol a').forEach(function (a) {
        a.addEventListener('click', function () { if (box && !wide.matches) box.open = false; });
    });

    // Active section + progress
    var bar = toc.querySelector('.pp-progress span');
    var currentLabel = toc.querySelector('.pp-toc-current');
    var current = null;
    var ticking = false;
    function update() {
        ticking = false;
        var line = window.innerHeight * 0.3;
        var active = sections[0];
        for (var i = 0; i < sections.length; i++) {
            if (sections[i].getBoundingClientRect().top <= line) active = sections[i];
        }
        // At the very bottom, the last section counts as read
        var doc = document.documentElement;
        if (window.innerHeight + window.scrollY >= doc.scrollHeight - 4) active = sections[sections.length - 1];
        if (active !== current) {
            if (current && links[current.id]) links[current.id].classList.remove('is-active');
            if (active && links[active.id]) {
                links[active.id].classList.add('is-active');
                links[active.id].setAttribute('aria-current', 'true');
            }
            if (current && links[current.id]) links[current.id].removeAttribute('aria-current');
            current = active;
            if (currentLabel && active) {
                var h = active.querySelector('h2');
                currentLabel.textContent = h ? h.childNodes[1].textContent.trim() : '';
            }
        }
        if (bar) {
            var r = body.getBoundingClientRect();
            var total = r.height - window.innerHeight * 0.6;
            var done = Math.min(1, Math.max(0, (-r.top + window.innerHeight * 0.3) / Math.max(1, total)));
            bar.style.transform = 'scaleX(' + done.toFixed(3) + ')';
        }
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
})();
