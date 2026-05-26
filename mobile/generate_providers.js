const fs = require('fs');
const path = require('path');

const libDir = 'd:\\peminjaman_buku\\mobile\\lib';

const files = {
  'providers/auth_provider.dart': `
import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  UserModel? _user;
  bool _isLoading = false;
  String? _error;
  bool _isLoggedIn = false;

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isLoggedIn => _isLoggedIn;

  Future<void> checkLoginStatus() async {
    _isLoading = true;
    notifyListeners();
    try {
      _isLoggedIn = await AuthService.isLoggedIn();
      if (_isLoggedIn) {
        await loadProfile();
      }
    } catch (e) {
      _error = e.toString();
      _isLoggedIn = false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final response = await AuthService.login(email, password);
      _user = UserModel.fromJson(response['user']);
      _isLoggedIn = true;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> register(String nama, String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      await AuthService.register(nama, email, password);
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadProfile() async {
    try {
      _user = await AuthService.getProfile();
      notifyListeners();
    } catch (e) {
      _error = e.toString();
    }
  }

  Future<void> logout() async {
    await AuthService.logout();
    _user = null;
    _isLoggedIn = false;
    notifyListeners();
  }
}
`,
  'providers/book_provider.dart': `
import 'package:flutter/material.dart';
import '../models/book_model.dart';
import '../services/book_service.dart';

class BookProvider extends ChangeNotifier {
  List<BookModel> _books = [];
  List<BookModel> _filteredBooks = [];
  bool _isLoading = false;
  String? _error;
  String _searchQuery = '';
  String _selectedCategory = 'Semua';

  List<BookModel> get filteredBooks => _filteredBooks;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String get selectedCategory => _selectedCategory;

  final List<String> categories = ['Semua', 'fiksi', 'edukasi', 'sastra', 'sejarah', 'sains', 'lainnya'];

  Future<void> loadBooks() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      _books = await BookService.getAllBooks();
      _applyFilters();
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void searchBooks(String query) {
    _searchQuery = query;
    _applyFilters();
  }

  void filterByCategory(String category) {
    _selectedCategory = category;
    _applyFilters();
  }

  void _applyFilters() {
    _filteredBooks = _books.where((book) {
      final matchesSearch = book.judul.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          (book.penulis?.toLowerCase().contains(_searchQuery.toLowerCase()) ?? false);
      final matchesCategory = _selectedCategory == 'Semua' || book.kategori.toLowerCase() == _selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    }).toList();
    notifyListeners();
  }

  Future<Map<String, dynamic>> checkAvailability(int id) async {
    return await BookService.checkAvailability(id);
  }
}
`,
  'providers/loan_provider.dart': `
import 'package:flutter/material.dart';
import '../models/loan_model.dart';
import '../services/loan_service.dart';

class LoanProvider extends ChangeNotifier {
  List<LoanModel> _loans = [];
  bool _isLoading = false;
  String? _error;

  List<LoanModel> get loans => _loans;
  bool get isLoading => _isLoading;
  String? get error => _error;

  int get activeLoans => _loans.where((l) => l.status == 'dipinjam').length;
  int get pendingLoans => _loans.where((l) => l.status == 'diproses').length;

  Future<void> loadMyLoans() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      _loans = await LoanService.getMyLoans();
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> createLoan(int idBuku, String tglPinjam, String tglKembali) async {
    _isLoading = true;
    notifyListeners();
    try {
      await LoanService.createLoan(idBuku, tglPinjam, tglKembali);
      await loadMyLoans();
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
`,
  'providers/saldo_provider.dart': `
import 'package:flutter/material.dart';
import '../models/saldo_model.dart';
import '../services/saldo_service.dart';

class SaldoProvider extends ChangeNotifier {
  double _saldo = 0;
  List<SaldoTransaction> _history = [];
  List<DendaItem> _dendaList = [];
  bool _isLoading = false;
  String? _error;

  double get saldo => _saldo;
  List<SaldoTransaction> get history => _history;
  List<DendaItem> get dendaList => _dendaList;
  bool get isLoading => _isLoading;
  String? get error => _error;

  int get unpaidDendaCount => _dendaList.where((d) => d.dendaDibayar == 0).length;

  Future<void> loadAll() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      _saldo = await SaldoService.getSaldo();
      _history = await SaldoService.getHistory();
      _dendaList = await SaldoService.getDenda();
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
`,
  'providers/saved_provider.dart': `
import 'package:flutter/material.dart';
import '../utils/local_storage.dart';

class SavedProvider extends ChangeNotifier {
  List<int> _savedBookIds = [];
  
  List<int> get savedBookIds => _savedBookIds;

  Future<void> loadSavedBooks() async {
    _savedBookIds = await LocalStorage.getSavedBooks();
    notifyListeners();
  }

  Future<void> toggleSave(int bookId) async {
    if (_savedBookIds.contains(bookId)) {
      await LocalStorage.removeBook(bookId);
      _savedBookIds.remove(bookId);
    } else {
      await LocalStorage.saveBook(bookId);
      _savedBookIds.add(bookId);
    }
    notifyListeners();
  }

  bool isBookSaved(int bookId) => _savedBookIds.contains(bookId);
}
`
};

for (const [relPath, content] of Object.entries(files)) {
  const fullPath = path.join(libDir, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim());
}
console.log('Providers generated successfully.');
