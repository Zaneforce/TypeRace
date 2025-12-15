# TypeRace - Aplikasi Typing Speed Game

Aplikasi web untuk belajar dan meningkatkan kecepatan mengetik dengan fitur multiplayer!

## 🚀 Fitur Utama

- ⌨️ **Virtual Keyboard** - Keyboard virtual dengan color-coded finger guidance untuk belajar touch typing
- 🔊 **Suara Ketikan** - Efek suara setiap kali mengetik menggunakan Web Audio API
- 🎯 **Practice Mode** - Latihan sendiri untuk meningkatkan kecepatan dengan text generator otomatis
- 🏆 **Public Room** - Adu kecepatan typing dengan pemain lain (bot simulation)
- 👥 **Custom Room** - Buat room dengan kode unik dan main dengan teman
- 📊 **Real-time Stats** - WPM (Words Per Minute) dan akurasi yang terupdate langsung
- 🎨 **UI Modern** - Desain Monkeytype-inspired dengan Font Awesome icons
- 🤖 **Auto Text Generator** - Generate teks latihan otomatis (normal, programming, mixed mode)

## 📦 Teknologi yang Digunakan

- **Next.js 14** - React framework dengan App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - State management
- **Web Audio API** - Untuk efek suara keyboard
- **Font Awesome** - Icon library untuk UI yang lebih profesional

## 🎨 Desain Features

### Virtual Keyboard dengan Finger Guidance
Keyboard menampilkan color-coding berdasarkan jari yang harus digunakan:
- 🟣 **Pink** - Kelingking (kiri & kanan)
- 🟪 **Purple** - Jari Manis (kiri & kanan)
- 🔵 **Blue** - Jari Tengah (kiri & kanan)
- 🟢 **Green** - Jari Telunjuk (kiri & kanan)
- 🟠 **Orange** - Jempol (spacebar)

Key yang akan diketik selanjutnya akan di-highlight dengan border kuning dan animasi pulse.

### Auto Text Generator
Text generator dapat menghasilkan:
- **Normal Mode**: Kata-kata umum bahasa Inggris
- **Programming Mode**: Kata-kata programming (function, variable, array, dll)
- **Mixed Mode**: Kombinasi keduanya (default)

Teks di-generate secara otomatis dengan panjang yang dapat disesuaikan.

## 🛠️ Instalasi

1. Install dependencies:
```bash
npm install
```

2. Jalankan development server:
```bash
npm run dev
```

3. Buka browser dan akses:
```
http://localhost:3000
```

## 📖 Cara Menggunakan

### Practice Mode
1. Pilih "Practice Mode" dari halaman utama
2. Mulai mengetik teks yang ditampilkan
3. Lihat WPM dan akurasi Anda secara real-time
4. Klik "Restart" untuk mencoba teks baru

### Public Room
1. Pilih "Public Room" dari halaman utama
2. Masukkan nama Anda
3. Adu kecepatan dengan pemain lain (bot)
4. Lihat posisi Anda di leaderboard

### Custom Room
1. Pilih "Custom Room" > "Buat Room"
2. Isi nama room dan nama Anda
3. Bagikan kode room ke teman-teman
4. Teman dapat join dengan memasukkan kode room
5. Mulai race bersama!

## 🎮 Kontrol

- Ketik di text area untuk memulai
- Keyboard virtual akan menyala sesuai tombol yang ditekan
- Suara akan otomatis muncul saat mengetik

## 📊 Statistik

- **WPM** - Words Per Minute (5 karakter = 1 kata)
- **Akurasi** - Persentase ketepatan mengetik
- **Progress** - Berapa banyak karakter yang sudah diketik

## 🎨 Fitur Visual

- Animasi keypress pada virtual keyboard
- Floating animation pada keyboard
- Gradient backgrounds
- Real-time progress bars
- Color-coded text (hijau untuk benar, merah untuk salah)

## 🔧 Struktur Project

```
TypeRace/
├── app/
│   ├── practice/         # Practice mode
│   ├── public/          # Public room
│   ├── room/
│   │   ├── create/      # Buat room baru
│   │   └── [code]/      # Dynamic route untuk join room
│   ├── layout.tsx
│   ├── page.tsx         # Homepage
│   └── globals.css
├── components/
│   └── VirtualKeyboard.tsx
├── hooks/
│   └── useKeyboardSound.ts
├── store/
│   ├── typingStore.ts
│   └── roomStore.ts
├── types/
│   └── room.ts
├── utils/
│   └── textUtils.ts
└── package.json
```

## 🚀 Production Build

```bash
npm run build
npm start
```

## 📝 Todo / Future Features

- [ ] Socket.io untuk real-time multiplayer sejati
- [ ] Database untuk menyimpan score dan user profiles
- [ ] Leaderboard global dengan ranking
- [ ] API integration untuk fetch quotes/paragraphs
- [ ] Tema custom (light/dark mode, color schemes)
- [ ] Suara keyboard yang bisa diganti (mechanical, membrane, dll)
- [ ] Mode difficulty (easy, medium, hard)
- [ ] Achievements system dengan badges
- [ ] Export hasil latihan sebagai PDF/image
- [ ] Multi-language support (ID, EN, dll)
- [ ] Code typing mode untuk programmer
- [ ] Blind mode (hide text while typing)

## 🤝 Kontribusi

Kontribusi selalu diterima! Silakan buat pull request atau issue.

## 📄 License

MIT License

---

Dibuat dengan ❤️ menggunakan Next.js
