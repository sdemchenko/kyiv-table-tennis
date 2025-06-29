// place name → <tr> with info about a club or court
const places = new Map();

$(document).ready(function () {
    configureBackToTopButton();
    configureCheckboxesFilteringCompetitions();
    populatePlacesMap();
    configurePlaceNameLinksToOpenPlaceInfoOverlay();
    fetchSchedule();
});

/**
 * (1) Fetch schedule.md,
 * (2) transform the fetched Markdown content to HTML,
 * (3) replace the initial (SEO) content of <tt>div#scheduleContainer</tt> with the HTML,
 * (4) makes club names in the schedule clicky, so that they open an overlay with the club info.
 */
function fetchSchedule() {
    fetch($('#scheduleContainer').attr('data-src') + '?cacheBuster=' + timestampNoOlderThanTenSeconds(), {})
        .then(function (response) {
            return response.text();
        })
        .then(function (data) {
            // Markdown with both HTML support and markdown-it-attrs plugin enabled
            const md = window.markdownit({html: true}).use(window.markdownItAttrs);

            const html = md.render(data);
            
            // Remove empty style attributes inserted by markdown-it-attrs
            const $parsed = $('<div>').html(html);
            $parsed.find('[style=""]').removeAttr('style');

            $('#scheduleContainer').html($parsed.html());
            
            makeClubNamesInTheScheduleClicky();
        })
        .catch(function (err) {
            console.log(err);
        });
}

/**
 * Timestamp to append to URLs to fetch fresh news and schedule.
 * Using ten-second staleness if the user hits the Refresh button repeatedly.
 */
function timestampNoOlderThanTenSeconds() {
    return Math.floor(new Date().getTime() / 10000);
}

function configureBackToTopButton() {
    const backToTop = $("#backToTop");
    $(window).scroll(function(){
        $(document).scrollTop() > 300 ? backToTop.show() : backToTop.hide();
    });
    backToTop.click(function() {
        window.scrollTo(0, 0);
    });
}

function configureCheckboxesFilteringCompetitions() {
    const tournamentMarkers = ['tournament', 'турнір', 'tournaments', 'турніри', 'cup', 'кубок', 'championship', 'чемпіонат'];
    $('#showTournaments').click(function () {
        $('#scheduleContainer > ul > li').filter(function () {
            return hasAnyDirectWholeWordCI($(this), tournamentMarkers);
        }).toggle();
    });
    $('#showOtherCompetitions').click(function () {
        $('#scheduleContainer > ul > li').filter(function () {
            return !hasAnyDirectWholeWordCI($(this), tournamentMarkers);
        }).toggle();
    });
}

function hasAnyDirectWholeWordCI($el, words) {
    const textNodes = Array.from($el[0].childNodes).filter(node => node.nodeType === Node.TEXT_NODE);

    return textNodes.some(node => {
        const text = node.textContent;

        return words.some(word => {
            // Build a word-boundary-safe regex for the word
            const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape regex metacharacters
            const regex = new RegExp(`(^|[^\\p{L}])(${escapedWord})(?!\\p{L})`, 'iu'); // Unicode-aware boundary
            return regex.test(text);
        });
    });
}

/**
 * In each text node in the schedule, convert the first occurrence of the club name into a link,
 * e.g. Orion will become <a data-place="Orion">Orion</a>.
 */
function makeClubNamesInTheScheduleClicky() {
    $('#scheduleContainer')
        .contents()
        .each(function processNode() {
            if (this.nodeType === Node.TEXT_NODE) {
                const nodeText = this.nodeValue;
                let replaced = false;

                for (const placeName of places.keys()) {
                    const index = nodeText.indexOf(placeName);
                    if (index !== -1) {
                        const before = nodeText.slice(0, index);
                        const after = nodeText.slice(index + placeName.length);

                        const $link = $(`<a data-place="${placeName}">${placeName}</a>`);

                        // Replace the text node with: before + <a> + after
                        $(this).replaceWith(document.createTextNode(before), $link[0], document.createTextNode(after));
                        replaced = true;
                        break; // only one match per node
                    }
                }

                if (!replaced) {
                    // Recurse into children if it's not a pure text node
                    $(this).contents().each(processNode);
                }
            } else if (this.nodeType === Node.ELEMENT_NODE) {
                $(this).contents().each(processNode);
            }
        });
}

function populatePlacesMap() {
    $('#t_clubs tbody tr, #t_courts tbody tr').each(function () {
        const $row = $(this);
        const $cell = $row.find('td:first');
        const name = $cell.text().trim();
        if (name) {
            places.set(name, $row.clone());
        }
    });
}

function configurePlaceNameLinksToOpenPlaceInfoOverlay() {
    const animationDuration = 100;
    const placeInfoOverlay = $('#placeInfoOverlay');

    // Show overlay near the clicked place name
    $(document).on('click', 'a[data-place]', function (e) {
        e.preventDefault();
        const placeName = $(this).data('place');
        const $row = places.get(placeName);
        if ($row) {
            // Populate overlay with the row
            const $clonedRow = $row.clone();
            
            // Is it better to display or hide the title in the overlay?
            // $clonedRow.find('td:first').remove();

            // Transform the row into a single column multi-row table
            const overlayTable = placeInfoOverlay.html(`<table><tbody></tbody></table>`);
            $clonedRow.find('td').each(function () {

                // Disable links in overlays to other overlays
                $(this).find('a[data-place]').each(function () {
                    $(this).replaceWith($('<span data-place="">').append($(this).text()));
                });

                if ($(this).text().trim() === '') {
                    return;
                }
                const $newRow = $('<tr></tr>');
                $newRow.append($(this)); // move the cell into the new row
                overlayTable.append($newRow);
            });

            // Position overlay below the clicked link and slightly to the right of the line start
            const leftOffset = 40;
            const scheduleContainer = $('#scheduleContainer');
            placeInfoOverlay.css({
                top: $(this).offset().top + $(this).outerHeight() + 5,
                left: scheduleContainer.offset().left + leftOffset,
                'max-width': (scheduleContainer.outerWidth() - leftOffset) + 'px'
            }).fadeIn(animationDuration);
        } else {
            console.warn(`No row found for place name "${placeName}"`);
        }
    });

    // Hide overlay when clicking outside it
    $(document).on('click', function (e) {
        const $triggerLink = $(e.target).closest('a[data-place]');

        if (
            !placeInfoOverlay.is(e.target) &&              // not clicking directly on overlay
            placeInfoOverlay.has(e.target).length === 0 && // not clicking inside overlay
            !$triggerLink.length                           // not clicking on 'a[data-place]' link
        ) {
            placeInfoOverlay.fadeOut(animationDuration);
        }
    });

    // Hide overlay on Escape key press
    $(document).on('keydown', function (e) {
        if (e.key === 'Escape' || e.keyCode === 27) {
            placeInfoOverlay.fadeOut(animationDuration);
        }
    });
    
}