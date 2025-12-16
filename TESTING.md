# 🧪 Testing Guide - Stats & Leaderboard System

## Cara Test Fitur Baru

### 1. Test Profile Page

**Langkah-langkah:**
1. Pastikan sudah login
2. Klik tombol **Profile** di kanan atas homepage
3. Jika belum ada data, akan muncul "Start typing to see your stats!"
4. Lakukan beberapa practice test atau custom room
5. Refresh halaman profile untuk melihat data

**Yang harus terlihat:**
- Stats cards menampilkan data (Total Tests, Avg WPM, Best WPM, Avg Accuracy)
- Improvement banner muncul setelah minimal 2 sesi
- Progress chart dengan bars horizontal
- Recent sessions table dengan data lengkap

### 2. Test Leaderboard Page

**Langkah-langkah:**
1. Klik tombol **Leaderboard** di homepage atau profile
2. Toggle antara tab "Daily Champions" dan "All-Time Legends"
3. Cek apakah ranking sudah benar (urut dari WPM tertinggi)

**Yang harus terlihat:**
- Top 3 dengan icon medal yang berbeda (crown, silver, bronze)
- Username dan stats (WPM, accuracy)
- Gradient background untuk top 3
- Tanggal entry

### 3. Test Auto-Save Sessions

#### A. Practice Mode
1. Buka `/practice`
2. Pilih mode (time atau words)
3. Selesaikan test sampai finish
4. Buka profile page → harus muncul session baru
5. Cek leaderboard → entry baru harus muncul

#### B. Custom Room
1. Create room atau join room
2. Start game dan finish test
3. Buka profile page → session dengan badge "Custom" harus muncul
4. Cek leaderboard → entry baru harus muncul

### 4. Test Period Filter

**Di Profile Page:**
1. Filter "This Week" → harus show sessions 7 hari terakhir
2. Filter "This Month" → harus show sessions 30 hari terakhir
3. Filter "All Time" → show semua sessions

### 5. Test Improvement Calculator

**Cara kerja:**
- Minimal harus ada 2 sesi
- Membandingkan rata-rata 50% sesi pertama vs 50% sesi terakhir
- Hijau jika naik, merah jika turun

**Test:**
1. Lakukan test dengan WPM rendah (misal: 30 WPM)
2. Lakukan test dengan WPM tinggi (misal: 50 WPM)
3. Buka profile → improvement banner harus show "+20 WPM" dengan warna hijau

### 6. Test Leaderboard Real-time

**Test Daily Leaderboard:**
1. Buka `/leaderboard` di tab "Daily Champions"
2. Lakukan practice test
3. Kembali ke leaderboard → entry baru harus langsung muncul (real-time)

**Test All-Time Leaderboard:**
1. Catat current Best WPM dari profile
2. Lakukan test dengan WPM lebih tinggi dari Best WPM
3. Cek all-time leaderboard → entry baru harus muncul
4. Lakukan test dengan WPM lebih rendah dari Best WPM
5. Cek all-time leaderboard → entry TIDAK update (karena bukan personal best)

### 7. Test Multiple Users

**Setup:**
1. Buka browser 1 dengan user A (login)
2. Buka browser 2/incognito dengan user B (login)
3. User A dan B lakukan practice test
4. Refresh leaderboard → kedua user harus muncul di ranking

**Cek:**
- Ranking urut benar (WPM tertinggi di atas)
- Top 3 dapat medal icon
- Stats masing-masing user benar

## 🔍 Firebase Database Check

Buka Firebase Console → Realtime Database:

### Expected Structure:

```
yourDatabase/
├── userStats/
│   ├── {userId1}/
│   │   ├── userId: "..."
│   │   ├── username: "..."
│   │   ├── totalTests: 5
│   │   ├── averageWpm: 45
│   │   ├── bestWpm: 60
│   │   ├── averageAccuracy: 95
│   │   ├── totalTimeTyping: 300
│   │   ├── lastPlayed: 1234567890
│   │   └── sessions: [...]
│   │
│   └── {userId2}/
│       └── ...
│
├── sessions/
│   ├── {userId1}/
│   │   ├── {sessionId1}: { wpm, accuracy, ... }
│   │   └── {sessionId2}: { wpm, accuracy, ... }
│   │
│   └── {userId2}/
│       └── ...
│
└── leaderboard/
    ├── daily/
    │   ├── {entryId1}: { userId, username, wpm, accuracy, timestamp }
    │   └── {entryId2}: { ... }
    │
    └── alltime/
        ├── {entryId1}: { userId, username, wpm, accuracy, timestamp }
        └── {entryId2}: { ... }
```

## 🐛 Common Issues & Solutions

### Issue 1: Stats tidak muncul di Profile
**Solusi:**
- Pastikan sudah login dengan user yang benar
- Cek Firebase console → `userStats/{userId}` ada data?
- Coba logout dan login lagi
- Hard refresh (Ctrl+F5)

### Issue 2: Leaderboard kosong
**Solusi:**
- Lakukan minimal 1 practice test
- Cek Firebase console → `leaderboard/daily` dan `leaderboard/alltime`
- Pastikan Firebase listener berjalan (cek console log)

### Issue 3: Session tidak tersimpan
**Solusi:**
- Cek console browser untuk error
- Pastikan user sudah login saat finish test
- Cek Firebase rules → pastikan user bisa write

### Issue 4: Daily leaderboard menampilkan data lama (>24 jam)
**Solusi:**
- Filter dilakukan di frontend berdasarkan timestamp
- Cek timestamp entry: `timestamp > Date.now() - 24*60*60*1000`
- Bisa tambahkan cloud function untuk auto-delete old entries

### Issue 5: All-time leaderboard ada duplikat user
**Expected behavior:**
- All-time bisa ada multiple entries dari 1 user
- Setiap personal best baru akan create entry baru
- Jika ingin hanya 1 entry per user, perlu modifikasi logic

## 📊 Test Checklist

### Basic Functionality
- [ ] Profile page load tanpa error
- [ ] Leaderboard page load tanpa error
- [ ] Navigation buttons berfungsi (Home, Profile, Leaderboard)
- [ ] User info display di homepage

### Session Tracking
- [ ] Practice time mode save session
- [ ] Practice words mode save session
- [ ] Custom room save session
- [ ] Session data lengkap (wpm, accuracy, mode, duration, etc)

### Profile Features
- [ ] Stats cards display benar
- [ ] Improvement banner calculate benar
- [ ] Period filter bekerja (week, month, all)
- [ ] Progress chart render dengan data benar
- [ ] Recent sessions table display benar
- [ ] Badge "Practice" vs "Custom" display benar

### Leaderboard Features
- [ ] Daily tab filter 24 jam terakhir
- [ ] All-time tab display personal best
- [ ] Ranking urut dari WPM tertinggi
- [ ] Top 3 medal icons berbeda
- [ ] Gradient background untuk top 3
- [ ] Hover animation berfungsi

### Real-time Updates
- [ ] Profile auto-update saat ada session baru
- [ ] Leaderboard auto-update real-time
- [ ] Multiple users bisa lihat perubahan bersamaan

### Edge Cases
- [ ] Profile dengan 0 sessions show placeholder
- [ ] Leaderboard dengan 0 entries show empty state
- [ ] Improvement banner dengan < 2 sessions tidak muncul
- [ ] Period filter dengan 0 matching sessions show empty

---

**Status:** ✅ Ready for Testing!
