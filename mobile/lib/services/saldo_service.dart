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