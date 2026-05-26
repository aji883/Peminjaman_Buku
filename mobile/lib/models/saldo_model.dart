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