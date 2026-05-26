const express = require('express');
const router = express.Router();
const WaitingList = require('../models/WaitingList');
const authMiddleware = require('../middleware/authMiddleware');

// Tambah antrian daftar tunggu (User)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { id_buku } = req.body;
        const id_user = req.user.id;

        if (!id_buku) {
            return res.status(400).json({ message: 'id_buku wajib diisi' });
        }

        const id = await WaitingList.create({ id_user, id_buku });
        res.status(201).json({ message: 'Berhasil mendaftar antrian daftar tunggu', id_antrian: id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal menambahkan ke daftar tunggu' });
    }
});

// Ambil semua daftar tunggu (Admin)
router.get('/', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        const list = await WaitingList.getAll();
        res.json(list);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mengambil data daftar tunggu' });
    }
});

// Ambil daftar tunggu saya (User)
router.get('/my', authMiddleware, async (req, res) => {
    try {
        const list = await WaitingList.getByUserId(req.user.id);
        res.json(list);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mengambil data daftar tunggu pribadi' });
    }
});

module.exports = router;
