const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Book = require('../models/Book');
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

// Routes
router.get('/', async (req, res) => {
    try {
        const books = await Book.getAll();
        res.json(books);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving books' });
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
