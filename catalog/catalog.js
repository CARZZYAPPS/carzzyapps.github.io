/*
    Carzzy Apps catalog
    -------------------
    Every game and tool lives in the PROJECTS list below. The home page and
    the category pages (/games/, /tools/, /math/, /music/) are all built from it,
    so adding a project here makes it show up everywhere it belongs.

    cats:  the categories it appears in. The first one is its main category.
    kind:  the short label under the title.
    isNew: shows a "New" badge.
    soon:  shows a "Coming soon" badge (for projects still under construction).
    img:   the card picture (a 16:9 screenshot works best, e.g. /images/my-game.jpg).
           Leave it out and the card shows a teal pattern instead.
*/

var CATEGORIES = [
    { id: 'games', name: 'Games', url: '/games/', blurb: 'Rhythm, sports, puzzles and arcade challenges.' },
    { id: 'tools', name: 'Tools', url: '/tools/', blurb: 'Timers, calculators and everyday utilities.' },
    { id: 'math',  name: 'Math',  url: '/math/',  blurb: 'Calculators, converters and number fun.' },
    { id: 'music', name: 'Music', url: '/music/', blurb: 'Practice tools and games with a beat.' }
];

var PROJECTS = [
    {
        id: 'mastermind', img: '/images/mastermind.jpg',
        title: 'Mastermind', url: '/mastermind/',
        cats: ['games'], kind: 'Puzzle', featured: true,
        desc: 'Play the classic game of Mastermind online and try to crack the code in 10 moves or less.',
        tags: ['Singleplayer', 'Multiplayer']
    },
    {
        id: 'decrossybus', img: '/images/decrossybus.jpg',
        title: 'DeCrossyBus', url: 'https://carzzyapps.github.io/DeCrossyBus/',
        cats: ['games'], kind: 'Arcade',
        desc: 'Why did DeBus cross the road? To save us from copyright infringement, of course.',
        tags: ['Arcade', 'Mobile friendly']
    },
    {
        id: 'leaderboards', img: '/images/leaderboards.jpg',
        title: 'Leaderboards', url: 'https://carzzyapps.github.io/Leaderboards/',
        cats: ['games'], kind: 'High scores',
        desc: "See who's on top. Click here to view the leaderboards.",
        tags: ['Rankings']
    },
    {
        id: 'right-on-time', img: '/images/right-on-time.jpg',
        title: 'Right On Time', url: 'https://carzzyapps.github.io/right-on-time/',
        cats: ['games'], kind: 'Reflex challenge',
        desc: 'A stopwatch where you try to stop it exactly on the second.',
        tags: ['Timing', 'Quick play']
    },
    {
        id: 'rhythm-runner', img: '/images/rhythm-runner.jpg',
        title: 'Rhythm Runner', url: 'https://carzzyapps.github.io/Under-Construction/',
        cats: ['games', 'music'], kind: 'Endless runner',
        desc: 'An endless runner where you jump spikes and duck drones, all to a built-in soundtrack.',
        tags: ['Built-in music', 'Mobile friendly']
    },
    {
        id: 'hockey-shootout', img: '/images/hockey-shootout.jpg',
        title: 'Hockey Shootout', url: 'https://carzzyapps.github.io/Hockey-Shootout/',
        cats: ['games'], kind: 'Sports',
        desc: 'Exactly what it sounds like.',
        tags: ['Sports', 'Arcade']
    },
    {
        id: 'scymores-games', img: '/images/scymores-games.jpg',
        title: "Scymore's Games", url: '/scymores-games/',
        cats: ['games'], kind: 'Collection',
        desc: 'New games coming soon!',
        tags: ['Collection']
    },
    {
        id: '2k-hoops', img: '/images/2k-hoops.jpg',
        title: '2K Hoops', url: 'https://carzzyapps.github.io/Basketball/',
        cats: ['games'], kind: 'Sports · Made by ACM',
        desc: 'A fun online basketball game.',
        tags: ['Sports', 'Arcade', '❌ Not mobile friendly (yet!)']
    },
    {
        id: 'radical-clicker', img: '/images/radical-clicker.jpg',
        title: 'Radical Clicker', url: 'https://carzzyapps.github.io/Radical-Clicker/',
        cats: ['games', 'math'], kind: 'Clicker',
        desc: 'A clicker game that counts in radicals.',
        tags: ['Math', 'Idle']
    },
    {
        id: 'jeopardy', img: '/images/jeopardy.jpg',
        title: 'Jeopardy', url: 'https://carzzyapps.github.io/Under-Construction/',
        cats: ['games'], kind: 'Trivia', soon: true,
        desc: 'Have questions you want featured on a Jeopardy game? Send them in via the contact page.',
        tags: ['Trivia', 'Group play']
    },
    {
        id: 'carzzy-chords', img: '/images/carzzy-chords.jpg',
        title: 'Carzzy Chords', url: 'https://carzzyapps.github.io/Carzzy-Chords/',
        cats: ['music', 'tools'], kind: 'Piano practice', isNew: true,
        desc: 'The perfect tool to practice piano chords.',
        tags: ['Piano', 'Practice']
    },
    {
        id: 'metronome', img: '/images/metronome.jpg',
        title: 'Metronome', url: 'https://carzzyapps.github.io/Metronome/',
        cats: ['music', 'tools'], kind: 'Music tool',
        desc: 'An online metronome to keep your practice perfectly in time.',
        tags: ['Music', 'Practice']
    },
    {
        id: 'carzzy-countdown', img: '/images/carzzy-countdown.jpg',
        title: 'Carzzy Countdown', url: 'https://carzzyapps.github.io/carzzy-countdown/',
        cats: ['tools'], kind: 'Utility', isNew: true,
        desc: 'A simple, customizable countdown timer. Set a countdown for any event, save it, and share it with others.',
        tags: ['Save', 'Share']
    },
    {
        id: 'radical-stopwatch', img: '/images/radical-stopwatch.jpg',
        title: 'Radical Stopwatch', url: 'https://carzzyapps.github.io/Radical-Stopwatch/',
        cats: ['math'], kind: 'Utility',
        desc: 'A stopwatch that counts in radicals.',
        tags: ['Math', 'Timer']
    },
    {
        id: 'stat-calc', img: '/images/stat-calc.jpg',
        title: 'Statistics Calculator', url: 'https://carzzyapps.github.io/Stat-Calc/',
        cats: ['math', 'tools'], kind: 'Calculator',
        desc: 'Calculator for mean, median, mode, z-scores, and more.',
        tags: ['Statistics', 'Study']
    },
    {
        id: 'miles-km', img: '/images/miles-km.jpg',
        title: 'Miles ↔ Kilometers', url: '/miles-km-convert/',
        cats: ['math', 'tools'], kind: 'Converter',
        desc: 'Convert miles to kilometers, and vice versa, easily with our handy converter.',
        tags: ['Units', 'Quick']
    }
];

