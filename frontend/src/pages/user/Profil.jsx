import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { fetchAPI } from '../../api/api';
import UserLayout from '../../components/layout/UserLayout';
import toast, { Toaster } from 'react-hot-toast';

const ITEMS_PER_PAGE = 5;
const ROW_SHIFT_HEIGHT = 640; // 5 cards * (112px height + 16px margin) = 640px

const Profil = () => {
    const { user, loginUser } = useContext(AuthContext);

    // Profile & Info States
    const [profileName, setProfileName] = useState('');
    const [profileEmail, setProfileEmail] = useState('');
    const [profileId, setProfileId] = useState('0');
    const [joinDate, setJoinDate] = useState('Mei 2026');
    const [saldo, setSaldo] = useState(0);

    // Password States
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordVerified, setPasswordVerified] = useState(false);
    const [showNewPasswordFields, setShowNewPasswordFields] = useState(false);

    // Loan History States
    const [loans, setLoans] = useState([]);
    const [loadingLoans, setLoadingLoans] = useState(true);
    const [currentHistoryPage, setCurrentHistoryPage] = useState(0);

    // Denda States
    const [dendas, setDendas] = useState([]);

    // Barcode States
    const [barcodeLines, setBarcodeLines] = useState([]);

    // Modals
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [loadingTransactions, setLoadingTransactions] = useState(false);

    // 3D Card States
    const [rotationY, setRotationY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartX = useRef(0);
    const lastDragX = useRef(0);
    const velocity = useRef(0);
    const timerRef = useRef(null);

    useEffect(() => {
        // Load initial barcode line classes
        const lines = [];
        for (let i = 0; i < 16; i++) {
            const rand = Math.random();
            if (rand > 0.7) lines.push('thick');
            else if (rand > 0.4) lines.push('mid');
            else lines.push('');
        }
        setBarcodeLines(lines);

        loadProfileDetails();
        loadLoanHistory();
        loadUserSaldo();
        loadDendaList();

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const loadProfileDetails = async () => {
        // Fallback populating from sessionStorage first
        const storedName = sessionStorage.getItem('user_name') || 'Pengunjung';
        const storedEmail = sessionStorage.getItem('user_email') || 'email@perpusonline.id';
        const storedId = sessionStorage.getItem('user_id') || '0';

        setProfileName(storedName);
        setProfileEmail(storedEmail);
        setProfileId(storedId);

        try {
            const userProfile = await fetchAPI('/auth/user/profile');
            if (userProfile) {
                setProfileName(userProfile.nama || storedName);
                setProfileEmail(userProfile.email || storedEmail);
                setProfileId(userProfile.id_user || storedId);

                // Sync context/session
                loginUser(sessionStorage.getItem('user_token'), {
                    nama: userProfile.nama,
                    email: userProfile.email,
                    id: userProfile.id_user
                });

                if (userProfile.created_at) {
                    const dateObj = new Date(userProfile.created_at);
                    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
                    const joinMonth = monthNames[dateObj.getMonth()];
                    const joinYear = dateObj.getFullYear();
                    setJoinDate(`${joinMonth} ${joinYear}`);
                }
            }
        } catch (err) {
            console.warn('Could not fetch fresh profile details, using session data:', err);
        }
    };

    const loadLoanHistory = async () => {
        setLoadingLoans(true);
        try {
            const history = await fetchAPI('/loans/my');
            setLoans(history || []);
        } catch (err) {
            console.error('Error fetching loan history:', err);
            toast.error('Gagal memuat riwayat peminjaman.');
        } finally {
            setLoadingLoans(false);
        }
    };

    const loadUserSaldo = async () => {
        try {
            const data = await fetchAPI('/saldo');
            setSaldo(data.saldo || 0);
        } catch (err) {
            console.warn('Could not load saldo:', err);
        }
    };

    const loadDendaList = async () => {
        try {
            const data = await fetchAPI('/saldo/denda');
            setDendas(data || []);
        } catch (err) {
            console.warn('Could not load denda:', err);
        }
    };

    const formatRupiah = (amount) => {
        return 'Rp ' + new Intl.NumberFormat('id-ID').format(amount || 0);
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();

        if (!profileName.trim()) {
            toast.error('Nama tidak boleh kosong.');
            return;
        }

        if (showNewPasswordFields) {
            if (!currentPassword) {
                toast.error('Masukkan password saat ini terlebih dahulu untuk mengubah password.');
                return;
            }
            if (newPassword.length < 6) {
                toast.error('Password baru minimal harus 6 karakter.');
                return;
            }
            if (newPassword !== confirmNewPassword) {
                toast.error('Konfirmasi password tidak cocok.');
                return;
            }
        }

        try {
            const payload = { nama: profileName };
            if (showNewPasswordFields && newPassword) {
                payload.password = newPassword;
                payload.currentPassword = currentPassword;
            }

            await fetchAPI('/auth/user/profile', {
                method: 'PUT',
                body: JSON.stringify(payload)
            });

            // Refresh profile data
            loadProfileDetails();

            // Reset password fields
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setPasswordVerified(false);
            setShowNewPasswordFields(false);

            toast.success('Profil berhasil diperbarui!');
        } catch (err) {
            toast.error(`Gagal memperbarui profil: ${err.message}`);
        }
    };

    const verifyCurrentPassword = async () => {
        if (!currentPassword) {
            toast.error('Masukkan password saat ini terlebih dahulu.');
            return;
        }

        try {
            const res = await fetchAPI('/auth/user/verify-password', {
                method: 'POST',
                body: JSON.stringify({ currentPassword })
            });

            if (res.valid) {
                toast.success('Password valid. Silakan masukkan password baru.');
                setPasswordVerified(true);
                setShowNewPasswordFields(true);
            }
        } catch (err) {
            toast.error(`Password salah atau gagal verifikasi: ${err.message}`);
        }
    };

    const deleteLoanHistoryItem = async (e, loanId) => {
        e.stopPropagation();
        if (!window.confirm('Apakah Anda yakin ingin menghapus riwayat peminjaman ini dari daftar Anda?')) {
            return;
        }

        try {
            await fetchAPI(`/loans/${loanId}`, { method: 'DELETE' });
            toast.success('Riwayat peminjaman berhasil dihapus.');
            loadLoanHistory();
        } catch (err) {
            toast.error(`Gagal menghapus riwayat: ${err.message}`);
        }
    };

    const payDenda = async (idPengembalian, dendaAmount) => {
        if (!window.confirm(`Bayar denda ${formatRupiah(dendaAmount)} dari saldo kartu Anda?`)) return;

        try {
            const res = await fetchAPI(`/saldo/bayar-denda/${idPengembalian}`, { method: 'POST' });
            toast.success(res.message || 'Denda berhasil dibayar!');
            loadUserSaldo();
            loadDendaList();
            loadLoanHistory(); // reload history because denda payment updates returns status
        } catch (err) {
            toast.error('Gagal membayar denda: ' + err.message);
        }
    };

    const openTransactionsModal = async () => {
        setShowHistoryModal(true);
        setLoadingTransactions(true);

        try {
            const data = await fetchAPI('/saldo/history');
            setTransactions(data || []);
        } catch (err) {
            toast.error('Gagal memuat riwayat transaksi: ' + err.message);
        } finally {
            setLoadingTransactions(false);
        }
    };

    // 3D Card Drag Handlers
    const handleDragStart = (clientX) => {
        setIsDragging(true);
        dragStartX.current = clientX;
        lastDragX.current = clientX;
        velocity.current = 0;
        if (timerRef.current) clearInterval(timerRef.current);
    };

    useEffect(() => {
        if (!isDragging) return;

        const handleDragMove = (e) => {
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const deltaX = clientX - lastDragX.current;
            velocity.current = deltaX;
            lastDragX.current = clientX;
            setRotationY(prev => prev + deltaX * 0.5);
        };

        const handleDragEnd = () => {
            setIsDragging(false);
            
            let vel = velocity.current;
            timerRef.current = setInterval(() => {
                if (Math.abs(vel) < 0.3) {
                    clearInterval(timerRef.current);
                    setRotationY(prev => {
                        let norm = ((prev % 360) + 360) % 360;
                        if (norm >= 90 && norm < 270) {
                            return Math.round(prev / 360) * 360 + 180;
                        } else {
                            return Math.round(prev / 360) * 360;
                        }
                    });
                    return;
                }
                vel *= 0.95;
                setRotationY(prev => prev + vel);
            }, 16);
        };

        window.addEventListener('mousemove', handleDragMove);
        window.addEventListener('mouseup', handleDragEnd);
        window.addEventListener('touchmove', handleDragMove, { passive: false });
        window.addEventListener('touchend', handleDragEnd);

        return () => {
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
            window.removeEventListener('touchmove', handleDragMove);
            window.removeEventListener('touchend', handleDragEnd);
        };
    }, [isDragging]);

    // History slider pagination
    const totalHistoryPages = Math.ceil(loans.length / ITEMS_PER_PAGE) || 1;

    const handlePrevSlide = () => {
        if (currentHistoryPage > 0) {
            setCurrentHistoryPage(prev => prev - 1);
        }
    };

    const handleNextSlide = () => {
        if (currentHistoryPage < totalHistoryPages - 1) {
            setCurrentHistoryPage(prev => prev + 1);
        }
    };

    const getLoanCoverUrl = (cover) => {
        if (!cover) return 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=150&auto=format&fit=crop';
        return cover.startsWith('http') || cover.startsWith('uploads')
            ? cover
            : `http://localhost:5000/${cover}`;
    };

    const getLoanStatusInfo = (status) => {
        let statusText = status;
        let iconClass = 'fa-clock';
        if (status === 'dipinjam') {
            statusText = 'Dipinjam';
            iconClass = 'fa-book-reader';
        } else if (status === 'diproses') {
            statusText = 'Diproses';
            iconClass = 'fa-hourglass-half';
        } else if (status === 'kembali') {
            statusText = 'Dikembalikan';
            iconClass = 'fa-check-circle';
        } else if (status === 'ditolak') {
            statusText = 'Ditolak';
            iconClass = 'fa-times-circle';
        }
        return { text: statusText, icon: iconClass };
    };

    const paddedId = String(profileId).padStart(4, '0');

    return (
        <UserLayout pageTitle="Profil Saya." totalBooks={loans.length}>
            <Toaster position="bottom-right" reverseOrder={false} />

            <div className="profile-top-grid">
                {/* Left Column: Member Card */}
                <div className="profile-member-section">
                    <h3 className="history-section-title"><i className="fas fa-id-card"></i> Kartu Anggota Digital</h3>
                    
                    {/* Member Card Wrapper */}
                    <div 
                        className="member-card-wrapper" 
                        id="memberCardWrapper"
                        onMouseDown={(e) => handleDragStart(e.clientX)}
                        onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
                    >
                        <div 
                            className={`member-card-inner ${isDragging ? 'dragging' : ''}`}
                            id="memberCardInner"
                            style={{ transform: `rotateY(${rotationY}deg)` }}
                        >
                            {/* Card Front */}
                            <div className="card-front">
                                <div className="card-header">
                                    <span className="card-logo"><i className="fas fa-book-open"></i> PERPUSONLINE</span>
                                    <span className="card-type">Anggota Aktif</span>
                                </div>
                                <div className="card-middle">
                                    <div className="card-id" id="cardMemberId">PO-MEMBER-{paddedId}</div>
                                    <div className="card-name" id="cardMemberName">{profileName}</div>
                                </div>
                                <div className="card-saldo">
                                    <div>
                                        <span className="card-saldo-label">Saldo</span>
                                        <div className="card-saldo-amount" id="cardSaldo">{formatRupiah(saldo)}</div>
                                    </div>
                                </div>
                                <div className="card-footer">
                                    <div className="card-meta-item">
                                        <span className="label">Bergabung Sejak</span>
                                        <span className="value" id="cardJoinDate">{joinDate}</span>
                                    </div>
                                    <div className="card-barcode" id="cardBarcode">
                                        {barcodeLines.map((cls, idx) => (
                                            <div key={idx} className={`barcode-line ${cls}`}></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {/* Card Back */}
                            <div className="card-back">
                                <div className="magnetic-strip"></div>
                                <div className="card-back-content">
                                    <div className="card-back-left">
                                        <div className="card-chip"></div>
                                        <div className="card-rules">
                                            <span className="rules-title">Syarat & Ketentuan:</span>
                                            <ul>
                                                <li>Maksimal pinjam 3 buku sekaligus.</li>
                                                <li>Batas pinjam maksimal 7 hari.</li>
                                                <li>Terlambat denda Rp 1.000/hari.</li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="card-back-right">
                                        <div className="signature-strip">
                                            <span className="signature-text" id="cardSignature">{profileName}</span>
                                        </div>
                                        <div className="card-back-info">
                                            <p>PO-SUPPORT: (022) 1234-5678</p>
                                            <p>www.perpusonline.id</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-back-footer">
                                    <p>Milik PerpusOnline. Harap kembalikan jika ditemukan.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Helper Text to drag */}
                    <p style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: '0.75rem', marginTop: '0.5rem', userSelect: 'none' }}>
                        <i className="fas fa-hand-pointer" style={{ marginRight: '0.25rem' }}></i> Geser kartu untuk melihat detail belakang
                    </p>

                    {/* Saldo & Denda Panel */}
                    <div className="saldo-panel">
                        <div className="saldo-panel-header">
                            <h4><i className="fas fa-wallet"></i> Saldo Kartu</h4>
                            <span className="saldo-big" id="panelSaldo">{formatRupiah(saldo)}</span>
                        </div>
                        <button className="btn btn-outline btn-sm" onClick={openTransactionsModal} style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <i className="fas fa-history"></i> Riwayat Transaksi
                        </button>
                        
                        {dendas.length > 0 && (
                            <div id="dendaSection" style={{ display: 'block', marginTop: '1.25rem' }}>
                                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#E74C3C', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <i className="fas fa-exclamation-triangle"></i> Denda Belum Dibayar
                                </h4>
                                <div className="denda-list" id="dendaList">
                                    {dendas.map(d => {
                                        const tglKembali = new Date(d.tgl_kembali).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                                        const tglReal = new Date(d.tgl_kembali_real).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                                        return (
                                            <div className="denda-item" key={d.id_pengembalian}>
                                                <div className="denda-item-info">
                                                    <h5>{d.judul}</h5>
                                                    <p>Tempo: {tglKembali} · Dikembalikan: {tglReal}</p>
                                                </div>
                                                <span className="denda-amount">{formatRupiah(d.denda)}</span>
                                                <button 
                                                    className="btn btn-sm" 
                                                    style={{ background: 'var(--accent)', color: 'white', whiteSpace: 'nowrap', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-sm)' }}
                                                    onClick={() => payDenda(d.id_pengembalian, d.denda)}
                                                >
                                                    <i className="fas fa-credit-card"></i> Bayar
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Settings */}
                <div className="profile-settings-section">
                    <div className="profile-form-card">
                        <h3><i className="fas fa-cog"></i> Pengaturan Akun</h3>
                        
                        <form id="updateProfileForm" onSubmit={handleProfileSubmit}>
                            <div className="form-group">
                                <label htmlFor="profileName">Nama Lengkap</label>
                                <input 
                                    type="text" 
                                    id="profileName" 
                                    className="form-control" 
                                    placeholder="Nama Lengkap" 
                                    required 
                                    style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-main)' }}
                                    value={profileName}
                                    onChange={(e) => setProfileName(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="profileEmail">Alamat Email</label>
                                <input 
                                    type="email" 
                                    id="profileEmail" 
                                    className="form-control" 
                                    disabled 
                                    style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: '#F0EDE8', cursor: 'not-allowed', color: 'var(--text-light)' }}
                                    value={profileEmail}
                                />
                                <small style={{ display: 'block', marginTop: '0.25rem', color: 'var(--text-light)', fontSize: '0.7rem' }}>Email tidak dapat diubah.</small>
                            </div>
                            
                            <div style={{ margin: '1.5rem 0', borderTop: '2px dashed var(--bg-main)', paddingTop: '1rem' }}>
                                <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-medium)', marginBottom: '0.75rem' }}>Ubah Password (Opsional)</h4>
                                <div className="form-group" id="currentPasswordGroup">
                                    <label htmlFor="profileCurrentPassword">Password Saat Ini</label>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <input 
                                            type="password" 
                                            id="profileCurrentPassword" 
                                            className="form-control" 
                                            placeholder="Masukkan password saat ini" 
                                            style={{ flex: 1, padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-main)' }}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            readOnly={passwordVerified}
                                        />
                                        <button 
                                            type="button" 
                                            id="verifyPasswordBtn" 
                                            className="btn btn-outline" 
                                            style={{ padding: '0 1rem' }}
                                            onClick={verifyCurrentPassword}
                                            disabled={passwordVerified}
                                        >
                                            Verifikasi
                                        </button>
                                    </div>
                                    <small style={{ display: 'block', marginTop: '0.25rem', color: 'var(--text-light)', fontSize: '0.7rem' }}>Verifikasi password lama untuk mengubah password baru.</small>
                                </div>
                                {showNewPasswordFields && (
                                    <div id="newPasswordSection">
                                        <div className="form-group">
                                            <label htmlFor="profilePassword">Password Baru</label>
                                            <input 
                                                type="password" 
                                                id="profilePassword" 
                                                className="form-control" 
                                                placeholder="Masukkan password baru" 
                                                style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-main)' }}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="profileConfirmPassword">Konfirmasi Password Baru</label>
                                            <input 
                                                type="password" 
                                                id="profileConfirmPassword" 
                                                className="form-control" 
                                                placeholder="Ulangi password baru" 
                                                style={{ width: '100%', padding: '0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-main)' }}
                                                value={confirmNewPassword}
                                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}>
                                Perbarui Profil <i className="fas fa-save"></i>
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Full Width Loan History */}
            <div className="loan-history-section" style={{ marginTop: '2.5rem' }}>
                <h3 className="history-section-title">
                    <i className="fas fa-history"></i> Riwayat Peminjaman Buku
                </h3>
                
                {loadingLoans ? (
                    <div id="historyPlaceholderContainer">
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)', background: 'white', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                            <i className="fas fa-spinner fa-spin fa-2x"></i>
                            <p style={{ marginTop: '0.75rem' }}>Memuat riwayat peminjaman...</p>
                        </div>
                    </div>
                ) : loans.length === 0 ? (
                    <div id="historyPlaceholderContainer">
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)', background: 'white', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                            <i className="fas fa-book-reader fa-2x" style={{ color: 'var(--accent)', marginBottom: '0.75rem', opacity: 0.7 }}></i>
                            <p>Belum ada riwayat peminjaman buku.</p>
                            <a href="/katalog" className="btn btn-primary btn-sm" style={{ marginTop: '1rem', display: 'inline-flex' }}>
                                Mulai Cari Buku <i className="fas fa-search"></i>
                            </a>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="loan-history-slider-container" id="historySliderContainer" style={{ display: 'block' }}>
                            <div 
                                id="loanHistoryContainer" 
                                className="loan-history-track"
                                style={{ transform: `translateY(-${currentHistoryPage * ROW_SHIFT_HEIGHT}px)` }}
                            >
                                {loans.map(loan => {
                                    const datePinjam = new Date(loan.tgl_pinjam).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                                    const dateKembali = new Date(loan.tgl_kembali).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                                    const statusInfo = getLoanStatusInfo(loan.status);

                                    return (
                                        <div className="loan-history-card" key={loan.id_peminjaman}>
                                            <img 
                                                src={getLoanCoverUrl(loan.cover)} 
                                                className="loan-cover" 
                                                alt={`Cover ${loan.judul}`} 
                                                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=150&auto=format&fit=crop'; }}
                                            />
                                            <div className="loan-details">
                                                <div>
                                                    <h4 className="loan-title">{loan.judul}</h4>
                                                    <div className="loan-dates">
                                                        <span className="loan-date-item">
                                                            <i className="fas fa-calendar-alt"></i> Pinjam: {datePinjam}
                                                        </span>
                                                        <span className="loan-date-item">
                                                            <i className="fas fa-calendar-check"></i> Tempo: {dateKembali}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="loan-status-row">
                                                    <span className={`status-badge ${loan.status}`}>
                                                        <i className={`fas ${statusInfo.icon}`}></i> {statusInfo.text}
                                                    </span>
                                                </div>
                                            </div>
                                            <button 
                                                className="btn-delete-loan" 
                                                onClick={(e) => deleteLoanHistoryItem(e, loan.id_peminjaman)} 
                                                title="Hapus Riwayat"
                                            >
                                                <i className="fas fa-trash-alt"></i>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Slider Controls */}
                        {loans.length > ITEMS_PER_PAGE && (
                            <div id="historySliderControls" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                                <button 
                                    id="prevHistoryBtn" 
                                    className="btn btn-outline btn-sm" 
                                    onClick={handlePrevSlide}
                                    style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', height: '36px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                                    disabled={currentHistoryPage === 0}
                                >
                                    <i className="fas fa-chevron-left"></i> Sebelum
                                </button>
                                <span id="historyPageIndicator" style={{ fontSize: '0.82rem', color: 'var(--text-medium)', fontWeight: 600, minWidth: '120px', textAlign: 'center' }}>
                                    Halaman {currentHistoryPage + 1} dari {totalHistoryPages}
                                </span>
                                <button 
                                    id="nextHistoryBtn" 
                                    className="btn btn-outline btn-sm" 
                                    onClick={handleNextSlide}
                                    style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', height: '36px', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                                    disabled={currentHistoryPage === totalHistoryPages - 1}
                                >
                                    Berikut <i className="fas fa-chevron-right"></i>
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Transaction History Modal */}
            {showHistoryModal && (
                <div className="modal active" id="historyModal" onClick={() => setShowHistoryModal(false)}>
                    <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3><i className="fas fa-history" style={{ color: 'var(--accent)' }}></i> Riwayat Transaksi</h3>
                            <span className="close-modal" onClick={() => setShowHistoryModal(false)}>&times;</span>
                        </div>
                        <div className="modal-body" id="historyModalBody">
                            {loadingTransactions ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                                    <i className="fas fa-spinner fa-spin"></i> Memuat...
                                </div>
                            ) : transactions.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                                    <i className="fas fa-inbox" style={{ fontSize: '1.5rem', opacity: 0.3, display: 'block', marginBottom: '0.5rem' }}></i>
                                    Belum ada transaksi.
                                </div>
                            ) : (
                                transactions.map(t => {
                                    const isTopup = t.jenis === 'topup';
                                    const icon = isTopup ? 'fa-arrow-down' : 'fa-arrow-up';
                                    const color = isTopup ? '#27AE60' : '#E74C3C';
                                    const sign = isTopup ? '+' : '-';
                                    const date = new Date(t.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                                    return (
                                        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `${color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <i className={`fas ${icon}`} style={{ color, fontSize: '0.85rem' }}></i>
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-dark)', margin: '0 0 0.1rem 0', textAlign: 'left' }}>
                                                    {t.keterangan || (isTopup ? 'Top Up Saldo' : 'Pembayaran Denda')}
                                                </p>
                                                <p style={{ fontSize: '0.7rem', color: 'var(--text-light)', margin: 0, textAlign: 'left' }}>{date}</p>
                                            </div>
                                            <span style={{ fontWeight: 700, color, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                                                {sign}{formatRupiah(t.jumlah)}
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}
        </UserLayout>
    );
};

export default Profil;
