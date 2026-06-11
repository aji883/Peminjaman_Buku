import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { fetchAPI } from '../../api/api';
import UserLayout from '../../components/layout/UserLayout';
import toast, { Toaster } from 'react-hot-toast';

const CATEGORY_META = {
    fiksi:   { icon: 'fa-hat-wizard',     color: '#00B894', bg: 'rgba(0,184,148,0.1)',   label: 'Fiksi' },
    edukasi: { icon: 'fa-graduation-cap', color: '#0984E3', bg: 'rgba(9,132,227,0.1)',   label: 'Edukasi' },
    sastra:  { icon: 'fa-feather-alt',    color: '#6C5CE7', bg: 'rgba(108,92,231,0.1)',  label: 'Sastra' },
    sejarah: { icon: 'fa-landmark',       color: '#E17055', bg: 'rgba(225,112,85,0.1)',  label: 'Sejarah' },
    sains:   { icon: 'fa-flask',          color: '#FD79A8', bg: 'rgba(253,121,168,0.1)', label: 'Sains' },
    lainnya: { icon: 'fa-book',           color: '#C4956A', bg: 'rgba(196,149,106,0.1)', label: 'Lainnya' }
};

const Koleksi = () => {
    const { user } = useContext(AuthContext);

    // States
    const [books, setBooks] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [savedBookIds, setSavedBookIds] = useState([]);

    // Detail & Loan Modal States
    const [selectedBook, setSelectedBook] = useState(null);
    const [showLoanModal, setShowLoanModal] = useState(false);
    const [loanBook, setLoanBook] = useState(null);
    const [tglPinjam, setTglPinjam] = useState('');
    const [tglKembali, setTglKembali] = useState('');
    const [loanError, setLoanError] = useState('');
    const [loanSuccess, setLoanSuccess] = useState('');

    useEffect(() => {
        loadCollection();
        loadSavedBooks();
    }, []);

    const loadCollection = async () => {
        try {
            const data = await fetchAPI('/books');
            setBooks(data);
        } catch (err) {
            console.error(err);
            toast.error('Gagal memuat koleksi.');
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

    const openBookDetail = (book) => {
        setSelectedBook(book);
    };

    const closeDetailModal = () => {
        setSelectedBook(null);
    };

    const handleBorrowClickFromDetail = () => {
        if (!selectedBook) return;
        if (selectedBook.stok <= 0) {
            toast.error('Maaf, stok buku ini sedang habis.');
            return;
        }

        const bookToBorrow = selectedBook;
        closeDetailModal();

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
                loadCollection(); // Refresh
            }, 2000);
        } catch (err) {
            setLoanError(err.message || 'Gagal mengajukan pinjaman');
            toast.error(err.message || 'Gagal mengajukan pinjaman');
        }
    };

    const getCoverUrl = (cover) => {
        return cover ? `http://localhost:5000/uploads/${cover}` : '';
    };

    // Calculate stats
    const totalBooks = books.length;
    const categoriesList = [...new Set(books.map(b => (b.kategori || 'lainnya').toLowerCase()))];
    const totalCategories = categoriesList.length;
    const availableBooks = books.filter(b => b.stok > 0).length;

    // Filter dynamic categories count
    const getCategoryCount = (cat) => {
        return books.filter(b => (b.kategori || 'lainnya').toLowerCase() === cat).length;
    };

    // Group books by category
    const groupBooks = () => {
        const grouped = {};
        
        // Filter by search query first if search is active
        let targetBooks = books;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            targetBooks = books.filter(b =>
                b.judul.toLowerCase().includes(q) ||
                (b.penulis && b.penulis.toLowerCase().includes(q)) ||
                (b.kategori && b.kategori.toLowerCase().includes(q))
            );
        }

        targetBooks.forEach(b => {
            const cat = (b.kategori || 'lainnya').toLowerCase();
            if (!grouped[cat]) grouped[cat] = [];
            grouped[cat].push(b);
        });

        return grouped;
    };

    const groupedData = groupBooks();

    return (
        <UserLayout 
            pageTitle="Koleksi." 
            showSearch={true} 
            searchInput={searchQuery} 
            onSearchChange={setSearchQuery}
            totalBooks={books.length}
        >
            <Toaster position="bottom-right" reverseOrder={false} />

            {/* Collection Stats Banner */}
            <div className="koleksi-banner" id="koleksiBanner" style={{ display: searchQuery ? 'none' : 'block' }}>
                <div className="koleksi-banner-bg"></div>
                <div className="koleksi-banner-content">
                    <div className="koleksi-banner-text">
                        <h2><i className="fas fa-layer-group"></i> Jelajahi Koleksi Kami</h2>
                        <p>Temukan buku favorit Anda berdasarkan kategori. Koleksi kami terus diperbarui untuk memenuhi kebutuhan literasi Anda.</p>
                    </div>
                    <div className="koleksi-banner-stats">
                        <div className="kb-stat">
                            <span className="kb-stat-num" id="statTotalBooks">{totalBooks}</span>
                            <span className="kb-stat-label">Total Buku</span>
                        </div>
                        <div className="kb-stat">
                            <span className="kb-stat-num" id="statTotalCategories">{totalCategories}</span>
                            <span className="kb-stat-label">Kategori</span>
                        </div>
                        <div className="kb-stat">
                            <span className="kb-stat-num" id="statAvailable">{availableBooks}</span>
                            <span className="kb-stat-label">Tersedia</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Filter Pills */}
            {!searchQuery && (
                <div className="koleksi-filter-bar" id="filterBar">
                    <button 
                        className={`filter-pill ${activeFilter === 'all' ? 'active' : ''}`} 
                        onClick={() => setActiveFilter('all')}
                    >
                        <i className="fas fa-th"></i> Semua
                    </button>
                    {categoriesList.map(cat => {
                        const meta = CATEGORY_META[cat] || CATEGORY_META.lainnya;
                        const count = getCategoryCount(cat);
                        return (
                            <button 
                                key={cat}
                                className={`filter-pill ${activeFilter === cat ? 'active' : ''}`} 
                                onClick={() => setActiveFilter(cat)}
                            >
                                <i className={`fas ${meta.icon}`} style={{ color: meta.color }}></i> {meta.label} <span className="pill-count">{count}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Category Sections */}
            <div id="koleksiContainer">
                {books.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
                        <i className="fas fa-spinner fa-spin fa-2x"></i>
                        <p style={{ marginTop: '0.75rem' }}>Memuat koleksi...</p>
                    </div>
                ) : searchQuery ? (
                    // Render Search Results
                    (() => {
                        // Gather search results
                        const results = [];
                        Object.values(groupedData).forEach(arr => results.push(...arr));

                        if (results.length === 0) {
                            return (
                                <div className="koleksi-empty-state">
                                    <i className="fas fa-search"></i>
                                    <h3>Tidak Ditemukan</h3>
                                    <p>Tidak ada buku yang cocok dengan pencarian "<strong>{searchQuery}</strong>"</p>
                                </div>
                            );
                        }

                        return (
                            <div className="koleksi-section" style={{ animation: 'fadeSlideUp 0.4s ease' }}>
                                <div className="koleksi-section-header">
                                    <div className="koleksi-section-title">
                                        <div className="kst-icon" style={{ background: 'var(--bg-input)', color: 'var(--primary)' }}>
                                            <i className="fas fa-search"></i>
                                        </div>
                                        <div>
                                            <h3>Hasil Pencarian: "{searchQuery}"</h3>
                                            <span>{results.length} buku ditemukan</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="koleksi-book-grid">
                                    {results.map(b => {
                                        const coverUrl = getCoverUrl(b.cover);
                                        const meta = CATEGORY_META[(b.kategori || 'lainnya').toLowerCase()] || CATEGORY_META.lainnya;
                                        const saved = isBookSaved(b.id_buku);
                                        return (
                                            <div className="book-card" key={`search-res-${b.id_buku}`} onClick={() => openBookDetail(b)}>
                                                <div className="cover-wrapper">
                                                    {coverUrl ? <img src={coverUrl} alt={b.judul} /> : <div className="no-cover"><i className="fas fa-book"></i></div>}
                                                    <span className={`stok-badge ${b.stok > 0 ? '' : 'empty'}`}>
                                                        {b.stok > 0 ? `${b.stok} tersedia` : 'Habis'}
                                                    </span>
                                                    <button className={`save-btn-mini ${saved ? 'saved' : ''}`} onClick={(e) => toggleSaveBook(e, b.id_buku)}>
                                                        <i className={`${saved ? 'fas' : 'far'} fa-bookmark`}></i>
                                                    </button>
                                                </div>
                                                <div className="book-title">{b.judul}</div>
                                                <div className="book-author">{b.penulis || 'Tidak diketahui'}</div>
                                                <span className="book-badge" style={{ background: `${meta.color}15`, color: meta.color, textTransform: 'capitalize' }}>{b.kategori || 'lainnya'}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })()
                ) : (
                    // Regular Render
                    (() => {
                        const targetKeys = activeFilter === 'all' ? Object.keys(groupedData) : [activeFilter];
                        
                        // Check if empty
                        const hasItems = targetKeys.some(key => groupedData[key] && groupedData[key].length > 0);
                        if (!hasItems) {
                            return (
                                <div className="koleksi-empty-state">
                                    <i className="fas fa-inbox"></i>
                                    <h3>Koleksi Kosong</h3>
                                    <p>Belum ada buku dalam koleksi perpustakaan.</p>
                                </div>
                            );
                        }

                        return targetKeys.map((cat, index) => {
                            const catBooks = groupedData[cat] || [];
                            if (catBooks.length === 0) return null;

                            const meta = CATEGORY_META[cat] || CATEGORY_META.lainnya;
                            const available = catBooks.filter(b => b.stok > 0).length;
                            const fillPercentage = catBooks.length ? (available / catBooks.length * 100) : 0;

                            return (
                                <div 
                                    className="koleksi-section" 
                                    key={cat}
                                    style={{ animation: `fadeSlideUp 0.5s ease ${index * 80}ms both` }}
                                >
                                    <div className="koleksi-section-header">
                                        <div className="koleksi-section-title">
                                            <div className="kst-icon" style={{ background: meta.bg, color: meta.color }}>
                                                <i className={`fas ${meta.icon}`}></i>
                                            </div>
                                            <div>
                                                <h3>{meta.label}</h3>
                                                <span>{catBooks.length} buku · {available} tersedia</span>
                                            </div>
                                        </div>
                                        <div className="koleksi-section-bar">
                                            <div className="ksb-fill" style={{ width: `${fillPercentage}%`, background: meta.color }}></div>
                                        </div>
                                    </div>
                                    <div className="koleksi-book-grid">
                                        {catBooks.map(b => {
                                            const coverUrl = getCoverUrl(b.cover);
                                            const saved = isBookSaved(b.id_buku);
                                            return (
                                                <div className="book-card" key={`koleksi-card-${b.id_buku}`} onClick={() => openBookDetail(b)}>
                                                    <div className="cover-wrapper">
                                                        {coverUrl ? <img src={coverUrl} alt={b.judul} /> : <div className="no-cover"><i className="fas fa-book"></i></div>}
                                                        <span className={`stok-badge ${b.stok > 0 ? '' : 'empty'}`}>
                                                            {b.stok > 0 ? `${b.stok} tersedia` : 'Habis'}
                                                        </span>
                                                        <button className={`save-btn-mini ${saved ? 'saved' : ''}`} onClick={(e) => toggleSaveBook(e, b.id_buku)}>
                                                            <i className={`${saved ? 'fas' : 'far'} fa-bookmark`}></i>
                                                        </button>
                                                    </div>
                                                    <div className="book-title">{b.judul}</div>
                                                    <div className="book-author">{b.penulis || 'Tidak diketahui'}</div>
                                                    <span className="book-badge" style={{ background: `${meta.color}15`, color: meta.color, textTransform: 'capitalize' }}>{b.kategori || 'lainnya'}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        });
                    })()
                )}
            </div>

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
                                <div className="book-detail-divider"></div>
                                <div className="book-detail-desc-section">
                                    <h4><i className="fas fa-align-left"></i> Deskripsi</h4>
                                    <p className="book-detail-desc" id="detailDescription">{selectedBook.deskripsi || 'Tidak ada deskripsi untuk buku ini.'}</p>
                                </div>
                                <div className="book-detail-actions-row">
                                    <button 
                                        className="btn btn-primary btn-borrow-detail" 
                                        onClick={handleBorrowClickFromDetail}
                                        disabled={selectedBook.stok <= 0}
                                    >
                                        <i className={selectedBook.stok > 0 ? "fas fa-hand-holding-heart" : "fas fa-times-circle"}></i> 
                                        {selectedBook.stok > 0 ? " Pinjam Buku Ini" : " Stok Habis"}
                                    </button>
                                    <button 
                                        className={`btn btn-outline btn-save-detail ${isBookSaved(selectedBook.id_buku) ? 'saved' : ''}`} 
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

export default Koleksi;
