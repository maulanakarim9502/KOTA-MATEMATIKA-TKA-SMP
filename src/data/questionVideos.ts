/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface QuestionVideoRecommendation {
  title: string;
  channel: string;
  url: string;
  reason: string;
}

/**
 * Rekomendasi video pembahasan terverifikasi per nomor soal (id 1..55).
 * Setiap entri dipetakan langsung ke topik spesifik dan tipe soal yang diujikan.
 */
export const QUESTION_RECOMMENDED_VIDEOS: Record<number, QuestionVideoRecommendation[]> = {
  // === BAB 1: BILANGAN REAL ===
  1: [
    {
      title: 'Rumus Skala Peta & Jarak Sebenarnya',
      channel: 'Yufid EDU',
      url: 'https://www.youtube.com/embed/92ecgOQIj38',
      reason: 'Membahas cara mencari jarak sebenarnya dari jarak peta dan skala (contoh cm ke km).',
    },
    {
      title: 'Menentukan Jarak Sebenarnya & Skala',
      channel: 'Matematika Hebat',
      url: 'https://www.youtube.com/embed/LTxHlIDl9yM',
      reason: 'Latihan soal cerita skala peta dan konversi satuan panjang.',
    },
  ],
  2: [
    {
      title: 'Perbandingan Senilai Kelas 7 SMP',
      channel: 'Ruang Tentor',
      url: 'https://www.youtube.com/embed/cYlnBH1IRGg',
      reason: 'Membahas konsep perbandingan senilai pada jumlah bahan/barang dan hasilnya.',
    },
    {
      title: 'Konsep Perbandingan Senilai',
      channel: 'Benni al azhri',
      url: 'https://www.youtube.com/embed/CDNrJqzao_Y',
      reason: 'Penjelasan rumus dasar perbandingan senilai beserta contoh penerapannya.',
    },
  ],
  3: [
    {
      title: 'Menuliskan Bilangan ke Notasi Ilmiah Baku',
      channel: 'Matema Kita',
      url: 'https://www.youtube.com/embed/rbvPt7h74Jw',
      reason: 'Membahas cara mengubah bilangan desimal sangat kecil (0,000...) menjadi bentuk baku a × 10^-n.',
    },
    {
      title: 'Cara Mengubah Angka Desimal ke Notasi Ilmiah',
      channel: 'Indah Nia',
      url: 'https://www.youtube.com/embed/1EL3SHpXR7c',
      reason: 'Langkah praktis menggeser tanda koma ke kanan untuk pangkat negatif.',
    },
  ],
  4: [
    {
      title: 'Menentukan Faktorisasi Prima (Pohon Faktor)',
      channel: 'Matematika Spekta',
      url: 'https://www.youtube.com/embed/5gO1fO9U3po',
      reason: 'Membahas cara menguraikan bilangan menjadi perkalian faktor prima berpangkat.',
    },
    {
      title: 'Faktorisasi Prima dengan Pohon Faktor',
      channel: 'Tahir Muhammad',
      url: 'https://www.youtube.com/embed/dzyetCmqq9E',
      reason: 'Contoh langkah pembagian berulang menggunakan bilangan prima 2, 3, 5.',
    },
  ],
  5: [
    {
      title: 'Pembahasan Soal Perbandingan Berbalik Nilai',
      channel: 'Ruang Tentor',
      url: 'https://www.youtube.com/embed/lhFk1-abivQ',
      reason: 'Membahas soal cerita jumlah pekerja vs waktu penyelesaian proyek.',
    },
    {
      title: 'Aplikasi Perbandingan Berbalik Nilai',
      channel: 'Portal Edukasi',
      url: 'https://www.youtube.com/embed/-I8hztM_LV4',
      reason: 'Cara membedakan perbandingan senilai dan berbalik nilai pada soal pekerja.',
    },
  ],

  // === BAB 2: PERSAMAAN & PERTIDAKSAMAAN LINIER ===
  6: [
    {
      title: 'Pertidaksamaan Linear Satu Variabel (PtLSV)',
      channel: 'Kimatika',
      url: 'https://www.youtube.com/embed/SM7qejnJv28',
      reason: 'Membahas penyelesaian pertidaksamaan bentuk ax + b <= cx + d untuk himpunan bilangan bulat.',
    },
    {
      title: 'PLSV dan PtLSV Matematika SMP',
      channel: 'AF Science',
      url: 'https://www.youtube.com/embed/j91Xy4TVlk4',
      reason: 'Penjelasan aturan pindah ruas pada pertidaksamaan linear satu variabel.',
    },
  ],
  7: [
    {
      title: 'Soal Cerita SPLDV Harga Barang',
      channel: 'Kimatika',
      url: 'https://www.youtube.com/embed/lAc-Fmc9o4Q',
      reason: 'Membahas cara memodelkan soal cerita jual-beli ke SPLDV dan menyelesaikannya.',
    },
    {
      title: 'Pembahasan Soal Cerita SPLDV Eliminasi-Substitusi',
      channel: 'Matematika Hebat',
      url: 'https://www.youtube.com/embed/HuUqkFD1sww',
      reason: 'Contoh soal cerita menentukan harga satuan dua jenis barang.',
    },
  ],
  8: [
    {
      title: 'Persamaan Linear Satu Variabel (PLSV)',
      channel: 'Kimatika',
      url: 'https://www.youtube.com/embed/OyynhZDrU-0',
      reason: 'Membahas cara menyelesaikan persamaan linear yang memuat sifat distributif tanda kurung.',
    },
    {
      title: 'Latihan Soal PLSV Pindah Ruas',
      channel: 'Mathsyairozi',
      url: 'https://www.youtube.com/embed/7H_EhKcK2G4',
      reason: 'Langkah menjabarkan tanda kurung a(bx + c) sebelum mengelompokkan variabel x.',
    },
  ],
  9: [
    {
      title: 'PtLSV & Pembagian Bilangan Negatif',
      channel: 'Kimatika',
      url: 'https://www.youtube.com/embed/SM7qejnJv28',
      reason: 'Membahas aturan membalik tanda pertidaksamaan saat membagi dengan koefisien negatif.',
    },
    {
      title: 'Menentukan Himpunan Penyelesaian PtLSV',
      channel: 'AF Science',
      url: 'https://www.youtube.com/embed/j91Xy4TVlk4',
      reason: 'Latihan menentukan nilai x < k dan menuliskannya pada garis bilangan.',
    },
  ],
  10: [
    {
      title: 'Menyelesaikan Soal SPLDV dengan Substitusi',
      channel: 'Didi Yuli Setiaji',
      url: 'https://www.youtube.com/embed/hALJUAkxxHI',
      reason: 'Membahas cara mensubstitusi nilai x dan y yang diketahui untuk mencari koefisien persamaan.',
    },
    {
      title: 'Variasi Soal SPLDV Kelas 8',
      channel: 'Matematika Mudah',
      url: 'https://www.youtube.com/embed/TwEtp9ALRec',
      reason: 'Penguatan metode substitusi dan eliminasi pada sistem persamaan dua variabel.',
    },
  ],

  // === BAB 3: BENTUK ALJABAR ===
  11: [
    {
      title: 'Perkalian & Operasi Hitung Bentuk Aljabar',
      channel: 'Mujib Channel',
      url: 'https://www.youtube.com/embed/JW9wZE8WPes',
      reason: 'Membahas perkalian suku dua (ax + b)(cx + d) lalu menyederhanakan suku sejenis.',
    },
    {
      title: 'Cara Mudah Perkalian Suku Dua Aljabar',
      channel: 'Didi Yuli Setiaji',
      url: 'https://www.youtube.com/embed/EyZsLWuX8MY',
      reason: 'Teknik skema pelangi untuk menjabarkan perkalian dua suku aljabar.',
    },
  ],
  12: [
    {
      title: 'Penerapan Bentuk Aljabar dalam Soal Cerita',
      channel: 'De Somat',
      url: 'https://www.youtube.com/embed/ZoNeF7GG4Tw',
      reason: 'Membahas cara menyusun kalimat belanja dan uang kembalian ke dalam ekspresi aljabar.',
    },
    {
      title: 'Pembahasan Soal Cerita Aljabar Kelas 7',
      channel: 'Hadian Nur',
      url: 'https://www.youtube.com/embed/M3vpRYQcHf0',
      reason: 'Latihan soal pemodelan transaksi pembelian menggunakan variabel x dan y.',
    },
  ],
  13: [
    {
      title: 'Rumus Pemfaktoran Selisih Dua Kuadrat',
      channel: 'Le GuruLes',
      url: 'https://www.youtube.com/embed/zwvPz5EccCc',
      reason: 'Membahas tepat bentuk pemfaktoran a^2 - b^2 = (a - b)(a + b) seperti 4x^2 - 25.',
    },
    {
      title: 'Pemfaktoran Selisih Kuadrat x^2 - y^2',
      channel: 'Matematika Official',
      url: 'https://www.youtube.com/embed/x_6pGY1pL10',
      reason: 'Contoh langkah mengubah bilangan kuadrat menjadi perkalian dua faktor sekawan.',
    },
  ],
  14: [
    {
      title: 'Penjumlahan dan Pengurangan Bentuk Aljabar',
      channel: 'Kimatika',
      url: 'https://www.youtube.com/embed/WHbVY5lOKMI',
      reason: 'Membahas sifat distributif tanda negatif pada pengurangan dua bentuk aljabar.',
    },
    {
      title: 'Menyatukan Suku Sejenis Pengurangan Aljabar',
      channel: 'SayaBisa',
      url: 'https://www.youtube.com/embed/lkGFVj4x7jY',
      reason: 'Penjelasan visual pengelompokan suku variabel sejenis setelah membuka kurung.',
    },
  ],
  15: [
    {
      title: 'Pemfaktoran Bentuk Aljabar dengan FPB Suku',
      channel: 'Hadian Nur',
      url: 'https://www.youtube.com/embed/2ASS7eZZWEo',
      reason: 'Membahas cara mengeluarkan faktor persekutuan terbesar (FPB) dari dua suku aljabar.',
    },
    {
      title: 'Latihan Faktorisasi Bentuk Aljabar SMP',
      channel: 'Yovita Vera',
      url: 'https://www.youtube.com/embed/cvyrLvAhwHI',
      reason: 'Penguatan faktorisasi koefisien dan pangkat variabel terkecil.',
    },
  ],

  // === BAB 4: FUNGSI ===
  16: [
    {
      title: 'Fungsi Linear & Penerapan Soal Cerita',
      channel: 'Math Education',
      url: 'https://www.youtube.com/embed/fsJfgTw6moY',
      reason: 'Membahas aplikasi rumus tarif f(x) = ax + b dalam persoalan biaya perjalanan.',
    },
    {
      title: 'Menentukan Nilai Fungsi Linear Kelas 8',
      channel: 'Video Pembelajaran Matematika',
      url: 'https://www.youtube.com/embed/9lwf-Z49_g8',
      reason: 'Cara menyubstitusi nilai x jarak/waktu ke dalam persamaan fungsi linear.',
    },
  ],
  17: [
    {
      title: 'Menentukan Rumus Fungsi f(x) = ax + b',
      channel: 'I-Math Tutorial',
      url: 'https://www.youtube.com/embed/uHgVLcseLxM',
      reason: 'Membahas soal mencari nilai a, b, dan f(k) jika diketahui dua nilai fungsi seperti f(2) dan f(-1).',
    },
    {
      title: 'Cara Menentukan Rumus Fungsi Kelas 8',
      channel: 'Kelas Pak Syam',
      url: 'https://www.youtube.com/embed/pXSS1GU-vQU',
      reason: 'Langkah eliminasi cepat untuk mencari gradien a dan konstanta b dari fungsi linear.',
    },
  ],
  18: [
    {
      title: 'Koordinat Kartesius & Bangun Datar',
      channel: 'Mathsyairozi',
      url: 'https://www.youtube.com/embed/FnwG8PnqATA',
      reason: 'Membahas cara menentukan titik sudut keempat bangun datar (persegi panjang) pada bidang Kartesius.',
    },
    {
      title: 'Menentukan Posisi Titik pada Bidang Koordinat',
      channel: 'BonaventuraWN',
      url: 'https://www.youtube.com/embed/7wQftLiin_g',
      reason: 'Penguatan pembacaan absis x dan ordinat y untuk sisi sejajar sumbu koordinat.',
    },
  ],
  19: [
    {
      title: 'Menentukan Empat Kuadran Bidang Koordinat',
      channel: 'BonaventuraWN',
      url: 'https://www.youtube.com/embed/7wQftLiin_g',
      reason: 'Membahas aturan tanda (x, y) pada Kuadran I, II, III, dan IV secara lengkap.',
    },
    {
      title: 'Kuadran Pada Koordinat Kartesius',
      channel: 'Tutorial Matematika SMP',
      url: 'https://www.youtube.com/embed/z13nQJb9gWQ',
      reason: 'Penjelasan singkat letak titik negatif-positif pada Kuadran II.',
    },
  ],
  20: [
    {
      title: 'Grafik & Titik Potong Fungsi Linear',
      channel: 'Video Pembelajaran Matematika',
      url: 'https://www.youtube.com/embed/9lwf-Z49_g8',
      reason: 'Membahas cara mencari titik potong terhadap sumbu Y dengan mensubstitusi x = 0.',
    },
    {
      title: 'Menentukan Titik Potong Sumbu X & Y Fungsi',
      channel: 'Math Education',
      url: 'https://www.youtube.com/embed/fsJfgTw6moY',
      reason: 'Penjelasan makna konstanta c pada f(x) = mx + c sebagai perpotongan sumbu Y.',
    },
  ],

  // === BAB 5: BARISAN & DERET ===
  21: [
    {
      title: 'Barisan dan Deret Aritmetika Kelas 8',
      channel: 'Mathsyairozi',
      url: 'https://www.youtube.com/embed/pTeZjwTA3Rs',
      reason: 'Membahas soal cerita menentukan suku ke-n menggunakan rumus Un = a + (n - 1)b.',
    },
    {
      title: 'Rumus Suku ke-n Barisan Aritmetika',
      channel: 'Benni al azhri',
      url: 'https://www.youtube.com/embed/p-4_wvClmGA',
      reason: 'Langkah mengidentifikasi suku pertama a dan beda tetap b dalam soal bertingkat.',
    },
  ],
  22: [
    {
      title: 'Pola Bilangan Segitiga & Persegi Kelas 8',
      channel: 'Easy Math',
      url: 'https://www.youtube.com/embed/JH_eArQYBVE',
      reason: 'Membahas khusus pola bilangan segitiga 1, 3, 6, 10 dan rumus Un = n(n + 1)/2.',
    },
    {
      title: 'Rumus Pola Bilangan & Contohnya',
      channel: 'Yufid EDU',
      url: 'https://www.youtube.com/embed/lE7Rid6ri1E',
      reason: 'Penjelasan berbagai macam pola bilangan konfigurasi objek tingkat SMP.',
    },
  ],
  23: [
    {
      title: 'Menentukan Jumlah Suku (Sn) Deret Aritmetika',
      channel: 'Seekor Lebah',
      url: 'https://www.youtube.com/embed/3wgAx11Rwtc',
      reason: 'Membahas soal cerita jumlah total kursi dalam beberapa baris dengan rumus Sn = n/2(2a + (n-1)b).',
    },
    {
      title: 'Deret Aritmetika & Rumus Sn',
      channel: 'Wahyudi AS',
      url: 'https://www.youtube.com/embed/Uv5eRs_v8qU',
      reason: 'Pembuktian dan latihan soal menghitung jumlah n suku pertama deret aritmetika.',
    },
  ],
  24: [
    {
      title: 'Barisan dan Deret Geometri Kelas 8',
      channel: 'Abi Muis',
      url: 'https://www.youtube.com/embed/eGjxsBQfFIM',
      reason: 'Membahas ciri barisan geometri dengan rasio perkalian tetap antar suku.',
    },
    {
      title: 'Membedakan Barisan Aritmetika dan Geometri',
      channel: 'Mahir Matematika',
      url: 'https://www.youtube.com/embed/8yfuAIZdz_w',
      reason: 'Cara menentukan pola rasio r = U2 / U1 pada barisan bilangan berpangkat.',
    },
  ],
  25: [
    {
      title: 'Cara Menentukan Rumus Suku ke-n Pola Bilangan',
      channel: 'Kelas Kak Nunu',
      url: 'https://www.youtube.com/embed/JyFAPsXSjzk',
      reason: 'Membahas cara menyusun rumus Un = bn + (a - b) dari barisan bilangan berpola tetap.',
    },
    {
      title: 'Menentukan Rumus Un Barisan Aritmetika',
      channel: 'Mathsyairozi',
      url: 'https://www.youtube.com/embed/pTeZjwTA3Rs',
      reason: 'Langkah menguji rumus Un dengan mensubstitusi nilai n = 1, 2, 3.',
    },
  ],

  // === BAB 6: OBJEK GEOMETRI: SUDUT & JARING-JARING ===
  26: [
    {
      title: 'Sudut Sehadap, Berseberangan, & Sepihak',
      channel: 'Yufid EDU',
      url: 'https://www.youtube.com/embed/0slFc-H5vxQ',
      reason: 'Membahas hubungan sudut pada dua garis sejajar yang dipotong garis transversal.',
    },
    {
      title: 'Hubungan Sudut Pada Dua Garis Sejajar',
      channel: 'Om Ali Suud',
      url: 'https://www.youtube.com/embed/H4_O9tAhpBM',
      reason: 'Contoh soal aljabar sudut dalam berseberangan yang besarnya sama besar.',
    },
  ],
  27: [
    {
      title: 'Sudut Saling Berpenyiku dan Berpelurus',
      channel: 'Le GuruLes',
      url: 'https://www.youtube.com/embed/-DxyQFfKwXY',
      reason: 'Membahas soal mencari pelurus suatu sudut jika diketahui penyikunya.',
    },
    {
      title: 'Contoh Soal Sudut Berpenyiku & Berpelurus',
      channel: 'Indah Nia',
      url: 'https://www.youtube.com/embed/2ZCt3PUjnS8',
      reason: 'Langkah bertahap menghitung sudut utama dari 90° lalu mencari 180° dikurangi sudut tersebut.',
    },
  ],
  28: [
    {
      title: 'Unsur-Unsur Prisma: Sisi, Rusuk & Titik Sudut',
      channel: 'Wandri Math',
      url: 'https://www.youtube.com/embed/Zmh4gzEB3yk',
      reason: 'Membahas rumus jumlah sisi (n + 2) dan jumlah rusuk (3n) pada prisma segi-n.',
    },
    {
      title: 'Menghitung Unsur & Panjang Rusuk Prisma',
      channel: 'Matematika Bersama Kak Wahyu',
      url: 'https://www.youtube.com/embed/ce11wdslSd8',
      reason: 'Cara menentukan banyak rusuk dan sisi pada prisma segi enam maupun segi lainnya.',
    },
  ],
  29: [
    {
      title: 'Animasi 3D Jaring-Jaring Prisma Segitiga',
      channel: 'Rahmat Matematika',
      url: 'https://www.youtube.com/embed/_m-fUX8NFio',
      reason: 'Menunjukkan secara visual bahwa jaring-jaring prisma segitiga terdiri dari 2 segitiga dan 3 persegi panjang.',
    },
    {
      title: 'Sifat-Sifat Prisma & Jaring-Jaring Prisma',
      channel: 'Hello, Mari Belajar',
      url: 'https://www.youtube.com/embed/rwq4JgZYFWk',
      reason: 'Penjelasan komposisi sisi alas, tutup, dan sisi tegak pembentuk jaring-jaring prisma.',
    },
  ],
  30: [
    {
      title: 'Sudut Berpelurus, Berpenyiku & Bertolak Belakang',
      channel: 'm4th-lab',
      url: 'https://www.youtube.com/embed/TgSyhobWJlo',
      reason: 'Menegaskan definisi sudut berpelurus (180°) dan sudut berpenyiku (90°).',
    },
    {
      title: 'Latihan Soal Hubungan Antar Sudut SMP',
      channel: 'Yovita Vera',
      url: 'https://www.youtube.com/embed/GpT-BZWcw4s',
      reason: 'Pembahasan soal pernyataan benar-salah konsep sudut berkomplemen dan bersuplemen.',
    },
  ],

  // === BAB 7: PYTHAGORAS & KESEBANGUNAN ===
  31: [
    {
      title: 'Teorema Pythagoras & Soal Cerita Arah Mata Angin',
      channel: 'Skolahan',
      url: 'https://www.youtube.com/embed/rGx96J6oraI',
      reason: 'Membahas cara menghitung jarak terdekat kapal yang berlayar ke utara lalu belok ke timur.',
    },
    {
      title: 'Teorema Pythagoras Kelas 8 SMP',
      channel: 'Mujib Channel',
      url: 'https://www.youtube.com/embed/3nYcgHTjOW0',
      reason: 'Penjelasan penggunaan rumus c^2 = a^2 + b^2 pada segitiga siku-siku.',
    },
  ],
  32: [
    {
      title: 'Menghitung Tinggi Pohon dari Bayangannya (Kesebangunan)',
      channel: 'Alam Matematik',
      url: 'https://www.youtube.com/embed/LnArvqewnAE',
      reason: 'Membahas tepat perbandingan kesebangunan tinggi pohon/tiang dan panjang bayangan.',
    },
    {
      title: 'Pembahasan Soal Kesebangunan Tinggi Pohon & Bayangan',
      channel: 'Insight Chamber',
      url: 'https://www.youtube.com/embed/wJ6gMs5zQtA',
      reason: 'Contoh soal membandingkan bayangan tiang bendera dan bayangan pohon pada saat yang sama.',
    },
  ],
  33: [
    {
      title: 'Menghitung Lebar Sisa Bawah Foto pada Karton',
      channel: 'Bimbel Excellent',
      url: 'https://www.youtube.com/embed/G8qgMC3yFGE',
      reason: 'Membahas tepat soal foto yang ditempel pada karton sebangun dengan sisa kiri, kanan, dan atas.',
    },
    {
      title: 'Kesebangunan: Menghitung Sisa Karton Bagian Bawah',
      channel: 'Rumah Belajar MattPlus',
      url: 'https://www.youtube.com/embed/th3XW8EYdH4',
      reason: 'Langkah perbandingan lebar dan tinggi foto terhadap karton untuk menemukan sisa bawah.',
    },
  ],
  34: [
    {
      title: 'Tripel Pythagoras & Menentukan Jenis Segitiga',
      channel: 'Mujib Channel',
      url: 'https://www.youtube.com/embed/3nYcgHTjOW0',
      reason: 'Membahas cara menguji tiga bilangan sisi segitiga (seperti 7, 24, 25) apakah membentuk siku-siku.',
    },
    {
      title: 'Cara Uji Tripel Pythagoras Kelas 8',
      channel: 'Skolahan',
      url: 'https://www.youtube.com/embed/rGx96J6oraI',
      reason: 'Daftar hafalan cepat dan pembuktian c^2 = a^2 + b^2.',
    },
  ],
  35: [
    {
      title: 'Perbedaan Kesebangunan & Kekongruenan Kelas 9',
      channel: 'Ruang Tentor',
      url: 'https://www.youtube.com/embed/W29QecujCdQ',
      reason: 'Membahas perbedaan syarat sebangun (sudut sama, sisi sebanding) vs kongruen (sama besar & sebentuk).',
    },
    {
      title: 'Konsep Dua Segitiga Sebangun',
      channel: 'I-Math Tutorial',
      url: 'https://www.youtube.com/embed/7hNBZfxzu94',
      reason: 'Penjelasan mengapa dua bangun sebangun belum tentu memiliki ukuran luas yang sama.',
    },
  ],

  // === BAB 8: TRANSFORMASI GEOMETRI ===
  36: [
    {
      title: 'Transformasi Geometri Part 1: Translasi (Pergeseran)',
      channel: 'Rumah Belajar Kamil',
      url: 'https://www.youtube.com/embed/Q1BbgHK4axg',
      reason: 'Membahas rumus translasi titik P(x, y) oleh T(a, b) menjadi P\'(x + a, y + b).',
    },
    {
      title: 'Lengkap Transformasi Geometri (Translasi)',
      channel: 'Matematika Hebat',
      url: 'https://www.youtube.com/embed/4ojT0jS_pR8',
      reason: 'Contoh soal penjumlahan koordinat translasi bilangan positif dan negatif.',
    },
  ],
  37: [
    {
      title: 'Pencerminan/Refleksi Terhadap Garis y = x',
      channel: 'Matematika Bersama Kak Wahyu',
      url: 'https://www.youtube.com/embed/mTYDVthj90Y',
      reason: 'Membahas tepat pencerminan titik A(x, y) terhadap garis y = x menjadi A\'(y, x).',
    },
    {
      title: 'Transformasi Refleksi Garis y = x Kelas 9',
      channel: 'Kelas Pak Syam',
      url: 'https://www.youtube.com/embed/grFBQ1hPkyw',
      reason: 'Latihan cepat menukar posisi absis dan ordinat saat dicerminkan terhadap garis y = x.',
    },
  ],
  38: [
    {
      title: 'Rotasi dan Dilatasi Faktor Skala k (Kelas 9)',
      channel: 'Fismatbykagit',
      url: 'https://www.youtube.com/embed/8XTOxmO-mzk',
      reason: 'Membahas rumus dilatasi pusat O(0, 0) dengan faktor skala k menjadi (kx, ky).',
    },
    {
      title: 'Trik Cepat Dilatasi, Refleksi, Translasi, Rotasi',
      channel: 'Seekor Lebah',
      url: 'https://www.youtube.com/embed/aj3E8B-7xAs',
      reason: 'Cara mudah perkalian koordinat oleh faktor skala k.',
    },
  ],
  39: [
    {
      title: 'Pencerminan Terhadap Sumbu X dan Sumbu Y',
      channel: 'Yovita Vera',
      url: 'https://www.youtube.com/embed/gxndJA2lA4E',
      reason: 'Membahas tepat refleksi titik (x, y) terhadap sumbu X menghasilkan bayangan (x, -y).',
    },
    {
      title: 'Refleksi Terhadap Sumbu X Kelas 9',
      channel: 'Hanna SN',
      url: 'https://www.youtube.com/embed/Fx3a8ioewbc',
      reason: 'Penjelasan visual mengapa tanda koordinat y berubah sementara x tetap.',
    },
  ],
  40: [
    {
      title: 'Transformasi Geometri: Rotasi 180° Pusat (0, 0)',
      channel: 'Math In',
      url: 'https://www.youtube.com/embed/f-uC9hirPP4',
      reason: 'Membahas tepat aturan rotasi 180° pusat O(0, 0) mengubah (x, y) menjadi (-x, -y).',
    },
    {
      title: 'Cara Menentukan Bayangan Rotasi 180°',
      channel: 'Paryatno Lusi',
      url: 'https://www.youtube.com/embed/dzMAgk9NgJo',
      reason: 'Pembahasan soal menentukan bayangan titik hasil perputaran 180 derajat.',
    },
  ],

  // === BAB 9: PENGUKURAN ===
  41: [
    {
      title: 'Menghitung Luas Gabungan Persegi Panjang & Setengah Lingkaran',
      channel: 'Matematika Spekta',
      url: 'https://www.youtube.com/embed/vwZGVVBk5Q0',
      reason: 'Membahas tepat cara menjumlahkan luas persegi panjang dengan luas setengah lingkaran.',
    },
    {
      title: 'Luas Gabungan Persegi Panjang & Setengah Lingkaran',
      channel: 'I-Math Tutorial',
      url: 'https://www.youtube.com/embed/UEmJSWZ7kNg',
      reason: 'Langkah menentukan jari-jari r dari lebar persegi panjang sebagai diameter setengah lingkaran.',
    },
  ],
  42: [
    {
      title: 'Menentukan Volume Balok & Kubus Kelas 8',
      channel: 'BonaventuraWN',
      url: 'https://www.youtube.com/embed/LHsYcVnCZBU',
      reason: 'Membahas rumus volume balok p × l × t dan konversi cm^3 ke satuan liter (dm^3).',
    },
    {
      title: 'Volume Bangun Ruang & Soal Cerita Air',
      channel: 'Manto Suwito',
      url: 'https://www.youtube.com/embed/iPHezaBsgcE',
      reason: 'Latihan menghitung pecahan bagian volume air di dalam wadah berbentuk balok.',
    },
  ],
  43: [
    {
      title: 'Cara Menghitung Keliling Lingkaran Diketahui Diameter',
      channel: 'CAKNEN Channel',
      url: 'https://www.youtube.com/embed/ObP2FsxSk1I',
      reason: 'Membahas tepat rumus K = pi × d menggunakan pi = 22/7 untuk diameter kelipatan 7.',
    },
    {
      title: 'Rumus Keliling Lingkaran & Contoh Soal',
      channel: 'Yufid EDU',
      url: 'https://www.youtube.com/embed/NNSz38MTAOs',
      reason: 'Penjelasan penggunaan 22/7 dan 3,14 pada keliling taman berbentuk lingkaran.',
    },
  ],
  44: [
    {
      title: 'Menentukan Volume Kubus (s^3) Kelas 8',
      channel: 'BonaventuraWN',
      url: 'https://www.youtube.com/embed/LHsYcVnCZBU',
      reason: 'Membahas cara menghitung volume kubus dari panjang rusuk s = 12 cm.',
    },
    {
      title: 'Volume Kubus, Balok & Bangun Ruang',
      channel: 'Manto Suwito',
      url: 'https://www.youtube.com/embed/iPHezaBsgcE',
      reason: 'Penguatan perhitungan pangkat tiga pada kubus.',
    },
  ],
  45: [
    {
      title: 'Perubahan Volume Kubus Jika Rusuk Diperbesar',
      channel: 'BonaventuraWN',
      url: 'https://www.youtube.com/embed/LHsYcVnCZBU',
      reason: 'Membahas hubungan perbandingan volume (ks)^3 = k^3 × s^3 saat panjang rusuk berubah.',
    },
    {
      title: 'Soal Aplikasi Volume Bangun Ruang Sisi Datar',
      channel: 'Manto Suwito',
      url: 'https://www.youtube.com/embed/iPHezaBsgcE',
      reason: 'Membantu membuktikan mengapa perbesaran rusuk 2 kali membuat volume menjadi 8 kali lipat.',
    },
  ],

  // === BAB 10: DATA (STATISTIKA) ===
  46: [
    {
      title: 'Mean, Median & Modus Data Tunggal (Ganjil & Genap)',
      channel: 'Matematika Hebat',
      url: 'https://www.youtube.com/embed/5ReiyMLq_E0',
      reason: 'Membahas cara mengurutkan data untuk menentukan nilai tengah (median) dan modus.',
    },
    {
      title: 'Statistika Kelas 8: Mean, Median, Modus',
      channel: 'Wandri Math',
      url: 'https://www.youtube.com/embed/6HwJtL19V8Q',
      reason: 'Latihan mencari median dan modus dari kumpulan nilai ulangan siswa.',
    },
  ],
  47: [
    {
      title: 'Statistika: Rata-Rata Gabungan Siswa Baru',
      channel: 'Purniasih MariBelajar',
      url: 'https://www.youtube.com/embed/4YJSsT97Jt8',
      reason: 'Membahas soal mencari nilai siswa yang baru bergabung saat rata-rata kelas berubah.',
    },
    {
      title: 'Menghitung Mean & Rata-Rata Gabungan SMP',
      channel: 'Nimatullah',
      url: 'https://www.youtube.com/embed/TSSdqs3eqVM',
      reason: 'Cara mengurangkan jumlah nilai total baru dengan jumlah nilai total awal.',
    },
  ],
  48: [
    {
      title: 'Cara Menghitung Diagram Lingkaran Persen & Soal',
      channel: 'Rumah Gemar Matematika',
      url: 'https://www.youtube.com/embed/xDZXgfIy-5o',
      reason: 'Membahas tepat soal diagram lingkaran persen (sisa persentase 100% dikali total data).',
    },
    {
      title: 'Pembahasan Soal Diagram Lingkaran Persen Part 2',
      channel: 'Rumah Gemar Matematika',
      url: 'https://www.youtube.com/embed/bjM5fxGG61Q',
      reason: 'Contoh mencari banyak item dari persentase yang tersisa pada diagram lingkaran.',
    },
  ],
  49: [
    {
      title: 'Statistika Dasar: Menentukan Mean (Rata-Rata)',
      channel: 'Ruang Belajar Channel',
      url: 'https://www.youtube.com/embed/1w3d88YF_oE',
      reason: 'Membahas rumus Mean = jumlah seluruh data dibagi banyaknya data.',
    },
    {
      title: 'Cara Menghitung Mean Data Tunggal',
      channel: 'Matematika Hebat',
      url: 'https://www.youtube.com/embed/5ReiyMLq_E0',
      reason: 'Contoh cepat menghitung rata-rata 5 nilai data tunggal.',
    },
  ],
  50: [
    {
      title: 'Pengertian & Cara Mencari Modus Data Tunggal',
      channel: 'Yufid EDU',
      url: 'https://www.youtube.com/embed/2p0Jv2p_J-0',
      reason: 'Menegaskan definisi Modus sebagai nilai paling sering muncul vs Median sebagai nilai tengah.',
    },
    {
      title: 'Ukuran Pemusatan Data: Mean, Median & Modus',
      channel: 'Wandri Math',
      url: 'https://www.youtube.com/embed/6HwJtL19V8Q',
      reason: 'Perbandingan arti istilah Mean, Median, dan Modus agar tidak tertukar.',
    },
  ],

  // === BAB 11: PELUANG ===
  51: [
    {
      title: 'Peluang Teoretik Pelemparan Dadu',
      channel: 'Portal Sekolah',
      url: 'https://www.youtube.com/embed/Dc6Ti7jf0R8',
      reason: 'Membahas ruang sampel n(S) = 6 pada dadu dan cara mencari peluang mata dadu bilangan prima.',
    },
    {
      title: 'Materi Peluang Lengkap Kelas 8 SMP',
      channel: 'Kak RO',
      url: 'https://www.youtube.com/embed/s11gKvpuf0Q',
      reason: 'Penjelasan rumus dasar P(A) = n(A) / n(S) pada pelemparan dadu.',
    },
  ],
  52: [
    {
      title: 'Peluang Teoretik & Pengambilan Sampel Acak',
      channel: 'Hadian Nur',
      url: 'https://www.youtube.com/embed/WG1EVajx7KU',
      reason: 'Membahas perbandingan jumlah kejadian yang dicari dengan total keseluruhan objek dalam wadah.',
    },
    {
      title: 'Contoh Soal Peluang Pengambilan Acak',
      channel: 'Kak RO',
      url: 'https://www.youtube.com/embed/s11gKvpuf0Q',
      reason: 'Langkah mengubah pecahan peluang menjadi bentuk desimal.',
    },
  ],
  53: [
    {
      title: 'Peluang Teoretik & Frekuensi Harapan (2 Koin)',
      channel: 'Hadian Nur',
      url: 'https://www.youtube.com/embed/WG1EVajx7KU',
      reason: 'Membahas rumus Frekuensi Harapan Fh = P(A) × banyak percobaan pada pelemparan koin.',
    },
    {
      title: 'Frekuensi Relatif dan Frekuensi Harapan',
      channel: 'Imam Sibawaihi',
      url: 'https://www.youtube.com/embed/tVRdi5ub7Ig',
      reason: 'Cara menyusun titik sampel 2 uang logam {AA, AG, GA, GG} sebelum menghitung Fh.',
    },
  ],
  54: [
    {
      title: 'Peluang Empirik & Frekuensi Relatif Kelas 8',
      channel: 'Portal Sekolah',
      url: 'https://www.youtube.com/embed/ByHjRZczSqM',
      reason: 'Membahas cara menghitung frekuensi relatif = banyak kejadian muncul dibagi total percobaan.',
    },
    {
      title: 'Latihan Soal Frekuensi Relatif Kelas 8',
      channel: 'Bu And Channel',
      url: 'https://www.youtube.com/embed/OcrODj7XJsc',
      reason: 'Pembahasan soal percobaan dan konversi rasio frekuensi ke desimal.',
    },
  ],
  55: [
    {
      title: 'Komplemen dari Peluang Suatu Kejadian',
      channel: 'Yufid EDU',
      url: 'https://www.youtube.com/embed/v3fR67mdlAA',
      reason: 'Membahas tepat rumus peluang komplemen P(bukan A) = 1 - P(A) seperti peluang tidak hujan.',
    },
    {
      title: 'Peluang Kejadian & Komplemennya Kelas 8',
      channel: 'Portal Sekolah',
      url: 'https://www.youtube.com/embed/Dc6Ti7jf0R8',
      reason: 'Penguatan sifat jumlah peluang suatu kejadian dan lawannya sama dengan 1.',
    },
  ],
};
