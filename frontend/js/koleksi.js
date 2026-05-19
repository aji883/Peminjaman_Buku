// ==========================================
// KOLEKSI PAGE JS
// ==========================================

let allBooks = [];
let currentDetailBookId = null;

const CATEGORY_META = {
    fiksi:   { icon: 'fa-hat-wizard',     color: '#00B894', bg: 'rgba(0,184,148,0.1)',   label: 'Fiksi' },
    edukasi: { icon: 'fa-graduation-cap', color: '#0984E3', bg: 'rgba(9,132,227,0.1)',   label: 'Edukasi' },
    sastra:  { icon: 'fa-feather-alt',    color: '#6C5CE7', bg: 'rgba(108,92,231,0.1)',  label: 'Sastra' },
    sejarah: { icon: 'fa-landmark',       color: '#E17055', bg: 'rgba(225,112,85,0.1)',  label: 'Sejarah' },
    sains:   { icon: 'fa-flask',          color: '#FD79A8', bg: 'rgba(253,121,168,0.1)', label: 'Sains' },
    lainnya: { icon: 'fa-book',           color: '#C4956A', bg: 'rgba(196,149,106,0.1)', label: 'Lainnya' }
};

document.addEventListener('DOMContentLoaded', () => {
    const userName = localStorage.getItem('user_name');
    if (userName) document.getElementById('userName').textContent = userName;
    loadCollection();
});

function logoutUser() {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_name');
    window.location.href = 'user-login.html';
}

async function loadCollection() {
    try {
        const books = await fetchAPI('/books');
        allBooks = books;
        updateStats(books);
        buildFilterPills(books);
        renderCategorySections(books);
    } catch (error) {
        document.getElementById('koleksiContainer').innerHTML = `
            <div style="text-align:center;padding:3rem;color:var(--danger);">
                <i class="fas fa-exclamation-triangle fa-2x" style="margin-bottom:0.75rem;"></i>
                <p>Gagal memuat koleksi. Pastikan server berjalan.</p>
            </div>`;
    }
}

function updateStats(books) {
    const categories = [...new Set(books.map(b => (b.kategori || 'lainnya').toLowerCase()))];
    const available = books.filter(b => b.stok > 0).length;
    document.getElementById('statTotalBooks').textContent = books.length;
    document.getElementById('statTotalCategories').textContent = categories.length;
    document.getElementById('statAvailable').textContent = available;
}

function buildFilterPills(books) {
    const bar = document.getElementById('filterBar');
    const categories = [...new Set(books.map(b => (b.kategori || 'lainnya').toLowerCase()))];
    // Keep the "Semua" pill, add dynamic ones
    categories.forEach(cat => {
        const meta = CATEGORY_META[cat] || CATEGORY_META.lainnya;
        const count = books.filter(b => (b.kategori || 'lainnya').toLowerCase() === cat).length;
        const btn = document.createElement('button');
        btn.className = 'filter-pill';
        btn.dataset.category = cat;
        btn.onclick = function() { filterCategory(cat, this); };
        btn.innerHTML = `<i class="fas ${meta.icon}" style="color:${meta.color}"></i> ${meta.label} <span class="pill-count">${count}</span>`;
        bar.appendChild(btn);
    });
}

function filterCategory(category, btn) {
    // Update active pill
    document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');

    if (category === 'all') {
        renderCategorySections(allBooks);
    } else {
        const filtered = allBooks.filter(b => (b.kategori || 'lainnya').toLowerCase() === category);
        renderSingleCategory(category, filtered);
    }
}

function searchCollection(query) {
    const q = query.toLowerCase();
    const filtered = allBooks.filter(b =>
        b.judul.toLowerCase().includes(q) ||
        (b.penulis && b.penulis.toLowerCase().includes(q)) ||
        (b.kategori && b.kategori.toLowerCase().includes(q))
    );
    if (q) {
        renderSearchResults(filtered, query);
    } else {
        renderCategorySections(allBooks);
    }
    // Reset filter pills
    document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
    if (!q) document.querySelector('.filter-pill[data-category="all"]').classList.add('active');
}

function renderSearchResults(books, query) {
    const container = document.getElementById('koleksiContainer');
    if (books.length === 0) {
        container.innerHTML = `
            <div class="koleksi-empty-state">
                <i class="fas fa-search"></i>
                <h3>Tidak Ditemukan</h3>
                <p>Tidak ada buku yang cocok dengan pencarian "<strong>${query}</strong>"</p>
            </div>`;
        return;
    }
    container.innerHTML = `
        <div class="koleksi-section" style="animation: fadeSlideUp 0.4s ease">
            <div class="koleksi-section-header">
                <div class="koleksi-section-title">
                    <div class="kst-icon" style="background:var(--bg-input);color:var(--primary);">
                        <i class="fas fa-search"></i>
                    </div>
                    <div>
                        <h3>Hasil Pencarian: "${query}"</h3>
                        <span>${books.length} buku ditemukan</span>
                    </div>
                </div>
            </div>
            <div class="koleksi-book-grid">${books.map(b => bookCardHTML(b)).join('')}</div>
        </div>`;
}

