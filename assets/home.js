$(document).ready(function () {
    fetchSchedule();
    configureBackToTopButton();
    configureCheckboxesFilteringCompetitions();
});

/**
 * (1) Fetch schedule.md,
 * (2) transform the fetched markdown content to HTML,
 * (3) replace the initial (SEO) content of <tt>div#scheduleContainer</tt> with the HTML.
 */
function fetchSchedule() {
    fetch($('#scheduleContainer').attr('data-src') + '?cacheBuster=' + timestampNoOlderThanTenSeconds(), {})
        .then(function (response) {
            return response.text();
        })
        .then(function (data) {
            const md = window.markdownit({
                html: true // Enable HTML tags in source
            });
            $('#scheduleContainer').html(md.render(data));
            linkClubNamesToClubDetails();
        })
        .catch(function (err) {
            console.log(err);
        });
}

/**
 * Timestamp to append to URLs to fetch fresh news and schedule.
 * Using ten seconds staleness if the user hits Refresh button repeatedly.
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
    $('#hideTournaments').click(function () {
        $("#scheduleContainer > ul > li:contains('🏆')").toggle();
    });
    $('#hideOtherCompetitions').click(function () {
        $("#scheduleContainer > ul > li:not(:contains('🏆'))").toggle();
    });
}

function linkClubNamesToClubDetails() {
    const overlayAnimationPeriod = 100;
    let scheduleContainer = $('#scheduleContainer');
    let clubOverlay = $('#clubOverlay');

    // Step 1: Build map of first-column text → <tr>
    const clubMap = {};
    const clubNames = [];

    $('#t_clubs tbody tr').each(function () {
        const $row = $(this);
        const $cell = $row.find('td:first');
        const name = $cell.text().trim();
        if (name) {
            clubMap[name] = $row.clone();
            clubNames.push(name);
        }
    });

    // Step 2: In each text node in the schedule, make the first occurrence of the club name clickable
    scheduleContainer
        .contents()
        .each(function processNode() {
            if (this.nodeType === Node.TEXT_NODE) {
                let nodeText = this.nodeValue;
                let replaced = false;

                for (const clubName of clubNames) {
                    const index = nodeText.indexOf(clubName);
                    if (index !== -1) {
                        const before = nodeText.slice(0, index);
                        const match = nodeText.slice(index, index + clubName.length);
                        const after = nodeText.slice(index + clubName.length);

                        const $link = $(`<a href="#" class="scroll-to-club" data-club="${clubName}">${match}</a>`);

                        // Replace text node with: before + <a> + after
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

    // Step 3: Show overlay near clicked link
    $(document).on('click', '.scroll-to-club', function (e) {
        e.preventDefault();
        const clubName = $(this).data('club');
        const $row = clubMap[clubName];
        if ($row) {
            // Populate overlay with the row
            const $clonedRow = $row.clone();
            $clonedRow.find('td:first').remove();

            // Transform the row into a single column multi-row table
            const overlayTable = clubOverlay.html(`<table><tbody></tbody></table>`);
            $clonedRow.find('td').each(function () {
                if ($(this).text().trim() === '') { return; }
                const $newRow = $('<tr></tr>');
                $newRow.append($(this)); // move the cell into the new row
                overlayTable.append($newRow);
            });

            // Position overlay below the clicked link and slightly to the right of the line start
            let leftOffset = 40;
            clubOverlay.css({
                top: $(this).offset().top + $(this).outerHeight() + 5,
                left: scheduleContainer.offset().left + leftOffset,
                'max-width': (scheduleContainer.outerWidth() - leftOffset) + 'px'
            }).fadeIn(overlayAnimationPeriod);
        }
    });

    // Step 4: Hide overlay when clicking outside it
    $(document).on('click', function (e) {
        const $overlay = clubOverlay;
        const $triggerLink = $(e.target).closest('.scroll-to-club');

        if (
            !$overlay.is(e.target) &&              // not clicking directly on overlay
            $overlay.has(e.target).length === 0 && // not clicking inside overlay
            !$triggerLink.length                   // not clicking on a scroll-to-club link
        ) {
            $overlay.fadeOut(overlayAnimationPeriod);
        }
    });

    // Step 5: Hide overlay on Escape key press
    $(document).on('keydown', function (e) {
        if (e.key === 'Escape' || e.keyCode === 27) {
            clubOverlay.fadeOut(overlayAnimationPeriod);
        }
    });
    
}