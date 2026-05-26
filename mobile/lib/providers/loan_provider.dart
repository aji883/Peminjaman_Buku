import 'package:flutter/material.dart';
import '../models/loan_model.dart';
import '../services/loan_service.dart';

class LoanProvider extends ChangeNotifier {
  List<LoanModel> _loans = [];
  bool _isLoading = false;
  String? _error;

  List<LoanModel> get loans => _loans;
  bool get isLoading => _isLoading;
  String? get error => _error;

  int get activeLoans => _loans.where((l) => l.status == 'dipinjam').length;
  int get pendingLoans => _loans.where((l) => l.status == 'diproses').length;

  Future<void> loadMyLoans() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      _loans = await LoanService.getMyLoans();
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> createLoan(int idBuku, String tglPinjam, String tglKembali) async {
    _isLoading = true;
    notifyListeners();
    try {
      await LoanService.createLoan(idBuku, tglPinjam, tglKembali);
      await loadMyLoans();
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}