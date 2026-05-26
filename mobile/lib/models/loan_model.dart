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