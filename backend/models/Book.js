const db = require('../config/db');
const fs = require('fs');
const path = require('path');

class Book {
    static async getAll() {
        const [rows] = await db.query('SELECT * FROM buku ORDER BY created_at DESC');
        return rows;
    }

    static async getById(id) {
        const [rows] = await db.query('SELECT * FROM buku WHERE id_buku = ?', [id]);
        return rows[0];
    }

    static async create(data) {
        const { judul, penulis, penerbit, tahun, stok, deskripsi, cover, kategori } = data;
        const [result] = await db.query(
            'INSERT INTO buku (judul, penulis, penerbit, tahun, stok, deskripsi, cover, kategori) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [judul, penulis || null, penerbit || null, tahun || null, stok || 0, deskripsi || null, cover, kategori || 'lainnya']
        );
        return result.insertId;
    }

    static async createBulk(books) {
        if (!books || books.length === 0) return 0;
        
        const values = [];
        const placeholders = [];
        
        for (const b of books) {
            placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?)');
            values.push(
                b.judul,
                b.penulis || null,
                b.penerbit || null,
                b.tahun || null,
                b.stok || 0,
                b.deskripsi || null,
                null, // cover default null untuk upload massal
                b.kategori || 'lainnya'
            );
        }
        
        const query = `INSERT INTO buku (judul, penulis, penerbit, tahun, stok, deskripsi, cover, kategori) VALUES ${placeholders.join(', ')}`;
        const [result] = await db.query(query, values);
        return result.affectedRows;
    }

    static async update(id, data) {
        const { judul, penulis, penerbit, tahun, stok, deskripsi, cover, kategori } = data;
        
        const oldBook = await this.getById(id);
        if (oldBook && cover && oldBook.cover && cover !== oldBook.cover) {
            this.deleteFile(oldBook.cover);
        }

        if (cover !== undefined) {
            const [result] = await db.query(
                'UPDATE buku SET judul=?, penulis=?, penerbit=?, tahun=?, stok=?, deskripsi=?, cover=?, kategori=? WHERE id_buku=?',
                [judul, penulis, penerbit, tahun, stok, deskripsi || null, cover, kategori || 'lainnya', id]
            );
            return result.affectedRows > 0;
        } else {
            const [result] = await db.query(
                'UPDATE buku SET judul=?, penulis=?, penerbit=?, tahun=?, stok=?, deskripsi=?, kategori=? WHERE id_buku=?',
                [judul, penulis, penerbit, tahun, stok, deskripsi || null, kategori || 'lainnya', id]
            );
            return result.affectedRows > 0;
        }
    }

    static async delete(id) {
        const book = await this.getById(id);
        if (book && book.cover) {
            this.deleteFile(book.cover);
        }
        const [result] = await db.query('DELETE FROM buku WHERE id_buku=?', [id]);
        return result.affectedRows > 0;
    }

    static deleteFile(filename) {
        const filePath = path.join(__dirname, '..', '..', 'frontend', 'uploads', filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
}

module.exports = Book;
