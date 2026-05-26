-- Add saldo column to user table
ALTER TABLE user ADD COLUMN saldo DECIMAL(12,2) DEFAULT 0.00 AFTER password;

-- Add denda_dibayar column to pengembalian table
ALTER TABLE pengembalian ADD COLUMN denda_dibayar TINYINT(1) DEFAULT 0 AFTER denda;

-- Create transaksi_saldo table for transaction history
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
