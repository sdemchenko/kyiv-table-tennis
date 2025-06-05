const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)');
prefersDarkMode.addEventListener('change', () => updateTheme());
updateTheme();

function updateTheme() {
    const theme = prefersDarkMode.matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
}