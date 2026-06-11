import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../../api/api';

const Footer = () => {
    const [stats, setStats] = useState({ totalBooks: 0, totalUsers: 0, activeLoan: 0 });

    useEffect(() => {
        const loadStats = async () => {
            try {
                const data = await fetchAPI('/books/stats');
                setStats(data);
            } catch (err) {
                console.error('Failed to load footer stats:', err);
            }
        };
        loadStats();
    }, []);

    return (
        <footer className="site-footer" id="siteFooter">
            <div className="footer-wave">
                <svg viewBox="0 0 1440 100" preserveAspectRatio="none">
                    <path d="M0,60 C360,100 720,0 1080,60 C1260,90 1380,70 1440,60 L1440,100 L0,100 Z" fill="currentColor"/>
                </svg>
            </div>
            <div className="footer-content">
                <div className="footer-grid">
                    {/* Brand & Description */}
                    <div className="footer-col footer-brand-col">
                        <h3 className="footer-logo"><i className="fas fa-book-open"></i> PerpusOnline</h3>
                        <p className="footer-desc">Sistem perpustakaan digital yang memudahkan pencarian, peminjaman, dan pengelolaan buku secara online. Membuka akses literasi untuk semua.</p>
                        <div className="footer-social">
                            <a href="#" title="Facebook"><i className="fab fa-facebook-f"></i></a>
                            <a href="#" title="Instagram"><i className="fab fa-instagram"></i></a>
                            <a href="#" title="Twitter"><i className="fab fa-twitter"></i></a>
                            <a href="#" title="YouTube"><i className="fab fa-youtube"></i></a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="footer-col">
                        <h4 className="footer-heading">Tautan Cepat</h4>
                        <ul className="footer-links">
                            <li><a href="#"><i className="fas fa-chevron-right"></i> Katalog Buku</a></li>
                            <li><a href="#howItWorks"><i className="fas fa-chevron-right"></i> Cara Meminjam</a></li>
                            <li><a href="#aboutLibrary"><i className="fas fa-chevron-right"></i> Tentang Kami</a></li>
                            <li><a href="#"><i className="fas fa-chevron-right"></i> Syarat & Ketentuan</a></li>
                            <li><a href="#"><i className="fas fa-chevron-right"></i> Kebijakan Privasi</a></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="footer-col">
                        <h4 className="footer-heading">Hubungi Kami</h4>
                        <ul className="footer-contact">
                            <li>
                                <i className="fas fa-map-marker-alt"></i>
                                <span>Jl. Pendidikan No. 45, Kec. Ilmu, Kota Literasi, Jawa Barat 40123</span>
                            </li>
                            <li>
                                <i className="fas fa-phone-alt"></i>
                                <span>(022) 1234-5678</span>
                            </li>
                            <li>
                                <i className="fas fa-envelope"></i>
                                <span>info@perpusonline.id</span>
                            </li>
                            <li>
                                <i className="fas fa-globe"></i>
                                <span>www.perpusonline.id</span>
                            </li>
                        </ul>
                    </div>

                    {/* Operating Hours */}
                    <div className="footer-col">
                        <h4 className="footer-heading">Jam Operasional</h4>
                        <ul className="footer-hours">
                            <li>
                                <span className="day">Senin - Jumat</span>
                                <span className="time">08:00 - 16:00</span>
                            </li>
                            <li>
                                <span className="day">Sabtu</span>
                                <span className="time">08:00 - 12:00</span>
                            </li>
                            <li className="closed">
                                <span className="day">Minggu</span>
                                <span className="time">Tutup</span>
                            </li>
                        </ul>
                        <div className="footer-map-btn">
                            <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.2)' }}>
                                <i className="fas fa-map-marked-alt"></i> Lihat di Google Maps
                            </a>
                        </div>
                    </div>
                </div>

                {/* Footer Stats Strip */}
                <div className="footer-stats-strip" style={{ display: 'flex', justifyContent: 'center', gap: '3rem', padding: '1.25rem 0', borderTop: '1px solid rgba(255,255,255,0.08)', borderBottom: '1px solid rgba(255,255,255,0.08)', marginTop: '2rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'rgba(255,255,255,0.75)', fontSize: '0.82rem' }}>
                        <i className="fas fa-book" style={{ color: 'var(--accent)', fontSize: '1rem' }}></i>
                        <span>Total Koleksi: <strong style={{ color: 'white', fontWeight: 600 }}>{stats.totalBooks}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'rgba(255,255,255,0.75)', fontSize: '0.82rem' }}>
                        <i className="fas fa-users" style={{ color: '#00B894', fontSize: '1rem' }}></i>
                        <span>Anggota Aktif: <strong style={{ color: 'white', fontWeight: 600 }}>{stats.totalUsers}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'rgba(255,255,255,0.75)', fontSize: '0.82rem' }}>
                        <i className="fas fa-hand-holding" style={{ color: '#0984E3', fontSize: '1rem' }}></i>
                        <span>Sedang Dipinjam: <strong style={{ color: 'white', fontWeight: 600 }}>{stats.activeLoan}</strong></span>
                    </div>
                </div>

                {/* Footer Bottom */}
                <div className="footer-bottom">
                    <p>&copy; 2026 PerpusOnline. Seluruh hak cipta dilindungi undang-undang.</p>
                    <p className="footer-credit">Dibuat dengan <i className="fas fa-heart" style={{ color: '#E74C3C' }}></i> untuk literasi Indonesia</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
