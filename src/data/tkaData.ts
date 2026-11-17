export interface Question {
  id: number;
  chapterId: number;
  numberInChapter: number;
  type: 'pg' | 'tf';
  question: string;
  options?: string[];
  correctAnswer: string;
  source: string;
  sourceUrl: string;
  material: string;
  hints: string[];
  explanation: string[];
  voiceScript: {
    readQuestion: string;
    correct: string;
    incorrect: string;
  };
}

export interface ChapterModule {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  videoUrls: { title: string; url: string }[];
  badgeName: string;
  color: string;
  position: [number, number, number];
}

export const CHAPTERS_DATA: ChapterModule[] = [
  {
    id: 1,
    title: 'Bab 1: Bilangan Real',
    subtitle: 'Perbandingan, Skala, Faktorisasi Prima, & Notasi Ilmiah',
    description: 'Pusat perhitungan skala peta, perbandingan senilai/berbalik nilai, dan notasi ilmiah.',
    videoUrls: [
      { title: 'Edu-Vid Part-1 (Bilangan & Perbandingan)', url: 'https://www.youtube.com/embed/OSzY633N5TA' },
      { title: 'Edu-Vid Part-2 (Perbandingan Berbalik Nilai)', url: 'https://www.youtube.com/embed/GFnhttH--yk' }
    ],
    badgeName: 'Ahli Bilangan Real',
    color: '#4f46e5',
    position: [-22, 0, -10]
  },
  {
    id: 2,
    title: 'Bab 2: Persamaan & Pertidaksamaan Linier',
    subtitle: 'PLSV, PtLSV, & SPLDV',
    description: 'Pusat analisis persamaan dan sistem pertidaksamaan linear dua variabel.',
    videoUrls: [
      { title: 'Edu-Vid Part-3 (PtLSV & SPLDV)', url: 'https://www.youtube.com/embed/ukyG40w5J5E' },
      { title: 'Mantappu Academy (PtLSV Garis Bilangan)', url: 'https://www.youtube.com/embed/6PACMPC_i5M' }
    ],
    badgeName: 'Pakar Aljabar Linier',
    color: '#06b6d4',
    position: [-38, 0, -22]
  },
  {
    id: 3,
    title: 'Bab 3: Bentuk Aljabar',
    subtitle: 'Operasi Hitung, Pemfaktoran, & Pemodelan Aljabar',
    description: 'Pusat manipulasi suku aljabar, penjabaran, dan pemfaktoran suku.',
    videoUrls: [
      { title: 'Edu-Vid Part-3 (Penyederhanaan Aljabar)', url: 'https://www.youtube.com/embed/ukyG40w5J5E' },
      { title: 'Edu-Vid Part-1 (Pemodelan Alat Tulis)', url: 'https://www.youtube.com/embed/OSzY633N5TA' }
    ],
    badgeName: 'Master Suku Aljabar',
    color: '#10b981',
    position: [-8, 0, -38]
  },
  {
    id: 4,
    title: 'Bab 4: Fungsi',
    subtitle: 'Koordinat Kartesius & Fungsi Linear',
    description: 'Pusat pemetaan koordinat, relasi, dan rumus fungsi f(x).',
    videoUrls: [
      { title: 'Edu-Vid Part-3 (Rumus Fungsi Linear)', url: 'https://www.youtube.com/embed/ukyG40w5J5E' },
      { title: 'Mantappu Academy (Menentukan f(x))', url: 'https://www.youtube.com/embed/6PACMPC_i5M' }
    ],
    badgeName: 'Ahli Koordinat & Fungsi',
    color: '#f59e0b',
    position: [18, 0, -28]
  },
  {
    id: 5,
    title: 'Bab 5: Barisan & Deret',
    subtitle: 'Pola Bilangan, Aritmetika, & Geometri',
    description: 'Pusat analisis pola susunan objek dan barisan bilangan.',
    videoUrls: [
      { title: 'Edu-Vid Part-3 (Pola Titik & Aritmetika)', url: 'https://www.youtube.com/embed/ukyG40w5J5E' },
      { title: 'Mantappu Academy (Pola Persegi)', url: 'https://www.youtube.com/embed/6PACMPC_i5M' }
    ],
    badgeName: 'Detektif Pola Bilangan',
    color: '#ec4899',
    position: [35, 0, -12]
  },
  {
    id: 6,
    title: 'Bab 6: Objek Geometri: Sudut & Jaring-jaring',
    subtitle: 'Hubungan Antar Sudut & Jaring-jaring Bangun Ruang',
    description: 'Pusat analisis garis sejajar, sudut berpelurus, dan jaring-jaring prisma/limas.',
    videoUrls: [
      { title: 'Edu-Vid Part-4 (Sudut Garis Sejajar)', url: 'https://www.youtube.com/embed/juDOq8MGCAU' },
      { title: 'Edu-Vid Part-5 (Jaring-jaring Prisma)', url: 'https://www.youtube.com/embed/w0I5n9Hc_t4' }
    ],
    badgeName: 'Arsitek Sudut & Ruang',
    color: '#8b5cf6',
    position: [-32, 0, 18]
  },
  {
    id: 7,
    title: 'Bab 7: Objek Geometri: Pythagoras & Kesebangunan',
    subtitle: 'Teorema Pythagoras, Kongruen, & Sebangun',
    description: 'Pusat perhitungan sisi segitiga siku-siku dan perbandingan kesebangunan.',
    videoUrls: [
      { title: 'Edu-Vid Part-4 (Kesebangunan Segitiga)', url: 'https://www.youtube.com/embed/juDOq8MGCAU' },
      { title: 'Edu-Vid Part-5 (Tripel Pythagoras)', url: 'https://www.youtube.com/embed/w0I5n9Hc_t4' }
    ],
    badgeName: 'Master Pythagoras',
    color: '#3b82f6',
    position: [-10, 0, 32]
  },
  {
    id: 8,
    title: 'Bab 8: Transformasi Geometri',
    subtitle: 'Refleksi, Translasi, Rotasi, & Dilatasi',
    description: 'Pusat pergerakan koordinat bangun datar pada bidang.',
    videoUrls: [
      { title: 'Edu-Vid Part-5 (Translasi & Rotasi)', url: 'https://www.youtube.com/embed/w0I5n9Hc_t4' }
    ],
    badgeName: 'Navigator Transformasi',
    color: '#14b8a6',
    position: [15, 0, 25]
  },
  {
    id: 9,
    title: 'Bab 9: Pengukuran',
    subtitle: 'Keliling, Luas Gabungan, & Volume Bangun Ruang',
    description: 'Pusat perhitungan luas bangun datar majemuk dan volume ruang.',
    videoUrls: [
      { title: 'Edu-Vid Part-4 (Luas Gabungan Taman)', url: 'https://www.youtube.com/embed/juDOq8MGCAU' },
      { title: 'Edu-Vid Part-5 (Volume Ruang)', url: 'https://www.youtube.com/embed/w0I5n9Hc_t4' },
      { title: 'Edu-Vid Part-6 (Monumen Ruang)', url: 'https://www.youtube.com/embed/OW3710R9pQk' }
    ],
    badgeName: 'Ahli Pengukuran Ruang',
    color: '#f97316',
    position: [38, 0, 35]
  },
  {
    id: 10,
    title: 'Bab 10: Data (Statistika)',
    subtitle: 'Mean, Median, Modus, & Membaca Diagram',
    description: 'Pusat pengolahan data pemusatan dan interpretasi diagram.',
    videoUrls: [
      { title: 'Edu-Vid Part-6 (Statistika & Rata-rata Gabungan)', url: 'https://www.youtube.com/embed/OW3710R9pQk' }
    ],
    badgeName: 'Analis Data Utama',
    color: '#84cc16',
    position: [-42, 0, -42]
  },
  {
    id: 11,
    title: 'Bab 11: Peluang',
    subtitle: 'Peluang Teoretik, Frekuensi Relatif, & Harapan',
    description: 'Pusat perhitungan peluang kejadian dan frekuensi harapan.',
    videoUrls: [
      { title: 'Edu-Vid Part-6 (Peluang & Frekuensi Harapan)', url: 'https://www.youtube.com/embed/OW3710R9pQk' }
    ],
    badgeName: 'Pakar Probabilitas',
    color: '#a855f7',
    position: [42, 0, -42]
  }
];