(function () {
    function esc(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    function inCat(catId) {
        return PROJECTS.filter(function (p) { return p.cats.indexOf(catId) !== -1; });
    }

    function catById(id) {
        for (var i = 0; i < CATEGORIES.length; i++) if (CATEGORIES[i].id === id) return CATEGORIES[i];
        return null;
    }

    function cardHTML(p, i) {
        var main = catById(p.cats[0]);
        var glow = (i * 37 + 15) % 100;
        var badges = '<span>' + esc(main ? main.name : '') + '</span>' + (p.isNew ? '<span class="new">New</span>' : '') + (p.soon ? '<span class="soon">Coming soon</span>' : '');
        var tags = (p.tags || []).map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('');
        var cta = p.cats[0] === 'games' ? 'Play' : 'Open';
        return '' +
            '<a class="cz-card" href="' + esc(p.url) + '" data-cover="' + esc(p.cats[0]) + '" style="--glow:' + glow + '%">' +
                '<span class="cz-cover' + (p.img ? ' has-img' : '') + '">' +
                    (p.img ? '<img class="cz-shot" src="' + esc(p.img) + '" alt="' + esc(p.title) + ' screenshot" loading="lazy" decoding="async">' : '') +
                    '<span class="cz-badges">' + badges + '</span>' +
                '</span>' +
                '<span class="cz-body">' +
                    '<span class="cz-kind">' + esc(p.kind) + '</span>' +
                    '<span class="cz-title">' + esc(p.title) + '</span>' +
                    '<span class="cz-desc">' + esc(p.desc) + '</span>' +
                    '<span class="cz-foot">' +
                        '<span class="cz-tags">' + tags + '</span>' +
                        '<span class="cz-play">' + cta + ' <span aria-hidden="true">→</span></span>' +
                    '</span>' +
                '</span>' +
            '</a>';
    }

    function catTileHTML(c, current) {
        var n = inCat(c.id).length;
        return '' +
            '<a class="cz-cat' + (c.id === current ? ' is-current' : '') + '" href="' + c.url + '" data-cover="' + c.id + '"' +
                (c.id === current ? ' aria-current="page"' : '') + '>' +
                '<span class="cz-cat-count">' + n + ' ' + (n === 1 ? 'project' : 'projects') + '</span>' +
                '<span class="cz-cat-name">' + esc(c.name) + '</span>' +
                '<span class="cz-cat-blurb">' + esc(c.blurb) + '</span>' +
                '<span class="cz-cat-go" aria-hidden="true">→</span>' +
            '</a>';
    }

    // <div data-cz="grid" data-cat="games"></div>   all projects in a category
    // <div data-cz="shelf" data-cat="games"></div>  scrolling row of a category
    // <div data-cz="cats" data-current="games"></div> category tiles
    // <span data-cz="count" data-cat="games"></span> number of projects (no data-cat = all)
    function render() {
        document.querySelectorAll('[data-cz]').forEach(function (el) {
            var type = el.getAttribute('data-cz');
            var cat = el.getAttribute('data-cat');
            if (type === 'grid' || type === 'shelf') {
                el.innerHTML = inCat(cat).map(cardHTML).join('');
            } else if (type === 'cats') {
                var cur = el.getAttribute('data-current');
                el.innerHTML = CATEGORIES.map(function (c) { return catTileHTML(c, cur); }).join('');
            } else if (type === 'count') {
                el.textContent = cat ? inCat(cat).length : PROJECTS.length;
            } else if (type === 'year') {
                el.textContent = new Date().getFullYear();
            }
        });

        // Shelf arrows
        document.querySelectorAll('[data-shelf-btn]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var shelf = document.getElementById(btn.getAttribute('aria-controls'));
                if (!shelf) return;
                var dir = btn.getAttribute('data-shelf-btn') === 'next' ? 1 : -1;
                shelf.scrollBy({ left: dir * shelf.clientWidth * 0.85, behavior: 'smooth' });
            });
        });

        // Cursor-follow glow
        document.querySelectorAll('.cz-card, .cz-cat').forEach(function (card) {
            card.addEventListener('pointermove', function (e) {
                var r = card.getBoundingClientRect();
                card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
                card.style.setProperty('--my', (e.clientY - r.top) + 'px');
            });
        });

        // Reveal on scroll
        var els = document.querySelectorAll('.reveal');
        if (!('IntersectionObserver' in window)) {
            els.forEach(function (el) { el.classList.add('in'); });
            return;
        }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
            });
        }, { rootMargin: '0px 0px -40px 0px', threshold: 0.06 });
        els.forEach(function (el) { io.observe(el); });
    }

    window.CarzzyCatalog = { projects: PROJECTS, categories: CATEGORIES, inCat: inCat };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
    else render();
})();
