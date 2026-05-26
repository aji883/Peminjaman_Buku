import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import Footer from './Footer';

const UserLayout = ({ children, pageTitle, showSearch = false, searchInput = '', onSearchChange = () => {}, totalBooks = 0 }) => {
    const { user, logoutUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = (e) => {
        e.preventDefault();
        logoutUser();
        navigate('/?logout=1');
    };

    return (
        <>
            <div className="app-layout">
                {/* SIDEBAR */}
                <aside className="sidebar">
                    <div className="sidebar-profile">
                        <div className="avatar">
                            <i className="fas fa-user" style={{ fontSize: '1.5rem' }}></i>
                        </div>
                        <p className="welcome-text">Selamat Datang</p>
                        <p className="user-name" id="userName">{user?.nama || 'Pengunjung'}</p>
                    </div>

                    <nav className="sidebar-nav">
                        <Link to="/katalog" className={location.pathname === '/katalog' ? 'active' : ''}>
                            <i className="fas fa-book-open"></i> Katalog Buku
                        </Link>
                        <Link to="/tersimpan" className={location.pathname === '/tersimpan' ? 'active' : ''}>
                            <i className="fas fa-bookmark"></i> Tersimpan
                        </Link>
                        <Link to="/profil" className={location.pathname === '/profil' ? 'active' : ''}>
                            <i className="fas fa-user-circle"></i> Profil
                        </Link>
                        <a href="#" onClick={handleLogout}>
                            <i className="fas fa-sign-out-alt"></i> Logout
                        </a>
                    </nav>

                    <div className="sidebar-brand" style={{ marginTop: 'auto' }}>
                        <span>Powered by</span>
                        <p className="brand-name">PerpusOnline.</p>
                    </div>
                </aside>

                {/* MAIN CONTENT */}
                <main className="main-content">
                    {/* Top Bar */}
                    <div className="top-bar">
                        <h1 className="page-title">{pageTitle}</h1>
                        {showSearch && (
                            <div className="search-box" id="searchBox">
                                <i className="fas fa-search"></i>
                                <input 
                                    type="text" 
                                    id="searchInput"
                                    placeholder="Cari buku..." 
                                    value={searchInput}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                />
                            </div>
                        )}
                        <div className="top-bar-actions">
                            <a href="#" className="active">Terbaru</a>
                            <a href="#">Populer</a>
                        </div>
                    </div>

                    {children}
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="bottom-nav">
                <Link to="/katalog" className={location.pathname === '/katalog' ? 'active' : ''}>
                    <i className="fas fa-book-open"></i>
                    <span>Katalog</span>
                </Link>
                <Link to="/tersimpan" className={location.pathname === '/tersimpan' ? 'active' : ''}>
                    <i className="fas fa-bookmark"></i>
                    <span>Tersimpan</span>
                </Link>
                <Link to="/profil" className={location.pathname === '/profil' ? 'active' : ''}>
                    <i className="fas fa-user-circle"></i>
                    <span>Profil</span>
                </Link>
                <a href="#" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                </a>
            </nav>

            <Footer totalBooks={totalBooks} />
        </>
    );
};

export default UserLayout;
