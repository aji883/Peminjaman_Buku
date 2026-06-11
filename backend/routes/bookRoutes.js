const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Book = require('../models/Book');
const Loan = require('../models/Loan');
const SavedBook = require('../models/SavedBook');
const authMiddleware = require('../middleware/authMiddleware');

// Multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', '..', 'frontend', 'uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });

// Saved Books Routes
router.get('/saved', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const saved = await SavedBook.getByUserId(userId);
        res.json(saved);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal mengambil buku tersimpan' });
    }
});

router.post('/saved', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id_buku } = req.body;
        if (!id_buku) {
            return res.status(400).json({ message: 'id_buku wajib diisi' });
        }
        await SavedBook.add(userId, id_buku);
        res.status(201).json({ message: 'Buku berhasil disimpan' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal menyimpan buku' });
    }
});

router.delete('/saved/:id_buku', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const bookId = req.params.id_buku;
        const deleted = await SavedBook.delete(userId, bookId);
        if (!deleted) {
            return res.status(404).json({ message: 'Buku tersimpan tidak ditemukan' });
        }
        res.json({ message: 'Buku berhasil dihapus dari daftar tersimpan' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Gagal menghapus buku tersimpan' });
    }
});

// Routes
router.get('/', async (req, res) => {
    try {
        const books = await Book.getAll();
        res.json(books);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving books' });
    }
});

// Public stats for footer
router.get('/stats', async (req, res) => {
    try {
        const db = require('../config/db');
        const [[{totalBooks}]] = await db.query('SELECT COUNT(*) AS totalBooks FROM buku');
        const [[{totalUsers}]] = await db.query('SELECT COUNT(*) AS totalUsers FROM user');
        const [[{activeLoan}]] = await db.query("SELECT COUNT(*) AS activeLoan FROM peminjaman WHERE status = 'dipinjam'");
        res.json({ totalBooks, totalUsers, activeLoan });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching stats' });
    }
});

// Get book availability info (earliest return date for out-of-stock books)
router.get('/:id/availability', async (req, res) => {
    try {
        const book = await Book.getById(req.params.id);
        if (!book) return res.status(404).json({ message: 'Book not found' });

        if (book.stok > 0) {
            return res.json({ available: true, stok: book.stok });
        }

        const earliest = await Loan.getEarliestReturnDate(req.params.id);
        if (earliest) {
            return res.json({
                available: false,
                earliest_return: earliest.tgl_kembali
            });
        }

        res.json({ available: false, earliest_return: null });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error checking availability' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const book = await Book.getById(req.params.id);
        if (!book) return res.status(404).json({ message: 'Book not found' });
        res.json(book);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving book' });
    }
});

router.post('/bulk', authMiddleware, async (req, res) => {
    try {
        const books = req.body;
        if (!Array.isArray(books) || books.length === 0) {
            return res.status(400).json({ message: 'Data buku tidak valid' });
        }
        
        // Pastikan setiap buku minimal ada judul
        for (const b of books) {
            if (!b.judul) return res.status(400).json({ message: 'Setiap baris harus memiliki judul' });
        }

        const affectedRows = await Book.createBulk(books);
        res.status(201).json({ message: `${affectedRows} buku berhasil ditambahkan` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Terjadi kesalahan saat menyimpan data massal' });
    }
});

router.post('/', authMiddleware, upload.single('cover'), async (req, res) => {
    try {
        const { judul, penulis, penerbit, tahun, stok, deskripsi, kategori } = req.body;
        if (!judul) return res.status(400).json({ message: 'Judul is required' });
        const cover = req.file ? req.file.filename : null;
        const id = await Book.create({ judul, penulis, penerbit, tahun, stok, deskripsi, cover, kategori });
        res.status(201).json({ message: 'Book created successfully', id_buku: id });
    } catch (error) {
        res.status(500).json({ message: 'Error creating book' });
    }
});

router.put('/:id', authMiddleware, upload.single('cover'), async (req, res) => {
    try {
        const { judul, penulis, penerbit, tahun, stok, deskripsi, kategori } = req.body;
        const cover = req.file ? req.file.filename : undefined;
        const success = await Book.update(req.params.id, { judul, penulis, penerbit, tahun, stok, deskripsi, cover, kategori });
        if (!success) return res.status(404).json({ message: 'Book not found' });
        res.json({ message: 'Book updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating book' });
    }
});

router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const success = await Book.delete(req.params.id);
        if (!success) return res.status(404).json({ message: 'Book not found' });
        res.json({ message: 'Book deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting book' });
    }
});

module.exports = router;
