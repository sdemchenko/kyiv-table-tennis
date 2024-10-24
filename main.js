//
// Open links to external resources in a new tab.
//
$(document).ready(makeLinksOpenInNewTab);

/* This web-site is not a usual one, it's a single page reference. So, it makes sense to open all links in new tabs. */
function makeLinksOpenInNewTab(){
    // all links except Table of Contents anchors should open in new tab:
    $('a').not('#toc a').not('#to_english').not('#to_ukrainian').attr('target','_blank');
}

//
// Automatically switch light / dark themes based on system preferences.
//
const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)')

function updateTheme() {
    const theme = prefersDarkMode.matches ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme)
}

updateTheme();
prefersDarkMode.addEventListener('change', () => updateTheme());

//
// Insert the content of news.html at the beginning of 'newsContainer' div.
//
$(function(){
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
});

//
// Transform the markdown content of schedule.md to HTML, then replace the content of 'scheduleContainer' div with the HTML.
//
const markdown = new remarkable.Remarkable({
    html: true, // Enable HTML tags in source
});

$(function(){
    fetch($('#scheduleContainer').attr('data-src') + '?t=' + new Date().getTime(), {})
        .then(function (response) {
            return response.text();
        })
        .then(function (data) {
            $('#scheduleContainer').html(markdown.render(data));
            makeLinksOpenInNewTab();
        })
        .catch(function (err) {
            console.log(err);
        });
});


//
// Increment the counter
//
$(function(){
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
});
