// ==========================================
// TERSIMPAN PAGE JS
// ==========================================

let allBooks = [];
let savedBooks = [];
let currentDetailBookId = null;
let currentView = 'grid';

document.addEventListener('DOMContentLoaded', () => {
    const userName = localStorage.getItem('user_name');
    if (userName) document.getElementById('userName').textContent = userName;
    loadSavedBooks();
});

function logoutUser() {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_name');
    window.location.href = 'user-login.html';
}

async function loadSavedBooks() {
    try {
        const books = await fetchAPI('/books');
        allBooks = books;
        const savedIds = getSavedBookIds();
        savedBooks = books.filter(b => savedIds.includes(b.id_buku));
        updateSavedStats(savedBooks);
        renderSavedBooks(savedBooks);
    } catch (error) {
        document.getElementById('savedContainer').innerHTML = `
            <div style="text-align:center;padding:3rem;color:var(--danger);">
                <i class="fas fa-exclamation-triangle fa-2x" style="margin-bottom:0.75rem;"></i>
                <p>Gagal memuat data. Pastikan server berjalan.</p>
            </div>`;
    }
}

function updateSavedStats(books) {
    document.getElementById('savedCount').textContent = books.length;
    document.getElementById('savedAvailable').textContent = books.filter(b => b.stok > 0).length;
    const cats = [...new Set(books.map(b => (b.kategori || 'lainnya').toLowerCase()))];
    document.getElementById('savedCategories').textContent = cats.length;
    document.getElementById('clearAllBtn').style.display = books.length > 0 ? 'inline-flex' : 'none';
}

function searchSaved(query) {
    const q = query.toLowerCase();
    const filtered = savedBooks.filter(b =>
        b.judul.toLowerCase().includes(q) ||
        (b.penulis && b.penulis.toLowerCase().includes(q))
    );
    renderSavedBooks(filtered);
}

function setView(view) {
    currentView = view;
    document.getElementById('viewGrid').classList.toggle('active', view === 'grid');
    document.getElementById('viewList').classList.toggle('active', view === 'list');
    renderSavedBooks(savedBooks);
}

function renderSavedBooks(books) {
    const container = document.getElementById('savedContainer');

    if (books.length === 0) {
        container.innerHTML = `
            <div class="tersimpan-empty">
                <div class="te-icon">
                    <i class="fas fa-bookmark"></i>
                </div>
                <h3>Belum Ada Buku Tersimpan</h3>
                <p>Simpan buku favorit Anda dari halaman Katalog atau Koleksi agar mudah ditemukan nanti.</p>
                <a href="index.html" class="btn btn-primary" style="margin-top:1rem;">
                    <i class="fas fa-book-open"></i> Jelajahi Katalog
                </a>
            </div>`;
        return;
    }

    if (currentView === 'list') {
        container.innerHTML = `<div class="tersimpan-list">${books.map((b, i) => savedListItem(b, i)).join('')}</div>`;
    } else {
        container.innerHTML = `<div class="book-grid">${books.map((b, i) => savedGridCard(b, i)).join('')}</div>`;
    }
}

function savedGridCard(book, index) {
    const coverHtml = book.cover
        ? `<img src="./uploads/${book.cover}" alt="${book.judul}">`
        : `<div class="no-cover"><i class="fas fa-book"></i></div>`;

    let catColor = 'var(--accent)';
    if (book.kategori === 'fiksi') catColor = '#00B894';
    else if (book.kategori === 'edukasi') catColor = '#0984E3';
    else if (book.kategori === 'sastra') catColor = '#6C5CE7';
    else if (book.kategori === 'sejarah') catColor = '#E17055';
    else if (book.kategori === 'sains') catColor = '#FD79A8';

    return `
        <div class="book-card" style="animation: fadeSlideUp 0.4s ease ${index * 60}ms both" onclick="openBookDetail(${book.id_buku})">
            <div class="cover-wrapper">
                ${coverHtml}
                <span class="stok-badge ${book.stok > 0 ? '' : 'empty'}">
                    ${book.stok > 0 ? `${book.stok} tersedia` : 'Habis'}
                </span>
                <button class="save-btn-mini saved" onclick="event.stopPropagation();removeSaved(${book.id_buku})" title="Hapus dari tersimpan">
                    <i class="fas fa-bookmark"></i>
                </button>
            </div>
            <div class="book-title">${book.judul}</div>
            <div class="book-author">${book.penulis || 'Tidak diketahui'}</div>
            <span class="book-badge" style="background:${catColor}15;color:${catColor};text-transform:capitalize;">${book.kategori || 'lainnya'}</span>
        </div>`;
}

