const db = require('../config/db');

class SavedBook {
    static async getByUserId(userId) {
        const query = `
            SELECT s.id_saved, s.id_buku, b.judul, b.penulis, b.penerbit, b.tahun, b.stok, b.kategori, b.cover, b.deskripsi, s.created_at
            FROM buku_tersimpan s
            JOIN buku b ON s.id_buku = b.id_buku
            WHERE s.id_user = ?
            ORDER BY s.created_at DESC
        `;
        const [rows] = await db.query(query, [userId]);
        return rows;
    }

    static async add(userId, bookId) {
        const query = `
            INSERT INTO buku_tersimpan (id_user, id_buku) 
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE id_user=id_user
        `;
        const [result] = await db.query(query, [userId, bookId]);
        return result.insertId;
    }

    static async delete(userId, bookId) {
        const query = 'DELETE FROM buku_tersimpan WHERE id_user = ? AND id_buku = ?';
        const [result] = await db.query(query, [userId, bookId]);
        return result.affectedRows > 0;
    }
}

module.exports = SavedBook;
