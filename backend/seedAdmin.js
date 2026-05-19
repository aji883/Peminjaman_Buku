/**
 * Script untuk membuat admin default di database.
 * Jalankan sekali saja: node seedAdmin.js
 */
const bcrypt = require('bcryptjs');
const db = require('./config/db');

async function seedAdmin() {
    try {
        const password = 'admin123';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Cek apakah admin sudah ada
        const [existing] = await db.query('SELECT * FROM admin WHERE email = ?', ['admin@perpustakaan.com']);
        
        if (existing.length > 0) {
            // Update password-nya supaya pasti sesuai hash bcrypt
            await db.query('UPDATE admin SET password = ? WHERE email = ?', [hashedPassword, 'admin@perpustakaan.com']);
            console.log('Admin password updated!');
        } else {
            await db.query(
                'INSERT INTO admin (nama, email, password) VALUES (?, ?, ?)',
                ['Administrator', 'admin@perpustakaan.com', hashedPassword]
            );
            console.log('Admin created!');
        }

        console.log('Email   : admin@perpustakaan.com');
        console.log('Password: admin123');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error.message);
        process.exit(1);
    }
}

seedAdmin();
