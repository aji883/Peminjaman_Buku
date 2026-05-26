import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../providers/auth_provider.dart';
import '../../utils/constants.dart';
import '../../utils/helpers.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _namaCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _obscure = true;

  Future<void> _register() async {
    final nama = _namaCtrl.text.trim();
    final email = _emailCtrl.text.trim();
    final password = _passwordCtrl.text.trim();
    if (nama.isEmpty || email.isEmpty || password.isEmpty) {
      Helpers.showSnackBar(context, 'Semua field harus diisi', isError: true);
      return;
    }
    try {
      await context.read<AuthProvider>().register(nama, email, password);
      if (mounted) {
        Helpers.showSnackBar(context, 'Registrasi berhasil! Silakan login.');
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) Helpers.showSnackBar(context, e.toString().replaceAll('Exception: ', ''), isError: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = context.watch<AuthProvider>().isLoading;

    return Scaffold(
      body: SingleChildScrollView(
        child: Column(
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(32, 80, 32, 48),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [AppColors.featured2, AppColors.featured, AppColors.featured3],
                  begin: Alignment.topRight,
                  end: Alignment.bottomLeft,
                ),
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(32),
                  bottomRight: Radius.circular(32),
                ),
              ),
              child: Column(
                children: [
                  const Icon(Icons.person_add_outlined, size: 56, color: Colors.white).animate().fadeIn().scale(),
                  const SizedBox(height: 16),
                  Text('Daftar Akun Baru', style: GoogleFonts.poppins(fontSize: 24, fontWeight: FontWeight.w800, color: Colors.white))
                      .animate().fadeIn(delay: 100.ms),
                  const SizedBox(height: 8),
                  Text('Bergabunglah dan jelajahi koleksi buku kami.', textAlign: TextAlign.center,
                    style: GoogleFonts.poppins(fontSize: 13, color: Colors.white.withValues(alpha: 0.85)),
                  ).animate().fadeIn(delay: 200.ms),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(28),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 8),
                  Text('Nama Lengkap', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.textMedium)),
                  const SizedBox(height: 6),
                  TextField(controller: _namaCtrl, style: GoogleFonts.poppins(color: AppColors.textDark, fontSize: 14),
                    decoration: const InputDecoration(hintText: 'Masukkan nama lengkap', prefixIcon: Icon(Icons.person_outline, color: AppColors.textLight, size: 20)),
                  ).animate().fadeIn(delay: 300.ms),
                  const SizedBox(height: 18),
                  Text('Email', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.textMedium)),
                  const SizedBox(height: 6),
                  TextField(controller: _emailCtrl, keyboardType: TextInputType.emailAddress, style: GoogleFonts.poppins(color: AppColors.textDark, fontSize: 14),
                    decoration: const InputDecoration(hintText: 'user@contoh.com', prefixIcon: Icon(Icons.email_outlined, color: AppColors.textLight, size: 20)),
                  ).animate().fadeIn(delay: 350.ms),
                  const SizedBox(height: 18),
                  Text('Password', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.textMedium)),
                  const SizedBox(height: 6),
                  TextField(controller: _passwordCtrl, obscureText: _obscure, style: GoogleFonts.poppins(color: AppColors.textDark, fontSize: 14),
                    decoration: InputDecoration(hintText: '••••••••', prefixIcon: const Icon(Icons.lock_outline, color: AppColors.textLight, size: 20),
                      suffixIcon: IconButton(icon: Icon(_obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined, color: AppColors.textLight, size: 20), onPressed: () => setState(() => _obscure = !_obscure)),
                    ),
                  ).animate().fadeIn(delay: 400.ms),
                  const SizedBox(height: 28),
                  SizedBox(height: 50,
                    child: ElevatedButton(
                      onPressed: isLoading ? null : _register,
                      child: isLoading
                          ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : Text('Daftar Sekarang', style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 15)),
                    ),
                  ).animate().fadeIn(delay: 500.ms),
                  const SizedBox(height: 24),
                  Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Text('Sudah punya akun? ', style: GoogleFonts.poppins(fontSize: 13, color: AppColors.textMedium)),
                    GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: Text('Masuk di sini', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.accent)),
                    ),
                  ]),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
