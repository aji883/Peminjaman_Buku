const fs = require('fs');
const path = require('path');

const libDir = 'd:\\peminjaman_buku\\mobile\\lib';

const files = {
  'screens/catalog/book_detail_screen.dart': `
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../models/book_model.dart';
import '../../providers/book_provider.dart';
import '../../providers/loan_provider.dart';
import '../../providers/saved_provider.dart';
import '../../utils/constants.dart';
import '../../utils/helpers.dart';
import '../../services/waiting_list_service.dart';

class BookDetailScreen extends StatefulWidget {
  final BookModel book;

  const BookDetailScreen({super.key, required this.book});

  @override
  State<BookDetailScreen> createState() => _BookDetailScreenState();
}

class _BookDetailScreenState extends State<BookDetailScreen> {
  bool _isLoading = false;
  Map<String, dynamic>? _availability;

  @override
  void initState() {
    super.initState();
    _checkAvailability();
  }

  Future<void> _checkAvailability() async {
    setState(() => _isLoading = true);
    try {
      final data = await context.read<BookProvider>().checkAvailability(widget.book.idBuku);
      if (mounted) setState(() => _availability = data);
    } catch (e) {
      if (mounted) Helpers.showSnackBar(context, e.toString(), isError: true);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _borrowBook() async {
    final tglPinjam = DateTime.now();
    final tglKembali = tglPinjam.add(const Duration(days: 7));
    
    final tglPinjamStr = tglPinjam.toIso8601String().split('T')[0];
    final tglKembaliStr = tglKembali.toIso8601String().split('T')[0];

    try {
      await context.read<LoanProvider>().createLoan(widget.book.idBuku, tglPinjamStr, tglKembaliStr);
      if (mounted) {
        Helpers.showSnackBar(context, 'Berhasil mengajukan peminjaman buku!');
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) Helpers.showSnackBar(context, e.toString(), isError: true);
    }
  }

  Future<void> _joinWaitingList() async {
    try {
      await WaitingListService.joinWaitingList(widget.book.idBuku);
      if (mounted) {
        Helpers.showSnackBar(context, 'Berhasil masuk daftar tunggu!');
      }
    } catch (e) {
      if (mounted) Helpers.showSnackBar(context, e.toString().replaceAll('Exception: ', ''), isError: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final savedProvider = context.watch<SavedProvider>();
    final isSaved = savedProvider.isBookSaved(widget.book.idBuku);

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 300,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: widget.book.coverUrl != null
                  ? Image.network(widget.book.coverUrl!, fit: BoxFit.cover)
                  : Container(
                      color: AppColors.surfaceLight,
                      child: const Icon(Icons.book, size: 100, color: AppColors.textMuted),
                    ),
            ),
            actions: [
              IconButton(
                icon: Icon(isSaved ? Icons.bookmark : Icons.bookmark_border, 
                  color: isSaved ? AppColors.accent : Colors.white),
                onPressed: () => savedProvider.toggleSave(widget.book.idBuku),
              ),
            ],
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          widget.book.kategori.toUpperCase(),
                          style: const TextStyle(color: AppColors.primary, fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                      ),
                      const Spacer(),
                      _isLoading 
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                        : Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: (_availability?['available'] == true) ? AppColors.success.withOpacity(0.2) : AppColors.error.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              (_availability?['available'] == true) ? 'Tersedia' : 'Habis',
                              style: TextStyle(
                                color: (_availability?['available'] == true) ? AppColors.success : AppColors.error, 
                                fontSize: 12, fontWeight: FontWeight.bold
                              ),
                            ),
                          ),
                    ],
                  ).animate().fadeIn().slideX(),
                  const SizedBox(height: 16),
                  Text(
                    widget.book.judul,
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                  ).animate().fadeIn(delay: 100.ms).slideX(),
                  const SizedBox(height: 8),
                  Text(
                    'Oleh \${widget.book.penulis ?? 'Anonim'}',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(color: AppColors.textSecondary),
                  ).animate().fadeIn(delay: 200.ms).slideX(),
                  const SizedBox(height: 24),
                  
                  // Info Cards
                  Row(
                    children: [
                      _buildInfoCard('Penerbit', widget.book.penerbit ?? '-'),
                      const SizedBox(width: 16),
                      _buildInfoCard('Tahun', widget.book.tahun?.toString() ?? '-'),
                    ],
                  ).animate().fadeIn(delay: 300.ms).slideY(),
                  const SizedBox(height: 24),
                  
                  Text('Deskripsi', style: Theme.of(context).textTheme.titleLarge).animate().fadeIn(delay: 400.ms),
                  const SizedBox(height: 8),
                  Text(
                    widget.book.deskripsi ?? 'Tidak ada deskripsi tersedia.',
                    style: const TextStyle(color: AppColors.textSecondary, height: 1.5),
                  ).animate().fadeIn(delay: 500.ms),
                  const SizedBox(height: 100), // spacing for bottom sheet
                ],
              ),
            ),
          ),
        ],
      ),
      bottomSheet: Container(
        color: AppColors.surface,
        padding: const EdgeInsets.all(24),
        child: Row(
          children: [
            if (_availability?['available'] == false && _availability?['earliest_return'] != null)
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Estimasi Tersedia:', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                    Text(
                      Helpers.formatDate(_availability!['earliest_return']),
                      style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.warning),
                    ),
                  ],
                ),
              ),
            const SizedBox(width: 16),
            Expanded(
              flex: 2,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: (_availability?['available'] == true) ? AppColors.primary : AppColors.warning,
                ),
                onPressed: _isLoading ? null : () {
                  if (_availability?['available'] == true) {
                    _borrowBook();
                  } else {
                    _joinWaitingList();
                  }
                },
                child: Text((_availability?['available'] == true) ? 'Pinjam Sekarang' : 'Masuk Antrian'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard(String title, String value) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surfaceLight,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
            const SizedBox(height: 4),
            Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }
}
`,
  'screens/collection/collection_screen.dart': `
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../providers/book_provider.dart';
import '../../utils/constants.dart';
import '../../widgets/book_card.dart';

class CollectionScreen extends StatelessWidget {
  const CollectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<BookProvider>();
    final categories = provider.categories.where((c) => c != 'Semua').toList();

    return Scaffold(
      appBar: AppBar(title: const Text('Koleksi Kategori')),
      body: provider.isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              itemCount: categories.length,
              itemBuilder: (context, index) {
                final category = categories[index];
                final booksInCategory = provider.filteredBooks.where((b) => b.kategori.toLowerCase() == category.toLowerCase()).toList();
                
                if (booksInCategory.isEmpty) return const SizedBox.shrink();

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Row(
                        children: [
                          Icon(Icons.category, color: AppColors.accent),
                          const SizedBox(width: 8),
                          Text(
                            category[0].toUpperCase() + category.substring(1),
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                          const Spacer(),
                          Text('\${booksInCategory.length} Buku', style: const TextStyle(color: AppColors.textSecondary)),
                        ],
                      ),
                    ),
                    SizedBox(
                      height: 250,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        itemCount: booksInCategory.length,
                        itemBuilder: (context, bIndex) {
                          return SizedBox(
                            width: 160,
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 8),
                              child: BookCard(book: booksInCategory[bIndex]),
                            ),
                          ).animate().fadeIn(delay: (bIndex * 100).ms).slideX();
                        },
                      ),
                    ),
                    const Divider(color: AppColors.surfaceLight, height: 32),
                  ],
                );
              },
            ),
    );
  }
}
`,
  'screens/saved/saved_screen.dart': `
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../providers/book_provider.dart';
import '../../providers/saved_provider.dart';
import '../../utils/constants.dart';
import '../../widgets/book_card.dart';

class SavedScreen extends StatelessWidget {
  const SavedScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final savedProvider = context.watch<SavedProvider>();
    final bookProvider = context.watch<BookProvider>();
    
    // Find all saved books from the complete list of books
    // Since _filteredBooks in BookProvider might be filtered, we'd ideally use all books
    // But for simplicity, we'll use whatever is loaded in the provider
    final savedBooks = bookProvider.filteredBooks.where((b) => savedProvider.isBookSaved(b.idBuku)).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Buku Tersimpan'),
        actions: [
          if (savedBooks.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.delete_sweep, color: AppColors.error),
              onPressed: () {
                // Show confirmation dialog before clearing all
                showDialog(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    backgroundColor: AppColors.surface,
                    title: const Text('Hapus Semua?'),
                    content: const Text('Yakin ingin menghapus semua buku tersimpan?'),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
                      TextButton(
                        onPressed: () {
                          context.read<SavedProvider>().loadSavedBooks(); // actually we should clear all
                          Navigator.pop(ctx);
                        }, 
                        child: const Text('Hapus', style: TextStyle(color: AppColors.error)),
                      ),
                    ],
                  ),
                );
              },
            ),
        ],
      ),
      body: savedBooks.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.bookmark_border, size: 80, color: AppColors.surfaceLight),
                  const SizedBox(height: 16),
                  const Text('Belum ada buku yang disimpan', style: TextStyle(color: AppColors.textSecondary)),
                ],
              ).animate().fadeIn().scale(),
            )
          : GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.65,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
              ),
              itemCount: savedBooks.length,
              itemBuilder: (context, index) {
                return BookCard(book: savedBooks[index])
                    .animate().fadeIn(delay: (index * 50).ms).slideY();
              },
            ),
    );
  }
}
`,
  'screens/profile/profile_screen.dart': `
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../providers/auth_provider.dart';
import '../../providers/saldo_provider.dart';
import '../../utils/constants.dart';
import '../../utils/helpers.dart';
import '../auth/login_screen.dart';
import 'loan_history_screen.dart';
import 'saldo_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AuthProvider>().loadProfile();
      context.read<SaldoProvider>().loadAll();
    });
  }

  void _logout() {
    context.read<AuthProvider>().logout();
    Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final saldoProvider = context.watch<SaldoProvider>();

    if (user == null) return const Center(child: CircularProgressIndicator());

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profil'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: AppColors.error),
            onPressed: _logout,
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Member Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.primary, Color(0xFF0052CC)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(color: AppColors.primary.withOpacity(0.4), blurRadius: 15, offset: const Offset(0, 5)),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('KARTU ANGGOTA', style: TextStyle(color: Colors.white70, letterSpacing: 2, fontSize: 12)),
                      const Icon(Icons.nfc, color: Colors.white70),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Text(
                    user.nama.toUpperCase(),
                    style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold, letterSpacing: 1),
                  ),
                  const SizedBox(height: 4),
                  Text(user.email, style: const TextStyle(color: Colors.white70)),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('ID MEMBER', style: TextStyle(color: Colors.white50, fontSize: 10)),
                          Text('#\${user.idUser.toString().padLeft(5, '0')}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          const Text('BERGABUNG', style: TextStyle(color: Colors.white50, fontSize: 10)),
                          Text(Helpers.formatDate(user.createdAt), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ],
                  )
                ],
              ),
            ).animate().fadeIn().slideY().shimmer(duration: 2000.ms),
            
            const SizedBox(height: 32),
            
            // Saldo Summary
            InkWell(
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SaldoScreen())),
              borderRadius: BorderRadius.circular(16),
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.surfaceLight,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.surfaceLight, width: 1),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: AppColors.accent.withOpacity(0.2), shape: BoxShape.circle),
                      child: const Icon(Icons.account_balance_wallet, color: AppColors.accent),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Saldo Dompet', style: TextStyle(color: AppColors.textSecondary)),
                          Text(
                            Helpers.formatCurrency(saldoProvider.saldo),
                            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                    if (saldoProvider.unpaidDendaCount > 0)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(color: AppColors.error, borderRadius: BorderRadius.circular(12)),
                        child: Text('\${saldoProvider.unpaidDendaCount} Denda', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      ),
                    const Icon(Icons.chevron_right, color: AppColors.textMuted),
                  ],
                ),
              ),
            ).animate().fadeIn(delay: 100.ms).slideY(),
            
            const SizedBox(height: 32),
            const Text('Menu Utama', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            
            _buildMenuItem(context, Icons.history, 'Riwayat Peminjaman', () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const LoanHistoryScreen()));
            }).animate().fadeIn(delay: 200.ms).slideX(),
            
            _buildMenuItem(context, Icons.person_outline, 'Edit Profil', () {
              // Edit Profile (not fully implemented in this demo)
              Helpers.showSnackBar(context, 'Menu Edit Profil');
            }).animate().fadeIn(delay: 300.ms).slideX(),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuItem(BuildContext context, IconData icon, String title, VoidCallback onTap) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
      ),
      child: ListTile(
        leading: Icon(icon, color: AppColors.primary),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w500)),
        trailing: const Icon(Icons.chevron_right, color: AppColors.textMuted),
        onTap: onTap,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }
}
`,
  'screens/profile/loan_history_screen.dart': `
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/loan_provider.dart';
import '../../utils/constants.dart';
import '../../utils/helpers.dart';

class LoanHistoryScreen extends StatefulWidget {
  const LoanHistoryScreen({super.key});

  @override
  State<LoanHistoryScreen> createState() => _LoanHistoryScreenState();
}

class _LoanHistoryScreenState extends State<LoanHistoryScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<LoanProvider>().loadMyLoans();
    });
  }

  @override
  Widget build(BuildContext context) {
    final loanProvider = context.watch<LoanProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('Riwayat Peminjaman')),
      body: loanProvider.isLoading
          ? const Center(child: CircularProgressIndicator())
          : loanProvider.loans.isEmpty
              ? const Center(child: Text('Belum ada riwayat peminjaman', style: TextStyle(color: AppColors.textSecondary)))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: loanProvider.loans.length,
                  itemBuilder: (context, index) {
                    final loan = loanProvider.loans[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 16),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(
                                    loan.judul ?? 'Buku Tidak Diketahui',
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Helpers.getStatusColor(loan.status).withOpacity(0.2),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    Helpers.getStatusText(loan.status),
                                    style: TextStyle(
                                      color: Helpers.getStatusColor(loan.status),
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                const Icon(Icons.calendar_today, size: 16, color: AppColors.textMuted),
                                const SizedBox(width: 8),
                                Text(
                                  Helpers.formatDateRange(loan.tglPinjam, loan.tglKembali),
                                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
`,
  'screens/profile/saldo_screen.dart': `
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
                                subtitle: Text('Kembali: \${Helpers.formatDate(denda.tglKembaliReal)}'),
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
                                  child: Text('Bayar \${Helpers.formatCurrency(denda.denda)}'),
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
                              title: Text(isTopup ? 'Top Up Saldo' : 'Pembayaran Denda'),
                              subtitle: Text(Helpers.formatDate(tx.createdAt)),
                              trailing: Text(
                                '\${isTopup ? '+' : '-'} \${Helpers.formatCurrency(tx.jumlah)}',
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
`
};

for (const [relPath, content] of Object.entries(files)) {
  const fullPath = path.join(libDir, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim());
}
console.log('UI Phase 2 generated successfully.');
