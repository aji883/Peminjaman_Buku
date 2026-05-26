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
}