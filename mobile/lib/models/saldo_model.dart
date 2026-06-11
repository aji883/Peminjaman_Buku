import '../utils/helpers.dart';

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
      jumlah: Helpers.parseDouble(json['jumlah']),
      saldoSebelum: Helpers.parseDouble(json['saldo_sebelum']),
      saldoSesudah: Helpers.parseDouble(json['saldo_sesudah']),
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
      denda: Helpers.parseDouble(json['denda']),
      tglKembaliReal: json['tgl_kembali_real'],
      dendaDibayar: json['denda_dibayar'] ?? 0,
      judul: json['judul'],
      tglKembali: json['tgl_kembali'],
    );
  }
}