const repoOwner = 'sdemchenko';
const repoName = 'kyiv-table-tennis';
const numCommits = 30;
const query = `
      query($owner: String!, $name: String!, $path: String!, $n: Int!) {
        repository(owner: $owner, name: $name) {
          ref(qualifiedName: "refs/heads/main") {
            target {
              ... on Commit {
                history(first: $n, path: $path) {
                  nodes {
                    oid
                    committedDate
                    message
                  }
                }
              }
            }
          }
        }
      }
    `;
const defaultOptions = {};
const auth = 'Bearer github' + '_pat_' + '11AAJTWWI0rnqJPqlnoGmw_lQBGAFXw3RuPiN6o30rMaMi4QJBSbUioASdId9pMDlq5YQLMWNAS4nFUXLH';

function renderChangelog(history) {
    let $changelog = $('#changelog').empty();
    for (let i = 0; i < history.length - 1; i++) {
        let entry = history[i];
        let prevSha = i + 1 < history.length ? history[i + 1].sha : '';
        $changelog.append(`<li><a href="#" class="diff-link" data-sha="${entry.sha}" data-prevsha="${prevSha}">
                                            <span class="date">${escapeHtml(entry.date)}</span>${escapeHtml(entry.message)}</a></li>`);
    }
}

function fetchChangelog() {
    const filename = $('#scheduleContainer').attr('data-src');
    fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/commits?path=${filename}&sha=main&per_page=${numCommits}&cacheBuster=${getCacheKey()}`)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .then(commits => {
            const history = commits.map(commit => ({
                date: formatDateForChangelog(new Date(commit.commit.author.date)),
                message: commit.commit.message,
                sha: commit.sha,
            }));
            renderChangelog(history);
        })
        .catch(err => {
            console.error('Failed to fetch changelog:', err);
            fetchChangelogUsingGraphQL();
        });
}

function fetchChangelogUsingGraphQL() {
    const filename = $('#scheduleContainer').attr('data-src');
    const variables = {
        owner: repoOwner,
        name: repoName,
        path: filename,
        n: numCommits
    };
    fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': auth
        },
        body: JSON.stringify({query, variables})
    })
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .then(json => {
            if (json.errors) {
                throw new Error(json.errors.map(e => e.message).join('; '));
            }
            const nodes = json.data?.repository?.ref?.target?.history?.nodes || [];
            const history = nodes.map(n => ({
                date: formatDateForChangelog(new Date(n.committedDate)),
                message: n.messageHeadline || n.message || '',
                sha: n.oid
            }));

            renderChangelog(history);
        })
        .catch(err => console.error('Failed to fetch changelog using GraphQL:', err));
}

function formatDateForChangelog(d) {
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

$(document).on('click', '.diff-link', function (e) {
    e.preventDefault();
    const currSha = $(this).data('sha');
    const prevSha = $(this).data('prevsha');
    Promise.all([
        fetchFileContent(currSha), // You write this
        prevSha ? fetchFileContent(prevSha) : Promise.resolve('')
    ]).then(([currMd, prevMd]) => {
        const diffArray = Diff.diffLines(cleanUpMarkup(prevMd), cleanUpMarkup(currMd));
        const diffHtml = formatDiffForDialog(diffArray);
        showDiffOverlay(diffHtml);
    });
});

function cleanUpMarkup(md) {
    return md
        .replace(/^\[\/\/].*\n?/gm, '\n')   // Remove comments from Markdown content (lines starting with '[//]')
        .replace(/^(\s*\n)+/, '')           // Remove empty lines at the beginning of the file
        .replace(/[*]/g, '•')               // Bullets instead of asterisks
        .replace(/<h3[^>]*>([^<]+)<\/h3>/g, (_, text) => '**' + text + '**'); // Day of the week
}

function fetchFileContent(sha, options = defaultOptions) {
    const filename = $('#scheduleContainer').attr('data-src');
    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filename}?ref=${sha}`;

    return fetch(url, options)
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
        .then(data => {
            const b64 = data.content.replace(/\n/g, '');
            const binary = atob(b64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; ++i) {
                bytes[i] = binary.charCodeAt(i);
            }
            return new TextDecoder('utf-8').decode(bytes);
        })
        .catch(err => {
            if (options === defaultOptions) {
                console.error('Failed to fetch file content:', err);
                return fetchFileContent(sha, {headers: {'Authorization': auth}});
            } else {
                return "Failed to fetch file content. Please try again later. If the problem persists, please contact the site administrator."
            }
        });
}

function isUkrainian() {
    return document.documentElement.lang === 'uk';
}

function showDiffOverlay(diffHtml) {
    $('#diff-overlay-dialog').remove();

    const bodyMaxWidth = 860;
    const viewportW = $(window).width();
    const viewportH = $(window).height();
    const dlgW = Math.min(Math.max(320, viewportW - 32), bodyMaxWidth);
    const dlgH = Math.min(Math.max(300, viewportH - 32), 800);
    const $dlg = $('<div id="diff-overlay-dialog"></div>')
        .html(`<div class="diff-overlay-content" style="width:100%;height:100%;overflow:auto;">
                    <pre style="white-space:pre;display:inline-block;min-width:100%;">${diffHtml}</pre>
               </div>`)
        .dialog({
            title: isUkrainian() ? 'Зміни' : 'Changes',
            width: dlgW,
            height: dlgH,
            modal: true,
            resizable: true,
            draggable: true,
            position: {my: "center", at: "center", of: window},
            buttons: [
                {
                    text: isUkrainian() ? 'Закрити' : 'Close',
                    click: function () {
                        $(this).dialog("close");
                    }
                }
            ],
            close: function () {
                $(window).off('resize.diffdlg');
            }
        });

    // Keep the dialog within the viewport on resize
    $(window).on('resize.diffdlg', function () {
        const w = $(window).width();
        const h = $(window).height();
        $dlg.dialog('option', {
            width: Math.min(Math.max(320, w - 32), bodyMaxWidth),
            height: Math.min(Math.max(300, h - 32), 800),
            position: {my: "center", at: "center", of: window}
        });
    });
}

function formatDiffForDialog(diffArray) {
    return diffArray.map(part => {
        let val = markdownBoldToHtml(markdownLinksAndImagesToHtml(escapeHtml(part.value)));
        if (part.added) return `<span class="diff-added">${val}</span>`;
        if (part.removed) return `<span class="diff-removed">${val}</span>`;
        return `<span>${val}</span>`;
    }).join('');
}

function markdownLinksAndImagesToHtml(markdown) {
    // Links first (images have ! prefix)
    let result = markdown.replace(
        /\[([^\]]+?)\]\(([^)]+?)(?:\s+"([^"]+)")?\)/g,
        (match, text, url, title) => {
            const titleAttr = title ? ` title="${title}"` : '';
            return `<a href="${url}" ${titleAttr}>${text}</a>`;
        }
    );
    // Images
    result = result.replace(
        /!\[([^\]]+?)\]\(([^)]+?)(?:\s+"([^"]+)")?\)/g,
        (match, alt, url, title) => {
            const titleAttr = title ? ` title="${title}"` : '';
            return `<img src="${url}" alt="${alt}" ${titleAttr}>`;
        }
    );
    return result;
}

function markdownBoldToHtml(text) {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong style="font-size: larger">$1</strong>')
        .replace(/__(.*?)__/g, '<strong>$1</strong>');
}