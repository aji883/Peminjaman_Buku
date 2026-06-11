const express = require('express'); // v2
const cors = require('cors');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const loanRoutes = require('./routes/loanRoutes');
const returnRoutes = require('./routes/returnRoutes');
const waitingListRoutes = require('./routes/waitingListRoutes');
const saldoRoutes = require('./routes/saldoRoutes');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Map(); // maps userId (int) -> Set of WebSocket clients

wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'subscribe') {
                const userId = parseInt(data.userId);
                if (!isNaN(userId)) {
                    ws.userId = userId;
                    if (!clients.has(userId)) {
                        clients.set(userId, new Set());
                    }
                    clients.get(userId).add(ws);
                    console.log(`WebSocket client subscribed to userId: ${userId}`);
                }
            }
        } catch (err) {
            console.error('Error parsing WebSocket message:', err);
        }
    });

    ws.on('close', () => {
        console.log('WebSocket connection closed');
        if (ws.userId && clients.has(ws.userId)) {
            const userClients = clients.get(ws.userId);
            userClients.delete(ws);
            if (userClients.size === 0) {
                clients.delete(ws.userId);
            }
        }
    });
});

// Global helper to send realtime updates
global.sendRealtimeUpdate = (userId, type, data) => {
    const parsedUserId = parseInt(userId);
    if (clients.has(parsedUserId)) {
        const userClients = clients.get(parsedUserId);
        const payload = JSON.stringify({ type, ...data });
        console.log(`Sending realtime update to userId ${parsedUserId}: ${payload}`);
        userClients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(payload);
            }
        });
    }
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global Logger
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
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
server.listen(PORT, () => {
    console.log(`Backend Server API is running on http://localhost:${PORT}`);
});
