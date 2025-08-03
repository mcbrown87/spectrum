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

    socket.on('start-game', ({ gameCode }, callback) => {
        const result = gameManager.startGame(gameCode);
        
        if (result.success) {
            // Notify all players that the game is starting
            io.to(gameCode).emit('game-started', {
                currentRound: result.game.currentRound,
                prompt: result.game.rounds[0].prompt,
                players: result.game.players.map(p => p.name)
            });
            callback({ success: true });
            console.log(`Game started: ${gameCode}`);
        } else {
            callback({ success: false, error: result.error });
        }
    });

    socket.on('submit-ranking', ({ gameCode, ranking }, callback) => {
        const result = gameManager.submitRanking(gameCode, socket.id, ranking);
        
        if (result.success) {
            // Notify all players of submission progress
            socket.to(gameCode).emit('ranking-submitted', {
                submittedCount: result.submittedCount,
                totalPlayers: result.totalPlayers
            });
            
            callback({ success: true });
            
            // If all players have submitted, calculate results
            if (result.allSubmitted) {
                const resultsData = gameManager.calculateRoundResults(gameCode);
                if (resultsData.success) {
                    // Convert Maps to Objects for JSON serialization
                    const roundScores = {};
                    const totalScores = {};
                    
                    resultsData.roundScores.forEach((score, playerId) => {
                        const player = gameManager.getGame(gameCode).players.find(p => p.id === playerId);
                        if (player) roundScores[player.name] = score;
                    });
                    
                    resultsData.totalScores.forEach((score, playerId) => {
                        const player = gameManager.getGame(gameCode).players.find(p => p.id === playerId);
                        if (player) totalScores[player.name] = score;
                    });
                    
                    io.to(gameCode).emit('round-results', {
                        consensusRanking: resultsData.consensusRanking,
                        roundScores,
                        totalScores,
                        currentRound: gameManager.getGame(gameCode).currentRound
                    });
                }
            }
            
            console.log(`Ranking submitted by ${socket.id} for game ${gameCode}`);
        } else {
            callback({ success: false, error: result.error });
        }
    });

    socket.on('next-round', ({ gameCode }, callback) => {
        const result = gameManager.advanceToNextRound(gameCode);
        
        if (result.success) {
            if (result.gameFinished) {
                // Convert final scores Map to Object
                const finalScores = {};
                result.finalScores.forEach((score, playerId) => {
                    const player = gameManager.getGame(gameCode).players.find(p => p.id === playerId);
                    if (player) finalScores[player.name] = score;
                });
                
                io.to(gameCode).emit('game-finished', { finalScores });
                console.log(`Game finished: ${gameCode}`);
            } else {
                io.to(gameCode).emit('new-round', {
                    roundNumber: result.newRound,
                    prompt: result.prompt
                });
                console.log(`Advanced to round ${result.newRound} in game ${gameCode}`);
            }
            callback({ success: true, gameFinished: result.gameFinished });
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