function savedListItem(book, index) {
    const coverHtml = book.cover
        ? `<img src="./uploads/${book.cover}" alt="${book.judul}">`
        : `<div class="list-no-cover"><i class="fas fa-book"></i></div>`;
    const catColors = { fiksi:'#00B894', edukasi:'#0984E3', sastra:'#6C5CE7', sejarah:'#E17055', sains:'#FD79A8' };
    const catColor = catColors[(book.kategori||'').toLowerCase()] || 'var(--accent)';
    return `
        <div class="saved-list-item" style="animation: fadeSlideUp 0.4s ease ${index * 50}ms both" onclick="openBookDetail(${book.id_buku})">
            <div class="sli-cover">${coverHtml}</div>
            <div class="sli-info">
                <h4>${book.judul}</h4>
                <p class="sli-author"><i class="fas fa-user-edit"></i> ${book.penulis || 'Tidak diketahui'}</p>
                <div class="sli-meta">
                    <span class="book-badge" style="background:${catColor}15;color:${catColor};">${book.kategori || 'lainnya'}</span>
                    <span class="sli-stock ${book.stok > 0 ? '' : 'empty'}">
                        <i class="fas ${book.stok > 0 ? 'fa-check-circle' : 'fa-times-circle'}"></i>
                        ${book.stok > 0 ? `${book.stok} tersedia` : 'Habis'}
                    </span>
                </div>
            </div>
            <div class="sli-actions">
                ${book.stok > 0 ? `<button class="btn btn-primary btn-sm" onclick="event.stopPropagation();quickBorrow(${book.id_buku})"><i class="fas fa-hand-holding-heart"></i> Pinjam</button>` : ''}
                <button class="btn btn-danger btn-sm" onclick="event.stopPropagation();removeSaved(${book.id_buku})" title="Hapus">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>`;
}

function removeSaved(bookId) {
    toggleSaveBook(bookId);
    savedBooks = savedBooks.filter(b => b.id_buku !== Number(bookId));
    updateSavedStats(savedBooks);
    renderSavedBooks(savedBooks);
}

function clearAllSaved() {
    if (!confirm('Hapus semua buku dari daftar tersimpan?')) return;
    localStorage.setItem('saved_books', '[]');
    savedBooks = [];
    updateSavedStats([]);
    renderSavedBooks([]);
    showToast('Semua buku dihapus dari tersimpan', 'info');
}

function quickBorrow(bookId) {
    const book = allBooks.find(b => b.id_buku === bookId);
    if (!book || book.stok <= 0) return;
    openBorrowModal(book.id_buku, book.judul, book.penulis || 'Tidak diketahui', book.cover);
}

