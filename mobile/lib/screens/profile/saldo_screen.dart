import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/saldo_provider.dart';
import '../../utils/constants.dart';
import '../../utils/helpers.dart';

class SaldoScreen extends StatelessWidget {
  const SaldoScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<SaldoProvider>();

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Saldo & Denda'),
          bottom: const TabBar(
            indicatorColor: AppColors.primary,
            tabs: [
              Tab(text: 'Denda Belum Dibayar'),
              Tab(text: 'Riwayat Transaksi'),
            ],
          ),
        ),
        body: provider.isLoading
            ? const Center(child: CircularProgressIndicator())
            : TabBarView(
                children: [
                  // Tab 1: Denda
                  provider.unpaidDendaCount == 0
                      ? const Center(child: Text('Tidak ada denda yang belum dibayar! 🎉', style: TextStyle(color: AppColors.success)))
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: provider.dendaList.length,
                          itemBuilder: (context, index) {
                            final denda = provider.dendaList[index];
                            if (denda.dendaDibayar == 1) return const SizedBox.shrink(); // hide paid

                            return Card(
                              child: ListTile(
                                leading: const Icon(Icons.warning_amber_rounded, color: AppColors.error, size: 32),
                                title: Text(denda.judul ?? 'Buku'),
                                subtitle: Text('Kembali: ${Helpers.formatDate(denda.tglKembaliReal)}'),
                                trailing: ElevatedButton(
                                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
                                  onPressed: () async {
                                    try {
                                      await context.read<SaldoProvider>().bayarDenda(denda.idPengembalian);
                                      if (context.mounted) Helpers.showSnackBar(context, 'Berhasil membayar denda');
                                    } catch (e) {
                                      if (context.mounted) Helpers.showSnackBar(context, e.toString(), isError: true);
                                    }
                                  },
                                  child: Text('Bayar ${Helpers.formatCurrency(denda.denda)}'),
                                ),
                              ),
                            );
                          },
                        ),

                  // Tab 2: History
                  provider.history.isEmpty
                      ? const Center(child: Text('Belum ada transaksi', style: TextStyle(color: AppColors.textSecondary)))
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: provider.history.length,
                          itemBuilder: (context, index) {
                            final tx = provider.history[index];
                            final isTopup = tx.jenis == 'topup';
                            
                            return ListTile(
                              leading: CircleAvatar(
                                backgroundColor: isTopup ? AppColors.success.withOpacity(0.2) : AppColors.error.withOpacity(0.2),
                                child: Icon(
                                  isTopup ? Icons.arrow_downward : Icons.arrow_upward,
                                  color: isTopup ? AppColors.success : AppColors.error,
                                ),
                              ),
                              title: Text(
                                tx.keterangan != null && tx.keterangan!.isNotEmpty
                                    ? tx.keterangan!
                                    : (isTopup ? 'Top Up Saldo' : 'Pembayaran Denda'),
                              ),
                              subtitle: Text(Helpers.formatDate(tx.createdAt)),
                              trailing: Text(
                                '${isTopup ? '+' : '-'} ${Helpers.formatCurrency(tx.jumlah)}',
                                style: TextStyle(
                                  color: isTopup ? AppColors.success : AppColors.error,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                            );
                          },
                        ),
                ],
              ),
      ),
    );
  }
}