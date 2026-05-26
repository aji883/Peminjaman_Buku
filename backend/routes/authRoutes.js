const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const User = require('../models/User');
const Loan = require('../models/Loan');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/authMiddleware');

// Admin Auth
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        const result = await Admin.login(email, password);
        res.json({ message: 'Login successful', ...result });
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
});

// User Auth
router.post('/user/register', async (req, res) => {
    try {
        const { nama, email, password } = req.body;
        if (!nama || !email || !password) {
            return res.status(400).json({ message: 'Semua field harus diisi' });
        }
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'Email sudah terdaftar' });
        }
        await User.register({ nama, email, password });
        res.status(201).json({ message: 'Registrasi berhasil, silakan login' });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
});

router.post('/user/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email dan password harus diisi' });
        }
        const result = await User.login(email, password);
        res.json({ message: 'Login berhasil', ...result });
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
});

// Verify Current Password
router.post('/user/verify-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword } = req.body;
        const userId = req.user.id;

        if (!currentPassword) {
            return res.status(400).json({ message: 'Password saat ini harus diisi' });
        }

        const user = await User.findByIdWithPassword(userId);
        if (!user) {
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Password saat ini salah' });
        }

        res.json({ message: 'Password valid', valid: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat memverifikasi password' });
    }
});


// Update User Profile (User)
router.put('/user/profile', authMiddleware, async (req, res) => {
    try {
        const { nama, password, currentPassword } = req.body;
        const userId = req.user.id;
        
        if (!nama) {
            return res.status(400).json({ message: 'Nama tidak boleh kosong' });
        }

        // If user wants to change password, verify current password first
        if (password) {
            if (!currentPassword) {
                return res.status(400).json({ message: 'Password saat ini harus diisi untuk mengubah password' });
            }

            const user = await User.findByIdWithPassword(userId);
            if (!user) {
                return res.status(404).json({ message: 'User tidak ditemukan' });
            }

            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Password saat ini salah' });
            }
        }
        
        const success = await User.update(userId, { nama, password });
        if (!success) {
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }
        
        res.json({ message: 'Profil berhasil diperbarui' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat memperbarui profil' });
    }
});

// Get User Profile details (including created_at)
router.get('/user/profile', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
});

// Get all users (for admin dashboard)
router.get('/users', authMiddleware, async (req, res) => {
    try {
        const users = await User.getAll();
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
});

// Get loans for a specific user (Admin)
router.get('/users/:id/loans', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Akses ditolak' });
        }
        const loans = await Loan.getByUserId(req.params.id);
        res.json(loans);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mengambil data peminjaman' });
    }
});

// Delete user account (Admin)
router.delete('/users/:id', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Akses ditolak' });
        }
        
        const success = await User.delete(req.params.id);
        if (!success) {
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }
        
        res.json({ message: 'User beserta seluruh riwayatnya berhasil dihapus' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat menghapus user' });
    }
});

module.exports = router;
