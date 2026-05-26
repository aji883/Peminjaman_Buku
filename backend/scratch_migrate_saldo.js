const db = require('./config/db');

async function migrate() {
    try {
        console.log('Connected to DB via pool');
        
        // 1. Add saldo column to user
        try {
            await db.query("ALTER TABLE user ADD COLUMN saldo DECIMAL(12,2) DEFAULT 0.00 AFTER password");
            console.log('Added saldo column to user successfully.');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column saldo already exists on user table. Skipping...');
            } else {
                throw err;
            }
        }

        // 2. Add denda_dibayar column to pengembalian
        try {
            await db.query("ALTER TABLE pengembalian ADD COLUMN denda_dibayar TINYINT(1) DEFAULT 0 AFTER denda");
            console.log('Added denda_dibayar column to pengembalian successfully.');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('Column denda_dibayar already exists on pengembalian table. Skipping...');
            } else {
                throw err;
            }
        }

        // 3. Create transaksi_saldo table
        const createTransaksiTable = `
            CREATE TABLE IF NOT EXISTS transaksi_saldo (
                id_transaksi INT AUTO_INCREMENT PRIMARY KEY,
                id_user INT NOT NULL,
                jenis ENUM('topup', 'denda') NOT NULL,
                jumlah DECIMAL(12,2) NOT NULL,
                saldo_sebelum DECIMAL(12,2) NOT NULL,
                saldo_sesudah DECIMAL(12,2) NOT NULL,
                keterangan VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_user) REFERENCES user(id_user) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
        `;
        await db.query(createTransaksiTable);
        console.log('transaksi_saldo table verified/created successfully.');
        
        console.log('All migrations completed successfully.');
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        // We don't call db.end() directly if it's a pool, but we can exit the process.
        process.exit(0);
    }
}

migrate();
