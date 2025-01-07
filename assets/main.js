$(document).ready(function () {
    useDarkOrLightSystemTheme();
    fetchNews();
    fetchSchedule();
    // incrementCounter();
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
 * Fetch news.html and insert its content at the beginning of 'newsContainer' div.
 */
function fetchNews() {
    fetch($('#newsContainer').attr('data-src') + '?t=' + Math.floor(new Date().getTime() / 10000), {})
        .then(function (response) {
            return response.text();
        })
        .then(function (data) {
            $('#newsContainer').html(data);
        })
        .catch(function (err) {
            console.log(err);
        });
}


/**
 * Fetch schedule.md, transform its markdown content to HTML, and replace the content of 'scheduleContainer' div with the HTML.
 */
function fetchSchedule() {
    fetch($('#scheduleContainer').attr('data-src') + '?t=' + Math.floor(new Date().getTime() / 10000), {})
        .then(function (response) {
            return response.text();
        })
        .then(function (data) {
            const markdown = new remarkable.Remarkable({
                html: true, // Enable HTML tags in source
            });
            $('#scheduleContainer').html(markdown.render(data));
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
