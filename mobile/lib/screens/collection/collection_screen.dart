import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../providers/book_provider.dart';
import '../../utils/constants.dart';
import '../../utils/helpers.dart';
import '../../widgets/book_card.dart';

class CollectionScreen extends StatelessWidget {
  const CollectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<BookProvider>();
    final categories = provider.categories.where((c) => c != 'Semua').toList();

    // Get ALL books (not filtered)
    // We use filteredBooks since search might be applied
    final allBooks = provider.filteredBooks;

    return Scaffold(
      appBar: AppBar(
        title: Text('Koleksi Kategori', style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.textDark)),
      ),
      body: provider.isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.accent))
          : ListView.builder(
              padding: const EdgeInsets.only(bottom: 24),
              itemCount: categories.length,
              itemBuilder: (context, index) {
                final category = categories[index];
                final booksInCategory = allBooks.where((b) => b.kategori.toLowerCase() == category.toLowerCase()).toList();

                if (booksInCategory.isEmpty) return const SizedBox.shrink();

                final catColor = Helpers.getCategoryColor(category);

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 20, 16, 12),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: catColor.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Icon(Helpers.getCategoryIcon(category), color: catColor, size: 20),
                          ),
                          const SizedBox(width: 12),
                          Text(
                            category[0].toUpperCase() + category.substring(1),
                            style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textDark),
                          ),
                          const Spacer(),
                          Text('${booksInCategory.length} Buku',
                            style: GoogleFonts.poppins(fontSize: 12, color: AppColors.textLight)),
                        ],
                      ),
                    ).animate().fadeIn(delay: (index * 80).ms),
                    SizedBox(
                      height: 260,
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
                          ).animate().fadeIn(delay: (bIndex * 60).ms).slideX(begin: 0.1);
                        },
                      ),
                    ),
                    if (index < categories.length - 1)
                      Divider(color: AppColors.border, indent: 16, endIndent: 16, height: 8),
                  ],
                );
              },
            ),
    );
  }
}