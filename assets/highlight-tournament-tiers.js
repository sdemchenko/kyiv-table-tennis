function highlightTournamentTiers($schedule) {
    $schedule.contents().each(function processNode() {
        if (this.nodeType === Node.TEXT_NODE && this.nodeValue.trim() !== '') {
            const result = highlightTiers(this.nodeValue);
            if (result !== this.nodeValue) {
                $(this).replaceWith(result);
            }
        } else if (this.nodeType === Node.ELEMENT_NODE) {
            $(this).contents().each(processNode);
        }
    });
}

function highlightTiers(text) {
    const adjectives = findAdjectives(text);
    if (adjectives.length === 0) return text;

    const tiers = findTiers(text);
    if (tiers.length === 0) return text;

    tiers.forEach(tier => tier.type = findNearestAdjectiveType(tier.pos, adjectives));
    return buildHighlightedText(text, tiers);
}

function findAdjectives(text) {
    let rankedPattern, unrankedPattern;
    if (isUkrainian()) {
        rankedPattern = /(?<![\p{L}-])рейтингов[\p{L}]*/giu;
        unrankedPattern = /(?<![\p{L}-])нерейтингов[\p{L}]*/giu;
    } else {
        rankedPattern = /(?<![\p{L}-])ranked[\p{L}]*/giu;
        unrankedPattern = /(?<![\p{L}-])unranked[\p{L}]*/giu;
    }

    const adjectives = [];
    let match;
    while ((match = rankedPattern.exec(text)) !== null) {
        adjectives.push({ pos: match.index, type: 'ranked' });
    }
    while ((match = unrankedPattern.exec(text)) !== null) {
        adjectives.push({ pos: match.index, type: 'unranked' });
    }
    return adjectives.sort((a, b) => a.pos - b.pos);
}

function findTiers(text) {
    const pattern = /(?<!:|\w)(\d+(?:\.\d+)?-\d+(?:\.\d+)?)(?!:|\w)/g;
    const tiers = [];
    let match;
    while ((match = pattern.exec(text)) !== null) {
        tiers.push({ pos: match.index, value: match[1] });
    }
    return tiers;
}

function findNearestAdjectiveType(tierPos, adjectives) {
    if (isUkrainian()) {
        let nearest = null;
        for (const adj of adjectives) {
            if (adj.pos < tierPos) nearest = adj;
        }
        return nearest?.type ?? null;
    } else {
        for (const adj of adjectives) {
            if (adj.pos > tierPos) return adj.type;
        }
        return null;
    }
}

function buildHighlightedText(text, tiers) {
    let result = '';
    let lastIndex = 0;
    for (const tier of tiers) {
        result += text.slice(lastIndex, tier.pos);
        result += tier.type
            ? `<span class="${tier.type} rankRange">${tier.value}</span>`
            : tier.value;
        lastIndex = tier.pos + tier.value.length;
    }
    return result + text.slice(lastIndex);
}