-- Tambah status 'dikembalikan' pada kolom status tabel peminjaman
ALTER TABLE peminjaman 
MODIFY COLUMN status ENUM('diproses','dipinjam','ditolak','dikembalikan') DEFAULT 'diproses';
