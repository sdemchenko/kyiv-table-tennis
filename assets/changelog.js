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
                date: formatDate(new Date(commit.commit.author.date)),
                message: commit.commit.message,
                sha: commit.sha,
            }));
            let $changelog = $('#changelog').empty();
            for (let i = 0; i < history.length - 1; i++) {
                let entry = history[i];
                let prevSha = i + 1 < history.length ? history[i + 1].sha : '';
                console.log(entry.sha, prevSha)
                $changelog.append(`<a href="#" class="diff-link" data-sha="${entry.sha}" data-prevsha="${prevSha}">
                                            <span class="date">${escapeHtml(entry.date)}</span> &nbsp; ${escapeHtml(entry.message)}</a><br>`);
            }
        })
        .catch(err => console.error('Failed to fetch changelog:', err));
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
    $('<div id="diff-overlay-dialog"></div>')
        .html(`<pre style="white-space:pre-wrap;overflow:auto;">${diffHtml}</pre>`)
        .dialog({
            title: "DIFF",
            width: 800,
            maxHeight: 600,
            modal: true,
            buttons: {
                Close: function() { $(this).dialog("close"); }
            }
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