const court = "court";
const club = "club";
window.PLACE_ALIASES = [
    {
        id: "place-5-element",
        type: club,
        title: {uk: "5 елемент", en: "5 Element"},
        aliases: ["пʼятий елемент", "пятый элемент"]
    },
    {
        id: "place-arena-sport",
        type: club,
        title: {uk: "Arena Sport", en: "Arena Sport"},
        aliases: ["Арена Спорт"]
    },
    {
        id: "place-beresteiskyi-134",
        type: court,
        title: {uk: "Берестейський проспект, 134", en: "Beresteiskyi Avenue, 134"},
        aliases: [],
        address: {uk: "Берестейський проспект, 134", en: "Beresteiskyi Avenue, 134"}
    },
    {
        id: "place-breiks",
        type: club,
        title: {uk: "Брейкс", en: "Breiks"},
        aliases: ["Breaks", "Київська Русь", "Киевская Русь", "Ruthenia"]
    },
    {
        id: "place-club-17",
        type: club,
        title: {uk: "Club 17", en: "Club 17"},
        aliases: ["Клаб 17", "Клуб 17"]
    },
    {
        id: "place-dbk-3",
        type: club,
        title: {uk: "Спорткомплекс ДБК-3", en: "DBK-3 Sports Complex"},
        aliases: [],
        address: {uk: "вулиця Олега Афанаса, 1", en: "1 Oleha Afanasa Street"}
    },
    {
        id: "place-dbk-4",
        type: club,
        title: {uk: "Спорткомплекс ДБК-4", en: "DBK-4 Sports Complex"},
        aliases: [],
        address: {uk: "вулиця Кульженків, 13", en: "13 Kulzhenkiv Street"}
    },
    {
        id: "place-drahomanov-university-sports-complex",
        type: club,
        title: {uk: "Спорткомплекс УДУ", en: "Drahomanov University Sports Complex"},
        aliases: ["Dragomanov", "Тургенєвська", "Тургеневская", "НПУ", "національний педагогічний університет Драгоманова",
            "український державний університет імені Михайла Драгоманова"]
    },
    {
        id: "place-gourmet",
        type: club,
        title: {uk: "Гурман", en: "Gourmet"},
        aliases: ["Gurman", "Поділ"]
    },
    {
        id: "place-grand-prix",
        type: club,
        title: {uk: "Grand-Prix", en: "Grand-Prix"},
        aliases: ["Гран-Прі", "ГранПрі"]
    },
    {
        id: "place-himars",
        type: club,
        title: {uk: "Himars", en: "Himars"},
        aliases: ["Хаймарс", "Давід", "Давид", "David", "Більшовик", "Большевик"]
    },
    {
        id: "place-holosiivsky-park",
        type: court,
        title: {uk: "Голосіївський парк", en: "Holosiïvsky Park"},
        aliases: ["Голосеевский парк", "Рильського", "Holosiivsky Park"],
        address: {uk: "Голосіївський парк", en: "Holosiïvsky Park"}
    },
    {
        id: "place-hvylovyi",
        type: court,
        title: {uk: "Хвильовий", en: "Khvylʹovyy"},
        aliases: ["HVLV", "Hvylovyi", "Khvylʹovyy"],
        address: {uk: "Верхній Вал 18", en: "Verkhnii Val 18"}
    },
    {
        id: "place-hydropark-lawn-tennis",
        type: court,
        title: {uk: "Гідропарк - на корті великого тенісу", en: "Hydropark - at lawn tennis courts"},
        aliases: ["Гидропарк"]
    },
    {
        id: "place-hydropark-venice-beach",
        type: court,
        title: {uk: "Гідропарк - біля пляжу \"Венеція\"", en: "Hydropark - near Venice Beach"},
        aliases: ["Гидропарк"]
    },
    {
        id: "place-hydropark-veterans",
        type: court,
        title: {uk: "Гідропарк - за кортами великого тенісу", en: "Hydropark - behind lawn tennis courts"},
        aliases: ["ветеранський", "veterans", "Гидропарк"]
    },
    {
        id: "place-kink",
        type: court,
        title: {uk: "Kink Bar", en: "Kink Bar"},
        aliases: ["Кінк Бар", "Кинк Бар"]
    },
    {
        id: "place-kutt",
        type: club,
        title: {uk: "KUTT", en: "KUTT"},
        aliases: ["КУТТ"]
    },
    {
        id: "place-kyiv-mohyla-academy",
        type: court,
        title: {uk: "Києво-Могилянська академія", en: "Kyiv-Mohyla Academy"},
        aliases: ["Киево-Могилянская академия"]
    },
    {
        id: "place-leader-rc",
        type: club,
        title: {uk: "Лідер (КМП)", en: "Leader (RC)"},
        aliases: ["Лідер КМП", "Leader RC", "Lider", "Лидер"],
        address: {uk: "проспект Гонгадзе, 32Г", en: "32Г Honhadze Avenue"}
    },
    {
        id: "place-leader-sports-school",
        type: club,
        title: {uk: "Лідер (ДЮСШ)", en: "Leader (Sports School)"},
        aliases: ["Лідер ДЮСШ", "Leader Sports School", "Lider", "Лидер"],
        address: {uk: "вулиця Коласа, 15Б", en: "15B Kolasa Street"}
    },
    {
        id: "place-master",
        type: club,
        title: {uk: "Мастер", en: "Master"},
        aliases: ["Майстер"]
    },
    {
        id: "place-orion",
        type: club,
        title: {uk: "Orion", en: "Orion"},
        aliases: ["Orion Sport", "Оріон Спорт"]
    },
    {
        id: "place-parkovo-syretska-12a",
        type: court,
        title: {uk: "вулиця Парково-Сирецька, 12А", en: "Parkovo-Syretska Street, 12А"},
        aliases: [],
        address: {uk: "вулиця Парково-Сирецька, 12А", en: "Parkovo-Syretska Street, 12А"}
    },
    {
        id: "place-pechersk",
        type: club,
        title: {uk: "Печерськ", en: "Pechersk"},
        aliases: ["Кловська", "Klovska"]
    },
    {
        id: "place-ping-pong-point",
        type: club,
        title: {uk: "Ping Pong Point", en: "Ping Pong Point"},
        aliases: ["Пінг Понг Пойнт", "ПінгПонг", "Пинг Понг", "ПингПонг"]
    },
    {
        id: "place-podacha-9",
        type: club,
        title: {uk: "Podacha#9", en: "Podacha#9"},
        aliases: ["Подача 9"]
    },
    {
        id: "place-podolskiy",
        type: club,
        title: {uk: "Podolskiy", en: "Podolskiy"},
        aliases: ["Подольський", "Поділ"]
    },
    {
        id: "place-pulse",
        type: club,
        title: {uk: "Pulse", en: "Pulse"},
        aliases: ["Пульс", "Палс"]
    },
    {
        id: "place-quiks",
        type: club,
        title: {uk: "Quiks", en: "Quiks"},
        aliases: ["Квікс", "Куікс"]
    },
    {
        id: "place-raketnik",
        type: club,
        title: {uk: "Raketnik", en: "Raketnik"},
        aliases: ["Ракетник"]
    },
    {
        id: "place-rsp",
        type: club,
        title: {uk: "RSP", en: "RSP"},
        aliases: ["РСП"]
    },
    {
        id: "place-setka-cup",
        type: club,
        title: {uk: "Setka Cup", en: "Setka Cup"},
        aliases: ["Сітка Кап", "Сетка Кап"]
    },
    {
        id: "place-spin-up",
        type: club,
        title: {uk: "Spin Up", en: "Spin Up"},
        aliases: ["Спін Ап", "СпінАп", "SpinUp"]
    },
    {
        id: "place-sports-school-21",
        type: club,
        title: {uk: "ДЮСШ №21", en: "Sports School #21"},
        aliases: ["ДЮСШ 21", "Sports School 21", "ДВРЗ", "Спортшкола 21"]
    },
    {
        id: "place-sports-school-23",
        type: club,
        title: {uk: "ДЮСШ №23", en: "Sports School #23"},
        aliases: ["ДЮСШ 23", "Sports School 23", "Маяковського", "Спортшкола 23"]
    },
    {
        id: "place-toni-tops",
        type: club,
        title: {uk: "Toni-Tops", en: "Toni-Tops"},
        aliases: ["Тоні-Топс", "ТоніТопс"]
    },
    {
        id: "place-top-spin-brovary",
        type: club,
        title: {uk: "Top Spin (Бровари)", en: "Top Spin (Brovary)"},
        aliases: ["Топ Спін Бровари"]
    },
    {
        id: "place-tt-republic",
        type: club,
        title: {uk: "TT Republic", en: "TT Republic"},
        aliases: ["Республіка", "ТТ Репаблік", "Республика", "ТТ Репаблик"]
    },
    {
        id: "place-tviy-tennis",
        type: club,
        title: {uk: "TviY tennis", en: "TviY tennis"},
        aliases: ["Твій Теніс", "Варшавський квартал"]
    },
    {
        id: "place-tvoya-podacha",
        type: club,
        title: {uk: "Твоя подача", en: "Tvoya Podacha"},
        aliases: ["ВДНХ", "VDNH"],
        address: {uk: "32 павільйон ВДНГ", en: "Pavilion 32 of VDNG"}
    },
    {
        id: "place-vdng-urban-park",
        type: court,
        title: {uk: "Урбан-парк ВДНГ", en: "VDNG Urban-Park"},
        aliases: ["ВДНХ", "VDNH"],
        address: {uk: "ВДНГ", en: "VDNG"}
    },
    {
        id: "place-volia",
        type: club,
        title: {uk: "Воля", en: "Volia"},
        aliases: ["Перова"]
    }
];
