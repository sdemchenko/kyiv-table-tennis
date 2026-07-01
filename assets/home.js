// place name → <tr> with info about a club or court
const places = new Map();

// Search/autocomplete records for shareable venue links.
const shareablePlaces = [];

$(document).ready(function () {
    configureBackToTopButton();
    configureCheckboxesFilteringCompetitions();
    populatePlacesMap();
    configurePlaceNameLinksToOpenPlaceInfoOverlay();
    configureShareVenueSearch();
    fetchSchedule();
    setInterval(fetchSchedule, 10 * 60 * 1000);
});

/**
 * (1) Fetch schedule.md,
 * (2) transform the fetched Markdown content to HTML,
 * (3) replace the initial (SEO) content of <tt>div#scheduleContainer</tt> with the HTML,
 * (4) make club names in the schedule clicky, so that they open an overlay with the club info.
 * (5) show/hide tournaments and ladders in the schedule based on the checkboxes.
 * (6) fetch and show the schedule changelog (a few dozens of the most recent changes).
 */
function fetchSchedule() {
    fetch($('#scheduleContainer').attr('data-src') + '?cacheBuster=' + getCacheKey())
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.text();
        })
        .then(data => {
            // Markdown with HTML support
            const md = window.markdownit({html: true});

            data = data.split('\n')
                .map(line => { // On narrow screens, show time and place on one line, and event description on the next.
                    return line.replace(/(^[*][^.]+[.][^.]+[.])/gm, '$1<br class="br-optional">')
                }).join('\n');

            const html = md.render(data);

            // Minor prettification
            const $parsed = $('<div>').html(html);
            highlightTournamentTiers($parsed);
            $parsed.find('[style=""]').removeAttr('style');

            $('#scheduleContainer').html($parsed.html());

            makeClubNamesInTheScheduleClicky();
            highlightToday();
            updateTournamentsVisibility();
            updateOtherCompetitionsVisibility();
            $('#schedule_error').hide();
            try {
                fetchChangelog();
            } catch (e) {
                console.error('Failed to fetch changelog:', e);
            }
        })
        .catch(err => {
            const d = new Date();
            const s = formatDate(d);
            $('#schedule_error_time').html(s);
            $('#schedule_error').show();
            console.log(err);
        });
}

/**
 * Returns a timestamp-based number.
 *  Use it to make the browser use a cached resource version for some milliseconds.
 */
function getCacheKey(ttlMs = 1000 * 60) {
    return Math.floor(Date.now() / ttlMs);
}

function configureBackToTopButton() {
    const backToTop = $("#backToTop");
    function showOrHideBackToTop() {
        $(document).scrollTop() > 300 ? backToTop.show() : backToTop.hide();
    }
    $(window).scroll(function(){
        showOrHideBackToTop();
    });
    showOrHideBackToTop();
}

function configureCheckboxesFilteringCompetitions() {
    let $showTournaments = $('#showTournaments');
    $showTournaments.prop('checked', localStorage.getItem('state_showTournaments') !== 'off');
    $showTournaments.click(updateTournamentsVisibility);
    let $showOtherCompetitions = $('#showOtherCompetitions');
    $showOtherCompetitions.prop('checked', localStorage.getItem('state_showOtherCompetitions') !== 'off');
    $showOtherCompetitions.click(updateOtherCompetitionsVisibility);
}

function updateTournamentsVisibility() {
    const visible = $('#showTournaments').prop('checked');
    localStorage.setItem('state_showTournaments', visible ? 'on' : 'off');
    $('#scheduleContainer > ul > li')
        .filter((_, el) => isTournament($(el)))
        .toggle(visible);
}

function updateOtherCompetitionsVisibility() {
    const visible = $('#showOtherCompetitions').prop('checked');
    localStorage.setItem('state_showOtherCompetitions', visible ? 'on' : 'off');
    $('#scheduleContainer > ul > li')
        .filter((_, el) => !isTournament($(el)))
        .toggle(visible);
}

function isTournament($item) {
    const tournamentKeywords = ['tournament', 'турнір', 'кубок', 'cup', 'чемпіонат', 'championship'];
    return tournamentKeywords.some(word => $item.text().toLowerCase().includes(word));
}

