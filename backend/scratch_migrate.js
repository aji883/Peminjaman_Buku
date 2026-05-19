const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

async function migrate() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        
        console.log('Connected to DB');
        
        // Add kategori column to buku table
        await connection.query("ALTER TABLE buku ADD COLUMN kategori VARCHAR(50) DEFAULT 'lainnya'");
        console.log('Added kategori column successfully.');
        
        await connection.end();
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('Column kategori already exists. Skipping...');
        } else {
            console.error('Migration failed:', err.message);
        }
    }
}

migrate();
