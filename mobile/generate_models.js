const fs = require('fs');
const path = require('path');

const libDir = 'd:\\peminjaman_buku\\mobile\\lib';

const files = {
  'models/user_model.dart': `
class UserModel {
  final int idUser;
  final String nama;
  final String email;
  final double saldo;
  final String? createdAt;

  UserModel({
    required this.idUser,
    required this.nama,
    required this.email,
    required this.saldo,
    this.createdAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      idUser: json['id_user'] ?? 0,
      nama: json['nama'] ?? '',
      email: json['email'] ?? '',
      saldo: (json['saldo'] ?? 0).toDouble(),
      createdAt: json['created_at'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id_user': idUser,
      'nama': nama,
      'email': email,
      'saldo': saldo,
      'created_at': createdAt,
    };
  }
}
`,
  'models/book_model.dart': `
import '../config/api_config.dart';

class BookModel {
  final int idBuku;
  final String judul;
  final String? penulis;
  final String? penerbit;
  final dynamic tahun;
  final int stok;
  final String? deskripsi;
  final String? cover;
  final String kategori;
  final String? createdAt;

  BookModel({
    required this.idBuku,
    required this.judul,
    this.penulis,
    this.penerbit,
    this.tahun,
    required this.stok,
    this.deskripsi,
    this.cover,
    required this.kategori,
    this.createdAt,
  });

  factory BookModel.fromJson(Map<String, dynamic> json) {
    return BookModel(
      idBuku: json['id_buku'] ?? 0,
      judul: json['judul'] ?? '',
      penulis: json['penulis'],
      penerbit: json['penerbit'],
      tahun: json['tahun'],
      stok: json['stok'] ?? 0,
      deskripsi: json['deskripsi'],
      cover: json['cover'],
      kategori: json['kategori'] ?? 'lainnya',
      createdAt: json['created_at'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id_buku': idBuku,
      'judul': judul,
      'penulis': penulis,
      'penerbit': penerbit,
      'tahun': tahun,
      'stok': stok,
      'deskripsi': deskripsi,
      'cover': cover,
      'kategori': kategori,
      'created_at': createdAt,
    };
  }

  String? get coverUrl {
    if (cover == null || cover!.isEmpty) return null;
    return '\${ApiConfig.uploadsUrl}/$cover';
  }
}
`,
  'models/loan_model.dart': `
class LoanModel {
  final int idPeminjaman;
  final int? idUser;
  final int? idBuku;
  final String? tglPinjam;
  final String? tglKembali;
  final String status;
  final int? approvedBy;
  final String? createdAt;
  final String? judul;
  final String? cover;

  LoanModel({
    required this.idPeminjaman,
    this.idUser,
    this.idBuku,
    this.tglPinjam,
    this.tglKembali,
    required this.status,
    this.approvedBy,
    this.createdAt,
    this.judul,
    this.cover,
  });

  factory LoanModel.fromJson(Map<String, dynamic> json) {
    return LoanModel(
      idPeminjaman: json['id_peminjaman'] ?? 0,
      idUser: json['id_user'],
      idBuku: json['id_buku'],
      tglPinjam: json['tgl_pinjam'],
      tglKembali: json['tgl_kembali'],
      status: json['status'] ?? 'diproses',
      approvedBy: json['approved_by'],
      createdAt: json['created_at'],
      judul: json['judul'],
      cover: json['cover'],
    );
  }
}
`,
  'models/saldo_model.dart': `
class SaldoTransaction {
  final int idTransaksi;
  final int? idUser;
  final String jenis;
  final double jumlah;
  final double saldoSebelum;
  final double saldoSesudah;
  final String? keterangan;
  final String? createdAt;

  SaldoTransaction({
    required this.idTransaksi,
    this.idUser,
    required this.jenis,
    required this.jumlah,
    required this.saldoSebelum,
    required this.saldoSesudah,
    this.keterangan,
    this.createdAt,
  });

  factory SaldoTransaction.fromJson(Map<String, dynamic> json) {
    return SaldoTransaction(
      idTransaksi: json['id_transaksi'] ?? 0,
      idUser: json['id_user'],
      jenis: json['jenis'] ?? '',
      jumlah: (json['jumlah'] ?? 0).toDouble(),
      saldoSebelum: (json['saldo_sebelum'] ?? 0).toDouble(),
      saldoSesudah: (json['saldo_sesudah'] ?? 0).toDouble(),
      keterangan: json['keterangan'],
      createdAt: json['created_at'],
    );
  }
}

class DendaItem {
  final int idPengembalian;
  final double denda;
  final String? tglKembaliReal;
  final int dendaDibayar;
  final String? judul;
  final String? tglKembali;

  DendaItem({
    required this.idPengembalian,
    required this.denda,
    this.tglKembaliReal,
    required this.dendaDibayar,
    this.judul,
    this.tglKembali,
  });

  factory DendaItem.fromJson(Map<String, dynamic> json) {
    return DendaItem(
      idPengembalian: json['id_pengembalian'] ?? 0,
      denda: (json['denda'] ?? 0).toDouble(),
      tglKembaliReal: json['tgl_kembali_real'],
      dendaDibayar: json['denda_dibayar'] ?? 0,
      judul: json['judul'],
      tglKembali: json['tgl_kembali'],
    );
  }
}
`,
  'models/waiting_list_model.dart': `
class WaitingListModel {
  final int idAntrian;
  final int? idUser;
  final int? idBuku;
  final String? tanggal;
  final String? createdAt;
  final String? judul;

  WaitingListModel({
    required this.idAntrian,
    this.idUser,
    this.idBuku,
    this.tanggal,
    this.createdAt,
    this.judul,
  });

  factory WaitingListModel.fromJson(Map<String, dynamic> json) {
    return WaitingListModel(
      idAntrian: json['id_antrian'] ?? 0,
      idUser: json['id_user'],
      idBuku: json['id_buku'],
      tanggal: json['tanggal'],
      createdAt: json['created_at'],
      judul: json['judul'],
    );
  }
}
`,
  'utils/constants.dart': `
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  static const Color primary = Color(0xFF1A73E8);
  static const Color background = Color(0xFF0F1923);
  static const Color surface = Color(0xFF1A2332);
  static const Color surfaceLight = Color(0xFF243447);
  static const Color accent = Color(0xFF00E5FF);
  static const Color success = Color(0xFF4CAF50);
  static const Color warning = Color(0xFFFFC107);
  static const Color error = Color(0xFFFF5252);
  
  static const Color textPrimary = Colors.white;
  static const Color textSecondary = Colors.white70;
  static const Color textMuted = Colors.white38;
}

class AppTheme {
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColors.background,
      primaryColor: AppColors.primary,
      colorScheme: const ColorScheme.dark(
        primary: AppColors.primary,
        secondary: AppColors.accent,
        surface: AppColors.surface,
        background: AppColors.background,
        error: AppColors.error,
      ),
      textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme).copyWith(
        titleLarge: GoogleFonts.inter(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
        titleMedium: GoogleFonts.inter(color: AppColors.textPrimary, fontWeight: FontWeight.w600),
        bodyLarge: GoogleFonts.inter(color: AppColors.textPrimary),
        bodyMedium: GoogleFonts.inter(color: AppColors.textSecondary),
      ),
      cardTheme: CardTheme(
        color: AppColors.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
          elevation: 0,
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.background,
        elevation: 0,
        centerTitle: true,
        iconTheme: IconThemeData(color: AppColors.textPrimary),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surfaceLight,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.error, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        labelStyle: const TextStyle(color: AppColors.textSecondary),
        hintStyle: const TextStyle(color: AppColors.textMuted),
      ),
    );
  }
}
`,
  'utils/helpers.dart': `
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'constants.dart';

class Helpers {
  static String formatCurrency(double amount) {
    final formatter = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);
    return formatter.format(amount);
  }

  static String formatDate(String? dateStr) {
    if (dateStr == null) return '-';
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('dd MMM yyyy').format(date);
    } catch (e) {
      return dateStr;
    }
  }

  static String formatDateRange(String? start, String? end) {
    if (start == null || end == null) return '-';
    try {
      final startDate = DateTime.parse(start);
      final endDate = DateTime.parse(end);
      return '\${DateFormat('dd MMM').format(startDate)} - \${DateFormat('dd MMM yyyy').format(endDate)}';
    } catch (e) {
      return '\$start - \$end';
    }
  }

  static Color getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'diproses': return AppColors.warning;
      case 'dipinjam': return AppColors.primary;
      case 'dikembalikan': return AppColors.success;
      case 'ditolak': return AppColors.error;
      default: return AppColors.textSecondary;
    }
  }

  static String getStatusText(String status) {
    switch (status.toLowerCase()) {
      case 'diproses': return 'Diproses';
      case 'dipinjam': return 'Dipinjam';
      case 'dikembalikan': return 'Dikembalikan';
      case 'ditolak': return 'Ditolak';
      default: return status;
    }
  }

  static IconData getCategoryIcon(String category) {
    switch (category.toLowerCase()) {
      case 'fiksi': return Icons.auto_awesome;
      case 'edukasi': return Icons.school;
      case 'sastra': return Icons.menu_book;
      case 'sejarah': return Icons.account_balance;
      case 'sains': return Icons.science;
      default: return Icons.book;
    }
  }

  static void showSnackBar(BuildContext context, String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message, style: const TextStyle(color: Colors.white)),
        backgroundColor: isError ? AppColors.error : AppColors.success,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }
}
`,
  'utils/local_storage.dart': `
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
`,
  'services/api_service.dart': `
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
        headers['Authorization'] = 'Bearer \$token';
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
        throw Exception('Server error: \${response.statusCode}');
      }
    }
  }

  static Future<dynamic> get(String endpoint, {bool auth = false}) async {
    final url = Uri.parse('\${ApiConfig.baseUrl}\$endpoint');
    final headers = await _getHeaders(auth: auth);
    
    final response = await http.get(url, headers: headers);
    _handleError(response);
    
    return jsonDecode(response.body);
  }

  static Future<dynamic> post(String endpoint, Map<String, dynamic> body, {bool auth = false}) async {
    final url = Uri.parse('\${ApiConfig.baseUrl}\$endpoint');
    final headers = await _getHeaders(auth: auth);
    
    final response = await http.post(url, headers: headers, body: jsonEncode(body));
    _handleError(response);
    
    return jsonDecode(response.body);
  }

  static Future<dynamic> put(String endpoint, Map<String, dynamic> body, {bool auth = false}) async {
    final url = Uri.parse('\${ApiConfig.baseUrl}\$endpoint');
    final headers = await _getHeaders(auth: auth);
    
    final response = await http.put(url, headers: headers, body: jsonEncode(body));
    _handleError(response);
    
    return jsonDecode(response.body);
  }
  
  static Future<dynamic> patch(String endpoint, Map<String, dynamic> body, {bool auth = false}) async {
    final url = Uri.parse('\${ApiConfig.baseUrl}\$endpoint');
    final headers = await _getHeaders(auth: auth);
    
    final response = await http.patch(url, headers: headers, body: jsonEncode(body));
    _handleError(response);
    
    return jsonDecode(response.body);
  }

  static Future<dynamic> delete(String endpoint, {bool auth = false}) async {
    final url = Uri.parse('\${ApiConfig.baseUrl}\$endpoint');
    final headers = await _getHeaders(auth: auth);
    
    final response = await http.delete(url, headers: headers);
    _handleError(response);
    
    return jsonDecode(response.body);
  }
}
`,
  'services/auth_service.dart': `
import 'api_service.dart';
import '../config/api_config.dart';
import '../models/user_model.dart';
import '../utils/local_storage.dart';

class AuthService {
  static Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await ApiService.post(ApiConfig.login, {
      'email': email,
      'password': password,
    });
    
    final token = response['token'];
    final user = response['user'];
    
    if (token != null) {
      await LocalStorage.saveToken(token);
    }
    if (user != null) {
      await LocalStorage.saveUserInfo(user);
    }
    
    return response;
  }

  static Future<void> register(String nama, String email, String password) async {
    await ApiService.post(ApiConfig.register, {
      'nama': nama,
      'email': email,
      'password': password,
    });
  }

  static Future<UserModel> getProfile() async {
    final response = await ApiService.get(ApiConfig.profile, auth: true);
    return UserModel.fromJson(response);
  }

  static Future<void> updateProfile({String? nama, String? currentPassword, String? newPassword}) async {
    final body = <String, dynamic>{};
    if (nama != null) body['nama'] = nama;
    if (currentPassword != null) body['currentPassword'] = currentPassword;
    if (newPassword != null) body['password'] = newPassword;
    
    await ApiService.put(ApiConfig.profile, body, auth: true);
  }

  static Future<bool> verifyPassword(String currentPassword) async {
    final response = await ApiService.post(ApiConfig.verifyPassword, {
      'currentPassword': currentPassword,
    }, auth: true);
    return response['valid'] == true;
  }

  static Future<void> logout() async {
    await LocalStorage.removeToken();
    await LocalStorage.removeUserInfo();
  }

  static Future<bool> isLoggedIn() async {
    final token = await LocalStorage.getToken();
    return token != null;
  }
}
`,
  'services/book_service.dart': `
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
    final response = await ApiService.get('\${ApiConfig.books}/\$id');
    return BookModel.fromJson(response);
  }

  static Future<Map<String, dynamic>> checkAvailability(int id) async {
    return await ApiService.get(ApiConfig.bookAvailability(id));
  }
}
`,
  'services/loan_service.dart': `
import 'api_service.dart';
import '../config/api_config.dart';
import '../models/loan_model.dart';

class LoanService {
  static Future<Map<String, dynamic>> createLoan(int idBuku, String tglPinjam, String tglKembali) async {
    return await ApiService.post(ApiConfig.loans, {
      'id_buku': idBuku,
      'tgl_pinjam': tglPinjam,
      'tgl_kembali': tglKembali,
    }, auth: true);
  }

  static Future<List<LoanModel>> getMyLoans() async {
    final response = await ApiService.get(ApiConfig.myLoans, auth: true);
    final List<dynamic> data = response;
    return data.map((json) => LoanModel.fromJson(json)).toList();
  }

  static Future<void> deleteLoan(int id) async {
    await ApiService.delete(ApiConfig.deleteLoan(id), auth: true);
  }
}
`,
  'services/saldo_service.dart': `
import 'api_service.dart';
import '../config/api_config.dart';
import '../models/saldo_model.dart';

class SaldoService {
  static Future<double> getSaldo() async {
    final response = await ApiService.get(ApiConfig.saldo, auth: true);
    return (response['saldo'] ?? 0).toDouble();
  }

  static Future<List<SaldoTransaction>> getHistory() async {
    final response = await ApiService.get(ApiConfig.saldoHistory, auth: true);
    final List<dynamic> data = response;
    return data.map((json) => SaldoTransaction.fromJson(json)).toList();
  }

  static Future<List<DendaItem>> getDenda() async {
    final response = await ApiService.get(ApiConfig.saldoDenda, auth: true);
    final List<dynamic> data = response;
    return data.map((json) => DendaItem.fromJson(json)).toList();
  }

  static Future<Map<String, dynamic>> bayarDenda(int idPengembalian) async {
    return await ApiService.post(ApiConfig.bayarDenda(idPengembalian), {}, auth: true);
  }
}
`,
  'services/waiting_list_service.dart': `
import 'api_service.dart';
import '../config/api_config.dart';
import '../models/waiting_list_model.dart';

class WaitingListService {
  static Future<Map<String, dynamic>> joinWaitingList(int idBuku) async {
    return await ApiService.post(ApiConfig.waitingList, {
      'id_buku': idBuku,
    }, auth: true);
  }

  static Future<List<WaitingListModel>> getMyWaitingList() async {
    final response = await ApiService.get(ApiConfig.myWaitingList, auth: true);
    final List<dynamic> data = response;
    return data.map((json) => WaitingListModel.fromJson(json)).toList();
  }
}
`
};

for (const [relPath, content] of Object.entries(files)) {
  const fullPath = path.join(libDir, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim());
}
console.log('Files generated successfully.');