function highlightToday() {
    const dayIds = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayId = dayIds[new Date().getDay()];
    $('#scheduleContainer h3').each(function () {
        const $h3 = $(this);
        const $ul = $h3.next('ul');
        if (this.id === todayId) {
            $h3.addClass('today');
            $ul.addClass('today');
        } else {
            $h3.removeClass('today');
            $ul.removeClass('today');
        }
    });
    $('#daysOfWeek li a').each(function () {
        const $a = $(this);
        if ($a.attr('data-day') === todayId) {
            $a.addClass('today');
        } else {
            $a.removeClass('today');
        }
    })
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
                        const idx = text.indexOf("\"" + placeName + "\"");
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

                    const beforeNode = document.createTextNode(text.slice(0, bestIndex));
                    const $link = $(`<a data-place="${bestName}">${bestName}</a>`);
                    const afterNode = document.createTextNode(text.slice(bestIndex + bestName.length + 2));

                    $(node).replaceWith(
                        beforeNode,
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

// -----------------------------------------------------------------------------
// Place lookup and schedule overlays
// -----------------------------------------------------------------------------

function populatePlacesMap() {
    const venueRegistry = Array.isArray(window.PLACE_ALIASES) ? window.PLACE_ALIASES : [];
    const placeBySearchText = new Map();

    venueRegistry.forEach(place => {
        getPlaceSearchTexts(place).forEach(text => {
            const normalized = normalizeSearchText(text);
            if (normalized) placeBySearchText.set(normalized, place);
        });
    });

    $('#t_clubs tbody tr, #t_courts tbody tr').each(function () {
        const $row = $(this);
        const $cells = $row.find('td');
        const $nameCell = $cells.first();
        const name = $nameCell.text().trim();
        if (!name) return;

        const type = $row.closest('table').attr('id') === 't_clubs' ? 'club' : 'court';
        const matchedAlias = placeBySearchText.get(normalizeSearchText(name));
        const id = matchedAlias?.id || makePlaceId(name);

        if (!$row.attr('id')) {
            $row.attr('id', id);
        }

        places.set(name, $row.clone());

        if (matchedAlias) {
            getPlaceSearchTexts(matchedAlias).forEach(alias => {
                if (alias) places.set(alias, $row.clone());
            });
        }

        const currentLang = getCurrentLanguage();
        const title = matchedAlias?.title?.[currentLang] || matchedAlias?.title?.uk || matchedAlias?.title?.en || name;
        //const address = matchedAlias?.address?.[currentLang] || matchedAlias?.address?.uk || matchedAlias?.address?.en || $cells.last().text().trim();
        const displayDetail = type === 'club'
            ? $cells.eq(2).text().trim()
            : $cells.eq(1).text().trim();

        shareablePlaces.push({
            id: $row.attr('id'),
            type,
            title,
            nameVariants: [
                name,
                title,
                matchedAlias?.title?.uk,
                matchedAlias?.title?.en,
                ...(matchedAlias?.aliases || []),
                ...(matchedAlias?.keywords || [])
            ].filter(Boolean),
            displayDetail,
            row: $row,
            searchText: [
                name,
                $row.text(),
                matchedAlias ? getPlaceSearchTexts(matchedAlias).join(' ') : ''
            ].join(' ')
        });
    });

    warnAboutMissingPlaceAliases(venueRegistry);
}

function configurePlaceNameLinksToOpenPlaceInfoOverlay() {
    const animationDuration = 100;
    const placeInfoOverlay = $('#placeInfoOverlay');

    function closePlaceInfoOverlay() {
        placeInfoOverlay.fadeOut(animationDuration);
    }

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
            let isFirstOverlayCell = true;

            $clonedRow.find('td').each(function () {

                // Disable links in overlays to other overlays
                $(this).find('a[data-place]').each(function () {
                    $(this).replaceWith($('<span data-place="">').append($(this).text()));
                });

                if ($(this).text().trim() === '') {
                    return;
                }

                if (isFirstOverlayCell) {
                    $(this)
                        .addClass('place-info-overlay-title-cell')
                        .append(`<button type="button" class="place-info-overlay-close" aria-label="Close">×</button>`);
                    isFirstOverlayCell = false;
                }

                const $newRow = $('<tr></tr>');
                $newRow.append($(this)); // move the cell into the new row
                overlayTable.append($newRow);
            });

            // Add events info (tournaments, ladders, etc.) grouped by day
            const eventsByDay = new Map();
            $('#scheduleContainer li').each(function () {
                const $li = $(this);
                const hasPlaceLink = $li.find(`a[data-place]`).filter(function() {
                    return $(this).attr('data-place') === placeName;
                }).length > 0;

                if (hasPlaceLink) {
                    const $clonedLi = $li.clone();

                    // Match the link tag and optional trailing punctuation/space.
                    // The link is created as <a data-place="VenueName">VenueName</a>
                    // We only want to remove it if it's the main venue, not if it's "(at VenueName)".
                    // So we check that it's not preceded by "at " or "у ".
                    const escapedPlaceName = placeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const regex = new RegExp(`(?<!\\(at\\s|\\(у\\s)<a[^>]*data-place=["']${escapedPlaceName}["'][^>]*>${escapedPlaceName}</a>\\.?\\s*`, 'g');
                    $clonedLi.html($clonedLi.html().replace(regex, ''));

                    // Disable links in overlays to other overlays
                    $clonedLi.find('a[data-place]').each(function () {
                        $(this).replaceWith($('<span>').append($(this).text()));
                    });

                    // Add day of the week
                    const $dayHeader = $li.closest('ul').prev('h3');
                    const dayName = $dayHeader.text().trim();

                    if (!eventsByDay.has(dayName)) {
                        eventsByDay.set(dayName, []);
                    }
                    eventsByDay.get(dayName).push($clonedLi.html());
                }
            });

            if (eventsByDay.size > 0) {
                let eventsHtml = '';
                eventsByDay.forEach((dayEvents, dayName) => {
                    const dayPrefix = dayName ? `<div class="place-info-overlay-event-day">${dayName}:</div>` : '';
                    const itemsHtml = dayEvents.map(html => `<div class="place-info-overlay-competition">${html}</div>`).join('');
                    eventsHtml += `<div class="place-info-overlay-event-group">${dayPrefix}${itemsHtml}</div>`;
                });
                const label = getCurrentLanguage() === 'en' ? 'Competition schedule' : 'Розклад змагань';
                const $eventsRow = $(`
                    <tr>
                        <td class="place-info-overlay-competitions-cell">
                            <details class="place-info-overlay-competitions-details">
                                <summary class="place-info-overlay-competitions-summary">
                                    <span class="place-info-overlay-competitions-cell-title">${label}</span>
                                </summary>
                                <div class="place-info-overlay-competitions-content">
                                    ${eventsHtml}
                                </div>
                            </details>
                        </td>
                    </tr>
                `);
                $eventsRow.find('.br-optional').remove();
                overlayTable.append($eventsRow);
            }

            // Position overlay below the clicked link and aligned with the schedule container
            const scheduleContainer = $('#scheduleContainer');
            placeInfoOverlay.css({
                top: $(this).offset().top + $(this).outerHeight() + 5,
                left: scheduleContainer.offset().left,
                'max-width': scheduleContainer.outerWidth() + 'px'
            }).fadeIn(animationDuration);
        } else {
            console.warn(`No row found for place name "${placeName}"`);
        }
    });

    // Hide overlay when clicking its close button
    placeInfoOverlay.on('click', '.place-info-overlay-close', function () {
        closePlaceInfoOverlay();
    });

    // Hide overlay when clicking outside it
    $(document).on('click', function (e) {
        const $triggerLink = $(e.target).closest('a[data-place]');

        if (
            !placeInfoOverlay.is(e.target) &&              // not clicking directly on overlay
            placeInfoOverlay.has(e.target).length === 0 && // not clicking inside overlay
            !$triggerLink.length                           // not clicking on 'a[data-place]' link
        ) {
            closePlaceInfoOverlay();
        }
    });

    // Hide overlay on Escape key press
    $(document).on('keydown', function (e) {
        if (e.key === 'Escape' || e.keyCode === 27) {
            closePlaceInfoOverlay();
        }
    });

}

