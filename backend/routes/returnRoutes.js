const express = require('express');
const router = express.Router();
const Return = require('../models/Return');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/returns/active-loans  — loans eligible for return (Admin)
router.get('/active-loans', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
        const loans = await Return.getActiveLoansList();
        res.json(loans);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mengambil data peminjaman aktif' });
    }
});

// GET /api/returns  — all return records (Admin)
router.get('/', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
        const returns = await Return.getAll();
        res.json(returns);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mengambil data pengembalian' });
    }
});

// POST /api/returns  — process a book return (Admin)
router.post('/', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });

        const { id_peminjaman, tgl_kembali_real } = req.body;
        if (!id_peminjaman || !tgl_kembali_real) {
            return res.status(400).json({ message: 'id_peminjaman dan tgl_kembali_real wajib diisi' });
        }

        const adminId = req.user.id;
        const result = await Return.create({ id_peminjaman, tgl_kembali_real, adminId });
        res.status(201).json({
            message: 'Pengembalian berhasil diproses',
            id_pengembalian: result.id_pengembalian,
            denda: result.denda
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Gagal memproses pengembalian' });
    }
});

module.exports = router;
