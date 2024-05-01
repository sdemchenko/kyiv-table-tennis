
// Open links to external resources in a new tab

$(document).ready(function(){
    $('a[href^="http://"], a[href^="https://"]').attr('target','_blank');
});



// Automatically switch light / dark themes based on system preferences

const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)')

function updateTheme() {
    const theme = prefersDarkMode.matches ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme)
}

updateTheme();
prefersDarkMode.addEventListener("change", () => updateTheme());