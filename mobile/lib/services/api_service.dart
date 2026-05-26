import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../utils/local_storage.dart';

class ApiService {
  static Future<Map<String, String>> _getHeaders({bool auth = false}) async {
    final headers = {'Content-Type': 'application/json'};
    if (auth) {
      final token = await LocalStorage.getToken();
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
    }
    return headers;
  }

  static void _handleError(http.Response response) {
    if (response.statusCode >= 400) {
      try {
        final body = jsonDecode(response.body);
        throw Exception(body['message'] ?? 'An error occurred');
      } catch (e) {
        if (e is Exception && e.toString() != 'Exception: FormatException: Unexpected character') {
          rethrow;
        }
        throw Exception('Server error: ${response.statusCode}');
      }
    }
  }

  static Future<dynamic> get(String endpoint, {bool auth = false}) async {
    final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    final headers = await _getHeaders(auth: auth);
    
    final response = await http.get(url, headers: headers);
    _handleError(response);
    
    return jsonDecode(response.body);
  }

  static Future<dynamic> post(String endpoint, Map<String, dynamic> body, {bool auth = false}) async {
    final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    final headers = await _getHeaders(auth: auth);
    
    final response = await http.post(url, headers: headers, body: jsonEncode(body));
    _handleError(response);
    
    return jsonDecode(response.body);
  }

  static Future<dynamic> put(String endpoint, Map<String, dynamic> body, {bool auth = false}) async {
    final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    final headers = await _getHeaders(auth: auth);
    
    final response = await http.put(url, headers: headers, body: jsonEncode(body));
    _handleError(response);
    
    return jsonDecode(response.body);
  }
  
  static Future<dynamic> patch(String endpoint, Map<String, dynamic> body, {bool auth = false}) async {
    final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    final headers = await _getHeaders(auth: auth);
    
    final response = await http.patch(url, headers: headers, body: jsonEncode(body));
    _handleError(response);
    
    return jsonDecode(response.body);
  }

  static Future<dynamic> delete(String endpoint, {bool auth = false}) async {
    final url = Uri.parse('${ApiConfig.baseUrl}$endpoint');
    final headers = await _getHeaders(auth: auth);
    
    final response = await http.delete(url, headers: headers);
    _handleError(response);
    
    return jsonDecode(response.body);
  }
}