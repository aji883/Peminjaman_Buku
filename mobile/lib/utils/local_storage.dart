import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class LocalStorage {
  static const String _tokenKey = 'user_token';
  static const String _userKey = 'user_info';
  static const String _savedBooksKey = 'saved_books';

  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  static Future<void> removeToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
  }

  static Future<void> saveUserInfo(Map<String, dynamic> user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userKey, jsonEncode(user));
  }

  static Future<Map<String, dynamic>?> getUserInfo() async {
    final prefs = await SharedPreferences.getInstance();
    final userStr = prefs.getString(_userKey);
    if (userStr != null) {
      return jsonDecode(userStr);
    }
    return null;
  }

  static Future<void> removeUserInfo() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_userKey);
  }

  static Future<List<int>> getSavedBooks() async {
    final prefs = await SharedPreferences.getInstance();
    final booksStr = prefs.getStringList(_savedBooksKey) ?? [];
    return booksStr.map((e) => int.parse(e)).toList();
  }

  static Future<void> saveBook(int bookId) async {
    final prefs = await SharedPreferences.getInstance();
    final booksStr = prefs.getStringList(_savedBooksKey) ?? [];
    if (!booksStr.contains(bookId.toString())) {
      booksStr.add(bookId.toString());
      await prefs.setStringList(_savedBooksKey, booksStr);
    }
  }

  static Future<void> removeBook(int bookId) async {
    final prefs = await SharedPreferences.getInstance();
    final booksStr = prefs.getStringList(_savedBooksKey) ?? [];
    booksStr.remove(bookId.toString());
    await prefs.setStringList(_savedBooksKey, booksStr);
  }

  static Future<bool> isBookSaved(int bookId) async {
    final prefs = await SharedPreferences.getInstance();
    final booksStr = prefs.getStringList(_savedBooksKey) ?? [];
    return booksStr.contains(bookId.toString());
  }

  static Future<void> clearSavedBooks() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_savedBooksKey);
  }

  static Future<void> clearAll() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }
}