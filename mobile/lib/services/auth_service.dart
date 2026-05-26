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