import 'dart:io';
import 'dart:convert';
import 'package:flutter/material.dart';
import '../config/api_config.dart';
import '../models/saldo_model.dart';
import '../services/saldo_service.dart';

class SaldoProvider extends ChangeNotifier {
  double _saldo = 0;
  List<SaldoTransaction> _history = [];
  List<DendaItem> _dendaList = [];
  bool _isLoading = false;
  String? _error;

  WebSocket? _ws;
  bool _isWsConnected = false;
  int? _subscribedUserId;

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

  void connectWebSocket(int userId) async {
    // If already connected for this user, do nothing
    if (_isWsConnected && _subscribedUserId == userId) return;
    
    // If connected to a different user, disconnect first
    if (_isWsConnected) {
      disconnectWebSocket();
    }

    _subscribedUserId = userId;
    final wsUrl = ApiConfig.wsUrl;
    debugPrint('Connecting to WebSocket: $wsUrl');
    
    try {
      _ws = await WebSocket.connect(wsUrl).timeout(const Duration(seconds: 5));
      _isWsConnected = true;

      // Subscribe to updates for this user
      _ws!.add(jsonEncode({
        'type': 'subscribe',
        'userId': userId,
      }));

      _ws!.listen((message) {
        debugPrint('WebSocket message received: $message');
        try {
          final data = jsonDecode(message);
          if (data['type'] == 'saldo_update') {
            loadAll();
          }
        } catch (e) {
          debugPrint('Error decoding WebSocket message: $e');
        }
      }, onDone: () {
        debugPrint('WebSocket connection closed. Reconnecting...');
        _isWsConnected = false;
        if (_subscribedUserId == userId) {
          Future.delayed(const Duration(seconds: 5), () => connectWebSocket(userId));
        }
      }, onError: (err) {
        debugPrint('WebSocket error: $err');
        _isWsConnected = false;
        if (_subscribedUserId == userId) {
          Future.delayed(const Duration(seconds: 5), () => connectWebSocket(userId));
        }
      });
    } catch (e) {
      debugPrint('Failed to connect to WebSocket: $e. Retrying in 5s...');
      _isWsConnected = false;
      if (_subscribedUserId == userId) {
        Future.delayed(const Duration(seconds: 5), () => connectWebSocket(userId));
      }
    }
  }

  void disconnectWebSocket() {
    _subscribedUserId = null;
    _ws?.close();
    _ws = null;
    _isWsConnected = false;
  }

  @override
  void dispose() {
    disconnectWebSocket();
    super.dispose();
  }
}