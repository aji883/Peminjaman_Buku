const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class Admin {
    static async findByEmail(email) {
        const [rows] = await db.query('SELECT * FROM admin WHERE email = ?', [email]);
        return rows[0];
    }

    static async login(email, password) {
        const admin = await this.findByEmail(email);
        if (!admin) {
            throw new Error('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch && password !== admin.password) {
            throw new Error('Invalid credentials');
        }

        const token = jwt.sign(
            { id: admin.id_admin, role: 'admin' },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1d' }
        );

        return {
            token,
            admin: {
                id: admin.id_admin,
                nama: admin.nama,
                email: admin.email
            }
        };
    }
}

module.exports = Admin;