// -----------------------------------------------------------------------------
// Share venue search/autocomplete
// -----------------------------------------------------------------------------

function configureShareVenueSearch() {
    const $search = $('#shareVenueSearch');
    if (!$search.length || !$.ui || !$.ui.autocomplete) return;

    const labels = getShareVenueLabels();

    $search.autocomplete({
        minLength: 1,
        delay: 60,
        source: function (request, response) {
            const query = normalizeSearchText(request.term);
            if (!query) {
                response([]);
                return;
            }

            const results = shareablePlaces
                .map(place => ({place, score: getPlaceMatchScore(place, query)}))
                .filter(match => match.score > 0 && document.getElementById(match.place.id))
                .sort((a, b) => b.score - a.score || a.place.title.localeCompare(b.place.title))
                .slice(0, 12)
                .map(match => ({
                    label: match.place.title,
                    value: match.place.title,
                    place: match.place
                }));

            response(results);
        },
        open: function () {
            $(this).autocomplete('widget').outerWidth($(this).outerWidth());
        },
        select: function (event, ui) {
            event.preventDefault();
            $search.val(ui.item.place.title);
            selectShareVenue(ui.item.place);
        },
        focus: function (event, ui) {
            event.preventDefault();
            $search.val(ui.item.place.title);
        }
    }).autocomplete('instance')._renderItem = function (ul, item) {
        const place = item.place;
        const typeLabel = place.type === 'club' ? labels.club : labels.court;
        const meta = [typeLabel, place.displayDetail].filter(Boolean).join(' — ');

        return $('<li>')
            .append(
                $('<div class="share-venue-result">')
                    .append($('<span class="share-venue-result-title">').text(place.title))
                    .append($('<span class="share-venue-result-meta">').text(meta))
            )
            .appendTo(ul);
    };

    $('#shareVenueCopy').on('click', function () {
        const url = $('#shareVenueLink').val();
        const placeId = $('#shareVenue').data('selectedPlaceId');
        if (url) copyShareVenueUrl(url, placeId);
    });

    if (location.hash) {
        highlightSharedPlace(location.hash.slice(1));
    }
}

