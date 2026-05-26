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
    return '${ApiConfig.uploadsUrl}/$cover';
  }
}