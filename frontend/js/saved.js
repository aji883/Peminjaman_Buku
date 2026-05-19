// ==========================================
// SAVED BOOKS (localStorage-based)
// ==========================================

function getSavedBookIds() {
    try {
        return JSON.parse(localStorage.getItem('saved_books') || '[]');
    } catch { return []; }
}

function isBookSaved(bookId) {
    return getSavedBookIds().includes(Number(bookId));
}

function toggleSaveBook(bookId) {
    bookId = Number(bookId);
    let saved = getSavedBookIds();
    if (saved.includes(bookId)) {
        saved = saved.filter(id => id !== bookId);
        showToast('Buku dihapus dari tersimpan', 'info');
    } else {
        saved.push(bookId);
        showToast('Buku berhasil disimpan!', 'success');
    }
    localStorage.setItem('saved_books', JSON.stringify(saved));
    return saved.includes(bookId);
}

// Toast notification
function showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.cssText = 'position:fixed;bottom:2rem;right:2rem;z-index:9999;display:flex;flex-direction:column;gap:0.5rem;';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : 'var(--primary)';
    const icon = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-times-circle' : 'fa-info-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
    toast.style.cssText = `
        background: ${bgColor}; color: white; padding: 0.85rem 1.5rem; border-radius: 12px;
        font-size: 0.85rem; font-weight: 500; font-family: 'Poppins', sans-serif;
        display: flex; align-items: center; gap: 0.5rem;
        box-shadow: 0 8px 25px rgba(0,0,0,0.2); animation: toastIn 0.35s ease;
        backdrop-filter: blur(10px);
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// Inject toast animations if not present
if (!document.getElementById('toastAnimStyle')) {
    const style = document.createElement('style');
    style.id = 'toastAnimStyle';
    style.textContent = `
        @keyframes toastIn { from { transform: translateX(100px); opacity:0; } to { transform: translateX(0); opacity:1; } }
        @keyframes toastOut { from { transform: translateX(0); opacity:1; } to { transform: translateX(100px); opacity:0; } }
    `;
    document.head.appendChild(style);
}
