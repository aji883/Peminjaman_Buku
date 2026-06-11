class ApiConfig {
  // Use 10.0.2.2 for Android emulator, or localhost/127.0.0.1 for Web/Windows, or your local IP for physical device
  // Since we added Web/Windows support, localhost is fine. If using Android emulator, change to 10.0.2.2
  static const String baseUrl = 'http://localhost:5000/api';
  static const String uploadsUrl = 'http://localhost:5000/uploads';

  static String get wsUrl {
    final cleanUrl = baseUrl.replaceAll('/api', '');
    if (cleanUrl.startsWith('https://')) {
      return cleanUrl.replaceAll('https://', 'wss://');
    } else {
      return cleanUrl.replaceAll('http://', 'ws://');
    }
  }

  // Auth
  static const String login = '/auth/user/login';
  static const String register = '/auth/user/register';
  static const String profile = '/auth/user/profile';
  static const String verifyPassword = '/auth/user/verify-password';

  // Books
  static const String books = '/books';
  static String bookAvailability(int id) => '/books/$id/availability';
  static const String savedBooks = '/books/saved';
  static String deleteSavedBook(int id) => '/books/saved/$id';

  // Loans
  static const String loans = '/loans';
  static const String myLoans = '/loans/my';
  static String deleteLoan(int id) => '/loans/$id';

  // Waiting List
  static const String waitingList = '/waiting-list';
  static const String myWaitingList = '/waiting-list/my';

  // Saldo
  static const String saldo = '/saldo';
  static const String saldoHistory = '/saldo/history';
  static const String saldoDenda = '/saldo/denda';
  static String bayarDenda(int id) => '/saldo/bayar-denda/$id';
}
