import 'package:flutter/material.dart';
import '../models/saldo_model.dart';
import '../services/saldo_service.dart';

class SaldoProvider extends ChangeNotifier {
  double _saldo = 0;
  List<SaldoTransaction> _history = [];
  List<DendaItem> _dendaList = [];
  bool _isLoading = false;
  String? _error;

  double get saldo => _saldo;
  List<SaldoTransaction> get history => _history;
  List<DendaItem> get dendaList => _dendaList;
  bool get isLoading => _isLoading;
  String? get error => _error;

  int get unpaidDendaCount => _dendaList.where((d) => d.dendaDibayar == 0).length;

  Future<void> loadAll() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      _saldo = await SaldoService.getSaldo();
      _history = await SaldoService.getHistory();
      _dendaList = await SaldoService.getDenda();
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> bayarDenda(int idPengembalian) async {
    _isLoading = true;
    notifyListeners();
    try {
      await SaldoService.bayarDenda(idPengembalian);
      await loadAll();
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}