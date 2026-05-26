import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { fetchAPI, fetchFormData } from '../../api/api';
import AdminLayout from '../../components/layout/AdminLayout';
import toast, { Toaster } from 'react-hot-toast';

const KelolaBuku = () => {
    const { admin } = useContext(AuthContext);

    // States
    const [books, setBooks] = useState([]);
    const [filteredBooks, setFilteredBooks] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Stat States
    const [stats, setStats] = useState({
        totalBooks: 0,
        available: 0,
        outOfStock: 0,
        totalStock: 0
    });

    // Book Form Modal States
    const [showBookModal, setShowBookModal] = useState(false);
    const [modalTitle, setModalTitle] = useState('Tambah Buku Baru');
    const [bookId, setBookId] = useState('');
    const [judul, setJudul] = useState('');
    const [penulis, setPenulis] = useState('');
    const [kategori, setKategori] = useState('lainnya');
    const [penerbit, setPenerbit] = useState('');
    const [tahun, setTahun] = useState('');
    const [stok, setStok] = useState(0);
    const [deskripsi, setDeskripsi] = useState('');
    const [coverFile, setCoverFile] = useState(null);
    const [coverPreviewUrl, setCoverPreviewUrl] = useState('');

    // Book Detail View Modal States
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewBook, setViewBook] = useState(null);

    // Bulk Import Modal States
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkText, setBulkText] = useState('');
    const [bulkProcessing, setBulkProcessing] = useState(false);

    useEffect(() => {
        loadBooksTable();
    }, []);

    // Filter and Sort Books
    useEffect(() => {
        let result = [...books];

        // Search filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(b =>
                b.judul.toLowerCase().includes(q) ||
                (b.penulis && b.penulis.toLowerCase().includes(q)) ||
                (b.penerbit && b.penerbit.toLowerCase().includes(q))
            );
        }

        // Sorting
        switch (sortBy) {
            case 'newest':
                result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
            case 'oldest':
                result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                break;
            case 'title-asc':
                result.sort((a, b) => a.judul.localeCompare(b.judul));
                break;
            case 'title-desc':
                result.sort((a, b) => b.judul.localeCompare(a.judul));
                break;
            case 'stock-low':
                result.sort((a, b) => a.stok - b.stok);
                break;
            case 'stock-high':
                result.sort((a, b) => b.stok - a.stok);
                break;
            default:
                break;
        }

        setFilteredBooks(result);
        setCurrentPage(1);
    }, [books, searchQuery, sortBy]);

    const loadBooksTable = async () => {
        try {
            const data = await fetchAPI('/books');
            setBooks(data || []);
            setFilteredBooks(data || []);
            updateStats(data || []);
        } catch (err) {
            console.error(err);
            toast.error('Gagal memuat data buku.');
        }
    };

    const updateStats = (booksList) => {
        setStats({
            totalBooks: booksList.length,
            available: booksList.filter(b => b.stok > 0).length,
            outOfStock: booksList.filter(b => b.stok <= 0).length,
            totalStock: booksList.reduce((sum, b) => sum + (b.stok || 0), 0)
        });
    };

    // Modal Form handlers
    const openAddModal = () => {
        setModalTitle('Tambah Buku Baru');
        setBookId('');
        setJudul('');
        setPenulis('');
        setKategori('lainnya');
        setPenerbit('');
        setTahun('');
        setStok(0);
        setDeskripsi('');
        setCoverFile(null);
        setCoverPreviewUrl('');
        setShowBookModal(true);
    };

    const openEditModal = (book) => {
        setModalTitle('Edit Buku');
        setBookId(book.id_buku);
        setJudul(book.judul);
        setPenulis(book.penulis || '');
        setKategori(book.kategori || 'lainnya');
        setPenerbit(book.penerbit || '');
        setTahun(book.tahun || '');
        setStok(book.stok || 0);
        setDeskripsi(book.deskripsi || '');
        setCoverFile(null);
        setCoverPreviewUrl(book.cover ? `http://localhost:5000/uploads/${book.cover}` : '');
        setShowBookModal(true);
    };

    const handleCoverChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCoverFile(file);
            const reader = new FileReader();
            reader.onload = (uploadEvent) => {
                setCoverPreviewUrl(uploadEvent.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleBookSubmit = async (e) => {
        e.preventDefault();
        
        const formData = new FormData();
        formData.append('judul', judul);
        formData.append('penulis', penulis);
        formData.append('penerbit', penerbit);
        formData.append('kategori', kategori);
        formData.append('tahun', tahun);
        formData.append('stok', stok);
        formData.append('deskripsi', deskripsi);

        if (coverFile) {
            formData.append('cover', coverFile);
        }

        try {
            if (bookId) {
                await fetchFormData(`/books/${bookId}`, formData, 'PUT');
                toast.success('Buku berhasil diperbarui');
            } else {
                await fetchFormData('/books', formData, 'POST');
                toast.success('Buku berhasil ditambahkan');
            }
            setShowBookModal(false);
            loadBooksTable();
        } catch (err) {
            toast.error(err.message || 'Gagal menyimpan buku');
        }
    };

    const deleteBook = async (id) => {
        if (window.confirm('Apakah Anda yakin ingin menghapus buku ini?')) {
            try {
                await fetchAPI(`/books/${id}`, { method: 'DELETE' });
                toast.success('Buku berhasil dihapus');
                loadBooksTable();
            } catch (err) {
                toast.error(err.message || 'Gagal menghapus buku');
            }
        }
    };

    // View Modal handlers
    const openViewModal = (book) => {
        setViewBook(book);
        setShowViewModal(true);
    };

    const handleEditFromView = () => {
        const book = viewBook;
        setShowViewModal(false);
        openEditModal(book);
    };

    const handleDeleteFromView = () => {
        const id = viewBook.id_buku;
        setShowViewModal(false);
        deleteBook(id);
    };

    // Bulk Import Logic
    const handleBulkSubmit = async () => {
        const rawData = bulkText.trim();
        if (!rawData) {
            toast.error('Silakan paste data terlebih dahulu');
            return;
        }

        const rows = rawData.split('\n');
        const booksArray = [];

        for (let i = 0; i < rows.length; i++) {
            if (!rows[i].trim()) continue;
            
            const cols = rows[i].split('\t');
            const bookTitle = cols[0] ? cols[0].trim() : '';
            if (!bookTitle) continue;
            
            booksArray.push({
                judul: bookTitle,
                penulis: cols[1] ? cols[1].trim() : null,
                penerbit: cols[2] ? cols[2].trim() : null,
                tahun: cols[3] ? parseInt(cols[3].trim()) : null,
                stok: cols[4] ? parseInt(cols[4].trim()) : 0,
                kategori: cols[5] ? cols[5].trim().toLowerCase() : 'lainnya',
                deskripsi: cols[6] ? cols[6].trim() : null
            });
        }

        if (booksArray.length === 0) {
            toast.error('Tidak ada baris data valid yang ditemukan');
            return;
        }

        setBulkProcessing(true);
        try {
            const response = await fetchAPI('/books/bulk', {
                method: 'POST',
                body: JSON.stringify(booksArray)
            });
            toast.success(response.message || 'Buku berhasil ditambahkan');
            setShowBulkModal(false);
            setBulkText('');
            loadBooksTable();
        } catch (err) {
            toast.error(err.message || 'Gagal memproses bulk data');
        } finally {
            setBulkProcessing(false);
        }
    };

    // Pagination Calculation
    const totalPages = Math.ceil(filteredBooks.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedBooks = filteredBooks.slice(startIndex, startIndex + itemsPerPage);

    const getCoverUrl = (cover) => {
        return cover ? `http://localhost:5000/uploads/${cover}` : '';
    };

    return (
        <AdminLayout 
            pageTitle="Kelola Buku"
            topBarActions={
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div className="search-box" style={{ width: '280px' }}>
                        <i className="fas fa-search"></i>
                        <input 
                            type="text" 
                            placeholder="Cari judul atau penulis..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button onClick={() => { setShowBulkModal(true); setBulkText(''); }} className="btn btn-outline" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                        <i className="fas fa-file-import"></i> Tambah Massal
                    </button>
                    <button onClick={openAddModal} className="btn btn-primary">
                        <i className="fas fa-plus"></i> Tambah Buku
                    </button>
                </div>
            }
        >
            <Toaster position="bottom-right" reverseOrder={false} />

            {/* Stats Cards */}
            <div className="book-stats-row" id="bookStatsRow">
                <div className="book-stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(196,149,106,0.15)', color: 'var(--accent)' }}>
                        <i className="fas fa-book-open"></i>
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.totalBooks}</span>
                        <span className="stat-label">Total Buku</span>
                    </div>
                </div>
                <div className="book-stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(39,174,96,0.12)', color: 'var(--success)' }}>
                        <i className="fas fa-check-circle"></i>
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.available}</span>
                        <span className="stat-label">Tersedia</span>
                    </div>
                </div>
                <div className="book-stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(231,76,60,0.1)', color: 'var(--danger)' }}>
                        <i className="fas fa-times-circle"></i>
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.outOfStock}</span>
                        <span className="stat-label">Stok Habis</span>
                    </div>
                </div>
                <div className="book-stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(108,92,231,0.1)', color: 'var(--badge-mystery)' }}>
                        <i className="fas fa-layer-group"></i>
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.totalStock}</span>
                        <span className="stat-label">Total Stok</span>
                    </div>
                </div>
            </div>

            {/* Books Table */}
            <div className="table-container" id="booksTableContainer">
                <div className="table-toolbar">
                    <span className="table-info" id="tableInfo">
                        {filteredBooks.length === 0 
                            ? 'Tidak ada buku untuk ditampilkan'
                            : `Menampilkan ${startIndex + 1}-${Math.min(startIndex + itemsPerPage, filteredBooks.length)} dari ${filteredBooks.length} buku`}
                    </span>
                    <div className="table-actions">
                        <select 
                            id="sortSelect" 
                            className="table-sort-select" 
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="newest">Terbaru</option>
                            <option value="oldest">Terlama</option>
                            <option value="title-asc">Judul A-Z</option>
                            <option value="title-desc">Judul Z-A</option>
                            <option value="stock-low">Stok Terendah</option>
                            <option value="stock-high">Stok Tertinggi</option>
                        </select>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: '65px' }}>Cover</th>
                            <th>Judul Buku</th>
                            <th>Penulis</th>
                            <th>Penerbit</th>
                            <th style={{ width: '70px' }}>Tahun</th>
                            <th style={{ width: '80px' }}>Stok</th>
                            <th style={{ width: '100px' }}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="booksTableBody">
                        {paginatedBooks.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
                                    Belum ada data buku.
                                </td>
                            </tr>
                        ) : (
                            paginatedBooks.map(book => {
                                const coverUrl = getCoverUrl(book.cover);
                                return (
                                    <tr key={book.id_buku} onClick={() => openViewModal(book)} style={{ cursor: 'pointer' }}>
                                        <td>
                                            {coverUrl ? (
                                                <img src={coverUrl} alt="Cover" style={{ width: '45px', height: '65px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                                            ) : (
                                                <div style={{ width: '45px', height: '65px', background: 'linear-gradient(135deg, #D4C5B2, #A8C5C8)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-book" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}></i></div>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{book.judul}</span>
                                                {book.kategori && <span style={{ fontSize: '0.65rem', background: 'rgba(196,149,106,0.15)', color: 'var(--accent)', padding: '0.15rem 0.4rem', borderRadius: '4px', textTransform: 'capitalize' }}>{book.kategori}</span>}
                                            </div>
                                            {book.deskripsi && <p style={{ fontSize: '0.72rem', color: 'var(--text-light)', marginTop: '0.2rem', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.deskripsi}</p>}
                                        </td>
                                        <td>{book.penulis || '-'}</td>
                                        <td>{book.penerbit || '-'}</td>
                                        <td>{book.tahun || '-'}</td>
                                        <td><span className={`stok-badge ${book.stok > 0 ? '' : 'empty'}`}>{book.stok}</span></td>
                                        <td>
                                            <div className="actions" onClick={(e) => e.stopPropagation()}>
                                                <button className="btn btn-outline btn-sm" onClick={() => openEditModal(book)} title="Edit">
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button className="btn btn-danger btn-sm" onClick={() => deleteBook(book.id_buku)} title="Hapus">
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
                {filteredBooks.length > itemsPerPage && (
                    <div className="pagination" id="paginationControls">
                        <button className="pagination-btn" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                            <i className="fas fa-chevron-left"></i>
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button 
                                key={page} 
                                className={`pagination-btn ${page === currentPage ? 'active' : ''}`}
                                onClick={() => setCurrentPage(page)}
                            >
                                {page}
                            </button>
                        ))}
                        <button className="pagination-btn" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    </div>
                )}
            </div>

            {/* Book Form Modal */}
            {showBookModal && (
                <div className="modal active" id="bookModal" onClick={() => setShowBookModal(false)}>
                    <div className="modal-content" style={{ maxWidth: '560px' }} onClick={(e) => e.stopPropagation()}>
                        <button className="close-modal" onClick={() => setShowBookModal(false)}>&times;</button>
                        <h3 id="modalTitle" style={{ marginBottom: '1.5rem' }}>{modalTitle}</h3>
                        
                        <form id="bookForm" enctype="multipart/form-data" onSubmit={handleBookSubmit}>
                            <div className="form-group" style={{ textAlign: 'center' }}>
                                <label>Sampul Buku</label>
                                <div 
                                    id="coverPreview" 
                                    style={{ width: '130px', height: '185px', margin: '0.5rem auto', borderRadius: '12px', border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.3s ease', background: 'var(--bg-input)' }}
                                    onClick={() => document.getElementById('coverInput').click()}
                                >
                                    {coverPreviewUrl ? (
                                        <img id="coverImg" src={coverPreviewUrl} alt="Cover Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div id="coverPlaceholder" style={{ textAlign: 'center', color: 'var(--text-light)' }}>
                                            <i className="fas fa-image fa-2x"></i>
                                            <p style={{ fontSize: '0.7rem', marginTop: '0.5rem' }}>Klik untuk upload</p>
                                        </div>
                                    )}
                                </div>
                                <input 
                                    type="file" 
                                    id="coverInput" 
                                    accept="image/*" 
                                    style={{ display: 'none' }} 
                                    onChange={handleCoverChange}
                                />
                            </div>

                            <div className="form-group">
                                <label>Judul Buku *</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    required 
                                    placeholder="Masukkan judul buku"
                                    value={judul}
                                    onChange={(e) => setJudul(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>Penulis</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    placeholder="Nama penulis"
                                    value={penulis}
                                    onChange={(e) => setPenulis(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>Kategori</label>
                                <select 
                                    className="form-control"
                                    value={kategori}
                                    onChange={(e) => setKategori(e.target.value)}
                                >
                                    <option value="fiksi">Fiksi</option>
                                    <option value="edukasi">Edukasi</option>
                                    <option value="sastra">Sastra</option>
                                    <option value="sejarah">Sejarah</option>
                                    <option value="sains">Sains</option>
                                    <option value="lainnya">Lainnya</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Penerbit</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    placeholder="Nama penerbit"
                                    value={penerbit}
                                    onChange={(e) => setPenerbit(e.target.value)}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Tahun Terbit</label>
                                    <input 
                                        type="number" 
                                        className="form-control" 
                                        min="1900" 
                                        max="2100" 
                                        placeholder="2024"
                                        value={tahun}
                                        onChange={(e) => setTahun(e.target.value)}
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Stok</label>
                                    <input 
                                        type="number" 
                                        className="form-control" 
                                        min="0"
                                        value={stok}
                                        onChange={(e) => setStok(parseInt(e.target.value) || 0)}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Deskripsi / Tentang Buku</label>
                                <textarea 
                                    className="form-control" 
                                    rows="3" 
                                    placeholder="Tulis sinopsis atau deskripsi buku..."
                                    value={deskripsi}
                                    onChange={(e) => setDeskripsi(e.target.value)}
                                ></textarea>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                                <i className="fas fa-save"></i> Simpan Buku
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Book Detail View Modal */}
            {showViewModal && viewBook && (
                <div className="modal active" id="bookViewModal" onClick={() => setShowViewModal(false)}>
                    <div className="modal-content book-detail-modal" onClick={(e) => e.stopPropagation()}>
                        <span className="close-modal" onClick={() => setShowViewModal(false)}>&times;</span>
                        <div className="book-detail-layout">
                            <div className="book-detail-cover" id="viewCoverWrapper">
                                {getCoverUrl(viewBook.cover) ? (
                                    <img src={getCoverUrl(viewBook.cover)} alt={viewBook.judul} />
                                ) : (
                                    <div className="detail-no-cover"><i className="fas fa-book"></i><span>{viewBook.judul.charAt(0)}</span></div>
                                )}
                            </div>
                            <div className="book-detail-info">
                                <h2 className="book-detail-title" id="viewTitle">{viewBook.judul}</h2>
                                <p className="book-detail-author" id="viewAuthor">{viewBook.penulis || 'Penulis tidak diketahui'}</p>
                                <div className="book-detail-meta">
                                    <div className="meta-item">
                                        <i className="fas fa-building"></i>
                                        <span id="viewPublisher">{viewBook.penerbit || '-'}</span>
                                    </div>
                                    <div className="meta-item">
                                        <i className="fas fa-calendar-alt"></i>
                                        <span id="viewYear">{viewBook.tahun || '-'}</span>
                                    </div>
                                    <div className="meta-item">
                                        <i className="fas fa-tags"></i>
                                        <span id="viewKategori" style={{ textTransform: 'capitalize' }}>{viewBook.kategori || 'Lainnya'}</span>
                                    </div>
                                    <div className={`meta-item ${viewBook.stok > 0 ? 'in-stock' : 'out-of-stock'}`} id="viewStockItem">
                                        <i className="fas fa-layer-group"></i>
                                        <span id="viewStock">{viewBook.stok > 0 ? `${viewBook.stok} Tersedia` : 'Stok Habis'}</span>
                                    </div>
                                </div>
                                <div className="book-detail-divider"></div>
                                <div className="book-detail-desc-section">
                                    <h4><i className="fas fa-align-left"></i> Deskripsi</h4>
                                    <p className="book-detail-desc" id="viewDescription">{viewBook.deskripsi || 'Tidak ada deskripsi.'}</p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto' }}>
                                    <button className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={handleEditFromView}>
                                        <i className="fas fa-edit"></i> Edit
                                    </button>
                                    <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={handleDeleteFromView}>
                                        <i className="fas fa-trash"></i> Hapus
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Import Modal */}
            {showBulkModal && (
                <div className="modal active" id="bulkImportModal" onClick={() => setShowBulkModal(false)}>
                    <div className="modal-content" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
                        <button className="close-modal" onClick={() => setShowBulkModal(false)}>&times;</button>
                        <h3 style={{ marginBottom: '1rem' }}>Tambah Buku Massal (Paste dari Excel)</h3>
                        
                        <div style={{ background: 'var(--bg-featured)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--text-medium)' }}>
                            <p><strong>Cara Penggunaan:</strong></p>
                            <ol style={{ marginTop: '0.5rem', marginLeft: '1.5rem', lineHeight: '1.5' }}>
                                <li>Siapkan data buku Anda di Microsoft Excel atau Google Sheets.</li>
                                <li>Pastikan urutan kolom adalah: <strong>Judul | Penulis | Penerbit | Tahun | Stok | Kategori | Deskripsi</strong>.</li>
                                <li>Copy (Ctrl+C) baris data dari Excel (tanpa baris header).</li>
                                <li>Paste (Ctrl+V) ke dalam kotak teks di bawah ini.</li>
                            </ol>
                            <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}><em>Catatan: Judul wajib diisi. Kategori yang valid: fiksi, edukasi, sastra, sejarah, sains, lainnya.</em></p>
                        </div>

                        <div className="form-group">
                            <textarea 
                                id="bulkDataInput" 
                                className="form-control" 
                                rows="10" 
                                placeholder="Paste data Anda di sini...&#10;Contoh:&#10;Buku A&#09;Andi&#09;Gramedia&#09;2023&#09;5&#09;fiksi&#09;Deskripsi buku A" 
                                style={{ fontFamily: 'monospace', whiteSpace: 'pre' }}
                                value={bulkText}
                                onChange={(e) => setBulkText(e.target.value)}
                            ></textarea>
                        </div>
                        
                        <button 
                            onClick={handleBulkSubmit} 
                            className="btn btn-primary" 
                            style={{ width: '100%', justifyContent: 'center' }} 
                            id="bulkSubmitBtn"
                            disabled={bulkProcessing}
                        >
                            {bulkProcessing ? (
                                <><i className="fas fa-spinner fa-spin"></i> Memproses...</>
                            ) : (
                                <><i className="fas fa-upload"></i> Proses Data</>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default KelolaBuku;
