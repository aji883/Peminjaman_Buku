const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class User {
    static async findByEmail(email) {
        const [rows] = await db.query('SELECT * FROM user WHERE email = ?', [email]);
        return rows[0];
    }

    static async register(data) {
        const { nama, email, password } = data;
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await db.query(
            'INSERT INTO user (nama, email, password) VALUES (?, ?, ?)',
            [nama, email, hashedPassword]
        );
        return result.insertId;
    }

    static async login(email, password) {
        const user = await this.findByEmail(email);
        if (!user) {
            throw new Error('Email atau password salah');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Email atau password salah');
        }

        const token = jwt.sign(
            { id: user.id_user, role: 'user' },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1d' }
        );

        return {
            token,
            user: {
                id: user.id_user,
                id_user: user.id_user,
                nama: user.nama,
                email: user.email
            }
        };
    }

    static async update(userId, data) {
        const { nama, password } = data;
        let query = 'UPDATE user SET nama = ?';
        const params = [nama];
        
        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            query += ', password = ?';
            params.push(hashedPassword);
        }
        
        query += ' WHERE id_user = ?';
        params.push(userId);
        
        const [result] = await db.query(query, params);
        return result.affectedRows > 0;
    }

    static async findById(userId) {
        const [rows] = await db.query('SELECT id_user, nama, email, saldo, created_at FROM user WHERE id_user = ?', [userId]);
        return rows[0];
    }

    static async findByIdWithPassword(userId) {
        const [rows] = await db.query('SELECT id_user, nama, email, password FROM user WHERE id_user = ?', [userId]);
        return rows[0];
    }

    static async getAll() {
        const [rows] = await db.query('SELECT id_user, nama, email, saldo, created_at FROM user ORDER BY created_at DESC');
        return rows;
    }

    static async delete(userId) {
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Delete saldo transactions
            await connection.query('DELETE FROM transaksi_saldo WHERE id_user = ?', [userId]);

            // Delete returns associated with this user's loans
            await connection.query(
                `DELETE FROM pengembalian WHERE id_peminjaman IN 
                (SELECT id_peminjaman FROM peminjaman WHERE id_user = ?)`,
                [userId]
            );

            // Delete loans
            await connection.query('DELETE FROM peminjaman WHERE id_user = ?', [userId]);

            // Finally, delete the user
            const [result] = await connection.query('DELETE FROM user WHERE id_user = ?', [userId]);

            await connection.commit();
            return result.affectedRows > 0;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = User;
