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
                          context.read<SavedProvider>().clearAll();
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