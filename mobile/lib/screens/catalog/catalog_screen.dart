import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../providers/book_provider.dart';
import '../../utils/constants.dart';
import '../../widgets/book_card.dart';

class CatalogScreen extends StatefulWidget {
  const CatalogScreen({super.key});

  @override
  State<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends State<CatalogScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<BookProvider>().loadBooks();
    });
  }

  @override
  Widget build(BuildContext context) {
    final bookProvider = context.watch<BookProvider>();

    return Scaffold(
      appBar: AppBar(
        title: Text('Katalog Buku', style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.textDark)),
      ),
      body: RefreshIndicator(
        color: AppColors.accent,
        onRefresh: () => context.read<BookProvider>().loadBooks(),
        child: Column(
          children: [
            // Search bar — matching web .search-box
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.inputBg,
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: Colors.transparent),
                ),
                child: TextField(
                  onChanged: (val) => context.read<BookProvider>().searchBooks(val),
                  style: GoogleFonts.poppins(fontSize: 14, color: AppColors.textDark),
                  decoration: InputDecoration(
                    hintText: 'Cari judul atau penulis...',
                    prefixIcon: const Icon(Icons.search, color: AppColors.textLight, size: 20),
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(vertical: 14),
                    fillColor: Colors.transparent,
                    filled: true,
                  ),
                ),
              ),
            ),

            // Category pills — matching web .pill-btn
            const SizedBox(height: 12),
            SizedBox(
              height: 36,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                itemCount: bookProvider.categories.length,
                itemBuilder: (context, index) {
                  final cat = bookProvider.categories[index];
                  final isSelected = cat == bookProvider.selectedCategory;
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: GestureDetector(
                      onTap: () => context.read<BookProvider>().filterByCategory(cat),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: isSelected ? AppColors.accent : AppColors.inputBg,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: isSelected ? AppColors.accent : AppColors.border),
                        ),
                        child: Text(
                          cat[0].toUpperCase() + cat.substring(1),
                          style: GoogleFonts.poppins(
                            fontSize: 13,
                            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                            color: isSelected ? Colors.white : AppColors.textMedium,
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),

            // Section title
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
              child: Row(
                children: [
                  Text(
                    bookProvider.selectedCategory == 'Semua'
                        ? 'Semua Buku'
                        : 'Kategori: ${bookProvider.selectedCategory[0].toUpperCase()}${bookProvider.selectedCategory.substring(1)}',
                    style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textDark),
                  ),
                  const Spacer(),
                  Text(
                    '${bookProvider.filteredBooks.length} buku',
                    style: GoogleFonts.poppins(fontSize: 12, color: AppColors.textLight),
                  ),
                ],
              ),
            ),

            // Book grid — matching web .book-grid
            Expanded(
              child: bookProvider.isLoading
                  ? const Center(child: CircularProgressIndicator(color: AppColors.accent))
                  : bookProvider.filteredBooks.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.search_off, size: 56, color: AppColors.textLight.withValues(alpha: 0.4)),
                              const SizedBox(height: 12),
                              Text('Tidak ada buku ditemukan.', style: GoogleFonts.poppins(color: AppColors.textLight)),
                            ],
                          ),
                        )
                      : GridView.builder(
                          padding: const EdgeInsets.all(16),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            childAspectRatio: 0.58,
                            crossAxisSpacing: 16,
                            mainAxisSpacing: 16,
                          ),
                          itemCount: bookProvider.filteredBooks.length,
                          itemBuilder: (context, index) {
                            return BookCard(book: bookProvider.filteredBooks[index])
                                .animate().fadeIn(delay: (index * 40).ms).slideY(begin: 0.08, end: 0);
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }
}