import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../../api/api';
import AdminLayout from '../../components/layout/AdminLayout';
import toast, { Toaster } from 'react-hot-toast';

const KelolaUser = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modal states
    const [showLoansModal, setShowLoansModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userLoans, setUserLoans] = useState([]);
    const [loadingLoans, setLoadingLoans] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await fetchAPI('/auth/users');
            setUsers(data);
        } catch (err) {
            toast.error('Gagal memuat data pengguna');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (user) => {
        if (!window.confirm(`PERINGATAN: Apakah Anda yakin ingin menghapus akun ${user.nama}?\n\nSemua riwayat peminjaman, saldo, dan data terkait akan dihapus permanen dari sistem.`)) {
            return;
        }

        try {
            await fetchAPI(`/auth/users/${user.id_user}`, {
                method: 'DELETE'
            });
            toast.success('Pengguna berhasil dihapus');
            loadUsers();
        } catch (err) {
            toast.error(err.message || 'Gagal menghapus pengguna');
        }
    };

    const handleViewLoans = async (user) => {
        setSelectedUser(user);
        setShowLoansModal(true);
        setLoadingLoans(true);
        setUserLoans([]);

        try {
            const loans = await fetchAPI(`/auth/users/${user.id_user}/loans`);
            setUserLoans(loans);
        } catch (err) {
            toast.error('Gagal memuat riwayat peminjaman');
            setShowLoansModal(false);
        } finally {
            setLoadingLoans(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    };

    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(number || 0);
    };

    return (
        <AdminLayout pageTitle="Kelola Pengguna">
            <Toaster position="bottom-right" />
            
            <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 className="card-title">Daftar Pengguna</h2>
                    <span className="badge" style={{ background: 'var(--primary)', color: 'white' }}>{users.length} Total</span>
                </div>
                
                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>
                        <i className="fas fa-spinner fa-spin fa-2x" style={{ color: 'var(--primary)' }}></i>
                        <p style={{ marginTop: '1rem', color: 'var(--text-light)' }}>Memuat data pengguna...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="empty-state">
                        <i className="fas fa-users" style={{ fontSize: '3rem', color: 'var(--border)', marginBottom: '1rem' }}></i>
                        <p>Belum ada pengguna terdaftar.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Nama Pengguna</th>
                                    <th>Email</th>
                                    <th>Saldo Dompet</th>
                                    <th>Terdaftar Pada</th>
                                    <th style={{ textAlign: 'center' }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((u) => (
                                    <tr key={u.id_user}>
                                        <td><strong>#{u.id_user}</strong></td>
                                        <td>{u.nama}</td>
                                        <td>{u.email}</td>
                                        <td style={{ fontWeight: 'bold', color: u.saldo > 0 ? 'var(--success)' : 'inherit' }}>
                                            {formatRupiah(u.saldo)}
                                        </td>
                                        <td>{formatDate(u.created_at)}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                <button 
                                                    className="btn btn-outline btn-sm" 
                                                    onClick={() => handleViewLoans(u)}
                                                    title="Lihat Peminjaman"
                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem' }}
                                                >
                                                    <i className="fas fa-book-reader"></i> Pinjaman
                                                </button>
                                                <button 
                                                    className="btn btn-danger btn-sm" 
                                                    onClick={() => handleDeleteUser(u)}
                                                    title="Hapus Akun"
                                                    style={{ padding: '0.4rem 0.6rem' }}
                                                >
                                                    <i className="fas fa-trash-alt"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Loans Modal */}
            {showLoansModal && (
                <div className="modal active" onClick={() => setShowLoansModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                        <div className="modal-header">
                            <h3>Riwayat Peminjaman - {selectedUser?.nama}</h3>
                            <span className="close-modal" onClick={() => setShowLoansModal(false)}>&times;</span>
                        </div>
                        <div className="modal-body">
                            {loadingLoans ? (
                                <div style={{ padding: '2rem', textAlign: 'center' }}>
                                    <i className="fas fa-spinner fa-spin fa-2x" style={{ color: 'var(--primary)' }}></i>
                                    <p style={{ marginTop: '1rem', color: 'var(--text-light)' }}>Memuat riwayat peminjaman...</p>
                                </div>
                            ) : userLoans.length === 0 ? (
                                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-medium)', background: 'var(--bg-main)', borderRadius: '8px' }}>
                                    <i className="fas fa-info-circle fa-2x" style={{ marginBottom: '1rem', color: 'var(--accent)' }}></i>
                                    <p>Pengguna ini belum pernah meminjam buku.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                    {userLoans.map(loan => (
                                        <div key={loan.id_peminjaman} style={{ display: 'flex', gap: '1rem', background: 'var(--bg-main)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                            <div style={{ width: '50px', height: '70px', flexShrink: 0, borderRadius: '4px', overflow: 'hidden', background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {loan.cover ? (
                                                    <img src={`http://localhost:5000/uploads/${loan.cover}`} alt="Cover" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <i className="fas fa-book" style={{ color: '#888' }}></i>
                                                )}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ margin: '0 0 0.3rem 0', color: 'var(--text-dark)' }}>{loan.judul}</h4>
                                                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-medium)', marginBottom: '0.5rem' }}>
                                                    <span><i className="far fa-calendar-alt"></i> Pinjam: {formatDate(loan.tgl_pinjam)}</span>
                                                    <span><i className="far fa-calendar-check"></i> Kembali: {formatDate(loan.tgl_kembali)}</span>
                                                </div>
                                                <div>
                                                    <span className={`badge ${
                                                        loan.status === 'dipinjam' ? 'badge-primary' : 
                                                        loan.status === 'dikembalikan' ? 'badge-success' : 
                                                        loan.status === 'ditolak' ? 'badge-danger' : 'badge-warning'
                                                    }`} style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px' }}>
                                                        {loan.status.toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default KelolaUser;
