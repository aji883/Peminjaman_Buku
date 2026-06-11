import '../utils/helpers.dart';

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
      idUser: json['id_user'] ?? json['id'] ?? 0,
      nama: json['nama'] ?? '',
      email: json['email'] ?? '',
      saldo: Helpers.parseDouble(json['saldo']),
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