function selectShareVenue(place) {
    const url = makeShareVenueUrl(place.id);
    history.replaceState(null, '', '#' + place.id);
    $('#shareVenue').data('selectedPlaceId', place.id);
    $('#shareVenueLink').val(url);
    $('#shareVenueSelected').prop('hidden', false);

    copyShareVenueUrl(url, place.id).then(copied => {
        if (copied) {
    highlightSharedPlace(place.id);
        }
    });
}

function makeShareVenueUrl(placeId) {
    const url = new URL(window.location.href);
    url.hash = placeId;
    return url.toString();
}

function copyShareVenueUrl(url, placeId) {
    const labels = getShareVenueLabels();

    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(url)
            .then(() => {
                showShareVenueStatus(labels.copied, placeId);
                return true;
            })
            .catch(() => fallbackCopyShareVenueUrl(url, labels, placeId));
    }

    return Promise.resolve(fallbackCopyShareVenueUrl(url, labels, placeId));
}

function fallbackCopyShareVenueUrl(url, labels, placeId) {
    const input = document.getElementById('shareVenueLink');
    if (!input) return false;

    input.value = url;
    input.focus({preventScroll: true});
    input.select();

    try {
        const copied = document.execCommand('copy');
        showShareVenueStatus(copied ? labels.copied : labels.copyManually, copied ? placeId : null);
        input.blur();
        return copied;
    } catch (e) {
        showShareVenueStatus(labels.copyManually, null);
        return false;
    }
}

function showShareVenueStatus(message, placeId) {
    $('#shareVenueStatus').text(message);

    if (placeId) {
        showSharedPlaceCopyBadge();
    }
}

function highlightSharedPlace(placeId) {
    const row = document.getElementById(placeId);
    if (!row) return;

    row.scrollIntoView({
        block: 'center'
    });

    if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur();
    }

    $(row)
        .removeClass('shared-place-highlight')
        .width(); // Force reflow to restart animation.
    $(row).addClass('shared-place-highlight');
}

function showSharedPlaceCopyBadge() {
    const labels = getShareVenueLabels();
    const $toast = $('#shareVenueToast');
    if (!$toast.length) return;

    $toast.text(labels.copiedBadge).fadeIn(250);

    clearTimeout(window.shareVenueToastTimeout);
    window.shareVenueToastTimeout = setTimeout(() => {
        $toast.fadeOut(250);
    }, 2800);
}

