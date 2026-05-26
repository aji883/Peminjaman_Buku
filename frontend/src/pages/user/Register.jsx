import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { fetchAPI } from '../../api/api';

const Register = () => {
    const [nama, setNama] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate('/katalog');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password !== confirmPassword) {
            setError('Konfirmasi password tidak cocok!');
            return;
        }

        try {
            const data = await fetchAPI('/auth/user/register', {
                method: 'POST',
                body: JSON.stringify({ nama, email, password })
            });

            setSuccess(data.message || 'Registrasi berhasil, silakan login');
            
            setTimeout(() => {
                navigate('/');
            }, 2000);
        } catch (err) {
            setError(err.message || 'Terjadi kesalahan saat registrasi');
        }
    };

    return (
        <div className="login-page">
            {/* Left Branding */}
            <div className="login-left">
                <div className="brand">
                    <i className="fas fa-users"></i>
                    <h1>Bergabung Sekarang!</h1>
                    <p>Buat akun anggota untuk dapat meminjam buku secara online dan mengakses perpustakaan digital kami 24/7.</p>
                </div>
            </div>

            {/* Right Form */}
            <div className="login-right">
                <div className="login-box">
                    <h2>Pendaftaran Anggota</h2>
                    <p className="subtitle">Isi data diri Anda untuk membuat akun</p>
                    
                    {error && <div className="alert error" style={{ display: 'block' }}>{error}</div>}
                    {success && <div className="alert success" style={{ display: 'block' }}>{success}</div>}

                    <form id="userRegisterForm" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="nama">Nama Lengkap</label>
                            <div className="input-icon">
                                <i className="fas fa-user"></i>
                                <input 
                                    type="text" 
                                    id="nama" 
                                    className="form-control" 
                                    required 
                                    placeholder="Budi Santoso"
                                    value={nama}
                                    onChange={(e) => setNama(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Alamat Email</label>
                            <div className="input-icon">
                                <i className="fas fa-envelope"></i>
                                <input 
                                    type="email" 
                                    id="email" 
                                    className="form-control" 
                                    required 
                                    placeholder="budi@contoh.com"
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
                                    minLength="6"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Konfirmasi Password</label>
                            <div className="input-icon">
                                <i className="fas fa-lock"></i>
                                <input 
                                    type="password" 
                                    id="confirmPassword" 
                                    className="form-control" 
                                    required 
                                    placeholder="••••••••" 
                                    minLength="6"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        </div>
                        
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.85rem' }}>
                            Buat Akun <i className="fas fa-user-plus"></i>
                        </button>
                    </form>

                    <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-medium)' }}>
                        Sudah punya akun? <Link to="/" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Login di sini</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
