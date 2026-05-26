import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const AdminLayout = ({ children, pageTitle, topBarActions = null }) => {
    const { admin, logoutAdmin } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = (e) => {
        e.preventDefault();
        logoutAdmin();
        navigate('/login');
    };

    return (
        <div className="app-layout">
            {/* SIDEBAR */}
            <aside className="sidebar">
                <div className="sidebar-profile">
                    <div className="avatar">A</div>
                    <p className="welcome-text">Welcome Back</p>
                    <p className="user-name" id="adminName">{admin?.nama || 'Administrator'}</p>
                </div>

                <nav className="sidebar-nav">
                    <Link to="/admin/dashboard" className={location.pathname === '/admin/dashboard' ? 'active' : ''}>
                        <i className="fas fa-th-large"></i> Dashboard
                    </Link>
                    <Link to="/admin/kelola-user" className={location.pathname === '/admin/kelola-user' ? 'active' : ''}>
                        <i className="fas fa-users"></i> Kelola User
                    </Link>
                    <Link to="/admin/kelola-buku" className={location.pathname === '/admin/kelola-buku' ? 'active' : ''}>
                        <i className="fas fa-book"></i> Kelola Buku
                    </Link>
                    <Link to="/admin/peminjaman" className={location.pathname === '/admin/peminjaman' ? 'active' : ''}>
                        <i className="fas fa-exchange-alt"></i> Peminjaman
                    </Link>
                    <Link to="/admin/pengembalian" className={location.pathname === '/admin/pengembalian' ? 'active' : ''}>
                        <i className="fas fa-undo"></i> Pengembalian
                    </Link>
                    <Link to="/admin/laporan" className={location.pathname === '/admin/laporan' ? 'active' : ''}>
                        <i className="fas fa-chart-bar"></i> Laporan
                    </Link>
                </nav>

                <div className="sidebar-brand">
                    <a href="#" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-light)', textDecoration: 'none', fontSize: '0.85rem', justifyContent: 'center' }}>
                        <i className="fas fa-sign-out-alt"></i> Logout
                    </a>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="main-content">
                {/* Top Bar */}
                <div className="top-bar">
                    <h1 className="page-title">{pageTitle}</h1>
                    {topBarActions}
                </div>

                {children}
            </main>
        </div>
    );
};

export default AdminLayout;
