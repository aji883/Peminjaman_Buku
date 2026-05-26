const db = require('../config/db');

class WaitingList {
    static async create(data) {
        const { id_user, id_buku } = data;
        const tanggal = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
        const [result] = await db.query(
            'INSERT INTO daftar_tunggu (id_user, id_buku, tanggal) VALUES (?, ?, ?)',
            [id_user, id_buku, tanggal]
        );
        return result.insertId;
    }

    static async getAll() {
        const [rows] = await db.query(
            `SELECT dt.*, u.nama AS nama_user, b.judul AS judul_buku 
             FROM daftar_tunggu dt
             JOIN user u ON dt.id_user = u.id_user
             JOIN buku b ON dt.id_buku = b.id_buku
             ORDER BY dt.created_at DESC`
        );
        return rows;
    }

    static async getByUserId(userId) {
        const [rows] = await db.query(
            `SELECT dt.*, b.judul AS judul_buku 
             FROM daftar_tunggu dt
             JOIN buku b ON dt.id_buku = b.id_buku
             WHERE dt.id_user = ?
             ORDER BY dt.created_at DESC`,
            [userId]
        );
        return rows;
    }
}

module.exports = WaitingList;
