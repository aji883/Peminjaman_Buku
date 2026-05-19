const db = require('../config/db');

class Return {
    /**
     * Calculate fine: Rp 1.000 per day late
     * Returns denda (int) in Rupiah
     */
    static calculateFine(tglKembaliSeharusnya, tglKembaliReal) {
        const due  = new Date(tglKembaliSeharusnya);
        const real = new Date(tglKembaliReal);
        const diffMs = real - due;
        if (diffMs <= 0) return 0;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return diffDays * 1000; // Rp 1.000 per day
    }

    /**
     * Create a return record (triggered by admin when book is physically returned).
     * Also updates peminjaman status to 'dikembalikan' and restores book stock.
     */
    static async create(data) {
        const { id_peminjaman, tgl_kembali_real, adminId } = data;
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // 1. Get loan detail
            const [loans] = await connection.query(
                `SELECT p.id_buku, p.tgl_kembali, p.status
                 FROM peminjaman p WHERE p.id_peminjaman = ?`,
                [id_peminjaman]
            );
            if (loans.length === 0) throw new Error('Peminjaman tidak ditemukan');
            const loan = loans[0];
            if (loan.status !== 'dipinjam') throw new Error('Buku belum berstatus dipinjam');

            // 2. Calculate fine
            const denda = Return.calculateFine(loan.tgl_kembali, tgl_kembali_real);

            // 3. Insert pengembalian record
            const [result] = await connection.query(
                `INSERT INTO pengembalian (id_peminjaman, tgl_kembali_real, denda, status, verified_by)
                 VALUES (?, ?, ?, 'selesai', ?)`,
                [id_peminjaman, tgl_kembali_real, denda, adminId]
            );

            // 4. Update peminjaman status → dikembalikan
            await connection.query(
                `UPDATE peminjaman SET status = 'dikembalikan' WHERE id_peminjaman = ?`,
                [id_peminjaman]
            );

            // 5. Restore book stock +1
            await connection.query(
                `UPDATE buku SET stok = stok + 1 WHERE id_buku = ?`,
                [loan.id_buku]
            );

            await connection.commit();
            return { id_pengembalian: result.insertId, denda };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Get all return records with loan, user, book details (Admin)
     */
    static async getAll() {
        const [rows] = await db.query(
            `SELECT
                pen.id_pengembalian,
                pen.tgl_kembali_real,
                pen.denda,
                pen.status,
                pen.created_at,
                p.id_peminjaman,
                p.tgl_pinjam,
                p.tgl_kembali,
                b.judul,
                u.nama AS nama_user
             FROM pengembalian pen
             JOIN peminjaman p ON pen.id_peminjaman = p.id_peminjaman
             JOIN buku b       ON p.id_buku = b.id_buku
             JOIN user u       ON p.id_user = u.id_user
             ORDER BY pen.created_at DESC`
        );
        return rows;
    }

    /**
     * Get all active loans eligible for return (status = 'dipinjam')
     */
    static async getActiveLoansList() {
        const [rows] = await db.query(
            `SELECT
                p.id_peminjaman,
                p.tgl_pinjam,
                p.tgl_kembali,
                b.judul,
                u.nama AS nama_user
             FROM peminjaman p
             JOIN buku b ON p.id_buku = b.id_buku
             JOIN user u ON p.id_user = u.id_user
             WHERE p.status = 'dipinjam'
             ORDER BY p.tgl_kembali ASC`
        );
        return rows;
    }
}

module.exports = Return;
