useDarkOrLightSystemTheme();

$(document).ready(function () {
    fetchSchedule();
    configureBackToTopButton();
    configureCheckboxesFilteringCompetitions();
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
            const md = window.markdownit({
                html: true // Enable HTML tags in source
            });
            $('#scheduleContainer').html(md.render(data));
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

function configureBackToTopButton() {
    let backToTop = $("#backToTop");
    $(window).scroll(function(){
        let height = 300; // Alternative: document.documentElement.clientHeight
        $(document).scrollTop() > height ? backToTop.show() : backToTop.hide();
    });
    backToTop.click(function() {
        $("html, body").scrollTop(0); // Alternative: $("html, body").animate({ scrollTop: 0 }, "fast");
        return false;
    });
}

function configureCheckboxesFilteringCompetitions() {
    $('#hideTournaments').click(function () {
        $("#scheduleContainer > ul > li:contains('🏆')").toggle();
    });
    $('#hideOtherCompetitions').click(function () {
        $("#scheduleContainer > ul > li:not(:contains('🏆'))").toggle();
    });
}
