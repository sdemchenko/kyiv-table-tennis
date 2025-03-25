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
 * (1) Fetch news.html,
 * (2) replace the initial (SEO) content of <tt>div#newsContainer</tt> with the fetched HTML.
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
 * (1) Fetch schedule.md,
 * (2) transform the fetched markdown content to HTML,
 * (3) replace the initial (SEO) content of <tt>div#scheduleContainer</tt> with the HTML.
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

screen.orientation.onchange = function() {
    let htmlElement =  $("html");
    let bodyElement = $("body");
    if($(window).innerWidth() < $(window).innerHeight()) {//landscape to portrait
        htmlElement.css("overflow-x","hidden");
        bodyElement.css("overflow-x", "hidden");
    } else {//portrait to landscape
        htmlElement.css("overflow","auto");
        bodyElement.css("overflow", "auto");
        //below 2 lines makes the UI not shrink in portrait mode
        htmlElement.css("overflow-x","auto");
        bodyElement.css("overflow-x", "auto");
    }
}