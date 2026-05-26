import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { fetchAPI } from '../../api/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    
    const { loginAdmin, admin } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (admin) {
            navigate('/admin/dashboard');
        }
    }, [admin, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const data = await fetchAPI('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            loginAdmin(data.token, data.admin.nama);
            navigate('/admin/dashboard');
        } catch (err) {
            setError(err.message || 'Email atau password salah');
        }
    };

    return (
        <div className="login-page">
            {/* Left Branding */}
            <div className="login-left">
                <div className="brand">
                    <i className="fas fa-book-open"></i>
                    <h1>PerpusOnline.</h1>
                    <p>Sistem Informasi Perpustakaan Digital untuk pengelolaan buku yang lebih mudah dan modern.</p>
                </div>
            </div>

            {/* Right Login Form */}
            <div className="login-right">
                <div className="login-box">
                    <h2>Admin Panel</h2>
                    <p className="subtitle">Masuk untuk mengelola perpustakaan</p>
                    
                    {error && <div className="alert error" style={{ display: 'block' }}>{error}</div>}

                    <form id="loginForm" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <div className="input-icon">
                                <i className="fas fa-envelope"></i>
                                <input 
                                    type="email" 
                                    id="email" 
                                    className="form-control" 
                                    required 
                                    placeholder="admin@perpustakaan.com"
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
                            Masuk ke Dashboard <i className="fas fa-arrow-right"></i>
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-light)' }}>
                        <Link to="/" style={{ color: 'var(--accent)', textDecoration: 'none' }}>&larr; Kembali ke Katalog</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
