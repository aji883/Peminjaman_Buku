const db = require('./config/db');

async function migrate() {
    try {
        console.log('Connected to DB via pool');
        
        const createSavedBooksTable = `
            CREATE TABLE IF NOT EXISTS buku_tersimpan (
                id_saved INT AUTO_INCREMENT PRIMARY KEY,
                id_user INT NOT NULL,
                id_buku INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY user_book (id_user, id_buku),
                FOREIGN KEY (id_user) REFERENCES user(id_user) ON DELETE CASCADE,
                FOREIGN KEY (id_buku) REFERENCES buku(id_buku) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `;
        
        await db.query(createSavedBooksTable);
        console.log('buku_tersimpan table verified/created successfully.');
        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        process.exit(0);
    }
}

migrate();
