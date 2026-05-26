import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { fetchAPI } from '../../api/api';
import AdminLayout from '../../components/layout/AdminLayout';
import toast, { Toaster } from 'react-hot-toast';

const Pengembalian = () => {
    const { admin } = useContext(AuthContext);

    // Tab State
    const [activeTab, setActiveTab] = useState('proses'); // 'proses' or 'riwayat'

    // Data States
    const [activeLoans, setActiveLoans] = useState([]);
    const [returnsHistory, setReturnsHistory] = useState([]);
    const [loadingActive, setLoadingActive] = useState(true);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Form States
    const [selectedLoanId, setSelectedLoanId] = useState('');
    const [tglKembaliSeharusnya, setTglKembaliSeharusnya] = useState('');
    const [tglKembaliReal, setTglKembaliReal] = useState('');

    // Fine Preview States
    const [showFinePreview, setShowFinePreview] = useState(false);
    const [fineAmount, setFineAmount] = useState(0);
    const [fineDays, setFineDays] = useState(0);

    useEffect(() => {
        loadActiveLoans();
    }, []);

    useEffect(() => {
        if (activeTab === 'riwayat') {
            loadReturnsHistory();
        }
    }, [activeTab]);

    // Recalculate fine when loan or actual return date changes
    useEffect(() => {
        if (!selectedLoanId || !tglKembaliReal) {
            setShowFinePreview(false);
            return;
        }

        const loan = activeLoans.find(l => String(l.id_peminjaman) === String(selectedLoanId));
        if (!loan) return;

        const due = new Date(loan.tgl_kembali);
        due.setHours(0,0,0,0);
        const real = new Date(tglKembaliReal);
        real.setHours(0,0,0,0);

        const diffMs = real - due;
        const diffDays = diffMs > 0 ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : 0;
        const denda = diffDays * 1000;

        setFineAmount(denda);
        setFineDays(diffDays);
        setShowFinePreview(true);
    }, [selectedLoanId, tglKembaliReal, activeLoans]);

    const loadActiveLoans = async () => {
        setLoadingActive(true);
        try {
            const data = await fetchAPI('/returns/active-loans');
            setActiveLoans(data || []);
        } catch (err) {
            console.error(err);
            toast.error('Gagal memuat data buku dipinjam.');
        } finally {
            setLoadingActive(false);
        }
    };

    const loadReturnsHistory = async () => {
        setLoadingHistory(true);
        try {
            const data = await fetchAPI('/returns');
            setReturnsHistory(data || []);
        } catch (err) {
            console.error(err);
            toast.error('Gagal memuat riwayat pengembalian.');
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleLoanSelectChange = (loanId) => {
        setSelectedLoanId(loanId);
        if (!loanId) {
            setTglKembaliSeharusnya('');
            setTglKembaliReal('');
            return;
        }

        const loan = activeLoans.find(l => String(l.id_peminjaman) === String(loanId));
        if (loan) {
            setTglKembaliSeharusnya(formatDate(loan.tgl_kembali));
            setTglKembaliReal(new Date().toISOString().split('T')[0]);
        }
    };

    const handleProsesClick = (loan) => {
        setSelectedLoanId(loan.id_peminjaman);
        setTglKembaliSeharusnya(formatDate(loan.tgl_kembali));
        setTglKembaliReal(new Date().toISOString().split('T')[0]);
        
        // Scroll to top of the layout content to focus form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmitReturn = async (e) => {
        e.preventDefault();

        if (!selectedLoanId || !tglKembaliReal) {
            toast.error('Pilih peminjaman dan tanggal kembali.');
            return;
        }

        if (!window.confirm('Konfirmasi pengembalian buku ini?')) return;

        try {
            const res = await fetchAPI('/returns', {
                method: 'POST',
                body: JSON.stringify({ 
                    id_peminjaman: parseInt(selectedLoanId), 
                    tgl_kembali_real: tglKembaliReal 
                })
            });

            toast.success(`Pengembalian berhasil! Denda: ${formatRupiah(res.denda || 0)}`);
            
            // Reset Form
            setSelectedLoanId('');
            setTglKembaliSeharusnya('');
            setTglKembaliReal('');
            setShowFinePreview(false);

            loadActiveLoans();
        } catch (err) {
            toast.error('Gagal: ' + err.message);
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('id-ID');
    };

    const formatRupiah = (amount) => {
        return 'Rp ' + new Intl.NumberFormat('id-ID').format(amount || 0);
    };

    return (
        <AdminLayout pageTitle="Manajemen Pengembalian">
            <Toaster position="bottom-right" reverseOrder={false} />

            {/* TABS */}
            <div className="tabs">
                <button 
                    className={`tab-btn ${activeTab === 'proses' ? 'active' : ''}`}
                    onClick={() => setActiveTab('proses')}
                >
                    <i className="fas fa-undo"></i> Proses Pengembalian
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'riwayat' ? 'active' : ''}`}
                    onClick={() => setActiveTab('riwayat')}
                >
                    <i className="fas fa-history"></i> Riwayat Pengembalian
                </button>
            </div>

            {/* TAB: PROSES PENGEMBALIAN */}
            {activeTab === 'proses' && (
                <div id="tab-proses" className="tab-content active">
                    {/* Form return */}
                    <div className="table-container" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1.2rem', fontSize: '1rem' }}>
                            <i className="fas fa-clipboard-check" style={{ color: 'var(--primary)', marginRight: '0.4rem' }}></i>
                            Form Konfirmasi Pengembalian
                        </h3>
                        <form onSubmit={handleSubmitReturn}>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <div className="form-group" style={{ flex: 1, minWidth: '220px' }}>
                                    <label>Pilih Peminjaman (Buku Dipinjam)</label>
                                    <select 
                                        id="selectLoan" 
                                        className="form-control" 
                                        value={selectedLoanId}
                                        onChange={(e) => handleLoanSelectChange(e.target.value)}
                                    >
                                        <option value="">-- Pilih Peminjaman --</option>
                                        {activeLoans.map(l => (
                                            <option key={l.id_peminjaman} value={l.id_peminjaman}>
                                                #{l.id_peminjaman} — {l.nama_user} — {l.judul}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                                    <label>Tanggal Kembali Seharusnya</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        disabled 
                                        placeholder="-" 
                                        value={tglKembaliSeharusnya}
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                                    <label>Tanggal Kembali Aktual *</label>
                                    <input 
                                        type="date" 
                                        className="form-control" 
                                        value={tglKembaliReal}
                                        onChange={(e) => setTglKembaliReal(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Fine preview */}
                            {showFinePreview && (
                                <div className="fine-preview-box" id="finePreview" style={{ display: 'flex' }}>
                                    <span className="fine-icon">💰</span>
                                    <div>
                                        <div className="fine-label">Estimasi Denda</div>
                                        <div className={`fine-amount ${fineAmount === 0 ? 'zero' : ''}`} id="fineAmount">
                                            {formatRupiah(fineAmount)}
                                        </div>
                                    </div>
                                    <div style={{ marginLeft: '1rem', fontSize: '0.8rem', color: 'var(--text-light)' }} id="fineNote">
                                        {fineAmount === 0 ? '✅ Tidak terlambat, tidak ada denda.' : `⚠️ Terlambat ${fineDays} hari × Rp 1.000`}
                                    </div>
                                </div>
                            )}

                            <button 
                                type="submit" 
                                className="btn btn-primary" 
                                style={{ marginTop: '1.2rem' }} 
                                disabled={!selectedLoanId || !tglKembaliReal}
                            >
                                <i className="fas fa-check-circle"></i> Konfirmasi Pengembalian
                            </button>
                        </form>
                    </div>

                    {/* Active loans table */}
                    <div className="table-container">
                        <h3 style={{ marginBottom: '1rem', fontSize: '0.95rem', color: 'var(--text-light)' }}>
                            Daftar Buku Sedang Dipinjam
                        </h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>Peminjam</th>
                                    <th>Judul Buku</th>
                                    <th>Tgl Pinjam</th>
                                    <th>Jatuh Tempo</th>
                                    <th>Sisa Hari</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingActive ? (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                                            <i className="fas fa-spinner fa-spin"></i> Memuat data...
                                        </td>
                                    </tr>
                                ) : activeLoans.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                                            Tidak ada buku yang sedang dipinjam.
                                        </td>
                                    </tr>
                                ) : (
                                    activeLoans.map(l => {
                                        const today = new Date();
                                        today.setHours(0,0,0,0);
                                        const due = new Date(l.tgl_kembali);
                                        due.setHours(0,0,0,0);
                                        const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
                                        
                                        let sisaHtml;
                                        if (diffDays < 0) {
                                            sisaHtml = <span style={{ color: '#c0600a', fontWeight: 700 }}><i className="fas fa-exclamation-triangle"></i> Terlambat {Math.abs(diffDays)} hari</span>;
                                        } else if (diffDays === 0) {
                                            sisaHtml = <span style={{ color: '#b45309', fontWeight: 600 }}>Hari ini</span>;
                                        } else {
                                            sisaHtml = <span style={{ color: '#1a7a4a' }}>{diffDays} hari lagi</span>;
                                        }

                                        return (
                                            <tr key={l.id_peminjaman}>
                                                <td><strong>{l.nama_user}</strong></td>
                                                <td>{l.judul}</td>
                                                <td>{formatDate(l.tgl_pinjam)}</td>
                                                <td>{formatDate(l.tgl_kembali)}</td>
                                                <td>{sisaHtml}</td>
                                                <td>
                                                    <button 
                                                        className="btn btn-sm" 
                                                        style={{ background: 'var(--primary)', color: '#fff' }}
                                                        onClick={() => handleProsesClick(l)}
                                                    >
                                                        <i className="fas fa-undo"></i> Proses
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB: RIWAYAT */}
            {activeTab === 'riwayat' && (
                <div id="tab-riwayat" className="tab-content active">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Peminjam</th>
                                    <th>Judul Buku</th>
                                    <th>Tgl Pinjam</th>
                                    <th>Jatuh Tempo</th>
                                    <th>Tgl Kembali Aktual</th>
                                    <th>Denda</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingHistory ? (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                                            <i className="fas fa-spinner fa-spin"></i> Memuat data...
                                        </td>
                                    </tr>
                                ) : returnsHistory.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                                            Belum ada riwayat pengembalian.
                                        </td>
                                    </tr>
                                ) : (
                                    returnsHistory.map(r => {
                                        let dendaBadge = <span className="denda-badge denda-none">Tidak Ada</span>;
                                        if (r.denda > 0) {
                                            if (r.denda_dibayar === 1) {
                                                dendaBadge = <span className="denda-badge denda-none" style={{ background: '#e6f9f0', color: '#1a7a4a' }}><i className="fas fa-check-circle"></i> {formatRupiah(r.denda)} (Lunas)</span>;
                                            } else {
                                                dendaBadge = <span className="denda-badge denda-ada" style={{ background: '#fff3e0', color: '#c0600a' }}><i className="fas fa-exclamation-circle"></i> {formatRupiah(r.denda)} (Belum Dibayar)</span>;
                                            }
                                        }

                                        return (
                                            <tr key={r.id_pengembalian}>
                                                <td><strong>{r.nama_user}</strong></td>
                                                <td>{r.judul}</td>
                                                <td>{formatDate(r.tgl_pinjam)}</td>
                                                <td>{formatDate(r.tgl_kembali)}</td>
                                                <td>{formatDate(r.tgl_kembali_real)}</td>
                                                <td>{dendaBadge}</td>
                                                <td><span className="status-badge selesai">{r.status}</span></td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default Pengembalian;
