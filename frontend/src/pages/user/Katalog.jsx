import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { fetchAPI } from '../../api/api';
import UserLayout from '../../components/layout/UserLayout';
import toast, { Toaster } from 'react-hot-toast';

const Katalog = () => {
    const { user } = useContext(AuthContext);
    
    // States
    const [books, setBooks] = useState([]);
    const [filteredBooks, setFilteredBooks] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('');
    const [savedBookIds, setSavedBookIds] = useState([]);

    // Detail Modal States
    const [selectedBook, setSelectedBook] = useState(null);
    const [availability, setAvailability] = useState(null);
    const [loadingAvailability, setLoadingAvailability] = useState(false);

    // Loan Modal States
    const [showLoanModal, setShowLoanModal] = useState(false);
    const [loanBook, setLoanBook] = useState(null);
    const [tglPinjam, setTglPinjam] = useState('');
    const [tglKembali, setTglKembali] = useState('');
    const [loanError, setLoanError] = useState('');
    const [loanSuccess, setLoanSuccess] = useState('');

    useEffect(() => {
        loadBooks();
        loadSavedBooks();
    }, []);

    // Synchronize filtered books on category, query or book change
    useEffect(() => {
        let result = books;

        if (activeCategory) {
            result = result.filter(b => b.kategori && b.kategori.toLowerCase() === activeCategory.toLowerCase());
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(b => 
                b.judul.toLowerCase().includes(q) ||
                (b.penulis && b.penulis.toLowerCase().includes(q)) ||
                (b.kategori && b.kategori.toLowerCase().includes(q))
            );
        }

        setFilteredBooks(result);
    }, [books, searchQuery, activeCategory]);

    const loadBooks = async () => {
        try {
            const data = await fetchAPI('/books');
            setBooks(data);
            setFilteredBooks(data);
        } catch (err) {
            console.error(err);
            toast.error('Gagal memuat buku. Pastikan server berjalan.');
        }
    };

    const loadSavedBooks = async () => {
        try {
            const storageKey = `saved_books_${sessionStorage.getItem('user_id') || 'guest'}`;
            let localSaved = [];
            try {
                localSaved = JSON.parse(localStorage.getItem(storageKey) || '[]');
            } catch (e) {
                localSaved = [];
            }
            
            // Fetch online saved books
            const savedData = await fetchAPI('/books/saved');
            let onlineIds = savedData.map(b => Number(b.id_buku));
            
            // If we have local books not synced yet, sync them
            if (localSaved.length > 0) {
                for (const bookId of localSaved) {
                    const id = Number(bookId);
                    if (!onlineIds.includes(id)) {
                        try {
                            await fetchAPI('/books/saved', {
                                method: 'POST',
                                body: JSON.stringify({ id_buku: id })
                            });
                            onlineIds.push(id);
                        } catch (err) {
                            console.error(`Gagal mensinkronisasikan buku ${id}:`, err);
                        }
                    }
                }
                // Clear local storage after successful sync
                localStorage.setItem(storageKey, '[]');
            }
            
            setSavedBookIds(onlineIds);
        } catch (err) {
            console.error('Gagal memuat buku tersimpan dari server:', err);
            try {
                const storageKey = `saved_books_${sessionStorage.getItem('user_id') || 'guest'}`;
                const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
                setSavedBookIds(saved.map(Number));
            } catch {
                setSavedBookIds([]);
            }
        }
    };

    const isBookSaved = (bookId) => {
        return savedBookIds.includes(Number(bookId));
    };

    const toggleSaveBook = async (e, bookId) => {
        e.stopPropagation();
        bookId = Number(bookId);
        let saved = [...savedBookIds];
        let nowSaved = false;

        try {
            if (saved.includes(bookId)) {
                await fetchAPI(`/books/saved/${bookId}`, {
                    method: 'DELETE'
                });
                saved = saved.filter(id => id !== bookId);
                toast('Buku dihapus dari tersimpan', { icon: 'ℹ️' });
            } else {
                await fetchAPI('/books/saved', {
                    method: 'POST',
                    body: JSON.stringify({ id_buku: bookId })
                });
                saved.push(bookId);
                toast.success('Buku berhasil disimpan!');
                nowSaved = true;
            }
            setSavedBookIds(saved);
        } catch (err) {
            console.error(err);
            toast.error(err.message || 'Gagal mengubah status tersimpan buku');
        }
        return nowSaved;
    };

    const openBookDetail = async (book) => {
        setSelectedBook(book);
        setAvailability(null);
        
        if (book.stok <= 0) {
            setLoadingAvailability(true);
            try {
                const availData = await fetchAPI(`/books/${book.id_buku}/availability`);
                setAvailability(availData);
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingAvailability(false);
            }
        }
    };

    const closeDetailModal = () => {
        setSelectedBook(null);
        setAvailability(null);
    };

    const handleBorrowClickFromDetail = () => {
        if (!selectedBook) return;
        if (selectedBook.stok <= 0) {
            toast.error('Maaf, stok buku ini sedang habis.');
            return;
        }

        const bookToBorrow = selectedBook;
        closeDetailModal();

        // Open loan modal
        setLoanBook(bookToBorrow);
        
        const today = new Date().toISOString().split('T')[0];
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextWeekStr = nextWeek.toISOString().split('T')[0];

        setTglPinjam(today);
        setTglKembali(nextWeekStr);
        setLoanError('');
        setLoanSuccess('');
        setShowLoanModal(true);
    };

    const handleLoanSubmit = async (e) => {
        e.preventDefault();
        setLoanError('');
        setLoanSuccess('');

        try {
            const response = await fetchAPI('/loans', {
                method: 'POST',
                body: JSON.stringify({ 
                    id_buku: loanBook.id_buku, 
                    tgl_pinjam: tglPinjam, 
                    tgl_kembali: tglKembali 
                })
            });

            setLoanSuccess(response.message);
            toast.success('Permintaan peminjaman berhasil dikirim!');
            
            setTimeout(() => {
                setShowLoanModal(false);
                setLoanBook(null);
                loadBooks(); // refresh stock counts
            }, 2000);
        } catch (err) {
            setLoanError(err.message || 'Gagal mengajukan pinjaman');
            toast.error(err.message || 'Gagal mengajukan pinjaman');
        }
    };

    const getCategoryColor = (cat) => {
        if (!cat) return 'var(--accent)';
        const c = cat.toLowerCase();
        if (c === 'fiksi') return '#00B894';
        if (c === 'edukasi') return '#0984E3';
        if (c === 'sastra') return '#6C5CE7';
        if (c === 'sejarah') return '#E17055';
        if (c === 'sains') return '#FD79A8';
        return 'var(--accent)';
    };

    const getCoverUrl = (cover) => {
        return cover ? `http://localhost:5000/uploads/${cover}` : '';
    };

    const featuredBooks = books.slice(0, 3);

    return (
        <UserLayout 
            pageTitle="Katalog." 
            showSearch={true} 
            searchInput={searchQuery} 
            onSearchChange={setSearchQuery}
            totalBooks={books.length}
        >
            <Toaster position="bottom-right" reverseOrder={false} />

            {/* Category Pills Filter */}
            <div className="category-pills-container">
                <div className="category-pills">
                    <button 
                        className={`pill-btn ${activeCategory === '' ? 'active' : ''}`} 
                        onClick={() => setActiveCategory('')}
                    >
                        <i className="fas fa-th"></i> Semua
                    </button>
                    <button 
                        className={`pill-btn ${activeCategory === 'fiksi' ? 'active' : ''}`} 
                        onClick={() => setActiveCategory('fiksi')}
                    >
                        <i className="fas fa-hat-wizard" style={{ color: '#00B894' }}></i> Fiksi
                    </button>
                    <button 
                        className={`pill-btn ${activeCategory === 'edukasi' ? 'active' : ''}`} 
                        onClick={() => setActiveCategory('edukasi')}
                    >
                        <i className="fas fa-graduation-cap" style={{ color: '#0984E3' }}></i> Edukasi
                    </button>
                    <button 
                        className={`pill-btn ${activeCategory === 'sastra' ? 'active' : ''}`} 
                        onClick={() => setActiveCategory('sastra')}
                    >
                        <i className="fas fa-feather-alt" style={{ color: '#6C5CE7' }}></i> Sastra
                    </button>
                    <button 
                        className={`pill-btn ${activeCategory === 'sejarah' ? 'active' : ''}`} 
                        onClick={() => setActiveCategory('sejarah')}
                    >
                        <i className="fas fa-landmark" style={{ color: '#E17055' }}></i> Sejarah
                    </button>
                    <button 
                        className={`pill-btn ${activeCategory === 'sains' ? 'active' : ''}`} 
                        onClick={() => setActiveCategory('sains')}
                    >
                        <i className="fas fa-flask" style={{ color: '#FD79A8' }}></i> Sains
                    </button>
                </div>
            </div>

            {/* Featured Books */}
            <h2 className="section-title">Buku Pilihan</h2>
            <div className="featured-books" style={{ marginBottom: '2rem' }}>
                {featuredBooks.length === 0 ? (
                    <div style={{ minWidth: '380px', background: 'var(--bg-featured)', borderRadius: 'var(--radius)', padding: '2rem', textAlign: 'center', color: 'var(--text-medium)' }}>
                        <i className="fas fa-book-open fa-2x" style={{ marginBottom: '0.5rem', opacity: 0.5 }}></i>
                        <p>Belum ada buku yang ditambahkan.</p>
                    </div>
                ) : (
                    featuredBooks.map((book) => {
                        const coverUrl = getCoverUrl(book.cover);
                        const saved = isBookSaved(book.id_buku);
                        return (
                            <div className="featured-card" key={`featured-${book.id_buku}`} onClick={() => openBookDetail(book)}>
                                <div style={{ position: 'relative' }}>
                                    {coverUrl ? (
                                        <img className="cover" src={coverUrl} alt={book.judul} />
                                    ) : (
                                        <div className="cover-placeholder"><i className="fas fa-book"></i></div>
                                    )}
                                    <button 
                                        className={`save-btn-mini ${saved ? 'saved' : ''}`} 
                                        onClick={(e) => toggleSaveBook(e, book.id_buku)} 
                                        title={saved ? 'Hapus dari tersimpan' : 'Simpan buku ini'} 
                                        style={{ top: '-0.25rem', left: '-0.25rem' }}
                                    >
                                        <i className={`${saved ? 'fas' : 'far'} fa-bookmark`}></i>
                                    </button>
                                </div>
                                <div className="info">
                                    <h3>{book.judul}</h3>
                                    <p>{book.penulis || 'Penulis tidak diketahui'}</p>
                                    <p className="meta"><i className="fas fa-building"></i> {book.penerbit || '-'} · {book.tahun || '-'}</p>
                                    <p className="meta">{book.stok > 0 ? <><i className="fas fa-check-circle" style={{ color: 'var(--success)' }}></i> {book.stok} Tersedia</> : <><i className="fas fa-times-circle" style={{ color: 'var(--danger)' }}></i> Stok Habis</>}</p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Semua Buku */}
            <div className="content-with-aside" style={{ marginBottom: '2.5rem' }}>
                <div className="content-area">
                    <h2 className="section-title">Semua Buku</h2>
                    <div className="book-grid">
                        {filteredBooks.length === 0 ? (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
                                <i className="fas fa-search fa-2x" style={{ marginBottom: '0.75rem', opacity: 0.3 }}></i>
                                <p>Tidak ada buku yang ditemukan.</p>
                            </div>
                        ) : (
                            filteredBooks.map((book) => {
                                const coverUrl = getCoverUrl(book.cover);
                                const catColor = getCategoryColor(book.kategori);
                                const saved = isBookSaved(book.id_buku);
                                return (
                                    <div className="book-card" key={`book-${book.id_buku}`} onClick={() => openBookDetail(book)}>
                                        <div className="cover-wrapper">
                                            {coverUrl ? (
                                                <img src={coverUrl} alt={book.judul} />
                                            ) : (
                                                <div className="no-cover"><i className="fas fa-book"></i></div>
                                            )}
                                            <span className={`stok-badge ${book.stok > 0 ? '' : 'empty'}`}>
                                                {book.stok > 0 ? `${book.stok} tersedia` : 'Habis'}
                                            </span>
                                            <button 
                                                className={`save-btn-mini ${saved ? 'saved' : ''}`} 
                                                onClick={(e) => toggleSaveBook(e, book.id_buku)} 
                                                title={saved ? 'Hapus dari tersimpan' : 'Simpan buku ini'}
                                            >
                                                <i className={`${saved ? 'fas' : 'far'} fa-bookmark`}></i>
                                            </button>
                                        </div>
                                        <div className="book-title">{book.judul}</div>
                                        <div className="book-author">{book.penulis || 'Tidak diketahui'}</div>
                                        <span className="book-badge" style={{ background: `${catColor}15`, color: catColor, textTransform: 'capitalize' }}>
                                            {book.kategori || 'lainnya'}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* How It Works Section */}
            <section className="catalog-section" id="howItWorks">
                <h2 className="section-title">Cara Meminjam Buku</h2>
                <div className="how-steps-grid">
                    <div className="how-step-card">
                        <div className="step-number">1</div>
                        <div className="step-icon"><i className="fas fa-search"></i></div>
                        <h4>Cari Buku</h4>
                        <p>Temukan buku yang ingin Anda pinjam melalui katalog atau fitur pencarian</p>
                    </div>
                    <div className="how-step-card">
                        <div className="step-number">2</div>
                        <div className="step-icon"><i className="fas fa-mouse-pointer"></i></div>
                        <h4>Pilih & Ajukan</h4>
                        <p>Klik buku untuk melihat detail, lalu ajukan permintaan peminjaman</p>
                    </div>
                    <div className="how-step-card">
                        <div className="step-number">3</div>
                        <div className="step-icon"><i className="fas fa-clock"></i></div>
                        <h4>Tunggu Konfirmasi</h4>
                        <p>Admin perpustakaan akan memproses dan mengkonfirmasi permintaan Anda</p>
                    </div>
                    <div className="how-step-card">
                        <div className="step-number">4</div>
                        <div className="step-icon"><i className="fas fa-book-reader"></i></div>
                        <h4>Ambil & Baca</h4>
                        <p>Datang ke perpustakaan untuk mengambil buku dan nikmati membaca!</p>
                    </div>
                </div>
            </section>

            {/* About Library Section */}
            <section className="catalog-section about-library" id="aboutLibrary">
                <div className="about-grid">
                    <div className="about-text">
                        <h2 className="section-title">Tentang Perpustakaan Kami</h2>
                        <p>PerpusOnline adalah sistem perpustakaan digital yang memudahkan Anda dalam mencari, meminjam, dan mengelola buku secara online. Dengan koleksi yang terus bertambah, kami berkomitmen untuk menyediakan akses literasi yang mudah dan terjangkau bagi semua kalangan.</p>
                        <div className="about-features">
                            <div className="about-feature-item">
                                <i className="fas fa-check-circle"></i>
                                <span>Koleksi buku lengkap dan terkini</span>
                            </div>
                            <div className="about-feature-item">
                                <i className="fas fa-check-circle"></i>
                                <span>Peminjaman mudah secara online</span>
                            </div>
                            <div className="about-feature-item">
                                <i className="fas fa-check-circle"></i>
                                <span>Layanan ramah dan profesional</span>
                            </div>
                            <div className="about-feature-item">
                                <i className="fas fa-check-circle"></i>
                                <span>Ruang baca nyaman ber-AC</span>
                            </div>
                        </div>
                    </div>
                    <div className="about-stats-grid">
                        <div className="about-stat">
                            <i className="fas fa-book-open"></i>
                            <span className="about-stat-num">{books.length}</span>
                            <span className="about-stat-label">Koleksi Buku</span>
                        </div>
                        <div className="about-stat">
                            <i className="fas fa-users"></i>
                            <span className="about-stat-num">500+</span>
                            <span className="about-stat-label">Anggota Aktif</span>
                        </div>
                        <div className="about-stat">
                            <i className="fas fa-handshake"></i>
                            <span className="about-stat-num">1.200+</span>
                            <span className="about-stat-label">Peminjaman</span>
                        </div>
                        <div className="about-stat">
                            <i className="fas fa-star"></i>
                            <span className="about-stat-num">4.8</span>
                            <span className="about-stat-label">Rating</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Book Detail Modal */}
            {selectedBook && (
                <div className="modal active" id="bookDetailModal" onClick={closeDetailModal}>
                    <div className="modal-content book-detail-modal" onClick={(e) => e.stopPropagation()}>
                        <span className="close-modal" onClick={closeDetailModal}>&times;</span>
                        <div className="book-detail-layout">
                            <div className="book-detail-cover" id="detailCoverWrapper">
                                {getCoverUrl(selectedBook.cover) ? (
                                    <img src={getCoverUrl(selectedBook.cover)} alt={selectedBook.judul} />
                                ) : (
                                    <div className="detail-no-cover"><i className="fas fa-book"></i><span>{selectedBook.judul.charAt(0)}</span></div>
                                )}
                            </div>
                            <div className="book-detail-info">
                                <h2 className="book-detail-title" id="detailTitle">{selectedBook.judul}</h2>
                                <p className="book-detail-author" id="detailAuthor">{selectedBook.penulis || 'Penulis tidak diketahui'}</p>
                                <div className="book-detail-meta">
                                    <div className="meta-item">
                                        <i className="fas fa-building"></i>
                                        <span id="detailPublisher">{selectedBook.penerbit || '-'}</span>
                                    </div>
                                    <div className="meta-item">
                                        <i className="fas fa-calendar-alt"></i>
                                        <span id="detailYear">{selectedBook.tahun || '-'}</span>
                                    </div>
                                    <div className={`meta-item ${selectedBook.stok > 0 ? 'in-stock' : 'out-of-stock'}`} id="detailStockItem">
                                        <i className="fas fa-layer-group"></i>
                                        <span id="detailStock">{selectedBook.stok > 0 ? `${selectedBook.stok} Tersedia` : 'Stok Habis'}</span>
                                    </div>
                                </div>
                                
                                {selectedBook.stok <= 0 && (
                                    <div id="availabilityInfo" style={{ display: 'block' }}>
                                        {loadingAvailability ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1rem', background: 'linear-gradient(135deg,rgba(243,156,18,0.08),rgba(243,156,18,0.03))', border: '1px solid rgba(243,156,18,0.2)', borderRadius: '10px', marginTop: '0.75rem' }}>
                                                <i className="fas fa-spinner fa-spin" style={{ color: '#F39C12', fontSize: '0.85rem' }}></i>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-medium)' }}>Mengecek ketersediaan...</span>
                                            </div>
                                        ) : availability && !availability.available && availability.earliest_return ? (() => {
                                            const returnDate = new Date(availability.earliest_return);
                                            const formattedDate = returnDate.toLocaleDateString('id-ID', {
                                                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                                            });
                                            const now = new Date();
                                            now.setHours(0, 0, 0, 0);
                                            const isOverdue = returnDate < now;
                                            
                                            return (
                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.85rem 1rem', background: 'linear-gradient(135deg,rgba(9,132,227,0.08),rgba(9,132,227,0.02))', border: '1px solid rgba(9,132,227,0.18)', borderRadius: '10px', marginTop: '0.75rem' }}>
                                                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(9,132,227,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                        <i className="fas fa-calendar-check" style={{ color: '#0984E3', fontSize: '0.9rem' }}></i>
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '0.2rem' }}>
                                                            {isOverdue ? 'Estimasi Kembali (Terlambat)' : 'Estimasi Tersedia Kembali'}
                                                        </p>
                                                        <p style={{ fontSize: '0.82rem', color: '#0984E3', fontWeight: 600, marginBottom: '0.15rem' }}>
                                                            <i className="far fa-clock" style={{ marginRight: '0.3rem', fontSize: '0.72rem' }}></i>{formattedDate}
                                                        </p>
                                                        <p style={{ fontSize: '0.72rem', color: 'var(--text-light)', lineHeight: 1.4 }}>
                                                            {isOverdue 
                                                                ? 'Buku ini seharusnya sudah dikembalikan. Silakan cek kembali nanti.' 
                                                                : 'Buku sedang dipinjam dan diperkirakan akan tersedia setelah tanggal di atas.'}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })() : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem 1rem', background: 'rgba(231,76,60,0.06)', border: '1px solid rgba(231,76,60,0.15)', borderRadius: '10px', marginTop: '0.75rem' }}>
                                                <i className="fas fa-info-circle" style={{ color: 'var(--danger)', fontSize: '0.85rem' }}></i>
                                                <span style={{ fontSize: '0.78rem', color: 'var(--text-medium)', lineHeight: 1.4 }}>Stok habis. Belum ada informasi kapan buku akan tersedia kembali.</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="book-detail-divider"></div>
                                <div className="book-detail-desc-section">
                                    <h4><i className="fas fa-align-left"></i> Deskripsi</h4>
                                    <p className="book-detail-desc" id="detailDescription">{selectedBook.deskripsi || 'Tidak ada deskripsi untuk buku ini.'}</p>
                                </div>
                                <div className="book-detail-actions-row">
                                    <button 
                                        className="btn btn-primary btn-borrow-detail" 
                                        id="detailBorrowBtn" 
                                        onClick={handleBorrowClickFromDetail}
                                        disabled={selectedBook.stok <= 0}
                                    >
                                        <i className={selectedBook.stok > 0 ? "fas fa-hand-holding-heart" : "fas fa-times-circle"}></i> 
                                        {selectedBook.stok > 0 ? " Pinjam Buku Ini" : " Stok Habis"}
                                    </button>
                                    <button 
                                        className={`btn btn-outline btn-save-detail ${isBookSaved(selectedBook.id_buku) ? 'saved' : ''}`} 
                                        id="detailSaveBtn" 
                                        onClick={(e) => toggleSaveBook(e, selectedBook.id_buku)}
                                    >
                                        <i className={`${isBookSaved(selectedBook.id_buku) ? 'fas' : 'far'} fa-bookmark`}></i> {isBookSaved(selectedBook.id_buku) ? 'Tersimpan' : 'Simpan'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Loan Modal */}
            {showLoanModal && loanBook && (
                <div className="modal active" id="loanModal" onClick={() => setShowLoanModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Pinjam Buku</h3>
                            <span className="close-modal" onClick={() => setShowLoanModal(false)}>&times;</span>
                        </div>
                        <div className="modal-body">
                            <div id="selectedBookInfo" className="selected-book-info">
                                {getCoverUrl(loanBook.cover) ? (
                                    <img src={getCoverUrl(loanBook.cover)} alt={loanBook.judul} />
                                ) : (
                                    <div style={{ width: '60px', height: '85px', background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}><i className="fas fa-book"></i></div>
                                )}
                                <div className="details">
                                    <h4>{loanBook.judul}</h4>
                                    <p>{loanBook.penulis || 'Tidak diketahui'}</p>
                                </div>
                            </div>
                            <form id="loanForm" onSubmit={handleLoanSubmit}>
                                <div className="form-group">
                                    <label htmlFor="tglPinjam">Tanggal Pinjam</label>
                                    <input 
                                        type="date" 
                                        id="tglPinjam" 
                                        className="form-control" 
                                        required 
                                        value={tglPinjam}
                                        onChange={(e) => setTglPinjam(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="tglKembali">Tanggal Kembali</label>
                                    <input 
                                        type="date" 
                                        id="tglKembali" 
                                        className="form-control" 
                                        required 
                                        value={tglKembali}
                                        onChange={(e) => setTglKembali(e.target.value)}
                                    />
                                </div>
                                
                                {loanError && <div className="alert error" style={{ display: 'block' }}>{loanError}</div>}
                                {loanSuccess && <div className="alert success" style={{ display: 'block' }}>{loanSuccess}</div>}

                                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                                    Kirim Permintaan Pinjam <i className="fas fa-paper-plane"></i>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </UserLayout>
    );
};

export default Katalog;
