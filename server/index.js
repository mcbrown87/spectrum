const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const GameManager = require('./gameManager');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const gameManager = new GameManager();

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/host', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/host/index.html'));
});

app.get('/play', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/player/index.html'));
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('create-game', ({ hostName }, callback) => {
        const game = gameManager.createGame(socket.id, hostName);
        socket.join(game.code);
        callback({ success: true, game: game });
        console.log(`Game created with code: ${game.code} by host: ${hostName}`);
    });

    socket.on('join-game', ({ gameCode, playerName }, callback) => {
        const result = gameManager.joinGame(gameCode, socket.id, playerName);
        
        if (result.success) {
            socket.join(gameCode);
            socket.to(gameCode).emit('player-joined', {
                playerId: socket.id,
                playerName: playerName,
                players: result.game.players
            });
            callback({ success: true, game: result.game });
            console.log(`${playerName} joined game ${gameCode}`);
        } else {
            callback({ success: false, error: result.error });
        }
    });

    socket.on('disconnect', () => {
        const result = gameManager.handleDisconnect(socket.id);
        if (result.gameCode) {
            socket.to(result.gameCode).emit('player-left', {
                playerId: socket.id,
                players: result.players
            });
            console.log(`Player ${socket.id} left game ${result.gameCode}`);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Game: http://localhost:${PORT}/`);
    console.log(`Host: http://localhost:${PORT}/host`);
    console.log(`Player: http://localhost:${PORT}/play`);
});