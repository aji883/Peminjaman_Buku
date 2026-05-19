let allBooks = [];
let currentDetailBookId = null;

document.addEventListener('DOMContentLoaded', () => {
    const userName = localStorage.getItem('user_name');
    if (userName) {
        document.getElementById('userName').textContent = userName;
    }
    loadBooks();
});

function logoutUser() {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_name');
    window.location.href = 'user-login.html';
}

function searchBooks(query) {
    const q = query.toLowerCase();
    const filtered = allBooks.filter(book => 
        book.judul.toLowerCase().includes(q) ||
        (book.penulis && book.penulis.toLowerCase().includes(q)) ||
        (book.kategori && book.kategori.toLowerCase().includes(q))
    );
    renderBooks(filtered);
}

function filterByCategory(category) {
    let filtered = allBooks;
    if (category) {
        filtered = allBooks.filter(book => book.kategori && book.kategori.toLowerCase() === category.toLowerCase());
    }
    
    // Update the section title to show active category
    const titleEl = document.querySelector('.content-area .section-title');
    if (titleEl) {
        titleEl.textContent = category ? `Buku Kategori: ${category.charAt(0).toUpperCase() + category.slice(1)}` : 'Semua Buku';
    }

    renderBooks(filtered);
    
    // Scroll to the books container so user sees the result
    const booksSection = document.querySelector('.content-with-aside');
    if (booksSection) {
        booksSection.scrollIntoView({ behavior: 'smooth' });
    }
}

async function loadBooks() {
    const container = document.getElementById('booksContainer');
    const featured = document.getElementById('featuredBooks');
    
    try {
        const books = await fetchAPI('/books');
        allBooks = books;

        // Update stats
        document.getElementById('totalBooks').textContent = books.length;
        const aboutEl = document.getElementById('aboutTotalBooks');
        if (aboutEl) aboutEl.textContent = books.length;
        
        if (books.length === 0) {
            featured.innerHTML = `
                <div style="min-width: 380px; background: var(--bg-featured); border-radius: var(--radius); padding: 2rem; text-align: center; color: var(--text-medium);">
                    <i class="fas fa-book-open fa-2x" style="margin-bottom: 0.5rem; opacity: 0.5;"></i>
                    <p>Belum ada buku yang ditambahkan.</p>
                </div>
            `;
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-light);">
                    <i class="fas fa-inbox fa-3x" style="margin-bottom: 1rem; opacity: 0.3;"></i>
                    <p>Koleksi buku masih kosong.</p>
                </div>
            `;
            return;
        }

        // Render featured (top 3)
        const featuredBooks = books.slice(0, 3);
        featured.innerHTML = featuredBooks.map((book, index) => {
            const coverHtml = book.cover
                ? `<img class="cover" src="./uploads/${book.cover}" alt="${book.judul}">`
                : `<div class="cover-placeholder"><i class="fas fa-book"></i></div>`;
            
            const saved = isBookSaved(book.id_buku);
            return `
                <div class="featured-card" onclick="openBookDetail(${book.id_buku})">
                    <div style="position:relative;">
                        ${coverHtml}
                        <button class="save-btn-mini ${saved ? 'saved' : ''}" onclick="event.stopPropagation();toggleSaveCard(${book.id_buku},this)" title="${saved ? 'Hapus dari tersimpan' : 'Simpan buku ini'}" style="top: -0.25rem; left: -0.25rem;">
                            <i class="${saved ? 'fas' : 'far'} fa-bookmark"></i>
                        </button>
                    </div>
                    <div class="info">
                        <h3>${book.judul}</h3>
                        <p>${book.penulis || 'Penulis tidak diketahui'}</p>
                        <p class="meta"><i class="fas fa-building"></i> ${book.penerbit || '-'} · ${book.tahun || '-'}</p>
                        <p class="meta">${book.stok > 0 ? `<i class="fas fa-check-circle" style="color: var(--success);"></i> ${book.stok} Tersedia` : `<i class="fas fa-times-circle" style="color: var(--danger);"></i> Stok Habis`}</p>
                    </div>
                </div>
            `;
        }).join('');

        // Render all books grid
        renderBooks(books);

    } catch (error) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--danger);">
                <i class="fas fa-exclamation-triangle fa-2x" style="margin-bottom: 0.75rem;"></i>
                <p>Gagal memuat buku. Pastikan server berjalan.</p>
                <p style="font-size: 0.75rem; color: var(--text-light); margin-top: 0.5rem;">${error.message}</p>
            </div>
        `;
        featured.innerHTML = '';
    }
}

