import 'package:flutter/material.dart';
import '../utils/local_storage.dart';
import '../services/book_service.dart';

class SavedProvider extends ChangeNotifier {
  List<int> _savedBookIds = [];
  bool _isLoading = false;
  
  List<int> get savedBookIds => _savedBookIds;
  bool get isLoading => _isLoading;

  Future<void> loadSavedBooks() async {
    _isLoading = true;
    notifyListeners();

    try {
      final token = await LocalStorage.getToken();
      if (token != null) {
        // Fetch from API
        final onlineBooks = await BookService.getSavedBooks();
        List<int> onlineIds = onlineBooks.map((b) => b.idBuku).toList();

        // Sync local saved books to server if any exist
        final localSaved = await LocalStorage.getSavedBooks();
        if (localSaved.isNotEmpty) {
          for (final bookId in localSaved) {
            if (!onlineIds.contains(bookId)) {
              try {
                await BookService.saveBook(bookId);
                onlineIds.add(bookId);
              } catch (e) {
                debugPrint('Failed to sync book $bookId: $e');
              }
            }
          }
          await LocalStorage.clearSavedBooks();
        }
        _savedBookIds = onlineIds;
      } else {
        // Load offline
        _savedBookIds = await LocalStorage.getSavedBooks();
      }
    } catch (e) {
      debugPrint('Error loading saved books: $e');
      // Fallback to local storage on error
      _savedBookIds = await LocalStorage.getSavedBooks();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> toggleSave(int bookId) async {
    try {
      final token = await LocalStorage.getToken();
      if (token != null) {
        if (_savedBookIds.contains(bookId)) {
          await BookService.removeSavedBook(bookId);
          _savedBookIds.remove(bookId);
        } else {
          await BookService.saveBook(bookId);
          _savedBookIds.add(bookId);
        }
      } else {
        if (_savedBookIds.contains(bookId)) {
          await LocalStorage.removeBook(bookId);
          _savedBookIds.remove(bookId);
        } else {
          await LocalStorage.saveBook(bookId);
          _savedBookIds.add(bookId);
        }
      }
    } catch (e) {
      debugPrint('Error toggling saved book: $e');
    } finally {
      notifyListeners();
    }
  }

  Future<void> clearAll() async {
    _isLoading = true;
    notifyListeners();

    try {
      final token = await LocalStorage.getToken();
      if (token != null) {
        final idsToDelete = List<int>.from(_savedBookIds);
        for (final bookId in idsToDelete) {
          try {
            await BookService.removeSavedBook(bookId);
          } catch (e) {
            debugPrint('Failed to delete book $bookId: $e');
          }
        }
      } else {
        await LocalStorage.clearSavedBooks();
      }
      _savedBookIds.clear();
    } catch (e) {
      debugPrint('Error clearing saved books: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  bool isBookSaved(int bookId) => _savedBookIds.contains(bookId);
}