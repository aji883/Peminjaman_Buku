import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'constants.dart';

class Helpers {
  static String formatCurrency(double amount) {
    final formatter = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);
    return formatter.format(amount);
  }

  static double parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is num) return value.toDouble();
    if (value is String) {
      return double.tryParse(value) ?? 0.0;
    }
    return 0.0;
  }

  static String formatDate(String? dateStr) {
    if (dateStr == null) return '-';
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('dd MMM yyyy').format(date);
    } catch (e) {
      return dateStr;
    }
  }

  static String formatJoinDate(String? dateStr) {
    if (dateStr == null) return '-';
    try {
      final date = DateTime.parse(dateStr);
      final monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      return '${monthNames[date.month - 1]} ${date.year}';
    } catch (e) {
      return dateStr;
    }
  }

  static String formatDateRange(String? start, String? end) {
    if (start == null || end == null) return '-';
    try {
      final startDate = DateTime.parse(start);
      final endDate = DateTime.parse(end);
      return '${DateFormat('dd MMM').format(startDate)} - ${DateFormat('dd MMM yyyy').format(endDate)}';
    } catch (e) {
      return '$start - $end';
    }
  }

  static Color getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'diproses': return AppColors.warning;
      case 'dipinjam': return AppColors.accent;
      case 'dikembalikan': return AppColors.success;
      case 'ditolak': return AppColors.danger;
      default: return AppColors.textLight;
    }
  }

  static String getStatusText(String status) {
    switch (status.toLowerCase()) {
      case 'diproses': return 'Diproses';
      case 'dipinjam': return 'Dipinjam';
      case 'dikembalikan': return 'Dikembalikan';
      case 'ditolak': return 'Ditolak';
      default: return status;
    }
  }

  static Color getCategoryColor(String category) {
    switch (category.toLowerCase()) {
      case 'fiksi': return AppColors.badgeFiction;
      case 'edukasi': return AppColors.badgeEducation;
      case 'sastra': return AppColors.badgeLiterature;
      case 'sejarah': return AppColors.badgeHistory;
      case 'sains': return AppColors.badgeScience;
      default: return AppColors.accent;
    }
  }

  static IconData getCategoryIcon(String category) {
    switch (category.toLowerCase()) {
      case 'fiksi': return Icons.auto_awesome;
      case 'edukasi': return Icons.school;
      case 'sastra': return Icons.menu_book;
      case 'sejarah': return Icons.account_balance;
      case 'sains': return Icons.science;
      default: return Icons.book;
    }
  }

  static void showSnackBar(BuildContext context, String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message, style: const TextStyle(color: Colors.white)),
        backgroundColor: isError ? AppColors.danger : AppColors.success,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        margin: const EdgeInsets.all(16),
      ),
    );
  }
}