function getPlaceMatchScore(place, normalizedQuery) {
    const title = normalizeSearchText(place.title);
    const nameVariants = (place.nameVariants || []).map(normalizeSearchText).filter(Boolean);
    const detail = normalizeSearchText(place.displayDetail);
    const full = normalizeSearchText(place.searchText);

    if (title === normalizedQuery) return 1000;
    if (nameVariants.some(name => name === normalizedQuery)) return 980;

    if (title.startsWith(normalizedQuery)) return 900;
    if (nameVariants.some(name => name.startsWith(normalizedQuery))) return 880;

    if (title.includes(normalizedQuery)) return 800;
    if (nameVariants.some(name => name.includes(normalizedQuery))) return 780;

    if (detail.startsWith(normalizedQuery)) return 700;
    if (detail.includes(normalizedQuery)) return 650;

    if (full.includes(normalizedQuery)) return 500;

    return 0;
}

function getPlaceSearchTexts(place) {
    return [
        place.id,
        place.title?.uk,
        place.title?.en,
        ...(place.aliases || []),
        ...(place.keywords || [])
    ].filter(Boolean);
}

function normalizeSearchText(text) {
    return String(text || '')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[’ʼ`´]/g, "'")
        .replace(/[№#]/g, ' ')
        .replace(/[.,;:()[\]{}"“”«»!?/\\|+_=*~^$@]/g, ' ')
        .replace(/[-–—]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function makePlaceId(name) {
    const transliterated = String(name || '')
        .toLowerCase()
        .replace(/['’ʼ`´]/g, '')
        .replace(/є/g, 'ye')
        .replace(/ї/g, 'yi')
        .replace(/й/g, 'y')
        .replace(/ю/g, 'yu')
        .replace(/я/g, 'ya')
        .replace(/ж/g, 'zh')
        .replace(/х/g, 'kh')
        .replace(/ц/g, 'ts')
        .replace(/ч/g, 'ch')
        .replace(/ш/g, 'sh')
        .replace(/щ/g, 'shch')
        .replace(/а/g, 'a')
        .replace(/б/g, 'b')
        .replace(/в/g, 'v')
        .replace(/г/g, 'h')
        .replace(/ґ/g, 'g')
        .replace(/д/g, 'd')
        .replace(/е/g, 'e')
        .replace(/з/g, 'z')
        .replace(/и/g, 'y')
        .replace(/і/g, 'i')
        .replace(/к/g, 'k')
        .replace(/л/g, 'l')
        .replace(/м/g, 'm')
        .replace(/н/g, 'n')
        .replace(/о/g, 'o')
        .replace(/п/g, 'p')
        .replace(/р/g, 'r')
        .replace(/с/g, 's')
        .replace(/т/g, 't')
        .replace(/у/g, 'u')
        .replace(/ф/g, 'f')
        .replace(/ь/g, '');

    const slug = transliterated
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return 'place-' + (slug || 'venue');
}

function warnAboutMissingPlaceAliases(aliases) {
    if (location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;

    const missing = aliases.filter(place => !document.getElementById(place.id));
    if (missing.length) {
        console.warn('Places from assets/places.js missing from this page:', missing.map(place => place.id));
    }
}

function getCurrentLanguage() {
    return isUkrainian() ? 'uk' : 'en';
}

function getShareVenueLabels() {
    return isUkrainian()
        ? {
            club: 'клуб',
            court: 'майданчик',
            copied: 'Посилання скопійовано.',
            copiedBadge: '✓ Посилання скопійовано',
            copyManually: 'Не вдалося скопіювати автоматично. Скопіюйте посилання з поля нижче.'
        }
        : {
            club: 'club',
            court: 'court',
            copied: 'Link copied.',
            copiedBadge: '✓ Link copied',
            copyManually: 'Could not copy automatically. Please copy the link from the field below.'
        };
}

// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------

function formatDate(d) {
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function escapeHtml(text) {
    return $('<div>').text(text).html();
}

function escapeHtmlAttr(text) {
    return $('<textarea />').text(text).val();
}

function isUkrainian() {
    return document.documentElement.lang === 'uk';
}
