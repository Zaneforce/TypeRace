# 📊 Sistem Statistik & Leaderboard - TypeRace

## ✨ Fitur Baru yang Ditambahkan

### 1. **Profile Page** (`/profile`)
Halaman profil pengguna dengan visualisasi statistik lengkap:

#### Fitur Profile:
- **User Stats Cards**: 
  - Total Tests (jumlah tes yang sudah diselesaikan)
  - Average WPM (rata-rata kecepatan mengetik)
  - Best WPM (rekor kecepatan tertinggi)
  - Average Accuracy (rata-rata akurasi)

- **Improvement Banner**:
  - Menampilkan peningkatan/penurunan WPM
  - Membandingkan 50% sesi pertama vs 50% sesi terakhir
  - Indikator visual warna (hijau = naik, merah = turun)

- **Period Selector**:
  - Filter data per minggu (7 hari terakhir)
  - Filter data per bulan (30 hari terakhir)
  - Filter semua waktu (all time)

- **Progress Chart**:
  - Grafik horizontal bar untuk 10 sesi terakhir
  - Menampilkan WPM setiap sesi
  - Skala otomatis berdasarkan WPM tertinggi

- **Recent Sessions**:
  - Tabel 10 sesi terakhir
  - Info lengkap: tanggal, WPM, akurasi, mode
  - Badge untuk membedakan Practice vs Custom Room

### 2. **Leaderboard Page** (`/leaderboard`)
Papan peringkat dengan 2 kategori:

#### Daily Champions 🔥
- Peringkat berdasarkan sesi dalam 24 jam terakhir
- Diupdate real-time setiap ada sesi baru
- Menampilkan top 100 pemain

#### All-Time Legends 👑
- Peringkat berdasarkan WPM terbaik sepanjang masa
- Hanya menampilkan personal best setiap pemain
- Menampilkan top 100 pemain

#### Fitur Leaderboard:
- **Medal Icons**:
  - 🏆 Rank 1: Crown (emas)
  - 🥈 Rank 2: Medal (perak)
  - 🥉 Rank 3: Medal (perunggu)
  - #4-100: Nomor peringkat

- **Visual Ranking**:
  - Gradient background khusus untuk top 3
  - Hover effect dengan scale animation
  - Informasi lengkap: username, WPM, akurasi, tanggal

### 3. **Automatic Session Tracking**
Setiap kali menyelesaikan tes (Practice atau Custom Room), data otomatis disimpan:

#### Data yang Disimpan per Session:
```typescript
{
  id: string;              // Unique session ID
  userId: string;          // User ID
  wpm: number;             // Words Per Minute
  accuracy: number;        // Percentage (0-100)
  mode: 'time' | 'words';  // Game mode
  duration: number;        // Duration in seconds
  wordCount: number;       // Total words typed
  timestamp: number;       // Completion timestamp
  roomType: 'practice' | 'custom'; // Source type
}
```

#### Aggregate Stats yang Diupdate:
- `totalTests`: Total sesi yang diselesaikan
- `averageWpm`: Rata-rata WPM dari semua sesi
- `bestWpm`: WPM tertinggi yang pernah dicapai
- `averageAccuracy`: Rata-rata akurasi dari semua sesi
- `totalTimeTyping`: Total waktu mengetik (detik)
- `lastPlayed`: Timestamp sesi terakhir

## 🔗 Navigasi Baru

### Di Homepage:
Ketika sudah login, akan muncul 3 tombol di kanan atas:
1. **Profile** 👤 - Ke halaman profil
2. **Leaderboard** 🏆 - Ke papan peringkat
3. **User Info** - Info akun dengan tombol logout

### Di Profile Page:
- Tombol **Home** 🏠 - Kembali ke homepage
- Tombol **Leaderboard** 🏆 - Ke papan peringkat

### Di Leaderboard Page:
- Tombol **Home** 🏠 - Kembali ke homepage

## 📁 File Structure

```
app/
  profile/
    page.tsx          # Halaman profile dengan stats & charts
  leaderboard/
    page.tsx          # Halaman leaderboard

types/
  stats.ts            # TypeScript interfaces untuk stats

Firebase Database Structure:
  userStats/
    {userId}/
      userId: string
      username: string
      totalTests: number
      averageWpm: number
      bestWpm: number
      averageAccuracy: number
      totalTimeTyping: number
      lastPlayed: number
      sessions: TypingSession[]
  
  sessions/
    {userId}/
      {sessionId}: TypingSession
  
  leaderboard/
    daily/
      {entryId}: LeaderboardEntry
    alltime/
      {entryId}: LeaderboardEntry
```

## 🎯 Cara Kerja

### 1. Practice Mode
1. User menyelesaikan test (words mode selesai semua / time mode habis waktu)
2. Fungsi `saveSession()` dipanggil otomatis
3. Session data disimpan ke Firebase
4. User stats diupdate (rata-rata, best, total)
5. Leaderboard entry dibuat (daily + alltime jika personal best)

### 2. Custom Room
1. User menyelesaikan test (sama seperti practice)
2. Saat `isFinished: true`, fungsi `saveSession()` dipanggil
3. Proses penyimpanan sama seperti practice
4. `roomType` diset sebagai `'custom'`

### 3. Real-time Updates
- Profile page menggunakan Firebase `onValue()` listener
- Data otomatis update ketika ada sesi baru
- Tidak perlu refresh halaman

## 🎨 Design Features

### Color Scheme:
- **Background**: Dark theme (`#1a1a1a`)
- **Primary**: Yellow (`#facc15`)
- **Success**: Green (untuk improvement)
- **Danger**: Red (untuk decrease)
- **Cards**: Dark gray dengan transparency

### Responsive Design:
- Mobile-friendly layout
- Adaptive cards dan tables
- Touch-friendly buttons

### Animations:
- Hover effects pada cards
- Scale animations
- Smooth transitions
- Pulse effects untuk live indicators

## 🚀 Next Steps (Opsional)

Fitur tambahan yang bisa dikembangkan:
1. **Weekly Challenges**: Target mingguan untuk WPM
2. **Achievements/Badges**: Unlock rewards untuk milestone tertentu
3. **Friends System**: Follow pemain lain dan lihat progress mereka
4. **Daily Streaks**: Bonus untuk mengetik setiap hari
5. **Custom Themes**: Pilihan warna dan tema keyboard
6. **Export Stats**: Download statistik dalam CSV/PDF
7. **Compare Mode**: Bandingkan stats dengan pemain lain
8. **Practice History**: Grafik detail per hari/minggu/bulan

## 📝 Notes

- Semua data disimpan secara real-time ke Firebase
- Personal best di leaderboard all-time hanya diupdate jika WPM baru lebih tinggi
- Daily leaderboard otomatis filter entry 24 jam terakhir
- Session tracking bekerja untuk user yang sudah login
- Tanpa login, masih bisa practice tapi tidak ada saving

## 🐛 Troubleshooting

**Stats tidak tersimpan?**
- Pastikan user sudah login
- Cek koneksi Firebase di console
- Pastikan finishTyping() dipanggil

**Leaderboard kosong?**
- Selesaikan minimal 1 test untuk muncul
- Cek Firebase Realtime Database rules

**Chart tidak muncul?**
- Minimal 1 session untuk menampilkan chart
- Cek data sessions di Firebase

---

✅ **Sistem sekarang sudah lengkap dengan Profile, Stats, dan Leaderboard!**
