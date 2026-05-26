import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { fetchAPI } from '../../api/api';

const Home = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    const { loginUser, user } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Cek apakah user datang dari logout
        const urlParams = new URLSearchParams(location.search);
        if (urlParams.get('logout') === '1') {
            setSuccess('Anda berhasil keluar.');
        }

        // Redirect jika sudah login
        if (user) {
            navigate('/katalog');
        }
    }, [user, navigate, location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const data = await fetchAPI('/auth/user/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            loginUser(data.token, data.user);
            navigate('/katalog');
        } catch (err) {
            setError(err.message || 'Email atau password salah');
        }
    };

    return (
        <div className="login-page">
            {/* Left Branding */}
            <div className="login-left">
                <div className="brand">
                    <i className="fas fa-book-reader"></i>
                    <h1>Halo, Anggota!</h1>
                    <p>Silakan masuk untuk mulai meminjam buku dan menjelajahi koleksi terbaru dari PerpusOnline.</p>
                </div>
            </div>

            {/* Right Login Form */}
            <div className="login-right">
                <div className="login-box">
                    <h2>Selamat Datang</h2>
                    <p class="subtitle">Masuk dengan akun anggota Anda</p>
                    
                    {error && <div className="alert error" style={{ display: 'block' }}>{error}</div>}
                    {success && <div className="alert success" style={{ display: 'block' }}>{success}</div>}

                    <form id="userLoginForm" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email">Alamat Email</label>
                            <div className="input-icon">
                                <i className="fas fa-envelope"></i>
                                <input 
                                    type="email" 
                                    id="email" 
                                    className="form-control" 
                                    required 
                                    placeholder="user@contoh.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <div className="input-icon">
                                <i className="fas fa-lock"></i>
                                <input 
                                    type="password" 
                                    id="password" 
                                    className="form-control" 
                                    required 
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>
                        
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.85rem' }}>
                            Masuk ke Katalog <i className="fas fa-arrow-right"></i>
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-medium)' }}>
                        Belum punya akun? <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Daftar di sini</Link>
                    </p>
                    
                    <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-light)' }}>
                        <Link to="/login" style={{ color: 'var(--text-light)', textDecoration: 'underline' }}>Login sebagai Admin</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Home;
