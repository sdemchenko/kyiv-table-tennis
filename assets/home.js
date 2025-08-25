// place name → <tr> with info about a club or court
const places = new Map();

$(document).ready(function () {
    configureBackToTopButton();
    configureCheckboxesFilteringCompetitions();
    populatePlacesMap();
    configurePlaceNameLinksToOpenPlaceInfoOverlay();
    fetchSchedule();
    setInterval(fetchSchedule, 10 * 60 * 1000);
    incrementCounter();
});

/**
 * (1) Fetch schedule.md,
 * (2) transform the fetched Markdown content to HTML,
 * (3) replace the initial (SEO) content of <tt>div#scheduleContainer</tt> with the HTML,
 * (4) makes club names in the schedule clicky, so that they open an overlay with the club info.
 */
function fetchSchedule() {
    fetch($('#scheduleContainer').attr('data-src') + '?cacheBuster=' + getCacheKey())
        .then(function (response) {
            return response.text();
        })
        .then(function (data) {
            // Markdown with HTML support
            const md = window.markdownit({html: true});

            const html = md.render(data);

            // Minor prettification
            const $parsed = $('<div>').html(html);
            $parsed.find('[style=""]').removeAttr('style');
            insertTournamentMarkers($parsed);

            $('#scheduleContainer').html($parsed.html());
            
            makeClubNamesInTheScheduleClicky();
            updateTournamentsVisibility();
            updateOtherCompetitionsVisibility();
        })
        .catch(function (err) {
            console.log(err);
        });
}

/**
 * Returns a timestamp-based number.
 *  Use it to make the browser use a cached resource version for some milliseconds.
 */
function getCacheKey(ttlMs = 1000 * 60 * 10) {
    return Math.floor(Date.now() / ttlMs);
}

function insertTournamentMarkers(schedule) {
    
    function insertGlyphs(schedule, textToFind, glyph, keepFoundText) {
        const escapedWord = textToFind.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape regex metacharacters
        const regex = new RegExp(`(^|[^\\p{L}-])(${escapedWord})`, 'iu'); // Unicode-aware boundary

        schedule.contents().each(function processNode() {
            if (this.nodeType === Node.TEXT_NODE && this.nodeValue.trim() !== '') {
                const replaced = this.nodeValue.replace(regex, glyph + (keepFoundText ? '$2' : ''));
                if (replaced !== this.nodeValue) {
                    $(this).replaceWith(replaced);
                }
            } else if (this.nodeType === Node.ELEMENT_NODE) {
                $(this).contents().each(processNode);
            }
        })
    }
    
    const markRanking = ' <i class="fas fa-trophy tournament ranking"></i> ';
    const markNonRanking = ' <i class="fas fa-trophy tournament non-ranking"></i> ';
    
    insertGlyphs(schedule, '🏆', markRanking, false);
    insertGlyphs(schedule, 'ranking tournament', markRanking, true);
    insertGlyphs(schedule, 'рейтингов', markRanking, true);
    insertGlyphs(schedule, '🏅', markNonRanking, false);
    insertGlyphs(schedule, 'non-ranking tournament', markNonRanking, true);
    insertGlyphs(schedule, 'нерейтингов', markNonRanking, true);
}

function configureBackToTopButton() {
    const backToTop = $("#backToTop");
    function showOrHideBackToTop() {
        $(document).scrollTop() > 300 ? backToTop.show() : backToTop.hide();
    }
    $(window).scroll(function(){
        showOrHideBackToTop();
    });
    backToTop.click(function() {
        window.scrollTo(0, 0);
    });
    showOrHideBackToTop();
}

function configureCheckboxesFilteringCompetitions() {
    $('#showTournaments').click(updateTournamentsVisibility);
    $('#showOtherCompetitions').click(updateOtherCompetitionsVisibility);
}

function updateTournamentsVisibility() {
    const visible = $('#showTournaments').prop('checked');
    $('#scheduleContainer > ul > li')
        .filter((_, el) => isTournament($(el)))
        .toggle(visible);
}

function updateOtherCompetitionsVisibility() {
    const visible = $('#showOtherCompetitions').prop('checked');
    $('#scheduleContainer > ul > li')
        .filter((_, el) => !isTournament($(el)))
        .toggle(visible);
}

function isTournament($item) {
    const tournamentKeywords = ['tournament', 'турнір', 'кубок', 'чемпіонат', 'championship'];
    return $item.find('i.tournament').length > 0 || tournamentKeywords.some(word => $item.text().toLowerCase().includes(word));
}

/**
 * In each text node in the schedule, convert the first occurrence of the club name into a link,
 * e.g., Orion will become <a data-place="Orion">Orion</a>.
 */
function makeClubNamesInTheScheduleClicky() {
    $('#scheduleContainer > ul > li').each(function () {
        function processNode() {
            if (this.nodeType === Node.TEXT_NODE) {
                let node = this;

                // Keep replacing the earliest match until none remain in this text node
                while (true) {
                    const text = node.nodeValue;
                    let bestIndex = Infinity;
                    let bestName = null;

                    for (const placeName of places.keys()) {
                        const idx = text.indexOf(placeName);
                        if (idx !== -1) {
                            if (idx < bestIndex) {
                                bestIndex = idx;
                                bestName = placeName;
                            } else if (idx === bestIndex && bestName && placeName.length > bestName.length) {
                                // tie at the same position: prefer the longer name
                                bestName = placeName;
                            }
                        }
                    }

                    if (bestName == null) break; // no more matches in this node

                    const before = text.slice(0, bestIndex);
                    const after  = text.slice(bestIndex + bestName.length);

                    const $link = $(`<a data-place="${bestName}">${bestName}</a>`);
                    const afterNode = document.createTextNode(after);

                    $(node).replaceWith(
                        document.createTextNode(before),
                        $link[0],
                        afterNode
                    );

                    // continue scanning the remaining text
                    node = afterNode;
                }
            } else if (this.nodeType === Node.ELEMENT_NODE) {
                // Avoid re-linking inside existing links
                if (this.tagName !== 'A') {
                    $(this).contents().each(processNode);
                }
            }
        }

        $(this).contents().each(processNode);
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
            
            // Transform the row into a single column multi-row table
            const overlayTable = placeInfoOverlay.html(`<table><tbody></tbody></table>`).find('tbody');
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
            const leftOffset = 20;
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

function incrementCounter() {
    if (!/localhost|127.0.0.1/.test(location.hostname)) { // or !location.hostname.includes('localhost') && location.hostname !== '127.0.0.1'
        fetch('https://script.google.com/macros/s/AKfycbyzKAk-NftzR3dXIcZCx870WRzlF0gay5_rlC1MjaMHm9suCX5CAFKTmECaStJ89AS9/exec', {
            method: 'GET',
            mode: 'no-cors'
        }).catch((err) => {
            // Ignore errors — we don’t need a response
            console.warn('Counter fetch failed silently:', err);
        });
    }
}