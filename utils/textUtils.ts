// English word banks
const englishWords = {
  common: [
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'I',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what'
  ],
  nouns: [
    'time', 'person', 'year', 'way', 'day', 'thing', 'man', 'world', 'life', 'hand',
    'part', 'child', 'eye', 'woman', 'place', 'work', 'week', 'case', 'point', 'government',
    'company', 'number', 'group', 'problem', 'fact', 'program', 'question', 'system', 'service', 'water',
    'computer', 'phone', 'internet', 'website', 'email', 'code', 'developer', 'software', 'application', 'data'
  ],
  verbs: [
    'be', 'have', 'do', 'say', 'get', 'make', 'go', 'know', 'take', 'see',
    'come', 'think', 'look', 'want', 'give', 'use', 'find', 'tell', 'ask', 'work',
    'seem', 'feel', 'try', 'leave', 'call', 'keep', 'let', 'begin', 'help', 'show',
    'write', 'build', 'create', 'develop', 'design', 'program', 'test', 'debug', 'deploy', 'learn'
  ],
  adjectives: [
    'good', 'new', 'first', 'last', 'long', 'great', 'little', 'own', 'other', 'old',
    'right', 'big', 'high', 'different', 'small', 'large', 'next', 'early', 'young', 'important',
    'few', 'public', 'bad', 'same', 'able', 'quick', 'fast', 'slow', 'easy', 'hard',
    'simple', 'complex', 'modern', 'digital', 'online', 'virtual', 'smart', 'efficient', 'powerful', 'advanced'
  ],
  programming: [
    'function', 'variable', 'array', 'object', 'string', 'number', 'boolean', 'loop', 'condition', 'class',
    'method', 'parameter', 'return', 'import', 'export', 'const', 'let', 'if', 'else', 'for',
    'while', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'async', 'await', 'promise'
  ]
};

// Indonesian word banks
const indonesianWords = {
  common: [
    'yang', 'ini', 'itu', 'dan', 'di', 'ke', 'dari', 'untuk', 'dengan', 'pada',
    'adalah', 'akan', 'ada', 'atau', 'juga', 'sudah', 'saya', 'tidak', 'kamu', 'mereka',
    'kami', 'kita', 'dia', 'apa', 'siapa', 'kapan', 'dimana', 'mengapa', 'bagaimana', 'tetapi',
    'karena', 'jika', 'maka', 'bisa', 'dapat', 'harus', 'boleh', 'mau', 'ingin', 'perlu'
  ],
  nouns: [
    'waktu', 'orang', 'tahun', 'hari', 'bulan', 'minggu', 'dunia', 'negara', 'kota', 'rumah',
    'sekolah', 'kantor', 'teman', 'keluarga', 'anak', 'bapak', 'ibu', 'guru', 'siswa', 'mahasiswa',
    'pekerjaan', 'masalah', 'solusi', 'kesempatan', 'tujuan', 'rencana', 'hasil', 'proses', 'sistem', 'program',
    'komputer', 'telepon', 'internet', 'aplikasi', 'website', 'email', 'data', 'kode', 'teknologi', 'software'
  ],
  verbs: [
    'pergi', 'datang', 'lihat', 'baca', 'tulis', 'bicara', 'dengar', 'makan', 'minum', 'tidur',
    'bangun', 'kerja', 'belajar', 'main', 'buat', 'ambil', 'beri', 'kirim', 'terima', 'tanya',
    'jawab', 'cari', 'temukan', 'mulai', 'selesai', 'coba', 'pikir', 'ingat', 'lupa', 'tahu',
    'pakai', 'simpan', 'hapus', 'ubah', 'tambah', 'kurang', 'bagi', 'kali', 'hitung', 'ukur'
  ],
  adjectives: [
    'baik', 'buruk', 'besar', 'kecil', 'tinggi', 'rendah', 'panjang', 'pendek', 'luas', 'sempit',
    'cepat', 'lambat', 'mudah', 'sulit', 'baru', 'lama', 'muda', 'tua', 'cantik', 'tampan',
    'pintar', 'bodoh', 'rajin', 'malas', 'kuat', 'lemah', 'sehat', 'sakit', 'senang', 'sedih',
    'penting', 'berguna', 'modern', 'canggih', 'praktis', 'efisien', 'efektif', 'digital', 'online', 'virtual'
  ],
  programming: [
    'fungsi', 'variabel', 'array', 'objek', 'string', 'angka', 'boolean', 'loop', 'kondisi', 'kelas',
    'method', 'parameter', 'return', 'import', 'export', 'konstanta', 'jika', 'maka', 'selain', 'untuk',
    'while', 'switch', 'case', 'break', 'lanjut', 'coba', 'tangkap', 'async', 'await', 'promise'
  ]
};

