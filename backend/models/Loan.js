const db = require('../config/db');

class Loan {
    static async create(data) {
        const { id_user, id_buku, tgl_pinjam, tgl_kembali } = data;
        const [result] = await db.query(
            'INSERT INTO peminjaman (id_user, id_buku, tgl_pinjam, tgl_kembali, status) VALUES (?, ?, ?, ?, ?)',
            [id_user, id_buku, tgl_pinjam, tgl_kembali, 'diproses']
        );
        return result.insertId;
    }

    static async getByUserId(userId) {
        const [rows] = await db.query(
            `SELECT p.*, b.judul, b.cover 
             FROM peminjaman p 
             JOIN buku b ON p.id_buku = b.id_buku 
             WHERE p.id_user = ? 
             ORDER BY p.created_at DESC`,
            [userId]
        );
        return rows;
    }

    static async getAll() {
        const [rows] = await db.query(
            `SELECT p.*, b.judul, u.nama as nama_user 
             FROM peminjaman p 
             JOIN buku b ON p.id_buku = b.id_buku 
             JOIN user u ON p.id_user = u.id_user 
             ORDER BY p.created_at DESC`
        );
        return rows;
    }

    static async updateStatus(loanId, status, adminId) {
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Update loan status
            const [result] = await connection.query(
                'UPDATE peminjaman SET status = ?, approved_by = ? WHERE id_peminjaman = ?',
                [status, adminId, loanId]
            );

            if (result.affectedRows === 0) {
                await connection.rollback();
                return false;
            }

            // If status is 'dipinjam', reduce book stock
            if (status === 'dipinjam') {
                console.log('Accepting loan, reducing stock for loanId:', loanId);
                // Get book ID for this loan
                const [loan] = await connection.query('SELECT id_buku FROM peminjaman WHERE id_peminjaman = ?', [loanId]);
                if (loan.length === 0) throw new Error('Peminjaman tidak ditemukan');
                
                const id_buku = loan[0].id_buku;
                console.log('Reducing stock for bookId:', id_buku);

                // Reduce stock by 1
                const [bookUpdate] = await connection.query(
                    'UPDATE buku SET stok = stok - 1 WHERE id_buku = ? AND stok > 0',
                    [id_buku]
                );

                if (bookUpdate.affectedRows === 0) {
                    throw new Error('Gagal mengurangi stok. Mungkin stok sudah habis.');
                }
                console.log('Stock reduced successfully');
            }

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async getEarliestReturnDate(bookId) {
        const [rows] = await db.query(
            `SELECT p.tgl_kembali, u.nama as nama_peminjam
             FROM peminjaman p
             JOIN user u ON p.id_user = u.id_user
             WHERE p.id_buku = ? AND p.status = 'dipinjam'
             ORDER BY p.tgl_kembali ASC
             LIMIT 1`,
            [bookId]
        );
        return rows[0] || null;
    }

    static async delete(loanId, userId) {
        const [result] = await db.query(
            'DELETE FROM peminjaman WHERE id_peminjaman = ? AND id_user = ?',
            [loanId, userId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = Loan;
