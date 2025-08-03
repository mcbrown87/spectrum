class GameManager {
    constructor() {
        this.games = new Map();
        this.playerToGame = new Map();
    }

    generateGameCode() {
        let code;
        do {
            code = Math.random().toString(36).substr(2, 6).toUpperCase();
        } while (this.games.has(code));
        return code;
    }

    createGame(hostId, hostName) {
        const code = this.generateGameCode();
        
        // Create host player object
        const hostPlayer = {
            id: hostId,
            name: hostName,
            joinedAt: new Date(),
            isHost: true
        };
        
        const game = {
            code,
            hostId,
            players: [hostPlayer],
            status: 'waiting',
            createdAt: new Date()
        };
        
        this.games.set(code, game);
        this.playerToGame.set(hostId, code);
        return game;
    }

    joinGame(gameCode, playerId, playerName) {
        const game = this.games.get(gameCode);
        
        if (!game) {
            return { success: false, error: 'Game not found' };
        }

        if (game.players.find(p => p.name.toLowerCase() === playerName.toLowerCase())) {
            return { success: false, error: 'Name already taken' };
        }

        if (game.players.length >= 8) {
            return { success: false, error: 'Game is full' };
        }

        const player = {
            id: playerId,
            name: playerName,
            joinedAt: new Date()
        };

        game.players.push(player);
        this.playerToGame.set(playerId, gameCode);

        return { success: true, game };
    }

    handleDisconnect(playerId) {
        const gameCode = this.playerToGame.get(playerId);
        if (!gameCode) {
            return { gameCode: null };
        }

        const game = this.games.get(gameCode);
        if (!game) {
            return { gameCode: null };
        }

        if (game.hostId === playerId) {
            this.games.delete(gameCode);
            game.players.forEach(player => {
                this.playerToGame.delete(player.id);
            });
            return { gameCode, gameDeleted: true };
        }

        game.players = game.players.filter(p => p.id !== playerId);
        this.playerToGame.delete(playerId);

        if (game.players.length === 0) {
            this.games.delete(gameCode);
        }

        return { gameCode, players: game.players };
    }

    getGame(gameCode) {
        return this.games.get(gameCode);
    }

    getAllGames() {
        return Array.from(this.games.values());
    }
}

module.exports = GameManager;