const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const DB_PATH = path.join(__dirname, 'db.json');

// QoL: Inisialisasi Database JSON agar tidak error saat push 
const initDB = () => {
    if (!fs.existsSync(DB_PATH)) {
        const initialData = { makanan: [], lokasi: [], rating: [] };
        fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
    }
};
initDB();

const readDB = () => JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
const writeDB = (data) => fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));

// GET: Ambil Data Gabungan (cite: 189)
app.get('/api/makanan', (req, res) => {
    try {
        const db = readDB();
        const result = db.makanan.map(m => {
            const lokasi = db.lokasi.find(l => l.id_lokasi === m.id_lokasi) || {};
            const rating = db.rating.find(r => r.id_makanan === m.id_makanan) || {};
            return { ...m, lokasi, rating };
        });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: "Gagal membaca database" });
    }
});

// POST: Tambah Data (cite: 248)
app.post('/api/makanan', (req, res) => {
    try {
        const db = readDB();
        const { nama, deskripsi, kategori, alamat, wilayah, latitude, longitude, foto_url } = req.body;

        // Validasi data sederhana [cite: 206]
        if (!nama || !alamat) return res.status(400).json({ error: "Nama dan Alamat wajib diisi" });

        const id_lokasi = Date.now();
        const id_makanan = Date.now() + 1;

        const newLoc = { id_lokasi, alamat, wilayah, latitude: parseFloat(latitude), longitude: parseFloat(longitude) };
        const newFood = { id_makanan, nama, deskripsi, kategori, foto_url, id_lokasi };
        const newRating = { id_rating: Date.now() + 2, id_makanan, nilai: 5, jumlah_review: 1 };

        // Pastikan array ada sebelum push
        db.lokasi.push(newLoc);
        db.makanan.push(newFood);
        db.rating.push(newRating);
        
        writeDB(db); // Simpan permanen ke db.json
        res.json({ success: true, message: "Data berhasil disimpan ke db.json" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Gagal menyimpan data" });
    }
});

app.delete('/api/makanan/:id', (req, res) => {
    const db = readDB();
    const id = parseInt(req.params.id);
    db.makanan = db.makanan.filter(m => m.id_makanan !== id);
    writeDB(db);
    res.json({ success: true });
});

app.listen(3000, () => console.log('FoodMap Terperbaiki: http://localhost:3000'));