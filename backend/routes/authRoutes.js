const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const User = require('../models/User');

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

module.exports = router;
