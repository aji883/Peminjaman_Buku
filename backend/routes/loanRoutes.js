const express = require('express');
const router = express.Router();
const Loan = require('../models/Loan');
const authMiddleware = require('../middleware/authMiddleware');

// Create loan request (User)
router.post('/', authMiddleware, async (req, res) => {
    console.log('Incoming loan request:', req.body);
    try {
        const { id_buku, tgl_pinjam, tgl_kembali } = req.body;
        const id_user = req.user.id;

        if (!id_buku || !tgl_pinjam || !tgl_kembali) {
            return res.status(400).json({ message: 'Semua field harus diisi' });
        }

        const id = await Loan.create({ id_user, id_buku, tgl_pinjam, tgl_kembali });
        res.status(201).json({ message: 'Permintaan peminjaman berhasil dikirim', id_peminjaman: id });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat membuat permintaan peminjaman' });
    }
});

// Get my loans (User)
router.get('/my', authMiddleware, async (req, res) => {
    try {
        const loans = await Loan.getByUserId(req.user.id);
        res.json(loans);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mengambil data peminjaman' });
    }
});

// Get all loans (Admin)
router.get('/', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        const loans = await Loan.getAll();
        res.json(loans);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mengambil data peminjaman' });
    }
});

// Update status (Admin)
router.patch('/:id/status', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        const { status } = req.body;
        const adminId = req.user.id;

        const success = await Loan.updateStatus(req.params.id, status, adminId);
        if (!success) return res.status(404).json({ message: 'Peminjaman tidak ditemukan' });

        res.json({ message: `Status peminjaman berhasil diperbarui menjadi ${status}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal memperbarui status peminjaman' });
    }
});

module.exports = router;
