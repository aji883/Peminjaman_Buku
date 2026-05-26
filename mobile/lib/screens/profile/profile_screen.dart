import 'dart:math' show pi;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../providers/auth_provider.dart';
import '../../providers/saldo_provider.dart';
import '../../utils/constants.dart';
import '../../utils/helpers.dart';
import '../auth/login_screen.dart';
import 'loan_history_screen.dart';
import 'saldo_screen.dart';
import 'edit_profile_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _showCardBack = false;
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
            AspectRatio(
              aspectRatio: 1.58 / 1,
              child: GestureDetector(
                onTap: () {
                  setState(() {
                    _showCardBack = !_showCardBack;
                  });
                },
                child: TweenAnimationBuilder<double>(
                  tween: Tween<double>(begin: 0, end: _showCardBack ? pi : 0),
                  duration: const Duration(milliseconds: 600),
                  builder: (context, val, __) {
                    final isBack = val >= pi / 2;
                    return Transform(
                      alignment: Alignment.center,
                      transform: Matrix4.identity()
                        ..setEntry(3, 2, 0.001) // perspective
                        ..rotateY(val),
                      child: isBack
                          ? Transform(
                              alignment: Alignment.center,
                              transform: Matrix4.identity()..rotateY(pi),
                              child: _buildCardBack(user),
                            )
                          : _buildCardFront(user, saldoProvider),
                    );
                  },
                ),
              ),
            ).animate().fadeIn().slideY(),
            const SizedBox(height: 8),
            Center(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.touch_app, size: 14, color: AppColors.textLight),
                  const SizedBox(width: 4),
                  Text(
                    'Tekan kartu untuk melihat detail belakang',
                    style: GoogleFonts.poppins(
                      color: AppColors.textLight,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
            
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
                        child: Text('${saldoProvider.unpaidDendaCount} Denda', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
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
              Navigator.push(context, MaterialPageRoute(builder: (_) => const EditProfileScreen()));
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

  Widget _buildCardFront(dynamic user, SaldoProvider saldoProvider) {
    final memberIdStr = 'PO-MEMBER-${user.idUser.toString().padLeft(4, '0')}';
    return Container(
      width: double.infinity,
      height: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF3A2E2B), Color(0xFF1A1210)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.accent.withValues(alpha: 0.25), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF1A1210).withValues(alpha: 0.4),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.menu_book, color: AppColors.accent, size: 18),
                  const SizedBox(width: 8),
                  Text(
                    'PERPUSONLINE',
                    style: GoogleFonts.poppins(
                      color: AppColors.accent,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                      letterSpacing: 1,
                    ),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.accent.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(100),
                  border: Border.all(color: AppColors.accent.withValues(alpha: 0.3)),
                ),
                child: Text(
                  'ANGGOTA AKTIF',
                  style: GoogleFonts.poppins(
                    color: AppColors.accent,
                    fontSize: 8,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 1.5,
                  ),
                ),
              ),
            ],
          ),
          const Spacer(),
          // Middle Section (ID & Name)
          Text(
            memberIdStr,
            style: GoogleFonts.spaceMono(
              color: const Color(0xFFF3EFE9),
              fontSize: 18,
              letterSpacing: 2,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            user.nama.toUpperCase(),
            style: GoogleFonts.poppins(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.5,
            ),
          ),
          const Spacer(),
          // Bottom Section (Saldo & Join Date)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'SALDO',
                    style: GoogleFonts.poppins(
                      color: Colors.white.withValues(alpha: 0.4),
                      fontSize: 8,
                      letterSpacing: 1,
                    ),
                  ),
                  Text(
                    Helpers.formatCurrency(saldoProvider.saldo),
                    style: GoogleFonts.spaceMono(
                      color: const Color(0xFFF1C40F),
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'BERGABUNG SEJAK',
                    style: GoogleFonts.poppins(
                      color: Colors.white.withValues(alpha: 0.4),
                      fontSize: 8,
                      letterSpacing: 1,
                    ),
                  ),
                  Text(
                    Helpers.formatJoinDate(user.createdAt),
                    style: GoogleFonts.poppins(
                      color: Colors.white.withValues(alpha: 0.9),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              // Pseudo Barcode lines
              Row(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Container(width: 2, height: 24, color: Colors.white.withValues(alpha: 0.8)),
                  const SizedBox(width: 2),
                  Container(width: 4, height: 24, color: Colors.white.withValues(alpha: 0.8)),
                  const SizedBox(width: 2),
                  Container(width: 1, height: 24, color: Colors.white.withValues(alpha: 0.8)),
                  const SizedBox(width: 2),
                  Container(width: 3, height: 24, color: Colors.white.withValues(alpha: 0.8)),
                  const SizedBox(width: 2),
                  Container(width: 2, height: 24, color: Colors.white.withValues(alpha: 0.8)),
                  const SizedBox(width: 2),
                  Container(width: 4, height: 24, color: Colors.white.withValues(alpha: 0.8)),
                  const SizedBox(width: 2),
                  Container(width: 1, height: 24, color: Colors.white.withValues(alpha: 0.8)),
                  const SizedBox(width: 2),
                  Container(width: 2, height: 24, color: Colors.white.withValues(alpha: 0.8)),
                ],
              )
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCardBack(dynamic user) {
    return Container(
      width: double.infinity,
      height: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 48, 20, 14), // top padding to leave room for magnetic strip
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF2D2321), Color(0xFF140E0C)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.accent.withValues(alpha: 0.25), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF140E0C).withValues(alpha: 0.4),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          // Magnetic Strip at the top absolute
          Positioned(
            top: -48,
            left: -20,
            right: -20,
            child: Container(
              height: 26,
              color: const Color(0xFF111111),
            ),
          ),
          // Back content
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Left Side (Chip & Rules)
              Expanded(
                flex: 4,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Gold metallic chip
                    Container(
                      width: 34,
                      height: 22,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFFF1C40F), Color(0xFFF39C12)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: Colors.black.withValues(alpha: 0.15)),
                      ),
                    ),
                    const Spacer(),
                    // Syarat & Ketentuan
                    Text(
                      'SYARAT & KETENTUAN:',
                      style: GoogleFonts.poppins(
                        color: AppColors.accent,
                        fontSize: 8,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 1),
                    Text(
                      '• Maksimal pinjam 3 buku sekaligus.\n'
                      '• Batas pinjam maksimal 7 hari.\n'
                      '• Terlambat denda Rp 1.000/hari.',
                      style: GoogleFonts.poppins(
                        color: Colors.white.withValues(alpha: 0.7),
                        fontSize: 7.5,
                        height: 1.25,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              // Right Side (Signature & Info)
              Expanded(
                flex: 3,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    // Signature Strip
                    Container(
                      width: 120,
                      height: 26,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF5F6FA),
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: Colors.black.withValues(alpha: 0.15)),
                      ),
                      child: Text(
                        user.nama,
                        style: GoogleFonts.caveat(
                          color: const Color(0xFF2F3640),
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const Spacer(),
                    // Contact Info
                    Text(
                      'PO-SUPPORT: (022) 1234-5678\nwww.perpusonline.id',
                      style: GoogleFonts.poppins(
                        color: Colors.white.withValues(alpha: 0.6),
                        fontSize: 7.5,
                        height: 1.25,
                      ),
                      textAlign: TextAlign.right,
                    ),
                  ],
                ),
              ),
            ],
          ),
          // Footer text
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.only(top: 4),
              decoration: BoxDecoration(
                border: Border(top: BorderSide(color: Colors.white.withValues(alpha: 0.1), width: 0.5)),
              ),
              child: Text(
                'Milik PerpusOnline. Harap kembalikan jika ditemukan.',
                style: GoogleFonts.poppins(
                  color: Colors.white.withValues(alpha: 0.4),
                  fontSize: 7,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
        ],
      ),
    );
  }
}