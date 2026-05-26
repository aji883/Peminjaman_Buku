import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../providers/auth_provider.dart';
import '../../services/auth_service.dart';
import '../../utils/constants.dart';
import '../../utils/helpers.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _isPasswordVerified = false;
  bool _isLoading = false;
  bool _isVerifyingPassword = false;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthProvider>().user;
    if (user != null) {
      _nameController.text = user.nama;
      _emailController.text = user.email;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _verifyCurrentPassword() async {
    final currentPw = _currentPasswordController.text.trim();
    if (currentPw.isEmpty) {
      Helpers.showSnackBar(context, 'Masukkan password saat ini terlebih dahulu.', isError: true);
      return;
    }

    setState(() => _isVerifyingPassword = true);
    try {
      final isValid = await AuthService.verifyPassword(currentPw);
      if (isValid) {
        setState(() => _isPasswordVerified = true);
        if (mounted) {
          Helpers.showSnackBar(context, 'Password valid. Silakan masukkan password baru.');
        }
      } else {
        if (mounted) {
          Helpers.showSnackBar(context, 'Password saat ini salah.', isError: true);
        }
      }
    } catch (e) {
      if (mounted) {
        Helpers.showSnackBar(context, e.toString().replaceAll('Exception: ', ''), isError: true);
      }
    } finally {
      if (mounted) setState(() => _isVerifyingPassword = false);
    }
  }

  Future<void> _updateProfile() async {
    if (!_formKey.currentState!.validate()) return;

    final name = _nameController.text.trim();
    final currentPassword = _currentPasswordController.text;
    final newPassword = _newPasswordController.text;
    final confirmPassword = _confirmPasswordController.text;

    if (newPassword.isNotEmpty) {
      if (currentPassword.isEmpty) {
        Helpers.showSnackBar(context, 'Masukkan password saat ini terlebih dahulu untuk mengubah password.', isError: true);
        return;
      }
      if (newPassword.length < 6) {
        Helpers.showSnackBar(context, 'Password baru minimal harus 6 karakter.', isError: true);
        return;
      }
      if (newPassword != confirmPassword) {
        Helpers.showSnackBar(context, 'Konfirmasi password tidak cocok.', isError: true);
        return;
      }
    }

    setState(() => _isLoading = true);
    try {
      await AuthService.updateProfile(
        nama: name,
        currentPassword: newPassword.isNotEmpty ? currentPassword : null,
        newPassword: newPassword.isNotEmpty ? newPassword : null,
      );

      if (mounted) {
        // Reload user profile in provider
        await context.read<AuthProvider>().loadProfile();
        if (mounted) {
          Helpers.showSnackBar(context, 'Profil berhasil diperbarui!');
          Navigator.pop(context);
        }
      }
    } catch (e) {
      if (mounted) {
        Helpers.showSnackBar(context, e.toString().replaceAll('Exception: ', ''), isError: true);
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Edit Profil'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Settings Icon Header
              Row(
                children: [
                  const Icon(Icons.settings, color: AppColors.accent),
                  const SizedBox(width: 8),
                  Text(
                    'Pengaturan Akun',
                    style: GoogleFonts.poppins(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textDark,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Container(
                height: 2,
                color: AppColors.border,
              ),
              const SizedBox(height: 24),

              // Full Name Input
              Text(
                'Nama Lengkap',
                style: GoogleFonts.poppins(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textMedium,
                ),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _nameController,
                style: GoogleFonts.poppins(color: AppColors.textDark),
                decoration: const InputDecoration(
                  hintText: 'Nama Lengkap',
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Nama tidak boleh kosong';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 20),

              // Email Input (Disabled)
              Text(
                'Alamat Email',
                style: GoogleFonts.poppins(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textMedium,
                ),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _emailController,
                enabled: false,
                style: GoogleFonts.poppins(color: AppColors.textLight),
                decoration: InputDecoration(
                  fillColor: const Color(0xFFF0EDE8), // grayed out fill color
                  hintText: 'Alamat Email',
                  suffixIcon: Icon(Icons.lock_outline, color: AppColors.textLight, size: 20),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Email tidak dapat diubah.',
                style: GoogleFonts.poppins(
                  fontSize: 11,
                  color: AppColors.textLight,
                ),
              ),
              const SizedBox(height: 24),

              // Change Password section
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.card,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Ubah Password (Opsional)',
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textDark,
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Current Password
                    Text(
                      'Password Saat Ini',
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: AppColors.textMedium,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _currentPasswordController,
                            obscureText: true,
                            enabled: !_isPasswordVerified,
                            style: GoogleFonts.poppins(
                              color: _isPasswordVerified ? AppColors.textLight : AppColors.textDark,
                            ),
                            decoration: const InputDecoration(
                              hintText: 'Password lama',
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        SizedBox(
                          height: 50,
                          child: ElevatedButton(
                            onPressed: _isPasswordVerified || _isVerifyingPassword
                                ? null
                                : _verifyCurrentPassword,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.accent,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                            ),
                            child: _isVerifyingPassword
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2.5,
                                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                    ),
                                  )
                                : const Text('Verifikasi'),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Verifikasi password lama untuk mengubah password baru.',
                      style: GoogleFonts.poppins(
                        fontSize: 11,
                        color: AppColors.textLight,
                      ),
                    ),

                    if (_isPasswordVerified) ...[
                      const SizedBox(height: 20),
                      // New Password
                      Text(
                        'Password Baru',
                        style: GoogleFonts.poppins(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textMedium,
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: _newPasswordController,
                        obscureText: true,
                        style: GoogleFonts.poppins(color: AppColors.textDark),
                        decoration: const InputDecoration(
                          hintText: 'Password baru',
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Confirm Password
                      Text(
                        'Konfirmasi Password Baru',
                        style: GoogleFonts.poppins(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textMedium,
                        ),
                      ),
                      const SizedBox(height: 8),
                      TextFormField(
                        controller: _confirmPasswordController,
                        obscureText: true,
                        style: GoogleFonts.poppins(color: AppColors.textDark),
                        decoration: const InputDecoration(
                          hintText: 'Ulangi password baru',
                        ),
                      ),
                    ].animate().fadeIn().slideY(begin: 0.1),
                  ],
                ),
              ),

              const SizedBox(height: 40),

              // Submit Button
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton.icon(
                  onPressed: _isLoading ? null : _updateProfile,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.accent,
                  ),
                  icon: _isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.5,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : const Icon(Icons.save, size: 20),
                  label: Text(
                    'Perbarui Profil',
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.w600,
                      fontSize: 15,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