export const QUESTIONS_DATA: Question[] = [
  // --- BAB 1 ---
  {
    id: 1,
    chapterId: 1,
    numberInChapter: 1,
    type: 'pg',
    question: "Jarak dua kota pada peta dengan skala 1 : 250.000 adalah 6 cm. Jarak sebenarnya kedua kota tersebut adalah ...",
    options: ["A. 1,5 km", "B. 15 km", "C. 150 km", "D. 1.500 km"],
    correctAnswer: "B",
    source: "Edu-Vid – RESMI PUSMENDIK TKA 2026 Part-1",
    sourceUrl: "https://www.youtube.com/watch?v=OSzY633N5TA",
    material: "Jarak sebenarnya = Jarak peta / skala = 6 cm × 250.000 = 1.500.000 cm = 15 km.",
    hints: [
      "Kalikan jarak pada peta dengan penyebut skala.",
      "1.500.000 cm diubah ke kilometer (bagi 100.000).",
      "Hasil akhirnya adalah 15 km."
    ],
    explanation: ["1. Jarak peta = 6 cm.", "2. Skala = 1 : 250.000.", "3. Jarak sebenarnya = 6 × 250.000 = 1.500.000 cm = 15 km."],
    voiceScript: { readQuestion: "Jarak dua kota pada peta dengan skala 1 : 250.000 adalah 6 cm. Berapa jarak sebenarnya?", correct: "Benar! Jarak sebenarnya adalah 15 kilometer.", incorrect: "Belum tepat. Ingat untuk mengalikan jarak peta dengan skala lalu konversi ke km." }
  },
  {
    id: 2,
    chapterId: 1,
    numberInChapter: 2,
    type: 'pg',
    question: "Untuk membuat 15 loyang kue dibutuhkan 2,5 kg tepung terigu. Jika Ibu ingin membuat 24 loyang kue, tepung terigu yang diperlukan adalah ...",
    options: ["A. 3,5 kg", "B. 4,0 kg", "C. 4,5 kg", "D. 5,0 kg"],
    correctAnswer: "B",
    source: "Edu-Vid – RESMI PUSMENDIK TKA 2026 Part-1",
    sourceUrl: "https://www.youtube.com/watch?v=OSzY633N5TA",
    material: "Gunakan perbandingan senilai: (2,5 / 15) × 24 = 4,0 kg.",
    hints: [
      "Gunakan konsep perbandingan senilai.",
      "Tepung per 1 loyang = 2,5 / 15 kg.",
      "Kalikan dengan 24 loyang."
    ],
    explanation: ["1. Tepung per loyang = 2,5 / 15 = 1/6 kg.", "2. Tepung untuk 24 loyang = 24 × (1/6) = 4,0 kg."],
    voiceScript: { readQuestion: "Untuk 15 loyang kue butuh 2,5 kg tepung. Berapa tepung untuk 24 loyang?", correct: "Tepat sekali! Kebutuhannya adalah 4,0 kg.", incorrect: "Periksa kembali perbandingan senilai jumlah loyang dan tepung." }
  },
  {
    id: 3,
    chapterId: 1,
    numberInChapter: 3,
    type: 'pg',
    question: "Massa sebuah partikel debu adalah 0,000045 gram. Penulisan massa partikel tersebut dalam bentuk notasi ilmiah yang benar adalah ...",
    options: ["A. 4,5 x 10^-5 gram", "B. 4,5 x 10^-4 gram", "C. 45 x 10^-6 gram", "D. 0,45 x 10^-4 gram"],
    correctAnswer: "A",
    source: "Edu-Vid – RESMI PUSMENDIK TKA 2026 Part-1",
    sourceUrl: "https://www.youtube.com/watch?v=OSzY633N5TA",
    material: "Bentuk baku a × 10^n dengan 1 <= a < 10. Geser koma 5 kali ke kanan menjadi 4,5 × 10^-5.",
    hints: [
      "Geser tanda desimal ke kanan hingga angka pertama bukan nol.",
      "Karena bilangan kurang dari 1, eksponen basis 10 bernilai negatif.",
      "Hasilnya adalah 4,5 × 10^-5."
    ],
    explanation: ["1. 0,000045 = 4,5 × 0,00001.", "2. 0,00001 = 10^-5.", "3. Hasil = 4,5 × 10^-5 gram."],
    voiceScript: { readQuestion: "Berapa notasi ilmiah dari 0,000045 gram?", correct: "Benar! Jawabannya 4,5 kali 10 pangkat minus 5.", incorrect: "Perhatikan arah pergeseran koma desimal." }
  },
  {
    id: 4,
    chapterId: 1,
    numberInChapter: 4,
    type: 'tf',
    question: "Faktorisasi prima dari bilangan 180 adalah 2^2 x 3^2 x 5.",
    options: ["Benar", "Salah"],
    correctAnswer: "Benar",
    source: "Edu-Vid – RESMI PUSMENDIK TKA 2026 Part-1",
    sourceUrl: "https://www.youtube.com/watch?v=OSzY633N5TA",
    material: "180 = 4 × 45 = 2^2 × 3^2 × 5.",
    hints: [
      "Bagilah 180 dengan bilangan prima berurutan (2, 3, 5).",
      "180 = 4 × 9 × 5.",
      "Faktorisasi primanya sesuai."
    ],
    explanation: ["1. 180 / 2 = 90", "2. 90 / 2 = 45", "3. 45 / 3 = 15", "4. 15 / 3 = 5", "5. Jadi 2^2 × 3^2 × 5 (Benar)."],
    voiceScript: { readQuestion: "Faktorisasi prima dari bilangan 180 adalah 2 kuadrat kali 3 kuadrat kali 5?", correct: "Benar!", incorrect: "Salah, faktorisasi tersebut sudah tepat." }
  },
  {
    id: 5,
    chapterId: 1,
    numberInChapter: 5,
    type: 'tf',
    question: "Sebuah proyek selesai dalam 30 hari oleh 12 pekerja. Jika pekerja ditambah 3 orang, proyek akan selesai dalam waktu 25 hari.",
    options: ["Benar", "Salah"],
    correctAnswer: "Salah",
    source: "Edu-Vid – RESMI PUSMENDIK TKA 2026 Part-2",
    sourceUrl: "https://www.youtube.com/watch?v=GFnhttH--yk",
    material: "Perbandingan berbalik nilai: 30 × 12 = 15 × x => x = 24 hari (bukan 25 hari).",
    hints: [
      "Gunakan perbandingan berbalik nilai.",
      "Pekerja total = 12 + 3 = 15 orang.",
      "Hasil perhitungan adalah 24 hari."
    ],
    explanation: ["1. Beban kerja = 30 hari × 12 pekerja = 360 pekerja-hari.", "2. Dengan 15 pekerja, waktu = 360 / 15 = 24 hari (Pernyataan Salah)."],
    voiceScript: { readQuestion: "Proyek selesai 30 hari oleh 12 pekerja. Ditambah 3 pekerja selesai 25 hari?", correct: "Benar, pernyataan itu memang Salah karena seharusnya 24 hari.", incorrect: "Pernyataan tersebut bernilai salah." }
  },

  // --- BAB 2 ---
  {
    id: 6,
    chapterId: 2,
    numberInChapter: 1,
    type: 'pg',
    question: "Himpunan penyelesaian dari pertidaksamaan 3x - 5 <= 2x + 4 untuk x bilangan bulat adalah ...",
    options: ["A. {..., 6, 7, 8}", "B. {..., 7, 8, 9}", "C. {9, 10, 11, ...}", "D. {10, 11, 12, ...}"],
    correctAnswer: "B",
    source: "Edu-Vid Part-3",
    sourceUrl: "https://www.youtube.com/watch?v=ukyG40w5J5E",
    material: "3x - 2x <= 4 + 5 => x <= 9. Bilangan bulat kurang dari sama dengan 9 adalah {..., 7, 8, 9}.",
    hints: [
      "Kumpulkan suku x ke ruas kiri dan konstanta ke ruas kanan.",
      "Didapatkan x <= 9.",
      "Himpunan bilangan bulat ke kiri."
    ],
    explanation: ["1. 3x - 2x <= 4 + 5", "2. x <= 9", "3. Himpunan {..., 7, 8, 9}."],
    voiceScript: { readQuestion: "Himpunan penyelesaian 3x min 5 kurang dari sama dengan 2x ditambah 4 adalah?", correct: "Benar! Jawabannya B.", incorrect: "Periksa kembali pemindahan ruas pertidaksamaan." }
  },
  {
    id: 7,
    chapterId: 2,
    numberInChapter: 2,
    type: 'pg',
    question: "Harga 3 kue donat dan 2 kue bolu adalah Rp22.000, sedangkan harga 2 kue donat dan 4 kue bolu adalah Rp28.000. Harga 1 kue donat adalah ...",
    options: ["A. Rp3.000", "B. Rp4.000", "C. Rp5.000", "D. Rp6.000"],
    correctAnswer: "B",
    source: "Edu-Vid Part-3",
    sourceUrl: "https://www.youtube.com/watch?v=ukyG40w5J5E",
    material: "Misal donat = x, bolu = y. 3x + 2y = 22k dan 2x + 4y = 28k => x = 4.000.",
    hints: [
      "Gunakan eliminasi atau substitusi SPLDV.",
      "Eliminasi variabel y dengan menyamakan koefisien.",
      "Hasil akhir x adalah 4.000."
    ],
    explanation: ["1. 3x + 2y = 22000 (kalikan 2 => 6x + 4y = 44000)", "2. 2x + 4y = 28000", "3. Kurangkan: 4x = 16000 => x = 4.000."],
    voiceScript: { readQuestion: "Harga 3 donat dan 2 bolu 22 ribu, 2 donat dan 4 bolu 28 ribu. Berapa harga 1 donat?", correct: "Tepat! Harga 1 donat adalah 4 ribu rupiah.", incorrect: "Coba eliminasi variabel y pada SPLDV." }
  },
  {
    id: 8,
    chapterId: 2,
    numberInChapter: 3,
    type: 'pg',
    question: "Penyelesaian dari persamaan linear 4(2x - 1) = 3x + 11 adalah ...",
    options: ["A. x = 2", "B. x = 3", "C. x = 4", "D. x = 5"],
    correctAnswer: "B",
    source: "Edu-Vid Part-3",
    sourceUrl: "https://www.youtube.com/watch?v=ukyG40w5J5E",
    material: "8x - 4 = 3x + 11 => 5x = 15 => x = 3.",
    hints: [
      "Jabarkan kurung di ruas kiri menggunakan sifat distributif.",
      "8x - 4 = 3x + 11.",
      "Selesaikan untuk x."
    ],
    explanation: ["1. 8x - 4 = 3x + 11", "2. 8x - 3x = 11 + 4", "3. 5x = 15 => x = 3."],
    voiceScript: { readQuestion: "Berapa nilai x dari persamaan 4 kali 2x min 1 sama dengan 3x ditambah 11?", correct: "Benar! x sama dengan 3.", incorrect: "Jabarkan dulu kurung distributifnya." }
  },
  {
    id: 9,
    chapterId: 2,
    numberInChapter: 4,
    type: 'tf',
    question: "Pada garis bilangan, penyelesaian dari -2x + 6 > 10 ditunjukkan oleh tanda panah ke kiri dari titik -2 dengan bulatan kosong.",
    options: ["Benar", "Salah"],
    correctAnswer: "Benar",
    source: "Mantappu Academy",
    sourceUrl: "https://www.youtube.com/watch?v=6PACMPC_i5M",
    material: "-2x > 4 => x < -2 (tanda pertidaksamaan berubah karena dibagi negatif). Bulatan kosong dan arah ke kiri.",
    hints: [
      "Bagilah kedua ruas dengan -2 dan balik tanda pertidaksamaannya.",
      "x < -2.",
      "Gunakan bulatan kosong."
    ],
    explanation: ["1. -2x > 4 => x < -2.", "2. Tanda < menggunakan bulatan kosong dan arah panah ke kiri (Benar)."],
    voiceScript: { readQuestion: "Penyelesaian -2x + 6 > 10 adalah panah ke kiri dari -2?", correct: "Benar!", incorrect: "Pernyataan tersebut benar." }
  },
  {
    id: 10,
    chapterId: 2,
    numberInChapter: 5,
    type: 'tf',
    question: "Jika x = 4 dan y = -2 merupakan solusi dari 2x + ay = 14, maka nilai a adalah 3.",
    options: ["Benar", "Salah"],
    correctAnswer: "Salah",
    source: "Mantappu Academy",
    sourceUrl: "https://www.youtube.com/watch?v=6PACMPC_i5M",
    material: "2(4) + a(-2) = 14 => 8 - 2a = 14 => -2a = 6 => a = -3 (bukan 3).",
    hints: [
      "Substitusikan x = 4 dan y = -2 ke dalam persamaan.",
      "8 - 2a = 14.",
      "Diperoleh a = -3."
    ],
    explanation: ["1. 8 - 2a = 14", "2. -2a = 6 => a = -3 (Pernyataan Salah)."],
    voiceScript: { readQuestion: "Jika x=4 y=-2 solusi 2x+ay=14, nilai a adalah 3?", correct: "Benar, pernyataan itu Salah karena a=-3.", incorrect: "Pernyataan bernilai salah." }
  },

  // --- BAB 3 ---
  {
    id: 11,
    chapterId: 3,
    numberInChapter: 1,
    type: 'pg',
    question: "Bentuk sederhana dari (2x + 3)(x - 4) - (x^2 - 5x - 12) adalah ...",
    options: ["A. x^2 - 10x", "B. x^2 - 10x - 24", "C. x^2 + 10x", "D. x^2 - 24"],
    correctAnswer: "A",
    source: "Edu-Vid Part-3",
    sourceUrl: "https://www.youtube.com/watch?v=ukyG40w5J5E",
    material: "(2x^2 - 8x + 3x - 12) - (x^2 - 5x - 12) = 2x^2 - 5x - 12 - x^2 + 5x + 12 = x^2.",
    hints: [
      "Jabarkan (2x + 3)(x - 4) menjadi 2x^2 - 5x - 12.",
      "Kurangkan dengan (x^2 - 5x - 12).",
      "Suku-suku saling menghilangkan."
    ],
    explanation: ["1. 2x^2 - 5x - 12 - x^2 + 5x + 12 = x^2."],
    voiceScript: { readQuestion: "Bentuk sederhana dari perkalian aljabar tersebut adalah?", correct: "Benar! Jawabannya x kuadrat.", incorrect: "Perhatikan tanda negatif saat membuka kurung." }
  },
  {
    id: 12,
    chapterId: 3,
    numberInChapter: 2,
    type: 'pg',
    question: "Andi membeli x buku tulis seharga Rp4.500 per buku dan y pulpen seharga Rp3.000 per buah. Jika ia membayar dengan uang Rp50.000, bentuk aljabar dari uang kembalian Andi adalah ...",
    options: ["A. 4.500x + 3.000y - 50.000", "B. 50.000 - 4.500x + 3.000y", "C. 50.000 - 4.500x - 3.000y", "D. 50.000 - 7.500(x + y)"],
    correctAnswer: "C",
    source: "Edu-Vid Part-1",
    sourceUrl: "https://www.youtube.com/watch?v=OSzY633N5TA",
    material: "Kembalian = Uang bayar - (Total harga buku + Total harga pulpen) = 50.000 - 4.500x - 3.000y.",
    hints: [
      "Total belanja = 4500x + 3000y.",
      "Kembalian = 50000 dikurangi total belanja.",
      "Gunakan tanda minus pada kedua suku belanja."
    ],
    explanation: ["1. Total belanja = 4.500x + 3.000y.", "2. Kembalian = 50.000 - 4.500x - 3.000y."],
    voiceScript: { readQuestion: "Bentuk aljabar uang kembalian Andi adalah?", correct: "Tepat! 50.000 minus 4.500x minus 3.000y.", incorrect: "Pastikan tanda minus dikenakan pada kedua jenis barang." }
  },
  {
    id: 13,
    chapterId: 3,
    numberInChapter: 3,
    type: 'pg',
    question: "Hasil pemfaktoran dari bentuk aljabar 4x^2 - 25 adalah ...",
    options: ["A. (2x - 5)(2x - 5)", "B. (2x + 5)(2x - 5)", "C. (4x + 5)(x - 5)", "D. (4x - 25)(x + 1)"],
    correctAnswer: "B",
    source: "Edu-Vid Part-3",
    sourceUrl: "https://www.youtube.com/watch?v=ukyG40w5J5E",
    material: "Selisih dua kuadrat: a^2 - b^2 = (a + b)(a - b). Jadi (2x)^2 - 5^2 = (2x + 5)(2x - 5).",
    hints: [
      "Gunakan rumus selisih dua kuadrat a^2 - b^2 = (a+b)(a-b).",
      "Akar dari 4x^2 adalah 2x, akar dari 25 adalah 5.",
      "Faktorisasi menjadi (2x + 5)(2x - 5)."
    ],
    explanation: ["1. (2x + 5)(2x - 5)."],
    voiceScript: { readQuestion: "Hasil pemfaktoran dari 4x kuadrat dikurangi 25 adalah?", correct: "Benar! (2x + 5)(2x - 5).", incorrect: "Gunakan rumus selisih kuadrat." }
  },
  {
    id: 14,
    chapterId: 3,
    numberInChapter: 4,
    type: 'tf',
    question: "Hasil pengurangan 3(2a - b) dari 5(a + 2b) adalah -a + 13b.",
    options: ["Benar", "Salah"],
    correctAnswer: "Benar",
    source: "Edu-Vid Part-3",
    sourceUrl: "https://www.youtube.com/watch?v=ukyG40w5J5E",
    material: "5(a + 2b) - 3(2a - b) = (5a + 10b) - (6a - 3b) = 5a + 10b - 6a + 3b = -a + 13b.",
    hints: [
      "5(a + 2b) = 5a + 10b.",
      "3(2a - b) = 6a - 3b.",
      "Kurangkan suku-suku sejenis."
    ],
    explanation: ["1. 5a + 10b - 6a + 3b = -a + 13b (Benar)."],
    voiceScript: { readQuestion: "Hasil pengurangan tersebut adalah -a + 13b?", correct: "Benar!", incorrect: "Pernyataan benar." }
  },
  {
    id: 15,
    chapterId: 3,
    numberInChapter: 5,
    type: 'tf',
    question: "Bentuk aljabar 3x + 6y - 12 jika difaktorkan menjadi 3(x + 2y - 12).",
    options: ["Benar", "Salah"],
    correctAnswer: "Salah",
    source: "Edu-Vid Part-3",
    sourceUrl: "https://www.youtube.com/watch?v=ukyG40w5J5E",
    material: "FPB dari 3, 6, dan 12 adalah 3. Seharusnya 3(x + 2y - 4), bukan -12.",
    hints: [
      "Keluarkan FPB dari setiap suku yaitu 3.",
      "-12 dibagi 3 adalah -4.",
      "Pernyataan tersebut salah."
    ],
    explanation: ["1. 3(x + 2y - 4) (Pernyataan Salah karena tertulis -12)."],
    voiceScript: { readQuestion: "Pemfaktoran 3x + 6y - 12 adalah 3(x + 2y - 12)?", correct: "Benar, pernyataan itu Salah.", incorrect: "Pernyataan bernilai salah." }
  },

  // --- BAB 4 ---
  {
    id: 16,
    chapterId: 4,
    numberInChapter: 1,
    type: 'pg',
    question: "Sebuah provider internet menetapkan biaya langganan paket kuota dengan rumus f(x) = 8.000x + 15.000, dengan x adalah jumlah gigabyte (GB) tambahan. Jika Sinta menggunakan 6 GB tambahan, biaya yang harus dibayar adalah ...",
    options: ["A. Rp48.000", "B. Rp53.000", "C. Rp63.000", "D. Rp73.000"],
    correctAnswer: "C",
    source: "Edu-Vid Part-3",
    sourceUrl: "https://www.youtube.com/watch?v=ukyG40w5J5E",
    material: "f(6) = 8.000(6) + 15.000 = 48.000 + 15.000 = Rp63.000.",
    hints: [
      "Substitusikan nilai x = 6 ke dalam rumus f(x).",
      "8000 × 6 + 15000.",
      "Hasilnya adalah Rp63.000."
    ],
    explanation: ["1. f(6) = 48.000 + 15.000 = Rp63.000."],
    voiceScript: { readQuestion: "Berapa biaya untuk 6 GB tambahan dengan rumus f(x) = 8000x + 15000?", correct: "Benar! Rp63.000.", incorrect: "Substitusikan 6 ke dalam x." }
  },
  {
    id: 17,
    chapterId: 4,
    numberInChapter: 2,
    type: 'pg',
    question: "Diketahui fungsi linear f(x) = ax + b. Jika f(2) = 7 dan f(-1) = -2, maka nilai dari f(5) adalah ...",
    options: ["A. 12", "B. 14", "C. 16", "D. 18"],
    correctAnswer: "C",
    source: "Mantappu Academy",
    sourceUrl: "https://www.youtube.com/watch?v=6PACMPC_i5M",
    material: "2a + b = 7 dan -a + b = -2 => 3a = 9 => a = 3, b = 1. f(x) = 3x + 1. f(5) = 3(5) + 1 = 16.",
    hints: [
      "Buat sistem persamaan dari f(2) dan f(-1).",
      "Cari nilai a dan b terlebih dahulu.",
      "Hitung f(5)."
    ],
    explanation: ["1. 2a + b = 7", "2. -a + b = -2", "3. a = 3, b = 1", "4. f(5) = 3(5) + 1 = 16."],
    voiceScript: { readQuestion: "Jika f(2)=7 dan f(-1)=-2, berapa nilai f(5)?", correct: "Tepat! Jawabannya 16.", incorrect: "Gunakan eliminasi untuk mencari a dan b." }
  },
  {
    id: 18,
    chapterId: 4,
    numberInChapter: 3,
    type: 'pg',
    question: "Titik-titik pada bidang koordinat kartesius: A(-3, 2), B(4, 2), dan C(4, -3). Agar terbentuk bangun persegi panjang ABCD, koordinat titik D yang tepat adalah ...",
    options: ["A. (-3, -3)", "B. (3, -3)", "C. (-3, 3)", "D. (-4, -3)"],
    correctAnswer: "A",
    source: "Edu-Vid Part-3",
    sourceUrl: "https://www.youtube.com/watch?v=ukyG40w5J5E",
    material: "Titik A(-3,2) dan B(4,2) sejajar sumbu X. B(4,2) dan C(4,-3) sejajar sumbu Y. Titik D harus berpasangan dengan A dan C membentuk persegi panjang di (-3, -3).",
    hints: [
      "Garis AB horizontal di y = 2. Garis BC vertikal di x = 4.",
      "Titik D harus memiliki x = -3 dan y = -3.",
      "Koordinat D adalah (-3, -3)."
    ],
    explanation: ["1. Koordinat D adalah (-3, -3)."],
    voiceScript: { readQuestion: "Koordinat titik D untuk membentuk persegi panjang ABCD adalah?", correct: "Benar! (-3, -3).", incorrect: "Perhatikan kesjajaran sumbu pada koordinat." }
  },
  {
    id: 19,
    chapterId: 4,
    numberInChapter: 4,
    type: 'tf',
    question: "Titik P(-5, 4) terletak pada Kuadran II dalam bidang koordinat kartesius.",
    options: ["Benar", "Salah"],
    correctAnswer: "Benar",
    source: "Mantappu Academy",
    sourceUrl: "https://www.youtube.com/watch?v=6PACMPC_i5M",
    material: "Kuadran II memiliki absis (x) negatif dan ordinat (y) positif. P(-5, 4) memenuhi syarat.",
    hints: [
      "Kuadran II: x negatif, y positif.",
      "x = -5, y = 4.",
      "Pernyataan benar."
    ],
    explanation: ["1. X negatif dan Y positif berada di Kuadran II (Benar)."],
    voiceScript: { readQuestion: "Titik P(-5, 4) terletak pada Kuadran II?", correct: "Benar!", incorrect: "Pernyataan benar." }
  },
  {
    id: 20,
    chapterId: 4,
    numberInChapter: 5,
    type: 'tf',
    question: "Grafik fungsi linear f(x) = 2x - 6 memotong sumbu Y di titik (-6, 0).",
    options: ["Benar", "Salah"],
    correctAnswer: "Salah",
    source: "Mantappu Academy",
    sourceUrl: "https://www.youtube.com/watch?v=6PACMPC_i5M",
    material: "Memotong sumbu Y saat x = 0 => f(0) = 2(0) - 6 = -6. Titiknya adalah (0, -6), bukan (-6, 0).",
    hints: [
      "Titik potong sumbu Y diperoleh saat x = 0.",
      "f(0) = -6.",
      "Titik potongnya adalah (0, -6)."
    ],
    explanation: ["1. Titik potong sumbu Y adalah (0, -6) (Pernyataan Salah)."],
    voiceScript: { readQuestion: "Grafik f(x)=2x-6 memotong sumbu Y di (-6, 0)?", correct: "Benar, pernyataan itu Salah.", incorrect: "Pernyataan bernilai salah." }
  },

  // --- BAB 5 ---
  {
    id: 21,
    chapterId: 5,
    numberInChapter: 1,
    type: 'pg',
    question: "Susunan batu bata pagar membentuk pola bilangan: baris pertama 4 batu bata, baris kedua 7 batu bata, baris ketiga 10 batu bata, dan seterusnya. Banyak batu bata pada baris ke-12 adalah ...",
    options: ["A. 34 buah", "B. 37 buah", "C. 40 buah", "D. 43 buah"],
    correctAnswer: "B",
    source: "Edu-Vid Part-3",
    sourceUrl: "https://www.youtube.com/watch?v=ukyG40w5J5E",
    material: "Barisan aritmetika dengan a = 4, b = 3. U_12 = a + 11b = 4 + 11(3) = 37 buah.",
    hints: [
      "Gunakan rumus suku ke-n barisan aritmetika: Un = a + (n-1)b.",
      "a = 4, b = 3, n = 12.",
      "Hasilnya adalah 37 buah."
    ],
    explanation: ["1. U_12 = 4 + (12 - 1)3 = 4 + 33 = 37."],
    voiceScript: { readQuestion: "Banyak batu bata pada baris ke-12 adalah?", correct: "Tepat! 37 buah.", incorrect: "Gunakan rumus aritmetika Un = a + (n-1)b." }
  },
  {
    id: 22,
    chapterId: 5,
    numberInChapter: 2,
    type: 'pg',
    question: "Diketahui pola bilangan segitiga: 1, 3, 6, 10, 15, ... Banyak noktah pada pola ke-8 adalah ...",
    options: ["A. 28", "B. 32", "C. 36", "D. 45"],
    correctAnswer: "C",
    source: "Mantappu Academy",
    sourceUrl: "https://www.youtube.com/watch?v=6PACMPC_i5M",
    material: "Rumus pola bilangan segitiga Un = n(n+1)/2. U_8 = 8(9)/2 = 36.",
    hints: [
      "Gunakan rumus pola segitiga n(n+1)/2.",
      "n = 8.",
      "Hasilnya adalah 36."
    ],
    explanation: ["1. U_8 = 8 × 9 / 2 = 36."],
    voiceScript: { readQuestion: "Banyak noktah pada pola segitiga ke-8 adalah?", correct: "Benar! 36.", incorrect: "Gunakan rumus n(n+1)/2." }
  },
  {
    id: 23,
    chapterId: 5,
    numberInChapter: 3,
    type: 'pg',
    question: "Dalam sebuah aula pertunjukan terdapat 10 baris kursi. Baris paling depan berisi 16 kursi, dan setiap baris di belakangnya selalu bertambah 3 kursi. Jumlah seluruh kursi di aula tersebut adalah ...",
    options: ["A. 280 kursi", "B. 295 kursi", "C. 310 kursi", "D. 325 kursi"],
    correctAnswer: "B",
    source: "Edu-Vid Part-3",
    sourceUrl: "https://www.youtube.com/watch?v=ukyG40w5J5E",
    material: "Deret aritmetika Sn = n/2 (2a + (n-1)b). S_10 = 10/2 (2(16) + 9(3)) = 5(32 + 27) = 5(59) = 295 kursi.",
    hints: [
      "Gunakan rumus jumlah n suku deret aritmetika Sn.",
      "a = 16, b = 3, n = 10.",
      "Hasilnya adalah 295 kursi."
    ],
    explanation: ["1. S_10 = 5(32 + 27) = 295 kursi."],
    voiceScript: { readQuestion: "Jumlah seluruh kursi di aula adalah?", correct: "Tepat! 295 kursi.", incorrect: "Gunakan rumus jumlah deret aritmetika Sn." }
  },
  {
    id: 24,
    chapterId: 5,
    numberInChapter: 4,
    type: 'tf',
    question: "Suku berikutnya dari barisan bilangan 2, 6, 18, 54 adalah 162.",
    options: ["Benar", "Salah"],
    correctAnswer: "Benar",
    source: "Mantappu Academy",
    sourceUrl: "https://www.youtube.com/watch?v=6PACMPC_i5M",
    material: "Ini adalah barisan geometri dengan rasio r = 3. 54 × 3 = 162.",
    hints: [
      "Periksa rasio perkalian antar suku.",
      "6/2 = 3, 18/6 = 3.",
      "Pernyataan benar."
    ],
    explanation: ["1. Suku berikutnya = 54 × 3 = 162 (Benar)."],
    voiceScript: { readQuestion: "Suku berikutnya dari 2, 6, 18, 54 adalah 162?", correct: "Benar!", incorrect: "Pernyataan benar." }
  },
  {
    id: 25,
    chapterId: 5,
    numberInChapter: 5,
    type: 'tf',
    question: "Rumus suku ke-n dari barisan 5, 9, 13, 17, ... adalah Un = 4n - 1.",
    options: ["Benar", "Salah"],
    correctAnswer: "Salah",
    source: "Mantappu Academy",
    sourceUrl: "https://www.youtube.com/watch?v=6PACMPC_i5M",
    material: "Un = a + (n-1)b = 5 + (n-1)4 = 4n + 1 (bukan 4n - 1).",
    hints: [
      "Uji untuk n = 1: 4(1) - 1 = 3 (tidak sama dengan suku pertama yaitu 5).",
      "Rumus yang benar adalah 4n + 1.",
      "Pernyataan salah."
    ],
    explanation: ["1. Rumus yang benar adalah Un = 4n + 1 (Pernyataan Salah)."],
    voiceScript: { readQuestion: "Rumus Un barisan tersebut adalah 4n - 1?", correct: "Benar, pernyataan itu Salah.", incorrect: "Pernyataan bernilai salah." }
  },

  // --- BAB 6 ---
  {
    id: 26,
    chapterId: 6,
    numberInChapter: 1,
    type: 'pg',
    question: "Dua garis sejajar dipotong garis transversal. Jika besar salah satu sudut dalam berseberangan adalah (3x + 15) derajat dan pasangannya 75 derajat, maka nilai x adalah ...",
    options: ["A. 15", "B. 20", "C. 25", "D. 30"],
    correctAnswer: "B",
    source: "Edu-Vid Part-4",
    sourceUrl: "https://www.youtube.com/watch?v=juDOq8MGCAU",
    material: "Sudut dalam berseberangan besarnya sama: 3x + 15 = 75 => 3x = 60 => x = 20.",
    hints: [
      "Sudut dalam berseberangan bernilai sama besar.",
      "3x + 15 = 75.",
      "Hasil x = 20."
    ],
    explanation: ["1. 3x = 60 => x = 20."],
    voiceScript: { readQuestion: "Berapa nilai x jika 3x ditambah 15 sama dengan 75 derajat?", correct: "Benar! x = 20.", incorrect: "Sudut dalam berseberangan besarnya sama." }
  },
  {
    id: 27,
    chapterId: 6,
    numberInChapter: 2,
    type: 'pg',
    question: "Besar suatu sudut sama dengan 4 kali penyikunya. Besar pelurus sudut tersebut adalah ...",
    options: ["A. 72 derajat", "B. 108 derajat", "C. 126 derajat", "D. 144 derajat"],
    correctAnswer: "B",
    source: "Edu-Vid Part-4",
    sourceUrl: "https://www.youtube.com/watch?v=juDOq8MGCAU",
    material: "Sudut = x, penyiku = 90 - x. x = 4(90 - x) => 5x = 360 => x = 72. Pelurus sudut = 180 - 72 = 108 derajat.",
    hints: [
      "Sudut + penyiku = 90.",
      "x = 4(90 - x) diperoleh x = 72.",
      "Pelurus = 180 - 72 = 108 derajat."
    ],
    explanation: ["1. Sudut = 72 derajat.", "2. Pelurus = 180 - 72 = 108 derajat."],
    voiceScript: { readQuestion: "Berapa pelurus sudut yang besarnya 4 kali penyikunya?", correct: "Tepat! 108 derajat.", incorrect: "Cari besar sudutnya terlebih dahulu." }
  },
  {
    id: 28,
    chapterId: 6,
    numberInChapter: 3,
    type: 'pg',
    question: "Banyaknya sisi dan rusuk pada sebuah jaring-jaring utuh prisma segi lima berturut-turut adalah ...",
    options: ["A. 5 sisi dan 10 rusuk", "B. 6 sisi dan 12 rusuk", "C. 7 sisi dan 15 rusuk", "D. 7 sisi dan 10 rusuk"],
    correctAnswer: "C",
    source: "Edu-Vid Part-5",
    sourceUrl: "https://www.youtube.com/watch?v=w0I5n9Hc_t4",
    material: "Prisma segi lima memiliki 7 sisi (2 alas/tutup + 5 tegak) dan 15 rusuk (5 alas + 5 tutup + 5 tinggi).",
    hints: [
      "Prisma segi-n memiliki n+2 sisi dan 3n rusuk.",
      "Untuk n = 5, sisi = 7, rusuk = 15.",
      "Pilihan C adalah yang benar."
    ],
    explanation: ["1. Sisi = 7, Rusuk = 15."],
    voiceScript: { readQuestion: "Berapa banyak sisi dan rusuk prisma segi lima?", correct: "Benar! 7 sisi dan 15 rusuk.", incorrect: "Gunakan rumus prisma n+2 sisi dan 3n rusuk." }
  },
  {
    id: 29,
    chapterId: 6,
    numberInChapter: 4,
    type: 'tf',
    question: "Jaring-jaring prisma segitiga tersusun atas 2 buah bangun segitiga yang kongruen dan 3 buah bangun persegi panjang.",
    options: ["Benar", "Salah"],
    correctAnswer: "Benar",
    source: "Edu-Vid Part-5",
    sourceUrl: "https://www.youtube.com/watch?v=w0I5n9Hc_t4",
    material: "Prisma segitiga memiliki alas dan tutup berupa 2 segitiga kongruen serta 3 sisi tegak berupa persegi panjang (Benar).",
    hints: [
      "Alas dan tutup prisma segitiga adalah segitiga.",
      "Sisi tegaknya berbentuk persegi panjang.",
      "Pernyataan benar."
    ],
    explanation: ["1. Sesuai dengan sifat jaring-jaring prisma segitiga (Benar)."],
    voiceScript: { readQuestion: "Jaring-jaring prisma segitiga terdiri dari 2 segitiga dan 3 persegi panjang?", correct: "Benar!", incorrect: "Pernyataan benar." }
  },
  {
    id: 30,
    chapterId: 6,
    numberInChapter: 5,
    type: 'tf',
    question: "Jumlah dua sudut yang saling berpelurus adalah 90 derajat.",
    options: ["Benar", "Salah"],
    correctAnswer: "Salah",
    source: "Edu-Vid Part-4",
    sourceUrl: "https://www.youtube.com/watch?v=juDOq8MGCAU",
    material: "Jumlah dua sudut berpelurus (suplemen) adalah 180 derajat. 90 derajat adalah sudut berpenyiku (komplemen).",
    hints: [
      "Pelurus = 180 derajat.",
      "Penyiku = 90 derajat.",
      "Pernyataan salah."
    ],
    explanation: ["1. Berpelurus bernilai 180 derajat (Pernyataan Salah)."],
    voiceScript: { readQuestion: "Jumlah dua sudut berpelurus adalah 90 derajat?", correct: "Benar, pernyataan itu Salah.", incorrect: "Pernyataan bernilai salah." }
  },

  // --- BAB 7 ---
  {
    id: 31,
    chapterId: 7,
    numberInChapter: 1,
    type: 'pg',
    question: "Sebuah kapal berlayar ke arah utara sejauh 24 km, lalu berbelok ke arah timur sejauh 10 km. Jarak terdekat kapal sekarang dari titik keberangkatan awal adalah ...",
    options: ["A. 26 km", "B. 28 km", "C. 30 km", "D. 34 km"],
    correctAnswer: "A",
    source: "Edu-Vid Part-4",
    sourceUrl: "https://www.youtube.com/watch?v=juDOq8MGCAU",
    material: "Jarak = √(24^2 + 10^2) = √(576 + 100) = √676 = 26 km.",
    hints: [
      "Gunakan Teorema Pythagoras c^2 = a^2 + b^2.",
      "Tripel Pythagoras 5-12-13 dikalikan 2 menjadi 10-24-26.",
      "Hasilnya adalah 26 km."
    ],
    explanation: ["1. Jarak = √(576 + 100) = 26 km."],
    voiceScript: { readQuestion: "Berapa jarak terdekat kapal dari titik awal setelah berlayar 24 km utara dan 10 km timur?", correct: "Benar! 26 km.", incorrect: "Gunakan Teorema Pythagoras." }
  },
  {
    id: 32,
    chapterId: 7,
    numberInChapter: 2,
    type: 'pg',
    question: "Sebuah tiang bendera setinggi 6 meter memiliki panjang bayangan 4 meter. Pada saat yang sama, sebuah pohon memiliki panjang bayangan 10 meter. Tinggi pohon tersebut adalah ...",
    options: ["A. 12 meter", "B. 15 meter", "C. 16 meter", "D. 24 meter"],
    correctAnswer: "B",
    source: "Edu-Vid Part-4",
    sourceUrl: "https://www.youtube.com/watch?v=juDOq8MGCAU",
    material: "Kesebangunan: Tinggi tiang / Bayangan tiang = Tinggi pohon / Bayangan pohon => 6 / 4 = t / 10 => t = (6 × 10) / 4 = 15 meter.",
    hints: [
      "Gunakan perbandingan senilai kesebangunan bayangan.",
      "6 / 4 = t / 10.",
      "Hasilnya adalah 15 meter."
    ],
    explanation: ["1. t = 60 / 4 = 15 meter."],
    voiceScript: { readQuestion: "Berapa tinggi pohon jika bayangannya 10 meter dan tiang 6 meter berbayangan 4 meter?", correct: "Tepat! 15 meter.", incorrect: "Gunakan perbandingan kesebangunan." }
  },
  {
    id: 33,
    chapterId: 7,
    numberInChapter: 3,
    type: 'pg',
    question: "Sebuah foto berukuran lebar 12 cm dan tinggi 18 cm ditempel pada karton yang sebangun. Jika di sebelah kiri, kanan, dan atas foto masih tersisa karton selebar 2 cm, maka lebar karton di bagian bawah foto adalah ...",
    options: ["A. 2 cm", "B. 3 cm", "C. 4 cm", "D. 6 cm"],
    correctAnswer: "C",
    source: "Edu-Vid Part-5",
    sourceUrl: "https://www.youtube.com/watch?v=w0I5n9Hc_t4",
    material: "Lebar karton = 12 + 2 + 2 = 16 cm. Perbandingan lebar karton : foto = 16 : 12 = 4 : 3. Tinggi karton = (4/3) × 18 = 24 cm. Sisa bawah = 24 - 2 (atas) - 18 (foto) = 4 cm.",
    hints: [
      "Hitung lebar total karton (12 + 2 + 2 = 16 cm).",
      "Gunakan perbandingan kesebangunan dengan tinggi.",
      "Sisa bawah adalah 4 cm."
    ],
    explanation: ["1. Tinggi karton = 24 cm.", "2. Bawah = 24 - 2 - 18 = 4 cm."],
    voiceScript: { readQuestion: "Berapa sisa karton di bagian bawah foto yang sebangun?", correct: "Benar! 4 cm.", incorrect: "Gunakan perbandingan kesebangunan bingkai karton." }
  },
  {
    id: 34,
    chapterId: 7,
    numberInChapter: 4,
    type: 'tf',
    question: "Kelompok bilangan 9 cm, 12 cm, dan 15 cm merupakan ukuran sisi-sisi segitiga siku-siku.",
    options: ["Benar", "Salah"],
    correctAnswer: "Benar",
    source: "Edu-Vid Part-5",
    sourceUrl: "https://www.youtube.com/watch?v=w0I5n9Hc_t4",
    material: "9^2 + 12^2 = 81 + 144 = 225 = 15^2. Merupakan tripel Pythagoras (kelipatan 3-4-5) (Benar).",
    hints: [
      "Uji kuadrat sisi terpanjang dengan jumlah kuadrat dua sisi lainnya.",
      "81 + 144 = 225.",
      "Pernyataan benar."
    ],
    explanation: ["1. Memenuhi Teorema Pythagoras (Benar)."],
    voiceScript: { readQuestion: "Apakah 9, 12, dan 15 adalah ukuran segitiga siku-siku?", correct: "Benar!", incorrect: "Pernyataan benar." }
  },
  {
    id: 35,
    chapterId: 7,
    numberInChapter: 5,
    type: 'tf',
    question: "Dua buah bangun datar yang sebangun sudah pasti saling kongruen.",
    options: ["Benar", "Salah"],
    correctAnswer: "Salah",
    source: "Edu-Vid Part-5",
    sourceUrl: "https://www.youtube.com/watch?v=w0I5n9Hc_t4",
    material: "Bangun yang kongruen pasti sebangun, tetapi bangun yang sebangun belum tentu kongruen karena ukurannya bisa berbeda (Pernyataan Salah).",
    hints: [
      "Kongruen artinya bentuk dan ukuran sama persis.",
      "Sebangun hanya memerlukan bentuk yang sebanding.",
      "Pernyataan salah."
    ],
    explanation: ["1. Sebangun belum tentu kongruen (Pernyataan Salah)."],
    voiceScript: { readQuestion: "Bangun datar yang sebangun pasti kongruen?", correct: "Benar, pernyataan itu Salah.", incorrect: "Pernyataan bernilai salah." }
  },

  // --- BAB 8 ---
  {
    id: 36,
    chapterId: 8,
    numberInChapter: 1,
    type: 'pg',
    question: "Titik M(-4, 7) ditranslasikan oleh T(6, -3). Koordinat bayangan titik M adalah ...",
    options: ["A. (2, 4)", "B. (-10, 10)", "C. (2, 10)", "D. (-2, 4)"],
    correctAnswer: "A",
    source: "Edu-Vid Part-5",
    sourceUrl: "https://www.youtube.com/watch?v=w0I5n9Hc_t4",
    material: "Translasi T(a, b): (x + a, y + b) = (-4 + 6, 7 + (-3)) = (2, 4).",
    hints: [
      "Jumlahkan koordinat titik asal dengan komponen translasi.",
      "x' = -4 + 6, y' = 7 - 3.",
      "Hasilnya adalah (2, 4)."
    ],
    explanation: ["1. M' = (2, 4)."],
    voiceScript: { readQuestion: "Berapa bayangan titik M(-4, 7) ditranslasikan T(6, -3)?", correct: "Benar! (2, 4).", incorrect: "Jumlahkan masing-masing absis dan ordinat." }
  },
  {
    id: 37,
    chapterId: 8,
    numberInChapter: 2,
    type: 'pg',
    question: "Bayangan titik B(5, -3) jika direfleksikan terhadap garis y = x adalah ...",
    options: ["A. (-5, 3)", "B. (-3, 5)", "C. (3, -5)", "D. (-5, -3)"],
    correctAnswer: "B",
    source: "Edu-Vid Part-5",
    sourceUrl: "https://www.youtube.com/watch?v=w0I5n9Hc_t4",
    material: "Refleksi terhadap y = x menukar posisi koordinat (x, y) menjadi (y, x). Jadi B(5, -3) menjadi (-3, 5).",
    hints: [
      "Refleksi y = x menukar posisi x dan y.",
      "(x, y) menjadi (y, x).",
      "Hasilnya adalah (-3, 5)."
    ],
    explanation: ["1. B' = (-3, 5)."],
    voiceScript: { readQuestion: "Berapa bayangan titik B(5, -3) direfleksikan terhadap garis y = x?", correct: "Tepat! (-3, 5).", incorrect: "Tukar posisi x dan y." }
  },
  {
    id: 38,
    chapterId: 8,
    numberInChapter: 3,
    type: 'pg',
    question: "Titik C(-2, 4) didilatasikan dengan pusat O(0, 0) dan faktor skala k = 3. Koordinat bayangan titik C adalah ...",
    options: ["A. (1, 7)", "B. (-6, 12)", "C. (6, -12)", "D. (-6, 7)"],
    correctAnswer: "B",
    source: "Edu-Vid Part-5",
    sourceUrl: "https://www.youtube.com/watch?v=w0I5n9Hc_t4",
    material: "Dilatasi [O, k]: (kx, ky) = (3(-2), 3(4)) = (-6, 12).",
    hints: [
      "Kalikan absis dan ordinat titik C dengan faktor skala k = 3.",
      "x' = 3 × (-2) = -6, y' = 3 × 4 = 12.",
      "Hasilnya adalah (-6, 12)."
    ],
    explanation: ["1. C' = (-6, 12)."],
    voiceScript: { readQuestion: "Berapa bayangan titik C(-2, 4) didilatasikan skala 3?", correct: "Benar! (-6, 12).", incorrect: "Kalikan koordinat dengan skala 3." }
  },
  {
    id: 39,
    chapterId: 8,
    numberInChapter: 4,
    type: 'tf',
    question: "Refleksi titik P(3, -8) terhadap sumbu X menghasilkan bayangan P'(3, 8).",
    options: ["Benar", "Salah"],
    correctAnswer: "Benar",
    source: "Edu-Vid Part-5",
    sourceUrl: "https://www.youtube.com/watch?v=w0I5n9Hc_t4",
    material: "Refleksi terhadap sumbu X mengubah tanda ordinat (y) menjadi -y. P(3, -8) menjadi P'(3, 8) (Benar).",
    hints: [
      "Refleksi sumbu X: (x, -y).",
      "-(-8) = 8.",
      "Pernyataan benar."
    ],
    explanation: ["1. P' = (3, 8) (Benar)."],
    voiceScript: { readQuestion: "Refleksi titik P(3, -8) terhadap sumbu X adalah P'(3, 8)?", correct: "Benar!", incorrect: "Pernyataan benar." }
  },
  {
    id: 40,
    chapterId: 8,
    numberInChapter: 5,
    type: 'tf',
    question: "Rotasi titik Q(2, 5) sebesar 180 derajat dengan pusat (0, 0) menghasilkan bayangan Q'(5, 2).",
    options: ["Benar", "Salah"],
    correctAnswer: "Salah",
    source: "Edu-Vid Part-5",
    sourceUrl: "https://www.youtube.com/watch?v=w0I5n9Hc_t4",
    material: "Rotasi 180 derajat terhadap (0, 0) mengubah tanda kedua koordinat menjadi (-x, -y). Jadi Q(2, 5) menjadi Q'(-2, -5), bukan (5, 2).",
    hints: [
      "Rotasi 180 derajat: (-x, -y).",
      "Hasilnya adalah (-2, -5).",
      "Pernyataan salah."
    ],
    explanation: ["1. Q'(-2, -5) (Pernyataan Salah)."],
    voiceScript: { readQuestion: "Rotasi Q(2, 5) sejauh 180 derajat adalah Q'(5, 2)?", correct: "Benar, pernyataan itu Salah.", incorrect: "Pernyataan bernilai salah." }
  },

  // --- BAB 9 ---
  {
    id: 41,
    chapterId: 9,
    numberInChapter: 1,
    type: 'pg',
    question: "Sebuah bangun gabungan terdiri dari persegi panjang berukuran 14 cm x 10 cm dan setengah lingkaran yang menempel pada sisi lebar 14 cm (pi = 22/7). Luas gabungan bangun tersebut adalah ...",
    options: ["A. 177 cm2", "B. 217 cm2", "C. 254 cm2", "D. 294 cm2"],
    correctAnswer: "B",
    source: "Edu-Vid Part-4",
    sourceUrl: "https://www.youtube.com/watch?v=juDOq8MGCAU",
    material: "Luas persegi panjang = 14 × 10 = 140 cm^2. Jari-jari setengah lingkaran = 14 / 2 = 7 cm. Luas setengah lingkaran = (1/2) × (22/7) × 7^2 = 77 cm^2. Luas total = 140 + 77 = 217 cm^2.",
    hints: [
      "Hitung luas persegi panjang (p × l).",
      "Hitung luas setengah lingkaran dengan r = 7 cm.",
      "Hasil total adalah 217 cm^2."
    ],
    explanation: ["1. Luas = 140 + 77 = 217 cm^2."],
    voiceScript: { readQuestion: "Berapa luas gabungan persegi panjang 14x10 dan setengah lingkaran berdiameter 14 cm?", correct: "Benar! 217 cm persegi.", incorrect: "Jumlahkan luas persegi panjang dan setengah lingkaran." }
  },
  {
    id: 42,
    chapterId: 9,
    numberInChapter: 2,
    type: 'pg',
    question: "Sebuah akuarium berbentuk balok memiliki panjang 80 cm, lebar 40 cm, dan tinggi 50 cm. Jika akuarium tersebut diisi air sebanyak 3/4 bagian, volume air di dalam akuarium adalah ...",
    options: ["A. 100 liter", "B. 120 liter", "C. 140 liter", "D. 160 liter"],
    correctAnswer: "B",
    source: "Edu-Vid Part-6",
    sourceUrl: "https://www.youtube.com/watch?v=OW3710R9pQk",
    material: "Volume total = 80 × 40 × 50 = 160.000 cm^3 = 160 liter. Volume air = (3/4) × 160 = 120 liter.",
    hints: [
      "Hitung volume balok dalam cm^3 lalu ubah ke liter (1 liter = 1000 cm^3).",
      "Kalikan dengan 3/4.",
      "Hasilnya adalah 120 liter."
    ],
    explanation: ["1. Volume total = 160 liter.", "2. Air = 3/4 × 160 = 120 liter."],
    voiceScript: { readQuestion: "Berapa liter volume air jika akuarium balok diisi 3/4 bagian?", correct: "Tepat! 120 liter.", incorrect: "Hitung volume balok lalu kalikan 3/4." }
  },
  {
    id: 43,
    chapterId: 9,
    numberInChapter: 3,
    type: 'pg',
    question: "Keliling sebuah taman berbentuk lingkaran dengan diameter 28 meter (pi = 22/7) adalah ...",
    options: ["A. 44 meter", "B. 66 meter", "C. 88 meter", "D. 176 meter"],
    correctAnswer: "C",
    source: "Edu-Vid Part-4",
    sourceUrl: "https://www.youtube.com/watch?v=juDOq8MGCAU",
    material: "Keliling = pi × d = (22/7) × 28 = 88 meter.",
    hints: [
      "Rumus keliling lingkaran adalah pi × d.",
      "pi = 22/7, d = 28.",
      "Hasilnya adalah 88 meter."
    ],
    explanation: ["1. K = 22/7 × 28 = 88 meter."],
    voiceScript: { readQuestion: "Berapa keliling taman lingkaran berdiameter 28 meter?", correct: "Benar! 88 meter.", incorrect: "Gunakan rumus keliling lingkaran." }
  },
  {
    id: 44,
    chapterId: 9,
    numberInChapter: 4,
    type: 'tf',
    question: "Volume sebuah kubus dengan panjang rusuk 12 cm adalah 1.728 cm3.",
    options: ["Benar", "Salah"],
    correctAnswer: "Benar",
    source: "Edu-Vid Part-6",
    sourceUrl: "https://www.youtube.com/watch?v=OW3710R9pQk",
    material: "Volume kubus = s^3 = 12 × 12 × 12 = 1.728 cm^3 (Benar).",
    hints: [
      "Pangkatkan tiga panjang rusuk kubus.",
      "12^3 = 1728.",
      "Pernyataan benar."
    ],
    explanation: ["1. Sesuai perhitungan volume kubus (Benar)."],
    voiceScript: { readQuestion: "Volume kubus rusuk 12 cm adalah 1.728 cm kubik?", correct: "Benar!", incorrect: "Pernyataan benar." }
  },
  {
    id: 45,
    chapterId: 9,
    numberInChapter: 5,
    type: 'tf',
    question: "Jika panjang rusuk sebuah kubus diperbesar 2 kali lipat, maka volumenya menjadi 4 kali lipat volume semula.",
    options: ["Benar", "Salah"],
    correctAnswer: "Salah",
    source: "Edu-Vid Part-6",
    sourceUrl: "https://www.youtube.com/watch?v=OW3710R9pQk",
    material: "Jika rusuk menjadi 2s, volume menjadi (2s)^3 = 8s^3 (menjadi 8 kali lipat, bukan 4 kali lipat).",
    hints: [
      "Volume kubus sebanding dengan pangkat tiga rusuknya (2^3 = 8).",
      "Pernyataan salah."
    ],
    explanation: ["1. Volumenya menjadi 8 kali lipat (Pernyataan Salah)."],
    voiceScript: { readQuestion: "Jika rusuk kubus diperbesar 2 kali, volume menjadi 4 kali lipat?", correct: "Benar, pernyataan itu Salah.", incorrect: "Pernyataan bernilai salah." }
  },

  // --- BAB 10 ---
  {
    id: 46,
    chapterId: 10,
    numberInChapter: 1,
    type: 'pg',
    question: "Data nilai ulangan IPA 9 siswa adalah: 75, 80, 65, 85, 90, 80, 70, 80, 95. Median dan modus dari data tersebut berturut-turut adalah ...",
    options: ["A. 75 dan 80", "B. 80 dan 80", "C. 80 dan 85", "D. 85 dan 80"],
    correctAnswer: "B",
    source: "Edu-Vid Part-6",
    sourceUrl: "https://www.youtube.com/watch?v=OW3710R9pQk",
    material: "Urutkan data: 65, 70, 75, 80, 80, 80, 85, 90, 95. Nilai tengah (median) data ke-5 adalah 80. Modus (paling sering muncul) adalah 80.",
    hints: [
      "Urutkan data dari terkecil ke terbesar terlebih dahulu.",
      "Cari nilai tengah (median) dan nilai terbanyak (modus).",
      "Keduanya bernilai 80."
    ],
    explanation: ["1. Median = 80, Modus = 80."],
    voiceScript: { readQuestion: "Berapa median dan modus dari data nilai IPA tersebut?", correct: "Benar! 80 dan 80.", incorrect: "Urutkan datanya terlebih dahulu." }
  },
  {
    id: 47,
    chapterId: 10,
    numberInChapter: 2,
    type: 'pg',
    question: "Rata-rata tinggi badan 14 siswa adalah 155 cm. Jika seorang siswa baru bergabung, rata-rata tinggi badan menjadi 156 cm. Tinggi badan siswa baru tersebut adalah ...",
    options: ["A. 165 cm", "B. 168 cm", "C. 170 cm", "D. 172 cm"],
    correctAnswer: "C",
    source: "Edu-Vid Part-6",
    sourceUrl: "https://www.youtube.com/watch?v=OW3710R9pQk",
    material: "Total awal = 14 × 155 = 2170. Total baru = 15 × 156 = 2340. Tinggi siswa baru = 2340 - 2170 = 170 cm.",
    hints: [
      "Hitung total tinggi 14 siswa.",
      "Hitung total tinggi 15 siswa setelah bergabung.",
      "Selisihnya adalah 170 cm."
    ],
    explanation: ["1. Tinggi siswa baru = 2340 - 2170 = 170 cm."],
    voiceScript: { readQuestion: "Berapa tinggi siswa baru jika rata-rata 14 siswa 155 cm naik menjadi 156 cm?", correct: "Tepat! 170 cm.", incorrect: "Kurangkan total nilai baru dengan total awal." }
  },
  {
    id: 48,
    chapterId: 10,
    numberInChapter: 3,
    type: 'pg',
    question: "Dalam diagram lingkaran penjualan 200 buah alat tulis, persentase buku tulis adalah 35%, pulpen 25%, pensil 20%, dan sisanya penghapus. Banyak penghapus yang terjual adalah ...",
    options: ["A. 20 buah", "B. 30 buah", "C. 40 buah", "D. 50 buah"],
    correctAnswer: "C",
    source: "Edu-Vid Part-6",
    sourceUrl: "https://www.youtube.com/watch?v=OW3710R9pQk",
    material: "Persentase penghapus = 100% - (35% + 25% + 20%) = 20%. Banyak penghapus = 20% × 200 = 40 buah.",
    hints: [
      "Hitung sisa persentase untuk penghapus (100% - 80% = 20%).",
      "Kalikan dengan total 200 buah.",
      "Hasilnya adalah 40 buah."
    ],
    explanation: ["1. Banyak penghapus = 20/100 × 200 = 40 buah."],
    voiceScript: { readQuestion: "Berapa banyak penghapus yang terjual dari 200 alat tulis?", correct: "Benar! 40 buah.", incorrect: "Hitung persentase sisanya." }
  },
  {
    id: 49,
    chapterId: 10,
    numberInChapter: 4,
    type: 'tf',
    question: "Mean dari kumpulan data: 6, 8, 7, 9, 10 adalah 8.",
    options: ["Benar", "Salah"],
    correctAnswer: "Benar",
    source: "Edu-Vid Part-6",
    sourceUrl: "https://www.youtube.com/watch?v=OW3710R9pQk",
    material: "Jumlah data = 6 + 8 + 7 + 9 + 10 = 40. Mean = 40 / 5 = 8 (Benar).",
    hints: [
      "Jumlahkan seluruh data lalu bagi dengan banyak data (5).",
      "Pernyataan benar."
    ],
    explanation: ["1. 40 / 5 = 8 (Benar)."],
    voiceScript: { readQuestion: "Apakah mean dari data tersebut adalah 8?", correct: "Benar!", incorrect: "Pernyataan benar." }
  },
  {
    id: 50,
    chapterId: 10,
    numberInChapter: 5,
    type: 'tf',
    question: "Median adalah nilai data yang paling sering muncul dalam suatu kelompok data.",
    options: ["Benar", "Salah"],
    correctAnswer: "Salah",
    source: "Edu-Vid Part-6",
    sourceUrl: "https://www.youtube.com/watch?v=OW3710R9pQk",
    material: "Nilai yang paling sering muncul adalah Modus; Median adalah nilai tengah setelah data diurutkan (Pernyataan Salah).",
    hints: [
      "Modus = sering muncul.",
      "Median = nilai tengah.",
      "Pernyataan salah."
    ],
    explanation: ["1. Itu adalah definisi Modus (Pernyataan Salah)."],
    voiceScript: { readQuestion: "Median adalah nilai data yang paling sering muncul?", correct: "Benar, pernyataan itu Salah.", incorrect: "Pernyataan bernilai salah." }
  },

  // --- BAB 11 ---
  {
    id: 51,
    chapterId: 11,
    numberInChapter: 1,
    type: 'pg',
    question: "Sebuah dadu bermata enam dilempar undi satu kali. Peluang munculnya mata dadu bilangan prima adalah ...",
    options: ["A. 1/6", "B. 1/3", "C. 1/2", "D. 2/3"],
    correctAnswer: "C",
    source: "Edu-Vid Part-6",
    sourceUrl: "https://www.youtube.com/watch?v=OW3710R9pQk",
    material: "Bilangan prima pada dadu: 2, 3, 5 (ada 3 angka). Peluang = 3/6 = 1/2.",
    hints: [
      "Tentukan bilangan prima pada dadu (2, 3, 5).",
      "Bandingkan jumlah prima (3) dengan total sisi dadu (6).",
      "Peluangnya adalah 1/2."
    ],
    explanation: ["1. P = 3/6 = 1/2."],
    voiceScript: { readQuestion: "Berapa peluang muncul mata dadu bilangan prima?", correct: "Benar! 1/2.", incorrect: "Hitung jumlah bilangan prima pada dadu." }
  },
  {
    id: 52,
    chapterId: 11,
    numberInChapter: 2,
    type: 'pg',
    question: "Dalam sebuah keranjang terdapat 480 jeruk dengan kondisi baik dan 20 jeruk busuk. Jika diambil 1 jeruk secara acak, peluang terambilnya jeruk busuk adalah ...",
    options: ["A. 0,02", "B. 0,04", "C. 0,05", "D. 0,20"],
    correctAnswer: "B",
    source: "Edu-Vid Part-6",
    sourceUrl: "https://www.youtube.com/watch?v=OW3710R9pQk",
    material: "Total jeruk = 480 + 20 = 500. Peluang jeruk busuk = 20 / 500 = 2 / 50 = 4 / 100 = 0,04.",
    hints: [
      "Hitung total seluruh jeruk di keranjang.",
      "Bagi jumlah jeruk busuk dengan total jeruk.",
      "Hasilnya adalah 0,04."
    ],
    explanation: ["1. P = 20 / 500 = 0,04."],
    voiceScript: { readQuestion: "Berapa peluang terambil jeruk busuk dari 500 total jeruk?", correct: "Tepat! 0,04.", incorrect: "Bagi jumlah jeruk busuk dengan total keseluruhan." }
  },
  {
    id: 53,
    chapterId: 11,
    numberInChapter: 3,
    type: 'pg',
    question: "Dua buah uang logam dilempar bersamaan sebanyak 120 kali. Frekuensi harapan munculnya kedua sisi gambar adalah ...",
    options: ["A. 30 kali", "B. 40 kali", "C. 60 kali", "D. 90 kali"],
    correctAnswer: "A",
    source: "Edu-Vid Part-6",
    sourceUrl: "https://www.youtube.com/watch?v=OW3710R9pQk",
    material: "Titik sampel 2 uang logam = {AA, AG, GA, GG} (n(S) = 4). Muncul kedua gambar (GG) = 1. Peluang = 1/4. Frekuensi harapan = (1/4) × 120 = 30 kali.",
    hints: [
      "Peluang muncul dua gambar dari dua uang logam adalah 1/4.",
      "Kalikan dengan banyak percobaan 120 kali.",
      "Hasilnya adalah 30 kali."
    ],
    explanation: ["1. Fh = 1/4 × 120 = 30 kali."],
    voiceScript: { readQuestion: "Berapa frekuensi harapan muncul dua gambar dari 120 kali lemparan dua koin?", correct: "Benar! 30 kali.", incorrect: "Gunakan rumus frekuensi harapan." }
  },
  {
    id: 54,
    chapterId: 11,
    numberInChapter: 4,
    type: 'tf',
    question: "Dari 250 kali uji coba sebuah sensor otomatis, tercatat 30 kali gagal mendeteksi. Frekuensi relatif kegagalan sensor tersebut adalah 0,12.",
    options: ["Benar", "Salah"],
    correctAnswer: "Benar",
    source: "Edu-Vid Part-6",
    sourceUrl: "https://www.youtube.com/watch?v=OW3710R9pQk",
    material: "Frekuensi relatif gagal = 30 / 250 = 3 / 25 = 12 / 100 = 0,12 (Benar).",
    hints: [
      "Bagi frekuensi kejadian gagal dengan total uji coba.",
      "30 / 250.",
      "Pernyataan benar."
    ],
    explanation: ["1. 30 / 250 = 0,12 (Benar)."],
    voiceScript: { readQuestion: "Frekuensi relatif kegagalan sensor adalah 0,12?", correct: "Benar!", incorrect: "Pernyataan benar." }
  },
  {
    id: 55,
    chapterId: 11,
    numberInChapter: 5,
    type: 'tf',
    question: "Jika peluang turun hujan hari ini adalah 0,35, maka peluang tidak turun hujan hari ini adalah 0,75.",
    options: ["Benar", "Salah"],
    correctAnswer: "Salah",
    source: "Edu-Vid Part-6",
    sourceUrl: "https://www.youtube.com/watch?v=OW3710R9pQk",
    material: "Peluang komplemen (tidak hujan) = 1 - 0,35 = 0,65 (bukan 0,75).",
    hints: [
      "Peluang komplemen diperoleh dari 1 dikurangi peluang kejadian tersebut.",
      "1 - 0,35 = 0,65.",
      "Pernyataan salah."
    ],
    explanation: ["1. 1 - 0,35 = 0,65 (Pernyataan Salah)."],
    voiceScript: { readQuestion: "Jika peluang hujan 0,35, peluang tidak hujan adalah 0,75?", correct: "Benar, pernyataan itu Salah.", incorrect: "Pernyataan bernilai salah." }
  }
];
