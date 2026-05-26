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