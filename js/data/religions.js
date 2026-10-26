// World beliefs, written for young children. Descriptions say what followers believe or
// do ("Many Muslims pray…"), never that a belief is true or better than another.

export const BELIEFS_INTRO = 'People around the world believe different things. Learning about each other\'s beliefs helps us understand and respect our friends. Some people follow a religion and some people don\'t, and everyone deserves kindness.';

export const RESPECT_LINE = 'When we visit someone\'s special place, we follow their rules to show respect, just like taking our shoes off at a friend\'s house.';

export const RELIGIONS = [
  {
    id: 'hinduism', name: 'Hinduism', emoji: '🕉️', people: 'Hindus', place: 'Temple (mandir)', placeEmoji: '🛕',
    book: 'The Vedas and the Bhagavad Gita',
    festivals: ['Diwali, the festival of lights', 'Holi, the festival of colours', 'Navratri, nine nights of dancing'],
    idea: 'Many Hindus believe in one God who can be seen in many forms, like Ganesha, Krishna and Lakshmi. Being kind to all living things is very important.',
    greeting: { text: 'Namaste', meaning: 'I bow to you', lang: 'hi-IN', native: 'नमस्ते', say: 'nuh-muh-stay' },
    fact: 'Hinduism is one of the oldest religions in the world. Most Hindus live in India and Nepal, and most people on Bali are Hindu too.',
    visit: 'Take your shoes off before going in, and wear clothes that cover your shoulders and knees.',
    where: ['IN', 'BALI', 'SG'],
  },
  {
    id: 'islam', name: 'Islam', emoji: '🕌', people: 'Muslims', place: 'Mosque (masjid)', placeEmoji: '🕌',
    book: 'The Quran',
    festivals: ['Eid al-Fitr, the celebration at the end of Ramadan', 'Ramadan, a month of fasting from dawn to sunset', 'Eid al-Adha'],
    idea: 'Muslims believe in one God (Allah, in Arabic) and follow the teachings of the Prophet Muhammad. Many Muslims pray five times a day, facing the holy city of Makkah.',
    greeting: { text: 'As-salamu alaykum', meaning: 'Peace be upon you', lang: 'ar-AE', native: 'السلام عليكم', say: 'as-sa-laa-mu a-lay-kum' },
    fact: 'More Muslims live in Indonesia than in any other country.',
    visit: 'Take your shoes off before going in. Visitors cover their arms and legs, and women and girls cover their hair with a scarf.',
    where: ['AE', 'EG', 'SG'],
  },
  {
    id: 'christianity', name: 'Christianity', emoji: '✝️', people: 'Christians', place: 'Church (big ones are cathedrals)', placeEmoji: '⛪',
    book: 'The Bible',
    festivals: ['Christmas, celebrating the birth of Jesus', 'Easter'],
    idea: 'Christians follow the teachings of Jesus, who taught people to love God and to love their neighbours.',
    greeting: { text: 'Peace be with you', meaning: 'a greeting used in church', lang: 'en-GB', native: 'Peace be with you' },
    fact: 'Christianity has more followers than any other religion: more than 2 billion people!',
    visit: 'Be quiet inside. Big cathedrals often ask visitors to cover their shoulders and knees.',
    where: ['UK', 'ES', 'US', 'FR', 'BR', 'KR', 'EG', 'SG'],
  },
  {
    id: 'buddhism', name: 'Buddhism', emoji: '☸️', people: 'Buddhists', place: 'Temple', placeEmoji: '🏯',
    book: 'The teachings of the Buddha (the Dharma)',
    festivals: ['Vesak, the Buddha\'s birthday', 'The Lotus Lantern Festival in Korea'],
    idea: 'Buddhists follow the teachings of the Buddha, a prince who lived in ancient India about 2,500 years ago. He taught people to be kind, calm and wise. Many Buddhists meditate to calm their minds.',
    greeting: { text: 'Hands together and a small bow', meaning: 'a respectful hello in many Buddhist places', lang: 'en-GB', native: '🙏' },
    fact: 'In Thailand, many boys and young men spend a short time living as monks in a temple.',
    visit: 'Cover your shoulders and knees, take your shoes off in the halls, and never point your feet at a Buddha statue.',
    where: ['KR', 'TW', 'TH', 'JP', 'SG'],
  },
  {
    id: 'sikhism', name: 'Sikhism', emoji: '🪯', people: 'Sikhs', place: 'Gurdwara', placeEmoji: '🛕',
    book: 'The Guru Granth Sahib',
    festivals: ['Vaisakhi', 'Guru Nanak\'s birthday', 'Bandi Chhor Divas, at Diwali time'],
    idea: 'Sikhs follow the teachings of Guru Nanak and the Gurus after him. They believe in one God, that everyone is equal, and in helping others (seva).',
    greeting: { text: 'Sat Sri Akal', meaning: 'God is the eternal truth', lang: 'pa-IN', native: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ', say: 'sut sree a-kaal' },
    fact: 'Every gurdwara has a langar, a free kitchen where anyone, of any religion, can sit together and share a meal.',
    visit: 'Everyone covers their head and takes their shoes off. You can share the free meal at the langar.',
    where: ['IN'],
  },
  {
    id: 'judaism', name: 'Judaism', emoji: '✡️', people: 'Jewish people (Jews)', place: 'Synagogue', placeEmoji: '🕍',
    book: 'The Torah',
    festivals: ['Hanukkah, the festival of lights', 'Passover', 'Shabbat, a day of rest every week'],
    idea: 'Jewish people believe in one God. Judaism is one of the oldest religions, more than 3,000 years old.',
    greeting: { text: 'Shalom', meaning: 'peace', lang: 'he-IL', native: 'שָׁלוֹם', say: 'sha-lom' },
    fact: 'At Hanukkah, families light one more candle on a special candle holder each night for eight nights.',
    visit: 'Wear modest clothes. Men and boys cover their heads with a small cap called a kippah.',
    where: ['US', 'UK', 'EG'],
  },
  {
    id: 'shinto', name: 'Shinto', emoji: '⛩️', people: 'followers of Shinto', place: 'Shrine', placeEmoji: '⛩️',
    book: 'Shinto has no single holy book.',
    festivals: ['Shichi-Go-San, a celebration for children aged 3, 5 and 7!', 'New Year visits to a shrine'],
    idea: 'Shinto is Japan\'s own ancient religion. People believe that kami, or spirits, live in nature: in mountains, trees, rivers and rocks.',
    greeting: { text: 'A polite bow', meaning: 'how people greet the kami at a shrine', lang: 'en-GB', native: '🙇' },
    fact: 'Many Japanese people follow both Shinto and Buddhist traditions.',
    visit: 'No special clothes are needed. Bow at the gate and wash your hands at the water basin.',
    where: ['JP'],
  },
  {
    id: 'taoism', name: 'Taoism and folk religion', emoji: '☯️', people: 'Taoists and people who follow folk traditions', place: 'Temple', placeEmoji: '🏮',
    book: 'The Tao Te Ching',
    festivals: ['Mazu\'s birthday, with a huge walking pilgrimage', 'Lunar New Year'],
    idea: 'Taoism comes from ancient China. It teaches living in harmony with nature and following "the Way" (the Tao). The yin-yang symbol shows how opposites balance each other.',
    greeting: { text: 'Hands together and a bow', meaning: 'a respectful greeting in a temple', lang: 'en-GB', native: '🙏' },
    fact: 'Mazu, the goddess of the sea, is much loved in Taiwan. Every year, huge crowds walk with her statue for days!',
    visit: 'Enter through the dragon door on the right and leave through the tiger door on the left.',
    where: ['TW', 'SG'],
  },
];

export const getReligion = id => RELIGIONS.find(r => r.id === id);
