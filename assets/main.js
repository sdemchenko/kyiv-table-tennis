$(document).ready(function () {
    useDarkOrLightSystemTheme();
    makeLinksOpenInNewTab();
    fetchNews();
    fetchSchedule();
    incrementCounter();
});

/**
 * Automatically switch light / dark themes based on system preferences.
 */
function useDarkOrLightSystemTheme() {

    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)');

    function updateTheme() {
        const theme = prefersDarkMode.matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
    }

    updateTheme();
    prefersDarkMode.addEventListener('change', () => updateTheme());
}

/**
 * This web-site is not a usual one, it's a single page reference. So, it makes sense to open in a new tab all links,
 * except Table of Contents links or the language switcher link.
 */
function makeLinksOpenInNewTab(){
    $('a').not('#toc a').not('#to_english').not('#to_ukrainian').attr('target','_blank');
}

/**
 * Fetch news.html and insert its content at the beginning of 'newsContainer' div.
 */
function fetchNews() {
    fetch($('#newsContainer').attr('data-src') + '?t=' + new Date().getTime(), {})
        .then(function (response) {
            return response.text();
        })
        .then(function (data) {
            $('#newsContainer').prepend(data);
            makeLinksOpenInNewTab();
        })
        .catch(function (err) {
            console.log(err);
        });
}


/**
 * Fetch schedule.md, transform its markdown content to HTML, and replace the content of 'scheduleContainer' div with the HTML.
 */
function fetchSchedule() {
    fetch($('#scheduleContainer').attr('data-src') + '?t=' + new Date().getTime(), {})
        .then(function (response) {
            return response.text();
        })
        .then(function (data) {
            const markdown = new remarkable.Remarkable({
                html: true, // Enable HTML tags in source
            });
            $('#scheduleContainer').html(markdown.render(data));
            makeLinksOpenInNewTab();
        })
        .catch(function (err) {
            console.log(err);
        });
}

function incrementCounter() {
    if (window.location.hostname === 'localhost') {
        return;
    }
    fetch('https://count.cab/hit/8CkvG1pF1f', {})
        .then(function (response) {
            return response.json();
        })
        .then(function (json) {
            // console.log(json);
        })
        .catch(function (err) {
            console.log(err);
        });
}