// ===== BOOK DETAIL MODAL =====
function openBookDetail(bookId) {
    const book = allBooks.find(b => b.id_buku === bookId);
    if (!book) return;
    currentDetailBookId = bookId;

    const coverWrapper = document.getElementById('detailCoverWrapper');
    coverWrapper.innerHTML = book.cover
        ? `<img src="./uploads/${book.cover}" alt="${book.judul}">`
        : `<div class="detail-no-cover"><i class="fas fa-book"></i><span>${book.judul.charAt(0)}</span></div>`;

    document.getElementById('detailTitle').textContent = book.judul;
    document.getElementById('detailAuthor').textContent = book.penulis || 'Penulis tidak diketahui';
    document.getElementById('detailPublisher').textContent = book.penerbit || 'Tidak diketahui';
    document.getElementById('detailYear').textContent = book.tahun || '-';

    const stockEl = document.getElementById('detailStock');
    const stockItem = document.getElementById('detailStockItem');
    if (book.stok > 0) {
        stockEl.textContent = `${book.stok} Tersedia`;
        stockItem.className = 'meta-item in-stock';
    } else {
        stockEl.textContent = 'Stok Habis';
        stockItem.className = 'meta-item out-of-stock';
    }

    document.getElementById('detailDescription').textContent = book.deskripsi || 'Tidak ada deskripsi untuk buku ini.';

    const borrowBtn = document.getElementById('detailBorrowBtn');
    if (book.stok > 0) {
        borrowBtn.style.display = 'inline-flex';
        borrowBtn.disabled = false;
        borrowBtn.innerHTML = '<i class="fas fa-hand-holding-heart"></i> Pinjam Buku Ini';
    } else {
        borrowBtn.style.display = 'inline-flex';
        borrowBtn.disabled = true;
        borrowBtn.innerHTML = '<i class="fas fa-times-circle"></i> Stok Habis';
    }

    const saveBtn = document.getElementById('detailSaveBtn');
    if (saveBtn) {
        const saved = isBookSaved(bookId);
        saveBtn.innerHTML = saved ? '<i class="fas fa-bookmark"></i> Tersimpan' : '<i class="far fa-bookmark"></i> Simpan';
        saveBtn.classList.toggle('saved', saved);
    }

    document.getElementById('bookDetailModal').classList.add('active');
}

function toggleSaveFromDetail() {
    if (!currentDetailBookId) return;
    const nowSaved = toggleSaveBook(currentDetailBookId);
    
    // Update button in modal
    const saveBtn = document.getElementById('detailSaveBtn');
    if (saveBtn) {
        saveBtn.innerHTML = nowSaved ? '<i class="fas fa-bookmark"></i> Tersimpan' : '<i class="far fa-bookmark"></i> Simpan';
        saveBtn.classList.toggle('saved', nowSaved);
    }

    // Refresh the saved list immediately
    if (!nowSaved) {
        savedBooks = savedBooks.filter(b => b.id_buku !== Number(currentDetailBookId));
        updateSavedStats(savedBooks);
        renderSavedBooks(savedBooks);
    }
}

function borrowFromDetail() {
    const book = allBooks.find(b => b.id_buku === currentDetailBookId);
    if (!book || book.stok <= 0) return;
    closeModal('bookDetailModal');
    openBorrowModal(book.id_buku, book.judul, book.penulis || 'Tidak diketahui', book.cover);
}

function openBorrowModal(id, judul, penulis, cover) {
    document.getElementById('loanBookId').value = id;
    const coverImg = cover ? `<img src="./uploads/${cover}" alt="${judul}">` : `<div style="width:60px;height:85px;background:#ddd;display:flex;align-items:center;justify-content:center;border-radius:4px;"><i class="fas fa-book"></i></div>`;
    document.getElementById('selectedBookInfo').innerHTML = `${coverImg}<div class="details"><h4>${judul}</h4><p>${penulis}</p></div>`;
    const today = new Date().toISOString().split('T')[0];
    const next = new Date(); next.setDate(next.getDate() + 7);
    document.getElementById('tglPinjam').value = today;
    document.getElementById('tglKembali').value = next.toISOString().split('T')[0];
    document.getElementById('loanModal').classList.add('active');
}

function closeModal(id) { document.getElementById(id).classList.remove('active'); }

document.getElementById('loanForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertBox = document.getElementById('loanAlert');
    try {
        const response = await fetchAPI('/loans', {
            method: 'POST',
            body: JSON.stringify({
                id_buku: document.getElementById('loanBookId').value,
                tgl_pinjam: document.getElementById('tglPinjam').value,
                tgl_kembali: document.getElementById('tglKembali').value
            })
        });
        alertBox.textContent = response.message;
        alertBox.className = 'alert success';
        setTimeout(() => { closeModal('loanModal'); alertBox.textContent = ''; alertBox.className = 'alert'; }, 2000);
    } catch (error) {
        alertBox.textContent = error.message;
        alertBox.className = 'alert error';
    }
});
