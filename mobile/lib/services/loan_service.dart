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