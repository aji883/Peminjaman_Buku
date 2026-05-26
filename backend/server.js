const express = require('express'); // v2
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const loanRoutes = require('./routes/loanRoutes');
const returnRoutes = require('./routes/returnRoutes');
const waitingListRoutes = require('./routes/waitingListRoutes');
const saldoRoutes = require('./routes/saldoRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Logger
app.use((req, res, next) => {
    console.log(`\${req.method} \${req.url}`);
    next();
});

// Serve frontend uploads folder statically so mobile/web app can fetch book covers
app.use('/uploads', express.static(path.join(__dirname, '../frontend/uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/waiting-list', waitingListRoutes);
app.use('/api/saldo', saldoRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend Server API is running on http://localhost:\${PORT}`);
});
