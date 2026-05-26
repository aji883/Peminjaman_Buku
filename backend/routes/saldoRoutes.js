const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/saldo — Get current user's saldo
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.query('SELECT saldo FROM user WHERE id_user = ?', [userId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }
        res.json({ saldo: parseFloat(rows[0].saldo || 0) });
    } catch (error) {
        console.error('Error fetching user saldo:', error);
        res.status(500).json({ message: 'Gagal mengambil data saldo' });
    }
});

// GET /api/saldo/history — Get user's transaction history
router.get('/history', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.query(
            'SELECT id_transaksi, jenis, jumlah, saldo_sebelum, saldo_sesudah, keterangan, created_at FROM transaksi_saldo WHERE id_user = ? ORDER BY created_at DESC',
            [userId]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching saldo history:', error);
        res.status(500).json({ message: 'Gagal mengambil riwayat transaksi' });
    }
});

// GET /api/saldo/denda — Get user's unpaid fines
router.get('/denda', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.query(
            `SELECT pen.id_pengembalian, pen.denda, pen.tgl_kembali_real, pen.denda_dibayar, b.judul, p.tgl_kembali 
             FROM pengembalian pen 
             JOIN peminjaman p ON pen.id_peminjaman = p.id_peminjaman 
             JOIN buku b ON p.id_buku = b.id_buku 
             WHERE p.id_user = ? AND pen.denda > 0 AND pen.denda_dibayar = 0 
             ORDER BY pen.created_at DESC`,
            [userId]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching user denda:', error);
        res.status(500).json({ message: 'Gagal mengambil data denda' });
    }
});

// POST /api/saldo/bayar-denda/:id_pengembalian — Pay a fine from user's saldo
router.post('/bayar-denda/:id_pengembalian', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const { id_pengembalian } = req.params;
    
    let conn;
    try {
        conn = await db.getConnection();
        await conn.beginTransaction();
        
        // 1. Get the fine record and verify it belongs to this user and isn't paid yet
        const [fineRows] = await conn.query(
            `SELECT pen.*, p.id_user, b.judul 
             FROM pengembalian pen 
             JOIN peminjaman p ON pen.id_peminjaman = p.id_peminjaman 
             JOIN buku b ON p.id_buku = b.id_buku
             WHERE pen.id_pengembalian = ?`,
            [id_pengembalian]
        );
        
        if (fineRows.length === 0) {
            await conn.rollback();
            return res.status(404).json({ message: 'Data pengembalian tidak ditemukan' });
        }
        
        const fine = fineRows[0];
        if (fine.id_user !== userId) {
            await conn.rollback();
            return res.status(403).json({ message: 'Anda tidak berhak membayar denda ini' });
        }
        
        if (fine.denda <= 0) {
            await conn.rollback();
            return res.status(400).json({ message: 'Tidak ada denda yang perlu dibayar pada transaksi ini' });
        }
        
        if (fine.denda_dibayar === 1) {
            await conn.rollback();
            return res.status(400).json({ message: 'Denda ini sudah lunas dibayar' });
        }
        
        // 2. Fetch user's current saldo
        const [userRows] = await conn.query('SELECT saldo FROM user WHERE id_user = ? FOR UPDATE', [userId]);
        if (userRows.length === 0) {
            await conn.rollback();
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }
        
        const currentSaldo = parseFloat(userRows[0].saldo || 0);
        const dendaAmount = parseFloat(fine.denda);
        
        // 3. Check if balance is sufficient
        if (currentSaldo < dendaAmount) {
            await conn.rollback();
            return res.status(400).json({ message: 'Saldo tidak mencukupi untuk membayar denda ini' });
        }
        
        const newSaldo = currentSaldo - dendaAmount;
        
        // 4. Deduct saldo
        await conn.query('UPDATE user SET saldo = ? WHERE id_user = ?', [newSaldo, userId]);
        
        // 5. Mark fine as paid
        await conn.query('UPDATE pengembalian SET denda_dibayar = 1 WHERE id_pengembalian = ?', [id_pengembalian]);
        
        // 6. Create transaction record
        const keterangan = `Bayar denda buku "${fine.judul}"`;
        await conn.query(
            `INSERT INTO transaksi_saldo (id_user, jenis, jumlah, saldo_sebelum, saldo_sesudah, keterangan) 
             VALUES (?, 'denda', ?, ?, ?, ?)`,
            [userId, dendaAmount, currentSaldo, newSaldo, keterangan]
        );
        
        await conn.commit();
        res.json({ 
            message: 'Denda berhasil dibayar!', 
            saldo_baru: newSaldo 
        });
        
    } catch (error) {
        if (conn) await conn.rollback();
        console.error('Error paying denda:', error);
        res.status(500).json({ message: 'Terjadi kesalahan saat memproses pembayaran' });
    } finally {
        if (conn) conn.release();
    }
});

// POST /api/saldo/topup — Top up user's saldo (Admin only)
router.post('/topup', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Hanya admin yang dapat melakukan top up' });
        }
        
        const { id_user, jumlah, keterangan } = req.body;
        if (!id_user || !jumlah || parseFloat(jumlah) <= 0) {
            return res.status(400).json({ message: 'id_user dan jumlah top up (harus > 0) wajib diisi' });
        }
        
        const topupAmount = parseFloat(jumlah);
        const desc = keterangan || 'Top Up Saldo oleh Admin';
        
        let conn;
        try {
            conn = await db.getConnection();
            await conn.beginTransaction();
            
            // 1. Get user's current saldo and lock
            const [userRows] = await conn.query('SELECT saldo FROM user WHERE id_user = ? FOR UPDATE', [id_user]);
            if (userRows.length === 0) {
                await conn.rollback();
                return res.status(404).json({ message: 'User tidak ditemukan' });
            }
            
            const currentSaldo = parseFloat(userRows[0].saldo || 0);
            const newSaldo = currentSaldo + topupAmount;
            
            // 2. Add saldo
            await conn.query('UPDATE user SET saldo = ? WHERE id_user = ?', [newSaldo, id_user]);
            
            // 3. Create transaction record
            await conn.query(
                `INSERT INTO transaksi_saldo (id_user, jenis, jumlah, saldo_sebelum, saldo_sesudah, keterangan) 
                 VALUES (?, 'topup', ?, ?, ?, ?)`,
                [id_user, topupAmount, currentSaldo, newSaldo, desc]
            );
            
            await conn.commit();
            res.json({ 
                message: 'Top up saldo berhasil!', 
                id_user,
                saldo_baru: newSaldo 
            });
            
        } catch (err) {
            if (conn) await conn.rollback();
            throw err;
        } finally {
            if (conn) conn.release();
        }
        
    } catch (error) {
        console.error('Error in topup API:', error);
        res.status(500).json({ message: 'Terjadi kesalahan saat memproses top up' });
    }
});

// GET /api/saldo/admin/users — Get all users with saldo info (Admin only)
router.get('/admin/users', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Akses ditolak' });
        }
        
        const [rows] = await db.query(
            'SELECT id_user, nama, email, no_hp, alamat, saldo, created_at FROM user ORDER BY created_at DESC'
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching admin users with saldo:', error);
        res.status(500).json({ message: 'Gagal mengambil data user' });
    }
});

module.exports = router;
