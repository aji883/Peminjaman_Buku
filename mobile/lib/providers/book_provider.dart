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