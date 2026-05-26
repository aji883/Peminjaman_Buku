import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Design system matching the web frontend exactly.
/// Web CSS variables mapped to Flutter constants.
class AppColors {
  // --bg-main: #FAF7F2
  static const Color background = Color(0xFFFAF7F2);
  // --bg-card: #FFFFFF
  static const Color card = Color(0xFFFFFFFF);
  // --bg-input: #F0EDE8
  static const Color inputBg = Color(0xFFF0EDE8);
  // --bg-featured: #D4C5B2
  static const Color featured = Color(0xFFD4C5B2);
  // --bg-featured-2: #A8C5C8
  static const Color featured2 = Color(0xFFA8C5C8);
  // Featured 3
  static const Color featured3 = Color(0xFFC8B6A6);

  // --accent: #C4956A
  static const Color accent = Color(0xFFC4956A);
  // --accent-hover: #B07D52
  static const Color accentHover = Color(0xFFB07D52);
  // --primary: #5B4A3F
  static const Color primary = Color(0xFF5B4A3F);
  // --primary-light: #8B7355
  static const Color primaryLight = Color(0xFF8B7355);

  // --text-dark: #1A1A2E
  static const Color textDark = Color(0xFF1A1A2E);
  // --text-medium: #4A4A5A
  static const Color textMedium = Color(0xFF4A4A5A);
  // --text-light: #8A8A9A
  static const Color textLight = Color(0xFF8A8A9A);

  // --border: #E8E4DE
  static const Color border = Color(0xFFE8E4DE);

  // Status colors
  // --danger: #E74C3C
  static const Color danger = Color(0xFFE74C3C);
  // --success: #27AE60
  static const Color success = Color(0xFF27AE60);
  static const Color warning = Color(0xFFF39C12);

  // Category badge colors
  static const Color badgeFiction = Color(0xFF00B894);
  static const Color badgeEducation = Color(0xFF0984E3);
  static const Color badgeLiterature = Color(0xFF6C5CE7);
  static const Color badgeHistory = Color(0xFFE17055);
  static const Color badgeScience = Color(0xFFFD79A8);

  // Compatibility aliases
  static const Color error = danger;
  static const Color surface = card;
  static const Color surfaceLight = inputBg;
  static const Color textPrimary = textDark;
  static const Color textSecondary = textMedium;
  static const Color textMuted = textLight;
}

class AppTheme {
  static ThemeData get lightTheme {
    final base = ThemeData.light();
    return base.copyWith(
      useMaterial3: true,
      scaffoldBackgroundColor: AppColors.background,
      primaryColor: AppColors.accent,
      colorScheme: ColorScheme.light(
        primary: AppColors.accent,
        secondary: AppColors.primary,
        surface: AppColors.card,
        error: AppColors.danger,
        onPrimary: Colors.white,
        onSurface: AppColors.textDark,
      ),
      textTheme: GoogleFonts.poppinsTextTheme(base.textTheme).copyWith(
        headlineLarge: GoogleFonts.poppins(
          color: AppColors.textDark,
          fontWeight: FontWeight.w800,
          fontSize: 28,
        ),
        headlineMedium: GoogleFonts.poppins(
          color: AppColors.textDark,
          fontWeight: FontWeight.w700,
          fontSize: 22,
        ),
        headlineSmall: GoogleFonts.poppins(
          color: AppColors.textDark,
          fontWeight: FontWeight.w700,
          fontSize: 18,
        ),
        titleLarge: GoogleFonts.poppins(
          color: AppColors.textDark,
          fontWeight: FontWeight.w700,
          fontSize: 16,
        ),
        titleMedium: GoogleFonts.poppins(
          color: AppColors.textMedium,
          fontWeight: FontWeight.w500,
          fontSize: 14,
        ),
        bodyLarge: GoogleFonts.poppins(
          color: AppColors.textDark,
          fontSize: 14,
        ),
        bodyMedium: GoogleFonts.poppins(
          color: AppColors.textMedium,
          fontSize: 13,
        ),
        bodySmall: GoogleFonts.poppins(
          color: AppColors.textLight,
          fontSize: 12,
        ),
        labelSmall: GoogleFonts.poppins(
          color: AppColors.textLight,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
      cardTheme: CardThemeData(
        color: AppColors.card,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: AppColors.border, width: 1),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.accent,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
          elevation: 0,
          textStyle: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 14),
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.background,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        iconTheme: const IconThemeData(color: AppColors.textDark),
        titleTextStyle: GoogleFonts.poppins(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: AppColors.textDark,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.inputBg,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.border, width: 1.5),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.border, width: 1.5),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: AppColors.accent, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        labelStyle: GoogleFonts.poppins(color: AppColors.textMedium, fontSize: 13),
        hintStyle: GoogleFonts.poppins(color: AppColors.textLight, fontSize: 13),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.card,
        selectedItemColor: AppColors.accent,
        unselectedItemColor: AppColors.textLight,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
      dividerColor: AppColors.border,
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.inputBg,
        selectedColor: AppColors.accent,
        labelStyle: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w500),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        side: const BorderSide(color: AppColors.border),
      ),
    );
  }
}