const mysql = require('mysql2/promise');
require('dotenv').config({path: './.env'});

(async () => {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    await conn.query("UPDATE buku SET kategori = 'fiksi' WHERE judul = 'Negeri 5 Menara'");
    await conn.query("UPDATE buku SET kategori = 'sastra' WHERE judul LIKE '%SISI TERGELAP SURGA%'");
    await conn.query("UPDATE buku SET kategori = 'sains' WHERE judul LIKE '%Bumi Manusia%'"); // Just an example, Pramoedya is sastra, let's just make it 'sastra' as well.
    await conn.query("UPDATE buku SET kategori = 'sastra' WHERE judul LIKE '%Bumi Manusia%'");
    await conn.query("UPDATE buku SET kategori = 'fiksi' WHERE judul LIKE '%Laskar Pelangi%'");

    console.log('Database updated manually.');
    await conn.end();
})();