function renderBooks(books) {
    const container = document.getElementById('booksContainer');
    
    if (books.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-light);">
                <i class="fas fa-search fa-2x" style="margin-bottom: 0.75rem; opacity: 0.3;"></i>
                <p>Tidak ada buku yang ditemukan.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = books.map(book => {
        const coverHtml = book.cover
            ? `<img src="./uploads/${book.cover}" alt="${book.judul}">`
            : `<div class="no-cover"><i class="fas fa-book"></i></div>`;

        let catColor = 'var(--accent)';
        if (book.kategori === 'fiksi') catColor = '#00B894';
        else if (book.kategori === 'edukasi') catColor = '#0984E3';
        else if (book.kategori === 'sastra') catColor = '#6C5CE7';
        else if (book.kategori === 'sejarah') catColor = '#E17055';
        else if (book.kategori === 'sains') catColor = '#FD79A8';

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
                <span class="book-badge" style="background: ${catColor}15; color: ${catColor}; text-transform: capitalize;">${book.kategori || 'lainnya'}</span>
            </div>
        `;
    }).join('');
}

// Book Detail Modal
function openBookDetail(bookId) {
    const book = allBooks.find(b => b.id_buku === bookId);
    if (!book) return;

    currentDetailBookId = bookId;

    // Cover
    const coverWrapper = document.getElementById('detailCoverWrapper');
    if (book.cover) {
        coverWrapper.innerHTML = `<img src="./uploads/${book.cover}" alt="${book.judul}">`;
    } else {
        coverWrapper.innerHTML = `<div class="detail-no-cover"><i class="fas fa-book"></i><span>${book.judul.charAt(0)}</span></div>`;
    }

    // Info
    document.getElementById('detailTitle').textContent = book.judul;
    document.getElementById('detailAuthor').textContent = book.penulis || 'Penulis tidak diketahui';
    document.getElementById('detailPublisher').textContent = book.penerbit || 'Tidak diketahui';
    document.getElementById('detailYear').textContent = book.tahun || '-';
    
    // Stock
    const stockEl = document.getElementById('detailStock');
    const stockItem = document.getElementById('detailStockItem');
    if (book.stok > 0) {
        stockEl.textContent = `${book.stok} Tersedia`;
        stockItem.classList.remove('out-of-stock');
        stockItem.classList.add('in-stock');
    } else {
        stockEl.textContent = 'Stok Habis';
        stockItem.classList.remove('in-stock');
        stockItem.classList.add('out-of-stock');
    }

    // Description
    const descEl = document.getElementById('detailDescription');
    descEl.textContent = book.deskripsi || 'Tidak ada deskripsi untuk buku ini.';

    // Borrow button
    const borrowBtn = document.getElementById('detailBorrowBtn');
    if (book.stok > 0) {
        borrowBtn.style.display = 'inline-flex';
        borrowBtn.disabled = false;
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

// Transition from detail modal to borrow modal
function borrowFromDetail() {
    const book = allBooks.find(b => b.id_buku === currentDetailBookId);
    if (!book) return;
    if (book.stok <= 0) {
        alert('Maaf, stok buku ini sedang habis dan tidak bisa dipinjam saat ini.');
        return;
    }

    closeModal('bookDetailModal');
    openBorrowModal(book.id_buku, book.judul, book.penulis || 'Tidak diketahui', book.cover);
}

function toggleSaveCard(bookId, btn) {
    const nowSaved = toggleSaveBook(bookId);
    btn.classList.toggle('saved', nowSaved);
    btn.querySelector('i').className = nowSaved ? 'fas fa-bookmark' : 'far fa-bookmark';
}

function toggleSaveFromDetail() {
    if (!currentDetailBookId) return;
    const nowSaved = toggleSaveBook(currentDetailBookId);
    const saveBtn = document.getElementById('detailSaveBtn');
    if (saveBtn) {
        saveBtn.innerHTML = nowSaved ? '<i class="fas fa-bookmark"></i> Tersimpan' : '<i class="far fa-bookmark"></i> Simpan';
        saveBtn.classList.toggle('saved', nowSaved);
    }
}

// Borrow Modal Logic
function openBorrowModal(id, judul, penulis, cover) {
    const modal = document.getElementById('loanModal');
    const bookInfo = document.getElementById('selectedBookInfo');
    const loanBookId = document.getElementById('loanBookId');
    
    loanBookId.value = id;
    const coverUrl = cover ? `./uploads/${cover}` : '';
    const coverImg = cover ? `<img src="${coverUrl}" alt="${judul}">` : `<div style="width:60px; height:85px; background:#ddd; display:flex; align-items:center; justify-content:center; border-radius:4px;"><i class="fas fa-book"></i></div>`;
    
    bookInfo.innerHTML = `
        ${coverImg}
        <div class="details">
            <h4>${judul}</h4>
            <p>${penulis}</p>
        </div>
    `;
    
    // Set default dates (today and +7 days)
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];
    
    document.getElementById('tglPinjam').value = today;
    document.getElementById('tglKembali').value = nextWeekStr;
    
    // Reset borrow button in detail modal for next time
    const detailBorrowBtn = document.getElementById('detailBorrowBtn');
    detailBorrowBtn.innerHTML = '<i class="fas fa-hand-holding-heart"></i> Pinjam Buku Ini';
    detailBorrowBtn.disabled = false;

    modal.classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Handle Loan Form
document.getElementById('loanForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id_buku = document.getElementById('loanBookId').value;
    const tgl_pinjam = document.getElementById('tglPinjam').value;
    const tgl_kembali = document.getElementById('tglKembali').value;
    const alertBox = document.getElementById('loanAlert');
    
    try {
        const response = await fetchAPI('/loans', {
            method: 'POST',
            body: JSON.stringify({ id_buku, tgl_pinjam, tgl_kembali })
        });
        
        alertBox.textContent = response.message;
        alertBox.className = 'alert success';
        
        setTimeout(() => {
            closeModal('loanModal');
            alertBox.textContent = '';
            alertBox.className = 'alert';
        }, 2000);
        
    } catch (error) {
        alertBox.textContent = error.message;
        alertBox.className = 'alert error';
    }
});