// Generate a random sentence
function generateRandomSentence(wordCount: number = 15): string {
  const words: string[] = [];
  const allWords = [...englishWords.common, ...englishWords.nouns, ...englishWords.verbs, ...englishWords.adjectives];
  
  for (let i = 0; i < wordCount; i++) {
    const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
    words.push(randomWord);
  }
  
  // Capitalize first letter
  words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  
  return words.join(' ') + '.';
}

// Generate programming-focused text
function generateProgrammingText(wordCount: number = 15): string {
  const words: string[] = [];
  const mixedWords = [...englishWords.programming, ...englishWords.common, ...englishWords.verbs];
  
  for (let i = 0; i < wordCount; i++) {
    const randomWord = mixedWords[Math.floor(Math.random() * mixedWords.length)];
    words.push(randomWord);
  }
  
  words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  
  return words.join(' ') + '.';
}

// Generate random text (Monkeytype style - simple random words)
function generateRandomText(wordCount: number = 15, language: 'en' | 'id' = 'en'): string {
  const words: string[] = [];
  const wordBank = language === 'id' ? indonesianWords : englishWords;
  const allWords = [...wordBank.common, ...wordBank.nouns, ...wordBank.verbs, ...wordBank.adjectives];
  
  for (let i = 0; i < wordCount; i++) {
    const randomWord = allWords[Math.floor(Math.random() * allWords.length)];
    words.push(randomWord);
  }
  
  return words.join(' ');
}

// Predefined quality sentences (backup)
export const sampleTexts = [
  "The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet.",
  "Practice makes perfect. The more you type, the faster you will become at typing.",
  "TypeRace is a fun way to improve your typing speed and accuracy while competing with others.",
  "In the world of technology, being able to type quickly and accurately is an essential skill.",
  "Programming requires not only logical thinking but also the ability to type code efficiently.",
  "Every great developer started by learning the basics, including how to type properly.",
  "The keyboard is your primary tool as a developer. Master it, and you master your craft.",
  "Speed and accuracy are both important. Don't sacrifice one for the other.",
  "Touch typing is a skill that will serve you well throughout your entire career.",
  "Challenge yourself every day to become a little bit faster than you were yesterday.",
  "Consistency is key when learning to type faster. Practice a little bit every single day.",
  "Focus on accuracy first, then gradually increase your speed over time.",
  "Learning to touch type without looking at the keyboard is a valuable investment.",
  "Modern software development requires fast typing skills to keep up with your thoughts.",
];

export const getRandomText = (wordCount: number = 15, language: 'en' | 'id' = 'en'): string => {
  return generateRandomText(wordCount, language); // Generate fresh random text each time
};

export const calculateWPM = (characters: number, timeInSeconds: number): number => {
  const minutes = timeInSeconds / 60;
  const words = characters / 5; // Standard: 5 characters = 1 word
  return Math.round(words / minutes);
};

export const calculateAccuracy = (correct: number, total: number): number => {
  if (total === 0) return 100;
  return Math.round((correct / total) * 100);
};
