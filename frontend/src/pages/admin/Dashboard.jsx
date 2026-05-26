import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { fetchAPI } from '../../api/api';
import AdminLayout from '../../components/layout/AdminLayout';
import toast, { Toaster } from 'react-hot-toast';

const Dashboard = () => {
    const { admin } = useContext(AuthContext);

    // States for dashboard stats
    const [stats, setStats] = useState({
        totalBooks: 0,
        totalUsers: 0,
        totalLoans: 0,
        pendingLoans: 0
    });

    // Lists
    const [recentBooks, setRecentBooks] = useState([]);
    const [recentLoans, setRecentLoans] = useState([]);
    
    // User Saldo Table States
    const [allUsersSaldo, setAllUsersSaldo] = useState([]);
    const [filteredUsersSaldo, setFilteredUsersSaldo] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentSaldoPage, setCurrentSaldoPage] = useState(1);
    const saldoItemsPerPage = 5;

    // Topup Modal States
    const [showTopupModal, setShowTopupModal] = useState(false);
    const [topupUser, setTopupUser] = useState(null);
    const [topupAmount, setTopupAmount] = useState('');
    const [topupDesc, setTopupDesc] = useState('Top up tunai via kasir');

    const [currentDateStr, setCurrentDateStr] = useState('');

    useEffect(() => {
        // Set date string
        const now = new Date();
        setCurrentDateStr(now.toLocaleDateString('id-ID', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        }));

        loadDashboardData();
    }, []);

    // Filter user saldo on query change
    useEffect(() => {
        if (!searchQuery) {
            setFilteredUsersSaldo(allUsersSaldo);
        } else {
            const query = searchQuery.toLowerCase();
            setFilteredUsersSaldo(
                allUsersSaldo.filter(u => {
                    const memberId = 'po-member-' + String(u.id_user).padStart(4, '0');
                    return u.nama.toLowerCase().includes(query) || 
                           (u.email && u.email.toLowerCase().includes(query)) ||
                           memberId.includes(query);
                })
            );
        }
        setCurrentSaldoPage(1);
    }, [searchQuery, allUsersSaldo]);

    const loadDashboardData = async () => {
        try {
            // Fetch books
            const books = await fetchAPI('/books');
            setRecentBooks(books.slice(0, 5));

            let totalLoansCount = 0;
            let pendingLoansCount = 0;
            
            // Fetch loans
            try {
                const loans = await fetchAPI('/loans');
                totalLoansCount = loans.length;
                pendingLoansCount = loans.filter(l => l.status === 'diproses').length;
                setRecentLoans(loans.slice(0, 5));
            } catch (err) {
                console.warn('Could not load loans for dashboard:', err);
            }

            // Fetch total users count
            let totalUsersCount = 0;
            try {
                const users = await fetchAPI('/auth/users');
                totalUsersCount = users.length;
            } catch (err) {
                console.warn('Could not load users for dashboard:', err);
            }

            setStats({
                totalBooks: books.length,
                totalUsers: totalUsersCount,
                totalLoans: totalLoansCount,
                pendingLoans: pendingLoansCount
            });

            // Fetch users with saldo
            try {
                const usersWithSaldo = await fetchAPI('/saldo/admin/users');
                setAllUsersSaldo(usersWithSaldo || []);
                setFilteredUsersSaldo(usersWithSaldo || []);
            } catch (err) {
                console.warn('Could not load users with saldo:', err);
            }

        } catch (error) {
            console.error('Dashboard load error:', error);
            toast.error('Gagal memuat data dashboard.');
        }
    };

    const handleTopupClick = (u) => {
        setTopupUser(u);
        setTopupAmount('');
        setTopupDesc('Top up tunai via kasir');
        setShowTopupModal(true);
    };

    const handleTopupSubmit = async (e) => {
        e.preventDefault();
        if (!topupUser || !topupAmount || topupAmount < 1000) {
            toast.error('Jumlah top up minimal Rp 1.000');
            return;
        }

        try {
            const res = await fetchAPI('/saldo/topup', {
                method: 'POST',
                body: JSON.stringify({ 
                    id_user: topupUser.id_user, 
                    jumlah: topupAmount, 
                    keterangan: topupDesc 
                })
            });

            toast.success(res.message || 'Top up berhasil!');
            setShowTopupModal(false);
            setTopupUser(null);
            loadDashboardData(); // Refresh table and stats
        } catch (err) {
            toast.error('Gagal melakukan top up: ' + err.message);
        }
    };

    const formatRupiah = (amount) => {
        return 'Rp ' + new Intl.NumberFormat('id-ID').format(amount || 0);
    };

    // User Saldo Pagination
    const totalSaldoPages = Math.ceil(filteredUsersSaldo.length / saldoItemsPerPage) || 1;
    const paginatedUsersSaldo = filteredUsersSaldo.slice(
        (currentSaldoPage - 1) * saldoItemsPerPage,
        currentSaldoPage * saldoItemsPerPage
    );

    return (
        <AdminLayout 
            pageTitle="Dashboard" 
            topBarActions={<span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>{currentDateStr}</span>}
        >
            <Toaster position="bottom-right" reverseOrder={false} />

            {/* Dashboard Stats */}
            <div className="dashboard-stats-grid" id="dashStatsGrid">
                <div className="dash-stat-card accent">
                    <div className="dash-stat-icon"><i className="fas fa-book-open"></i></div>
                    <div className="dash-stat-body">
                        <span className="dash-stat-value">{stats.totalBooks}</span>
                        <span className="dash-stat-label">Total Buku</span>
                    </div>
                </div>
                <div className="dash-stat-card success">
                    <div className="dash-stat-icon"><i className="fas fa-users"></i></div>
                    <div className="dash-stat-body">
                        <span className="dash-stat-value">{stats.totalUsers}</span>
                        <span className="dash-stat-label">Anggota</span>
                    </div>
                </div>
                <div className="dash-stat-card info">
                    <div className="dash-stat-icon"><i className="fas fa-hand-holding"></i></div>
                    <div className="dash-stat-body">
                        <span className="dash-stat-value">{stats.totalLoans}</span>
                        <span className="dash-stat-label">Peminjaman</span>
                    </div>
                </div>
                <div className="dash-stat-card warning">
                    <div className="dash-stat-icon"><i className="fas fa-clock"></i></div>
                    <div className="dash-stat-body">
                        <span className="dash-stat-value">{stats.pendingLoans}</span>
                        <span className="dash-stat-label">Menunggu Konfirmasi</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions & Recent */}
            <div className="dashboard-content-grid">
                {/* Quick Actions */}
                <div className="dash-card">
                    <h3 className="dash-card-title"><i className="fas fa-bolt"></i> Aksi Cepat</h3>
                    <div className="quick-actions-grid">
                        <Link to="/admin/kelola-buku" className="quick-action-item">
                            <div className="qa-icon" style={{ background: 'rgba(196,149,106,0.15)', color: 'var(--accent)' }}><i className="fas fa-plus"></i></div>
                            <span>Tambah Buku</span>
                        </Link>
                        <Link to="/admin/peminjaman" className="quick-action-item">
                            <div className="qa-icon" style={{ background: 'rgba(39,174,96,0.1)', color: 'var(--success)' }}><i className="fas fa-check-circle"></i></div>
                            <span>Konfirmasi Pinjam</span>
                        </Link>
                        <Link to="/admin/pengembalian" className="quick-action-item">
                            <div className="qa-icon" style={{ background: 'rgba(108,92,231,0.1)', color: 'var(--badge-mystery)' }}><i className="fas fa-undo"></i></div>
                            <span>Pengembalian</span>
                        </Link>
                        <Link to="/admin/laporan" className="quick-action-item">
                            <div className="qa-icon" style={{ background: 'rgba(9,132,227,0.1)', color: 'var(--badge-education)' }}><i className="fas fa-chart-bar"></i></div>
                            <span>Lihat Laporan</span>
                        </Link>
                    </div>
                </div>

                {/* Recent Loans */}
                <div className="dash-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 className="dash-card-title" style={{ marginBottom: 0 }}><i className="fas fa-history"></i> Peminjaman Terbaru</h3>
                        <Link to="/admin/peminjaman" style={{ fontSize: '0.8rem', color: 'var(--accent)', textDecoration: 'none' }}>Lihat Semua &rarr;</Link>
                    </div>
                    <div id="recentLoansContainer">
                        {recentLoans.length === 0 ? (
                            <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '1rem', fontSize: '0.85rem' }}>
                                Belum ada data peminjaman.
                            </p>
                        ) : (
                            <div className="recent-loans-list">
                                {recentLoans.map(loan => {
                                    const date = new Date(loan.tgl_pinjam).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
                                    return (
                                        <div className="recent-loan-item" key={loan.id_peminjaman}>
                                            <div className="loan-user-avatar">{(loan.nama_user || 'U').charAt(0).toUpperCase()}</div>
                                            <div className="loan-info">
                                                <span className="loan-user-name">{loan.nama_user || 'User'}</span>
                                                <span className="loan-book-title">{loan.judul || 'Buku'}</span>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <span className={`status-badge ${loan.status}`}>{loan.status}</span>
                                                <span className="loan-date">{date}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Books */}
            <div className="dash-card" style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 className="dash-card-title" style={{ marginBottom: 0 }}><i className="fas fa-book"></i> Buku Terbaru</h3>
                    <Link to="/admin/kelola-buku" style={{ fontSize: '0.8rem', color: 'var(--accent)', textDecoration: 'none' }}>Kelola Buku &rarr;</Link>
                </div>
                <div className="recent-books-grid" id="recentBooksGrid">
                    {recentBooks.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '1.5rem', fontSize: '0.85rem', gridColumn: '1 / -1' }}>
                            Belum ada buku.
                        </p>
                    ) : (
                        recentBooks.map(book => {
                            const coverUrl = book.cover ? `http://localhost:5000/uploads/${book.cover}` : '';
                            return (
                                <div className="recent-book-card" key={book.id_buku}>
                                    <div className="recent-book-cover">
                                        {coverUrl ? (
                                            <img src={coverUrl} alt={book.judul} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#D4C5B2,#A8C5C8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="fas fa-book" style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.5)' }}></i></div>
                                        )}
                                    </div>
                                    <p className="recent-book-title">{book.judul}</p>
                                    <p className="recent-book-author">{book.penulis || '-'}</p>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Kelola Saldo Anggota */}
            <div className="dash-card" style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <h3 className="dash-card-title" style={{ marginBottom: 0 }}><i className="fas fa-wallet"></i> Kelola Saldo Kartu Anggota</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <div className="search-box" style={{ position: 'relative' }}>
                            <i className="fas fa-search" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }}></i>
                            <input 
                                type="text" 
                                placeholder="Cari nama, email, ID..." 
                                className="form-control" 
                                style={{ paddingLeft: '30px', width: '250px', borderRadius: '20px', border: '1px solid var(--border)' }}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <div className="table-container" style={{ marginTop: '1rem' }}>
                    <table>
                        <thead>
                            <tr>
                                <th>Nama Anggota</th>
                                <th>Email</th>
                                <th>No. HP</th>
                                <th>Saldo Kartu</th>
                                <th style={{ textAlign: 'center' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="adminUsersSaldoTable">
                            {paginatedUsersSaldo.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-light)' }}>
                                        Tidak ada data anggota.
                                    </td>
                                </tr>
                            ) : (
                                paginatedUsersSaldo.map(u => {
                                    const memberId = 'PO-MEMBER-' + String(u.id_user).padStart(4, '0');
                                    return (
                                        <tr key={u.id_user}>
                                            <td>
                                                <strong>{u.nama}</strong>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-light)', fontFamily: 'monospace', letterSpacing: '0.5px', marginTop: '2px' }}>{memberId}</div>
                                            </td>
                                            <td>{u.email || '-'}</td>
                                            <td>{u.no_hp || '-'}</td>
                                            <td style={{ fontWeight: 700, color: '#27AE60' }}>{formatRupiah(u.saldo)}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button 
                                                    className="btn btn-sm" 
                                                    style={{ background: 'var(--accent)', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)' }}
                                                    onClick={() => handleTopupClick(u)}
                                                >
                                                    <i className="fas fa-wallet"></i> Top Up
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                {filteredUsersSaldo.length > saldoItemsPerPage && (
                    <div id="saldoPagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                        <button 
                            className="btn btn-outline btn-sm" 
                            onClick={() => setCurrentSaldoPage(prev => Math.max(1, prev - 1))} 
                            disabled={currentSaldoPage === 1}
                        >
                            <i className="fas fa-chevron-left"></i>
                        </button>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-medium)' }}>
                            Halaman {currentSaldoPage} dari {totalSaldoPages}
                        </span>
                        <button 
                            className="btn btn-outline btn-sm" 
                            onClick={() => setCurrentSaldoPage(prev => Math.min(totalSaldoPages, prev + 1))} 
                            disabled={currentSaldoPage === totalSaldoPages}
                        >
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    </div>
                )}
            </div>

            {/* Top Up Modal */}
            {showTopupModal && topupUser && (
                <div className="modal active" id="topupModal" onClick={() => setShowTopupModal(false)}>
                    <div className="modal-content" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3><i className="fas fa-wallet" style={{ color: 'var(--accent)' }}></i> Top Up Saldo Anggota</h3>
                            <span className="close-modal" onClick={() => setShowTopupModal(false)}>&times;</span>
                        </div>
                        <div className="modal-body">
                            <form id="topupForm" onSubmit={handleTopupSubmit}>
                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-medium)', marginBottom: '0.35rem', display: 'block', textAlign: 'left' }}>Nama Anggota</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        readOnly 
                                        style={{ background: '#f5f6fa', border: '1px solid var(--border)', width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)' }}
                                        value={topupUser.nama}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '1rem' }}>
                                    <label htmlFor="topupAmount" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-medium)', marginBottom: '0.35rem', display: 'block', textAlign: 'left' }}>Jumlah Top Up (Rp)</label>
                                    <input 
                                        type="number" 
                                        id="topupAmount" 
                                        className="form-control" 
                                        placeholder="Contoh: 10000" 
                                        min="1000" 
                                        required 
                                        style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-main)' }}
                                        value={topupAmount}
                                        onChange={(e) => setTopupAmount(e.target.value)}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label htmlFor="topupDesc" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-medium)', marginBottom: '0.35rem', display: 'block', textAlign: 'left' }}>Keterangan (Opsional)</label>
                                    <input 
                                        type="text" 
                                        id="topupDesc" 
                                        className="form-control" 
                                        placeholder="Contoh: Top up tunai via kasir" 
                                        style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-main)' }}
                                        value={topupDesc}
                                        onChange={(e) => setTopupDesc(e.target.value)}
                                    />
                                </div>
                                <button type="submit" className="btn" style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <i className="fas fa-check"></i> Konfirmasi Top Up
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default Dashboard;
