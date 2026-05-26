import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Hydrate state from storage
        const userToken = sessionStorage.getItem('user_token');
        const adminToken = localStorage.getItem('token');

        if (userToken) {
            setUser({
                token: userToken,
                nama: sessionStorage.getItem('user_name'),
                email: sessionStorage.getItem('user_email'),
                id: sessionStorage.getItem('user_id'),
                role: 'user'
            });
        }

        if (adminToken) {
            setAdmin({
                token: adminToken,
                nama: localStorage.getItem('admin_name'),
                role: 'admin'
            });
        }
        setLoading(false);
    }, []);

    const loginUser = (token, userData) => {
        sessionStorage.setItem('user_token', token);
        sessionStorage.setItem('user_name', userData.nama);
        sessionStorage.setItem('user_email', userData.email);
        sessionStorage.setItem('user_id', userData.id);
        
        setUser({
            token,
            nama: userData.nama,
            email: userData.email,
            id: userData.id,
            role: 'user'
        });
    };

    const loginAdmin = (token, adminName) => {
        localStorage.setItem('token', token);
        localStorage.setItem('admin_name', adminName);
        
        setAdmin({
            token,
            nama: adminName,
            role: 'admin'
        });
    };

    const logoutUser = () => {
        sessionStorage.removeItem('user_token');
        sessionStorage.removeItem('user_name');
        sessionStorage.removeItem('user_email');
        sessionStorage.removeItem('user_id');
        setUser(null);
    };

    const logoutAdmin = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('admin_name');
        setAdmin(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            admin,
            loading,
            loginUser,
            loginAdmin,
            logoutUser,
            logoutAdmin,
            isAuthenticated: !!user,
            isAdminAuthenticated: !!admin
        }}>
            {children}
        </AuthContext.Provider>
    );
};
