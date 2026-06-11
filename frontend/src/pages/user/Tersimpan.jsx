import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { fetchAPI } from '../../api/api';
import UserLayout from '../../components/layout/UserLayout';
import toast, { Toaster } from 'react-hot-toast';

const Tersimpan = () => {
    const { user } = useContext(AuthContext);

    // States
    const [allBooks, setAllBooks] = useState([]);
    const [savedBooks, setSavedBooks] = useState([]);
    const [filteredSavedBooks, setFilteredSavedBooks] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
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
        loadData();
    }, []);

    useEffect(() => {
        // Filter based on search query
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            setFilteredSavedBooks(
                savedBooks.filter(b =>
                    b.judul.toLowerCase().includes(q) ||
                    (b.penulis && b.penulis.toLowerCase().includes(q))
                )
            );
        } else {
            setFilteredSavedBooks(savedBooks);
        }
    }, [searchQuery, savedBooks]);


    const loadData = async () => {
        try {
            const booksData = await fetchAPI('/books');
            setAllBooks(booksData);

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

            // Sync if local books exist
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
                localStorage.setItem(storageKey, '[]');
                // Refetch after sync
                const updatedSavedData = await fetchAPI('/books/saved');
                setSavedBookIds(onlineIds);
                setSavedBooks(updatedSavedData);
                setFilteredSavedBooks(updatedSavedData);
            } else {
                setSavedBookIds(onlineIds);
                setSavedBooks(savedData);
                setFilteredSavedBooks(savedData);
            }
        } catch (err) {
            console.error(err);
            toast.error('Gagal memuat buku tersimpan.');
        }
    };

    const removeSaved = async (bookId) => {
        bookId = Number(bookId);
        try {
            await fetchAPI(`/books/saved/${bookId}`, {
                method: 'DELETE'
            });
            const updatedIds = savedBookIds.filter(id => id !== bookId);
            setSavedBookIds(updatedIds);
            
            const updatedSaved = savedBooks.filter(b => Number(b.id_buku) !== bookId);
            setSavedBooks(updatedSaved);
            setFilteredSavedBooks(updatedSaved);
            toast('Buku dihapus dari tersimpan', { icon: 'ℹ️' });
        } catch (err) {
            console.error(err);
            toast.error(err.message || 'Gagal menghapus buku dari tersimpan');
        }
    };

    const clearAllSaved = async () => {
        if (!window.confirm('Hapus semua buku dari daftar tersimpan?')) return;
        
        try {
            await Promise.all(savedBookIds.map(bookId => 
                fetchAPI(`/books/saved/${bookId}`, { method: 'DELETE' })
            ));
            
            setSavedBookIds([]);
            setSavedBooks([]);
            setFilteredSavedBooks([]);
            toast('Semua buku dihapus dari tersimpan', { icon: 'ℹ️' });
        } catch (err) {
            console.error(err);
            toast.error('Beberapa buku gagal dihapus dari tersimpan');
            loadData();
        }
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

    const handleQuickBorrow = (e, book) => {
        e.stopPropagation();
        setLoanBook(book);
        
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
                loadData(); // Refresh stock
            }, 2000);
        } catch (err) {
            setLoanError(err.message || 'Gagal mengajukan pinjaman');
            toast.error(err.message || 'Gagal mengajukan pinjaman');
        }
    };

    const getCoverUrl = (cover) => {
        return cover ? `http://localhost:5000/uploads/${cover}` : '';
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

    // Calculate stats
    const savedCount = savedBooks.length;
    const availableCount = savedBooks.filter(b => b.stok > 0).length;
    const categoriesCount = [...new Set(savedBooks.map(b => (b.kategori || 'lainnya').toLowerCase()))].length;

    return (
        <UserLayout 
            pageTitle="Tersimpan." 
            showSearch={true} 
            searchInput={searchQuery} 
            onSearchChange={setSearchQuery}
            totalBooks={allBooks.length}
        >
            <Toaster position="bottom-right" reverseOrder={false} />

            {/* Saved Stats Row */}
            <div className="tersimpan-stats-row" id="savedStatsRow">
                <div className="ts-stat-card">
                    <div className="ts-stat-icon" style={{ background: 'rgba(196,149,106,0.12)', color: 'var(--accent)' }}>
                        <i className="fas fa-bookmark"></i>
                    </div>
                    <div className="ts-stat-body">
                        <span className="ts-stat-value" id="savedCount">{savedCount}</span>
                        <span className="ts-stat-label">Buku Tersimpan</span>
                    </div>
                </div>
                <div className="ts-stat-card">
                    <div className="ts-stat-icon" style={{ background: 'rgba(39,174,96,0.1)', color: 'var(--success)' }}>
                        <i className="fas fa-check-circle"></i>
                    </div>
                    <div className="ts-stat-body">
                        <span className="ts-stat-value" id="savedAvailable">{availableCount}</span>
                        <span className="ts-stat-label">Siap Dipinjam</span>
                    </div>
                </div>
                <div className="ts-stat-card">
                    <div className="ts-stat-icon" style={{ background: 'rgba(108,92,231,0.1)', color: '#6C5CE7' }}>
                        <i className="fas fa-tags"></i>
                    </div>
                    <div className="ts-stat-body">
                        <span className="ts-stat-value" id="savedCategories">{categoriesCount}</span>
                        <span className="ts-stat-label">Kategori</span>
                    </div>
                </div>
            </div>

            {/* Sort/View controls */}
            <div className="tersimpan-toolbar" id="savedToolbar">
                <div className="tt-left">
                    <span className="tt-label"><i className="fas fa-bookmark" style={{ color: 'var(--accent)' }}></i> Daftar Buku Tersimpan</span>
                </div>
                <div className="tt-right">
                    <button 
                        className={`tt-view-btn ${viewMode === 'grid' ? 'active' : ''}`} 
                        onClick={() => setViewMode('grid')} 
                        title="Tampilan Grid"
                    >
                        <i className="fas fa-th-large"></i>
                    </button>
                    <button 
                        className={`tt-view-btn ${viewMode === 'list' ? 'active' : ''}`} 
                        onClick={() => setViewMode('list')} 
                        title="Tampilan List"
                    >
                        <i className="fas fa-list"></i>
                    </button>
                    {savedBooks.length > 0 && (
                        <button className="btn btn-outline btn-sm" onClick={clearAllSaved} id="clearAllBtn">
                            <i className="fas fa-trash-alt"></i> Hapus Semua
                        </button>
                    )}
                </div>
            </div>

            {/* Saved Books Container */}
            <div id="savedContainer">
                {filteredSavedBooks.length === 0 ? (
                    <div className="tersimpan-empty">
                        <div className="te-icon">
                            <i className="fas fa-bookmark"></i>
                        </div>
                        <h3>Belum Ada Buku Tersimpan</h3>
                        <p>Simpan buku favorit Anda dari halaman Katalog atau Koleksi agar mudah ditemukan nanti.</p>
                        <a href="/katalog" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                            <i className="fas fa-book-open"></i> Jelajahi Katalog
                        </a>
                    </div>
                ) : viewMode === 'list' ? (
                    <div className="tersimpan-list">
                        {filteredSavedBooks.map((book, index) => {
                            const coverUrl = getCoverUrl(book.cover);
                            const catColor = getCategoryColor(book.kategori);
                            return (
                                <div 
                                    className="saved-list-item" 
                                    key={book.id_buku}
                                    style={{ animation: `fadeSlideUp 0.4s ease ${index * 50}ms both` }}
                                    onClick={() => openBookDetail(book)}
                                >
                                    <div className="sli-cover">
                                        {coverUrl ? <img src={coverUrl} alt={book.judul} /> : <div className="list-no-cover"><i className="fas fa-book"></i></div>}
                                    </div>
                                    <div className="sli-info">
                                        <h4>{book.judul}</h4>
                                        <p className="sli-author"><i className="fas fa-user-edit"></i> {book.penulis || 'Tidak diketahui'}</p>
                                        <div className="sli-meta">
                                            <span className="book-badge" style={{ background: `${catColor}15`, color: catColor }}>{book.kategori || 'lainnya'}</span>
                                            <span className={`sli-stock ${book.stok > 0 ? '' : 'empty'}`}>
                                                <i className={`fas ${book.stok > 0 ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                                                {book.stok > 0 ? `${book.stok} tersedia` : 'Habis'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="sli-actions">
                                        {book.stok > 0 && (
                                            <button 
                                                className="btn btn-primary btn-sm" 
                                                onClick={(e) => handleQuickBorrow(e, book)}
                                            >
                                                <i className="fas fa-hand-holding-heart"></i> Pinjam
                                            </button>
                                        )}
                                        <button 
                                            className="btn btn-danger btn-sm" 
                                            onClick={(e) => { e.stopPropagation(); removeSaved(book.id_buku); }} 
                                            title="Hapus"
                                        >
                                            <i className="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="book-grid">
                        {filteredSavedBooks.map((book, index) => {
                            const coverUrl = getCoverUrl(book.cover);
                            const catColor = getCategoryColor(book.kategori);
                            return (
                                <div 
                                    className="book-card" 
                                    key={book.id_buku}
                                    style={{ animation: `fadeSlideUp 0.4s ease ${index * 60}ms both` }}
                                    onClick={() => openBookDetail(book)}
                                >
                                    <div className="cover-wrapper">
                                        {coverUrl ? <img src={coverUrl} alt={book.judul} /> : <div className="no-cover"><i className="fas fa-book"></i></div>}
                                        <span className={`stok-badge ${book.stok > 0 ? '' : 'empty'}`}>
                                            {book.stok > 0 ? `${book.stok} tersedia` : 'Habis'}
                                        </span>
                                        <button 
                                            className="save-btn-mini saved" 
                                            onClick={(e) => { e.stopPropagation(); removeSaved(book.id_buku); }} 
                                            title="Hapus dari tersimpan"
                                        >
                                            <i className="fas fa-bookmark"></i>
                                        </button>
                                    </div>
                                    <div className="book-title">{book.judul}</div>
                                    <div className="book-author">{book.penulis || 'Tidak diketahui'}</div>
                                    <span className="book-badge" style={{ background: `${catColor}15`, color: catColor, textTransform: 'capitalize' }}>{book.kategori || 'lainnya'}</span>
                                </div>
                            );
                        })}
                    </div>
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
                                        className="btn btn-outline btn-save-detail saved" 
                                        onClick={() => removeSaved(selectedBook.id_buku)}
                                    >
                                        <i className="fas fa-bookmark"></i> Tersimpan
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

export default Tersimpan;
