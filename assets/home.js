$(document).ready(function () {
    fetchSchedule();
    configureBackToTopButton();
    configureCheckboxesFilteringCompetitions();
});

/**
 * (1) Fetch schedule.md,
 * (2) transform the fetched Markdown content to HTML,
 * (3) replace the initial (SEO) content of <tt>div#scheduleContainer</tt> with the HTML.
 */
function fetchSchedule() {
    fetch($('#scheduleContainer').attr('data-src') + '?cacheBuster=' + timestampNoOlderThanTenSeconds(), {})
        .then(function (response) {
            return response.text();
        })
        .then(function (data) {
            const md = window.markdownit({
                html: true // Enable HTML tags in the source
            });
            $('#scheduleContainer').html(md.render(data));
            linkPlaceNamesToPlaceInfo();
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
    let backToTop = $("#backToTop");
    $(window).scroll(function(){
        $(document).scrollTop() > 300 ? backToTop.show() : backToTop.hide();
    });
    backToTop.click(function() {
        window.scrollTo(0, 0);
    });
}

function configureCheckboxesFilteringCompetitions() {
    $('#showTournaments').click(function () {
        $("#scheduleContainer > ul > li:contains('🏆')").toggle();
    });
    $('#showOtherCompetitions').click(function () {
        $("#scheduleContainer > ul > li:not(:contains('🏆'))").toggle();
    });
}

function linkPlaceNamesToPlaceInfo() {
    const animationDuration = 100;
    let scheduleContainer = $('#scheduleContainer');
    let placeInfoOverlay = $('#placeInfoOverlay');

    // Step 1: Build a map of place name → <tr>
    const places = new Map();

    $('#t_clubs tbody tr, #t_courts tbody tr').each(function () {
        const $row = $(this);
        const $cell = $row.find('td:first');
        const name = $cell.text().trim();
        if (name) {
            places.set(name, $row.clone());
        }
    });

    // Step 2: In each text node in the schedule, make the first occurrence of the place name clickable
    scheduleContainer
        .contents()
        .each(function processNode() {
            if (this.nodeType === Node.TEXT_NODE) {
                let nodeText = this.nodeValue;
                let replaced = false;

                for (const clubName of places.keys()) {
                    const index = nodeText.indexOf(clubName);
                    if (index !== -1) {
                        const before = nodeText.slice(0, index);
                        const after = nodeText.slice(index + clubName.length);

                        const $link = $(`<a href="#" class="place-name" data-place="${clubName}">${clubName}</a>`);

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

    // Step 3: Show overlay near the clicked place name
    $(document).on('click', '.place-name', function (e) {
        e.preventDefault();
        const placeName = $(this).data('place');
        const $row = places.get(placeName);
        if ($row) {
            // Populate overlay with the row
            const $clonedRow = $row.clone();
            $clonedRow.find('td:first').remove();

            // Transform the row into a single column multi-row table
            const overlayTable = placeInfoOverlay.html(`<table><tbody></tbody></table>`);
            $clonedRow.find('td').each(function () {
                if ($(this).text().trim() === '') { return; }
                const $newRow = $('<tr></tr>');
                $newRow.append($(this)); // move the cell into the new row
                overlayTable.append($newRow);
            });

            // Position overlay below the clicked link and slightly to the right of the line start
            let leftOffset = 40;
            placeInfoOverlay.css({
                top: $(this).offset().top + $(this).outerHeight() + 5,
                left: scheduleContainer.offset().left + leftOffset,
                'max-width': (scheduleContainer.outerWidth() - leftOffset) + 'px'
            }).fadeIn(animationDuration);
        } else {
            console.warn(`No row found for place name "${placeName}"`);
        }
    });

    // Step 4: Hide overlay when clicking outside it
    $(document).on('click', function (e) {
        const $triggerLink = $(e.target).closest('.place-name');

        if (
            !placeInfoOverlay.is(e.target) &&              // not clicking directly on overlay
            placeInfoOverlay.has(e.target).length === 0 && // not clicking inside overlay
            !$triggerLink.length                   // not clicking on a place-name link
        ) {
            placeInfoOverlay.fadeOut(animationDuration);
        }
    });

    // Step 5: Hide overlay on Escape key press
    $(document).on('keydown', function (e) {
        if (e.key === 'Escape' || e.keyCode === 27) {
            placeInfoOverlay.fadeOut(animationDuration);
        }
    });
    
}