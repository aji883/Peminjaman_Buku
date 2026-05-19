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
                nama: user.nama,
                email: user.email
            }
        };
    }
}

module.exports = User;