function renderCategorySections(books) {
    const container = document.getElementById('koleksiContainer');
    const grouped = {};
    books.forEach(b => {
        const cat = (b.kategori || 'lainnya').toLowerCase();
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(b);
    });

    if (Object.keys(grouped).length === 0) {
        container.innerHTML = `
            <div class="koleksi-empty-state">
                <i class="fas fa-inbox"></i>
                <h3>Koleksi Kosong</h3>
                <p>Belum ada buku dalam koleksi perpustakaan.</p>
            </div>`;
        return;
    }

    let html = '';
    let delay = 0;
    for (const [cat, catBooks] of Object.entries(grouped)) {
        html += categorySection(cat, catBooks, delay);
        delay += 80;
    }
    container.innerHTML = html;
}

function renderSingleCategory(category, books) {
    const container = document.getElementById('koleksiContainer');
    if (books.length === 0) {
        container.innerHTML = `
            <div class="koleksi-empty-state">
                <i class="fas fa-folder-open"></i>
                <h3>Kategori Kosong</h3>
                <p>Belum ada buku dalam kategori ini.</p>
            </div>`;
        return;
    }
    container.innerHTML = categorySection(category, books, 0);
}

function categorySection(cat, books, delay) {
    const meta = CATEGORY_META[cat] || CATEGORY_META.lainnya;
    const available = books.filter(b => b.stok > 0).length;
    return `
        <div class="koleksi-section" style="animation: fadeSlideUp 0.5s ease ${delay}ms both">
            <div class="koleksi-section-header">
                <div class="koleksi-section-title">
                    <div class="kst-icon" style="background:${meta.bg};color:${meta.color};">
                        <i class="fas ${meta.icon}"></i>
                    </div>
                    <div>
                        <h3>${meta.label}</h3>
                        <span>${books.length} buku · ${available} tersedia</span>
                    </div>
                </div>
                <div class="koleksi-section-bar">
                    <div class="ksb-fill" style="width:${books.length ? (available/books.length*100) : 0}%;background:${meta.color};"></div>
                </div>
            </div>
            <div class="koleksi-book-grid">${books.map(b => bookCardHTML(b)).join('')}</div>
        </div>`;
}

function bookCardHTML(book) {
    const coverHtml = book.cover
        ? `<img src="./uploads/${book.cover}" alt="${book.judul}">`
        : `<div class="no-cover"><i class="fas fa-book"></i></div>`;
    const meta = CATEGORY_META[(book.kategori || 'lainnya').toLowerCase()] || CATEGORY_META.lainnya;
    const saved = isBookSaved(book.id_buku);
    return `
        <div class="book-card" onclick="openBookDetail(${book.id_buku})">
            <div class="cover-wrapper">
                ${coverHtml}
                <span class="stok-badge ${book.stok > 0 ? '' : 'empty'}">
                    ${book.stok > 0 ? `${book.stok} tersedia` : 'Habis'}
                </span>
                <button class="save-btn-mini ${saved ? 'saved' : ''}" onclick="event.stopPropagation();toggleSaveCard(${book.id_buku},this)" title="${saved ? 'Hapus dari tersimpan' : 'Simpan buku ini'}">
                    <i class="${saved ? 'fas' : 'far'} fa-bookmark"></i>
                </button>
            </div>
            <div class="book-title">${book.judul}</div>
            <div class="book-author">${book.penulis || 'Tidak diketahui'}</div>
            <span class="book-badge" style="background:${meta.color}15;color:${meta.color};text-transform:capitalize;">${book.kategori || 'lainnya'}</span>
        </div>`;
}

function toggleSaveCard(bookId, btn) {
    const nowSaved = toggleSaveBook(bookId);
    btn.classList.toggle('saved', nowSaved);
    btn.querySelector('i').className = nowSaved ? 'fas fa-bookmark' : 'far fa-bookmark';
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

    // Save button state
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
    const saveBtn = document.getElementById('detailSaveBtn');
    saveBtn.innerHTML = nowSaved ? '<i class="fas fa-bookmark"></i> Tersimpan' : '<i class="far fa-bookmark"></i> Simpan';
    saveBtn.classList.toggle('saved', nowSaved);
}

function borrowFromDetail() {
    const book = allBooks.find(b => b.id_buku === currentDetailBookId);
    if (!book || book.stok <= 0) { alert('Stok buku habis.'); return; }
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
