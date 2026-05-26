import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { fetchAPI } from '../../api/api';
import AdminLayout from '../../components/layout/AdminLayout';
import toast, { Toaster } from 'react-hot-toast';

const Laporan = () => {
    const { admin } = useContext(AuthContext);

    // Raw Data States
    const [allLoans, setAllLoans] = useState([]);
    const [allReturns, setAllReturns] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter States
    const [statusFilter, setStatusFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Computed Filtered Data
    const [filteredData, setFilteredData] = useState([]);

    // Stats State
    const [stats, setStats] = useState({
        total: 0,
        diproses: 0,
        dipinjam: 0,
        dikembalikan: 0,
        ditolak: 0,
        totalDenda: 0
    });

    useEffect(() => {
        loadReportData();
    }, []);

    useEffect(() => {
        // Apply filtering logic
        const returnMap = {};
        allReturns.forEach(r => {
            returnMap[r.id_peminjaman] = r;
        });

        const filtered = allLoans.filter(l => {
            const matchStatus = !statusFilter || l.status === statusFilter;
            const matchSearch = !searchQuery || 
                (l.nama_user || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                (l.judul || '').toLowerCase().includes(searchQuery.toLowerCase());
            
            // Format dates
            const loanDate = l.tgl_pinjam.split('T')[0];
            const matchStart = !startDate || loanDate >= startDate;
            const matchEnd = !endDate || loanDate <= endDate;

            return matchStatus && matchSearch && matchStart && matchEnd;
        });

        setFilteredData(filtered);
    }, [allLoans, allReturns, statusFilter, searchQuery, startDate, endDate]);

    const loadReportData = async () => {
        setLoading(true);
        try {
            const [loansData, returnsData] = await Promise.all([
                fetchAPI('/loans'),
                fetchAPI('/returns')
            ]);

            setAllLoans(loansData || []);
            setAllReturns(returnsData || []);

            // Compute statistics
            const total = loansData.length;
            const diproses = loansData.filter(l => l.status === 'diproses').length;
            const dipinjam = loansData.filter(l => l.status === 'dipinjam').length;
            const dikembalikan = loansData.filter(l => l.status === 'dikembalikan').length;
            const ditolak = loansData.filter(l => l.status === 'ditolak').length;
            const totalDenda = (returnsData || []).reduce((sum, r) => sum + (r.denda || 0), 0);

            setStats({
                total,
                diproses,
                dipinjam,
                dikembalikan,
                ditolak,
                totalDenda
            });

        } catch (err) {
            console.error(err);
            toast.error('Gagal memuat data laporan.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetFilters = () => {
        setStatusFilter('');
        setSearchQuery('');
        setStartDate('');
        setEndDate('');
    };

    const formatRupiah = (amount) => {
        return 'Rp ' + new Intl.NumberFormat('id-ID').format(amount || 0);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('id-ID');
    };

    // Return map helper
    const returnMap = {};
    allReturns.forEach(r => {
        returnMap[r.id_peminjaman] = r;
    });

    return (
        <AdminLayout 
            pageTitle="Laporan Peminjaman"
            topBarActions={
                <button onClick={() => window.print()} className="btn" style={{ background: 'var(--bg-input, #f0f0f0)', color: 'var(--text, #333)', border: '1px solid var(--border)' }}>
                    <i className="fas fa-print"></i> Cetak
                </button>
            }
        >
            <Toaster position="bottom-right" reverseOrder={false} />

            {/* Summary cards */}
            <div className="stats-row" id="statsRow">
                <div className="stat-card">
                    <div className="stat-icon">📋</div>
                    <div className="stat-num" id="statTotal">{stats.total}</div>
                    <div className="stat-lbl">Total Peminjaman</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-num" id="statDiproses">{stats.diproses}</div>
                    <div className="stat-lbl">Menunggu Konfirmasi</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📖</div>
                    <div className="stat-num" id="statDipinjam">{stats.dipinjam}</div>
                    <div className="stat-lbl">Sedang Dipinjam</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-num" id="statKembali">{stats.dikembalikan}</div>
                    <div className="stat-lbl">Sudah Dikembalikan</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">❌</div>
                    <div className="stat-num" id="statDitolak">{stats.ditolak}</div>
                    <div className="stat-lbl">Ditolak</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-num" id="statDenda" style={{ fontSize: '1.2rem' }}>{formatRupiah(stats.totalDenda)}</div>
                    <div className="stat-lbl">Total Denda</div>
                </div>
            </div>

            {/* Filter */}
            <div className="filter-row no-print" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
                <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '160px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block', color: 'var(--text-light)' }}>Filter Status</label>
                    <select 
                        id="filterStatus" 
                        className="form-control"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">Semua Status</option>
                        <option value="diproses">Diproses</option>
                        <option value="dipinjam">Dipinjam</option>
                        <option value="dikembalikan">Dikembalikan</option>
                        <option value="ditolak">Ditolak</option>
                    </select>
                </div>
                <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '160px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block', color: 'var(--text-light)' }}>Tanggal Awal</label>
                    <input 
                        type="date" 
                        id="startDate" 
                        className="form-control"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>
                <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '160px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block', color: 'var(--text-light)' }}>Tanggal Akhir</label>
                    <input 
                        type="date" 
                        id="endDate" 
                        className="form-control"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
                <div className="form-group" style={{ margin: 0, flex: 1, minWidth: '160px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block', color: 'var(--text-light)' }}>Cari Nama / Judul</label>
                    <input 
                        type="text" 
                        id="searchInput" 
                        className="form-control" 
                        placeholder="Cari..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="form-group" style={{ flex: 'none', margin: 0 }}>
                    <button onClick={handleResetFilters} className="btn" style={{ background: 'var(--bg-input, #f0f0f0)', color: 'var(--text, #333)', border: '1px solid var(--border)' }}>
                        <i className="fas fa-times"></i> Reset
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="table-container">
                <table id="reportTable">
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}>#</th>
                            <th>Peminjam</th>
                            <th>Judul Buku</th>
                            <th>Tgl Pinjam</th>
                            <th>Jatuh Tempo</th>
                            <th>Tgl Kembali Aktual</th>
                            <th>Status</th>
                            <th>Denda</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                                    <i className="fas fa-spinner fa-spin"></i> Memuat data laporan...
                                </td>
                            </tr>
                        ) : filteredData.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                                    Tidak ada data.
                                </td>
                            </tr>
                        ) : (
                            filteredData.map((l, i) => {
                                const ret = returnMap[l.id_peminjaman];
                                const tglReal = ret ? formatDate(ret.tgl_kembali_real) : '-';
                                const denda = ret ? ret.denda : null;
                                const dendaHtml = ret ? (
                                    denda > 0 ? (
                                        <span className="denda-badge denda-ada">{formatRupiah(denda)}</span>
                                    ) : (
                                        <span className="denda-badge denda-none">Tidak Ada</span>
                                    )
                                ) : (
                                    '-'
                                );

                                return (
                                    <tr key={l.id_peminjaman}>
                                        <td style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>{i + 1}</td>
                                        <td><strong>{l.nama_user}</strong></td>
                                        <td>{l.judul}</td>
                                        <td>{formatDate(l.tgl_pinjam)}</td>
                                        <td>{formatDate(l.tgl_kembali)}</td>
                                        <td>{tglReal}</td>
                                        <td><span className={`status-badge ${l.status}`}>{l.status}</span></td>
                                        <td>{dendaHtml}</td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
            <p id="rowCount" style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-light)' }}>
                {filteredData.length > 0 ? `Menampilkan ${filteredData.length} dari ${allLoans.length} data.` : ''}
            </p>
        </AdminLayout>
    );
};

export default Laporan;
