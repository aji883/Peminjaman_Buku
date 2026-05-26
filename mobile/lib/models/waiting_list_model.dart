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