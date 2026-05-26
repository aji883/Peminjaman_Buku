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