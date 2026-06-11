import 'api_service.dart';
import '../config/api_config.dart';
import '../models/book_model.dart';

class BookService {
  static Future<List<BookModel>> getAllBooks() async {
    final response = await ApiService.get(ApiConfig.books);
    final List<dynamic> data = response;
    return data.map((json) => BookModel.fromJson(json)).toList();
  }

  static Future<BookModel> getBook(int id) async {
    final response = await ApiService.get('${ApiConfig.books}/$id');
    return BookModel.fromJson(response);
  }

  static Future<Map<String, dynamic>> checkAvailability(int id) async {
    return await ApiService.get(ApiConfig.bookAvailability(id));
  }

  static Future<List<BookModel>> getSavedBooks() async {
    final response = await ApiService.get(ApiConfig.savedBooks, auth: true);
    final List<dynamic> data = response;
    return data.map((json) => BookModel.fromJson(json)).toList();
  }

  static Future<void> saveBook(int bookId) async {
    await ApiService.post(ApiConfig.savedBooks, {'id_buku': bookId}, auth: true);
  }

  static Future<void> removeSavedBook(int bookId) async {
    await ApiService.delete(ApiConfig.deleteSavedBook(bookId), auth: true);
  }
}