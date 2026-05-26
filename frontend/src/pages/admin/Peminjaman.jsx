import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { fetchAPI } from '../../api/api';
import AdminLayout from '../../components/layout/AdminLayout';
import toast, { Toaster } from 'react-hot-toast';

const Peminjaman = () => {
    const { admin } = useContext(AuthContext);
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadLoans();
    }, []);

    const loadLoans = async () => {
        setLoading(true);
        try {
            const data = await fetchAPI('/loans');
            setLoans(data || []);
        } catch (err) {
            console.error(err);
            toast.error('Gagal memuat data peminjaman.');
        } finally {
            setLoading(false);
        }
    };

    const updateLoanStatus = async (id, status) => {
        if (!window.confirm(`Apakah Anda yakin ingin mengubah status menjadi ${status}?`)) return;

        try {
            const response = await fetchAPI(`/loans/${id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status })
            });

            toast.success(response.message || 'Status peminjaman berhasil diperbarui');
            loadLoans();
        } catch (err) {
            toast.error('Gagal update status: ' + err.message);
        }
    };

    return (
        <AdminLayout pageTitle="Konfirmasi Peminjaman">
            <Toaster position="bottom-right" reverseOrder={false} />

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Buku</th>
                            <th>Tgl Pinjam</th>
                            <th>Tgl Kembali</th>
                            <th>Status</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                                    <i className="fas fa-spinner fa-spin"></i> Memuat data peminjaman...
                                </td>
                            </tr>
                        ) : loans.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                                    Belum ada permintaan peminjaman.
                                </td>
                            </tr>
                        ) : (
                            loans.map(loan => {
                                const tglPinjam = new Date(loan.tgl_pinjam).toLocaleDateString('id-ID');
                                const tglKembali = new Date(loan.tgl_kembali).toLocaleDateString('id-ID');
                                
                                return (
                                    <tr key={loan.id_peminjaman}>
                                        <td><strong>{loan.nama_user}</strong></td>
                                        <td>{loan.judul}</td>
                                        <td>{tglPinjam}</td>
                                        <td>{tglKembali}</td>
                                        <td><span className={`status-badge ${loan.status}`}>{loan.status}</span></td>
                                        <td>
                                            {loan.status === 'diproses' ? (
                                                <div className="actions">
                                                    <button 
                                                        className="btn btn-sm" 
                                                        style={{ background: 'var(--success)', color: 'white' }} 
                                                        onClick={() => updateLoanStatus(loan.id_peminjaman, 'dipinjam')}
                                                    >
                                                        <i className="fas fa-check"></i> Terima
                                                    </button>
                                                    <button 
                                                        className="btn btn-sm btn-danger" 
                                                        onClick={() => updateLoanStatus(loan.id_peminjaman, 'ditolak')}
                                                    >
                                                        <i className="fas fa-times"></i> Tolak
                                                    </button>
                                                </div>
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
};

export default Peminjaman;
