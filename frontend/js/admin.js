document.addEventListener('DOMContentLoaded', () => {
    const adminName = localStorage.getItem('admin_name');
    if (adminName) {
        document.getElementById('adminName').textContent = adminName;
    }
    loadBooksTable();
    document.getElementById('bookForm').addEventListener('submit', handleBookSubmit);
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('admin_name');
    window.location.href = '../login.html';
}

function showAlert(message, type = 'success') {
    const alertBox = document.getElementById('alertMessage');
    alertBox.textContent = message;
    alertBox.className = `alert ${type}`;
    setTimeout(() => { alertBox.style.display = 'none'; }, 3000);
}

// Cover preview
function previewCover(input) {
    const img = document.getElementById('coverImg');
    const placeholder = document.getElementById('coverPlaceholder');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target.result;
            img.style.display = 'block';
            placeholder.style.display = 'none';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Modal functions
const modal = document.getElementById('bookModal');
const form = document.getElementById('bookForm');

function openModal(book = null) {
    modal.classList.add('active');
    form.reset();
    
    const img = document.getElementById('coverImg');
    const placeholder = document.getElementById('coverPlaceholder');
    img.style.display = 'none';
    img.src = '';
    placeholder.style.display = 'block';

    if (book) {
        document.getElementById('modalTitle').textContent = 'Edit Buku';
        document.getElementById('bookId').value = book.id_buku;
        document.getElementById('judul').value = book.judul;
        document.getElementById('penulis').value = book.penulis || '';
        document.getElementById('penerbit').value = book.penerbit || '';
        document.getElementById('tahun').value = book.tahun || '';
        document.getElementById('stok').value = book.stok || 0;
        document.getElementById('deskripsi').value = book.deskripsi || '';
        
        if (book.cover) {
            img.src = '../uploads/' + book.cover;
            img.style.display = 'block';
            placeholder.style.display = 'none';
        }
    } else {
        document.getElementById('modalTitle').textContent = 'Tambah Buku Baru';
        document.getElementById('bookId').value = '';
    }
}

function closeModal() {
    modal.classList.remove('active');
}

// CRUD Operations
async function loadBooksTable() {
    const tbody = document.getElementById('booksTableBody');
    try {
        const books = await fetchAPI('/books');
        
        if (books.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-light); padding: 2rem;">Belum ada data buku</td></tr>`;
            return;
        }

        tbody.innerHTML = books.map(book => {
            const coverHtml = book.cover 
                ? `<img src="../uploads/${book.cover}" alt="Cover" style="width: 45px; height: 65px; object-fit: cover; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">` 
                : `<div style="width: 45px; height: 65px; background: linear-gradient(135deg, #D4C5B2, #A8C5C8); border-radius: 8px; display: flex; align-items: center; justify-content: center;"><i class="fas fa-book" style="color: rgba(255,255,255,0.6); font-size: 0.9rem;"></i></div>`;
            
            const bookForEdit = { ...book };
            const bookJson = JSON.stringify(bookForEdit).replace(/'/g, "&#39;").replace(/"/g, "&quot;");

            return `
                <tr>
                    <td>${coverHtml}</td>
                    <td>
                        <span style="font-weight: 600; color: var(--text-dark);">${book.judul}</span>
                        ${book.deskripsi ? `<p style="font-size: 0.72rem; color: var(--text-light); margin-top: 0.2rem; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${book.deskripsi}</p>` : ''}
                    </td>
                    <td>${book.penulis || '-'}</td>
                    <td>${book.penerbit || '-'}</td>
                    <td>${book.tahun || '-'}</td>
                    <td><span class="stok-badge ${book.stok > 0 ? '' : 'empty'}">${book.stok}</span></td>
                    <td>
                        <div class="actions">
                            <button class="btn btn-outline btn-sm" onclick='openModal(JSON.parse(this.dataset.book))' data-book="${bookJson}" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="deleteBook(${book.id_buku})" title="Hapus">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="7" style="color: var(--danger); text-align: center;">Error: ${error.message}</td></tr>`;
    }
}

async function handleBookSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('bookId').value;
    const coverFile = document.getElementById('cover').files[0];

    const formData = new FormData();
    formData.append('judul', document.getElementById('judul').value);
    formData.append('penulis', document.getElementById('penulis').value);
    formData.append('penerbit', document.getElementById('penerbit').value);
    formData.append('tahun', document.getElementById('tahun').value);
    formData.append('stok', document.getElementById('stok').value);
    formData.append('deskripsi', document.getElementById('deskripsi').value);
    
    if (coverFile) {
        formData.append('cover', coverFile);
    }

    try {
        if (id) {
            await fetchFormData(`/books/${id}`, formData, 'PUT');
            showAlert('Buku berhasil diperbarui');
        } else {
            await fetchFormData('/books', formData, 'POST');
            showAlert('Buku berhasil ditambahkan');
        }
        closeModal();
        loadBooksTable();
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

async function deleteBook(id) {
    if (confirm('Apakah Anda yakin ingin menghapus buku ini?')) {
        try {
            await fetchAPI(`/books/${id}`, { method: 'DELETE' });
            showAlert('Buku berhasil dihapus');
            loadBooksTable();
        } catch (error) {
            showAlert(error.message, 'error');
        }
    }
}
