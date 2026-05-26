import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';

// User Pages
import Home from './pages/user/Home';
import Register from './pages/user/Register';
import Login from './pages/user/Login';
import Katalog from './pages/user/Katalog';
import Koleksi from './pages/user/Koleksi';
import Profil from './pages/user/Profil';
import Tersimpan from './pages/user/Tersimpan';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import KelolaUser from './pages/admin/KelolaUser';
import KelolaBuku from './pages/admin/KelolaBuku';
import Peminjaman from './pages/admin/Peminjaman';
import Pengembalian from './pages/admin/Pengembalian';
import Laporan from './pages/admin/Laporan';

// Global Styles
import './css/style.css';
import './css/koleksi-tersimpan.css';
import './css/admin-custom.css';
import './css/user-custom.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* User Protected Routes */}
          <Route path="/katalog" element={
            <ProtectedRoute>
              <Katalog />
            </ProtectedRoute>
          } />
          <Route path="/koleksi" element={
            <ProtectedRoute>
              <Koleksi />
            </ProtectedRoute>
          } />
          <Route path="/tersimpan" element={
            <ProtectedRoute>
              <Tersimpan />
            </ProtectedRoute>
          } />
          <Route path="/profil" element={
            <ProtectedRoute>
              <Profil />
            </ProtectedRoute>
          } />

          {/* Admin Protected Routes */}
          <Route path="/admin/dashboard" element={
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          } />
          <Route path="/admin/kelola-user" element={
            <AdminRoute>
              <KelolaUser />
            </AdminRoute>
          } />
          <Route path="/admin/kelola-buku" element={
            <AdminRoute>
              <KelolaBuku />
            </AdminRoute>
          } />
          <Route path="/admin/peminjaman" element={
            <AdminRoute>
              <Peminjaman />
            </AdminRoute>
          } />
          <Route path="/admin/pengembalian" element={
            <AdminRoute>
              <Pengembalian />
            </AdminRoute>
          } />
          <Route path="/admin/laporan" element={
            <AdminRoute>
              <Laporan />
            </AdminRoute>
          } />

          {/* Fallback Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
