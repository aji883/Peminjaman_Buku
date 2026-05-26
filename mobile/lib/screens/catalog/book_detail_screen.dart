import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
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
      if (mounted) Helpers.showSnackBar(context, e.toString().replaceAll('Exception: ', ''), isError: true);
    }
  }

  Future<void> _joinWaitingList() async {
    try {
      await WaitingListService.joinWaitingList(widget.book.idBuku);
      if (mounted) Helpers.showSnackBar(context, 'Berhasil masuk daftar tunggu!');
    } catch (e) {
      if (mounted) Helpers.showSnackBar(context, e.toString().replaceAll('Exception: ', ''), isError: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final savedProvider = context.watch<SavedProvider>();
    final isSaved = savedProvider.isBookSaved(widget.book.idBuku);
    final isAvailable = _availability?['available'] == true;
    final catColor = Helpers.getCategoryColor(widget.book.kategori);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 320,
            pinned: true,
            backgroundColor: AppColors.card,
            leading: IconButton(
              icon: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.9), shape: BoxShape.circle),
                child: const Icon(Icons.arrow_back, color: AppColors.textDark, size: 20),
              ),
              onPressed: () => Navigator.pop(context),
            ),
            actions: [
              IconButton(
                icon: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.9), shape: BoxShape.circle),
                  child: Icon(isSaved ? Icons.bookmark : Icons.bookmark_border,
                    color: isSaved ? AppColors.accent : AppColors.textDark, size: 20),
                ),
                onPressed: () => savedProvider.toggleSave(widget.book.idBuku),
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: widget.book.coverUrl != null
                  ? Image.network(widget.book.coverUrl!, fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        decoration: const BoxDecoration(gradient: LinearGradient(colors: [AppColors.featured, AppColors.featured2])),
                        child: Center(child: Text(widget.book.judul[0], style: GoogleFonts.poppins(fontSize: 72, fontWeight: FontWeight.w800, color: Colors.white.withValues(alpha: 0.3)))),
                      ))
                  : Container(
                      decoration: const BoxDecoration(gradient: LinearGradient(colors: [AppColors.featured, AppColors.featured2])),
                      child: Center(child: Text(widget.book.judul[0], style: GoogleFonts.poppins(fontSize: 72, fontWeight: FontWeight.w800, color: Colors.white.withValues(alpha: 0.3)))),
                    ),
            ),
          ),

          SliverToBoxAdapter(
            child: Container(
              color: AppColors.card,
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Category & availability badges
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(color: catColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(6)),
                        child: Text(widget.book.kategori, style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w700, color: catColor, letterSpacing: 0.5)),
                      ),
                      const Spacer(),
                      if (!_isLoading)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: isAvailable ? AppColors.success.withValues(alpha: 0.1) : AppColors.danger.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(isAvailable ? Icons.check_circle : Icons.cancel, size: 14,
                                color: isAvailable ? AppColors.success : AppColors.danger),
                              const SizedBox(width: 4),
                              Text(isAvailable ? '${_availability?['stok']} Tersedia' : 'Stok Habis',
                                style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w600,
                                  color: isAvailable ? AppColors.success : AppColors.danger)),
                            ],
                          ),
                        ),
                    ],
                  ).animate().fadeIn(),

                  const SizedBox(height: 16),
                  Text(widget.book.judul, style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.textDark)).animate().fadeIn(delay: 100.ms),
                  const SizedBox(height: 6),
                  Text(widget.book.penulis ?? 'Penulis tidak diketahui', style: GoogleFonts.poppins(fontSize: 14, color: AppColors.textMedium)).animate().fadeIn(delay: 150.ms),
                ],
              ),
            ),
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Info cards row
                  Row(
                    children: [
                      _infoTile(Icons.apartment, 'Penerbit', widget.book.penerbit ?? '-'),
                      const SizedBox(width: 12),
                      _infoTile(Icons.calendar_today, 'Tahun', widget.book.tahun?.toString() ?? '-'),
                      const SizedBox(width: 12),
                      _infoTile(Icons.inventory_2, 'Stok', widget.book.stok.toString()),
                    ],
                  ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1),

                  const SizedBox(height: 24),

                  // Description
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(color: AppColors.card, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Deskripsi', style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textDark)),
                        const SizedBox(height: 8),
                        Text(widget.book.deskripsi ?? 'Tidak ada deskripsi untuk buku ini.',
                          style: GoogleFonts.poppins(fontSize: 13, color: AppColors.textMedium, height: 1.6)),
                      ],
                    ),
                  ).animate().fadeIn(delay: 300.ms),

                  // Availability info for out of stock
                  if (!isAvailable && _availability?['earliest_return'] != null)
                    Container(
                      width: double.infinity,
                      margin: const EdgeInsets.only(top: 16),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFF8E1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.warning.withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.schedule, color: AppColors.warning, size: 20),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Estimasi Tersedia Kembali', style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textDark)),
                                Text(Helpers.formatDate(_availability!['earliest_return']),
                                  style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.accent)),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ).animate().fadeIn(delay: 400.ms),

                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),
        ],
      ),

      // Bottom action bar
      bottomSheet: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.card,
          border: Border(top: BorderSide(color: AppColors.border)),
        ),
        child: SafeArea(
          child: SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: isAvailable ? AppColors.accent : AppColors.warning,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onPressed: _isLoading ? null : () {
                if (isAvailable) {
                  _borrowBook();
                } else {
                  _joinWaitingList();
                }
              },
              icon: Icon(isAvailable ? Icons.volunteer_activism : Icons.access_time, size: 20),
              label: Text(
                isAvailable ? 'Pinjam Buku Ini' : 'Masuk Daftar Tunggu',
                style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 15),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _infoTile(IconData icon, String label, String value) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            Icon(icon, size: 20, color: AppColors.accent),
            const SizedBox(height: 8),
            Text(label, style: GoogleFonts.poppins(fontSize: 11, color: AppColors.textLight)),
            const SizedBox(height: 2),
            Text(value, style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textDark), textAlign: TextAlign.center, maxLines: 1, overflow: TextOverflow.ellipsis),
          ],
        ),
      ),
    );
  }
}