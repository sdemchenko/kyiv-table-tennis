const repoOwner = 'sdemchenko';
const repoName = 'kyiv-table-tennis';

function fetchChangelog() {
    const filename = $('#scheduleContainer').attr('data-src');
    fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/commits?path=${filename}&sha=main&per_page=30`)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .then(commits => {
            const history = commits.map(commit => ({
                date: formatDateShort(new Date(commit.commit.author.date)),
                message: commit.commit.message,
                sha: commit.sha,
            }));
            let $changelog = $('#changelog').empty();
            for (let i = 0; i < history.length - 1; i++) {
                let entry = history[i];
                let prevSha = i + 1 < history.length ? history[i + 1].sha : '';
                $changelog.append(`<a href="#" class="diff-link" data-sha="${entry.sha}" data-prevsha="${prevSha}">
                                            <span class="date">${escapeHtml(entry.date)}</span>&nbsp; ${escapeHtml(entry.message)}</a><br>`);
            }
        })
        .catch(err => console.error('Failed to fetch changelog:', err));
}

function formatDateShort(d) {
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`;
}

$(document).on('click', '.diff-link', function(e) {
    e.preventDefault();
    const currSha = $(this).data('sha');
    const prevSha = $(this).data('prevsha');
    Promise.all([
        fetchFileContent(currSha), // You write this
        prevSha ? fetchFileContent(prevSha) : Promise.resolve('')
    ]).then(([currMd, prevMd]) => {
        const diffArray = Diff.diffLines(cleanUpMarkdown(prevMd), cleanUpMarkdown(currMd));
        const diffHtml = formatDiffForDialog(diffArray);
        showDiffOverlay(diffHtml);
    });
});

function cleanUpMarkdown(md) {
    // Remove comments from Markdown content (lines starting with '[//]')
    // Then remove empty lines at the beginning of the file
    return md.replace(/^\[\/\/].*\n?/gm, '\n').replace(/^(\s*\n)+/, '');
}

function fetchFileContent(sha) {
    const filename = $('#scheduleContainer').attr('data-src');
    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filename}?ref=${sha}`;

    return fetch(url)
        .then(response => response.json())
        .then(data => {
            const b64 = data.content.replace(/\n/g, '');
            const binary = atob(b64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; ++i) {
                bytes[i] = binary.charCodeAt(i);
            }
            return new TextDecoder('utf-8').decode(bytes);
        });
}

function showDiffOverlay(diffHtml) {
    $('#diff-overlay-dialog').remove();

    const bodyMaxWidth = 860;
    const viewportW = $(window).width();
    const viewportH = $(window).height();
    const dlgW = Math.min(Math.max(320, viewportW - 32), bodyMaxWidth);
    const dlgH = Math.min(Math.max(300, viewportH - 32), 800);
    let isUkrainianLanguage = $('html').attr('lang') === 'uk';
    const $dlg = $('<div id="diff-overlay-dialog"></div>')
        .html(`<div class="diff-overlay-content" style="width:100%;height:100%;overflow:auto;">
                    <pre style="white-space:pre;display:inline-block;min-width:100%;">${diffHtml}</pre>
               </div>`)
        .dialog({
            title: isUkrainianLanguage ? 'Зміни' : 'Changes',
            width: dlgW,
            height: dlgH,
            modal: true,
            resizable: true,
            draggable: true,
            position: { my: "center", at: "center", of: window },
            buttons: [
                {
                    text: isUkrainianLanguage ? 'Закрити' : 'Close',
                    click: function () {
                        $(this).dialog("close");
                    }
                }
            ],
            close: function() {
                $(window).off('resize.diffdlg');
            }
        });

    // Keep the dialog within the viewport on resize
    $(window).on('resize.diffdlg', function() {
        const w = $(window).width();
        const h = $(window).height();
        $dlg.dialog('option', {
            width: Math.min(Math.max(320, w - 32), bodyMaxWidth),
            height: Math.min(Math.max(300, h - 32), 800),
            position: { my: "center", at: "center", of: window }
        });
    });
}

function formatDiffForDialog(diffArray) {
    // diffArray: result of Diff.diffLines(oldStr, newStr)
    return diffArray.map(part => {
        if (part.added) return `<span style="background:#e6ffe6">+ ${escapeHtml(part.value)}</span>`;
        if (part.removed) return `<span style="background:#ffe6e6">- ${escapeHtml(part.value)}</span>`;
        return `<span>${escapeHtml(part.value)}</span>`;
    }).join('');
}