//
// Open links to external resources in a new tab.
//
$(document).ready(function(){
    $('a[href^="http://"], a[href^="https://"]').attr('target','_blank');
});


//
// Automatically switch light / dark themes based on system preferences.
//
const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)')

function updateTheme() {
    const theme = prefersDarkMode.matches ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme)
}

updateTheme();
prefersDarkMode.addEventListener("change", () => updateTheme());

//
// Insert the content of news.html at the beginning of 'newsContainer' div.
//
$(document).ready(function(){
    fetch($('#newsContainer').attr('source') + '?t=' + new Date().getTime(), {})
        .then(function (response) {
            return response.text();
        })
        .then(function (data) {
            $('#newsContainer').prepend(data);
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

$(document).ready(function(){
    fetch($('#scheduleContainer').attr('source') + '?t=' + new Date().getTime(), {})
        .then(function (response) {
            return response.text();
        })
        .then(function (data) {
            $('#scheduleContainer').html(markdown.render(data));
        })
        .catch(function (err) {
            console.log(err);
        });
});
