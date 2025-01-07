$(document).ready(function () {
    useDarkOrLightSystemTheme();
    fetchNews();
    fetchSchedule();
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
 * Fetch news.html and replace the content of 'newsContainer' div with the HTML.
 */
function fetchNews() {
    fetch($('#newsContainer').attr('data-src') + '?t=' + timestampNoOlderThanTenSeconds(), {})
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
    fetch($('#scheduleContainer').attr('data-src') + '?t=' + timestampNoOlderThanTenSeconds(), {})
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

/**
 * Timestamp to append to URLs to fetch fresh news and schedule.
 * Using ten seconds staleness if the user hits Refresh button repeatedly.
 */
function timestampNoOlderThanTenSeconds() {
    return Math.floor(new Date().getTime() / 10000);
}
