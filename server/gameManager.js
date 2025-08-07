const PromptManager = require('./promptManager');

class GameManager {
    constructor() {
        this.games = new Map();
        this.playerToGame = new Map();
        this.promptManager = new PromptManager();
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
            createdAt: new Date(),
            currentRound: 0,
            totalRounds: 2,
            roundPhase: null, // 'ranking', 'results'
            rounds: [],
            rankings: new Map(), // playerId -> rankings array
            scores: new Map() // playerId -> total score
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

    // Game flow methods
    startGame(gameCode) {
        const game = this.games.get(gameCode);
        if (!game || game.status !== 'waiting' || game.players.length < 2) {
            return { success: false, error: 'Cannot start game' };
        }

        game.status = 'playing';
        game.currentRound = 1;
        game.roundPhase = 'ranking';
        
        // Get prompts for the entire game
        const gamePrompts = this.promptManager.getPromptsForGame(game.totalRounds);
        game.gamePrompts = gamePrompts; // Store prompts for the entire game
        
        // Initialize first round
        game.rounds.push({
            roundNumber: 1,
            prompt: gamePrompts[0]?.text || "Rank players by height (tallest to shortest)",
            promptId: gamePrompts[0]?.id || "height",
            rankings: new Map(), // playerId -> ranking array
            submitted: new Set() // playerIds who have submitted
        });

        // Initialize scores
        game.players.forEach(player => {
            game.scores.set(player.id, 0);
        });

        return { success: true, game };
    }

    submitRanking(gameCode, playerId, ranking) {
        const game = this.games.get(gameCode);
        if (!game || game.status !== 'playing' || game.roundPhase !== 'ranking') {
            return { success: false, error: 'Cannot submit ranking now' };
        }

        const currentRound = game.rounds[game.currentRound - 1];
        if (!currentRound) {
            return { success: false, error: 'Invalid round' };
        }

        // Store the ranking
        currentRound.rankings.set(playerId, ranking);
        currentRound.submitted.add(playerId);

        // Check if all players have submitted
        const allSubmitted = currentRound.submitted.size === game.players.length;

        return { 
            success: true, 
            allSubmitted,
            submittedCount: currentRound.submitted.size,
            totalPlayers: game.players.length
        };
    }

    calculateRoundResults(gameCode) {
        const game = this.games.get(gameCode);
        if (!game || game.status !== 'playing') {
            return { success: false, error: 'Game not in progress' };
        }

        const currentRound = game.rounds[game.currentRound - 1];
        if (!currentRound) {
            return { success: false, error: 'Invalid round' };
        }

        // Calculate consensus ranking (most common order)
        const playerRankings = Array.from(currentRound.rankings.values());
        const consensusRanking = this.calculateConsensusRanking(playerRankings, game.players);
        
        // Calculate scores based on how close each player's ranking is to consensus
        const roundScores = new Map();
        
        currentRound.rankings.forEach((ranking, playerId) => {
            const score = this.calculateRankingScore(ranking, consensusRanking);
            roundScores.set(playerId, score);
            
            // Add to total score
            const currentScore = game.scores.get(playerId) || 0;
            game.scores.set(playerId, currentScore + score);
        });

        currentRound.consensusRanking = consensusRanking;
        currentRound.roundScores = roundScores;
        
        game.roundPhase = 'results';

        return { 
            success: true, 
            consensusRanking,
            roundScores,
            totalScores: game.scores
        };
    }

    advanceToNextRound(gameCode) {
        const game = this.games.get(gameCode);
        if (!game || game.status !== 'playing' || game.roundPhase !== 'results') {
            return { success: false, error: 'Cannot advance round now' };
        }

        if (game.currentRound >= game.totalRounds) {
            // Game is over
            game.status = 'finished';
            return { success: true, gameFinished: true, finalScores: game.scores };
        }

        // Advance to next round
        game.currentRound++;
        game.roundPhase = 'ranking';

        // Get the prompt for this round from the game's prompt collection
        const currentPrompt = game.gamePrompts[game.currentRound - 1];
        const promptText = currentPrompt?.text || `Round ${game.currentRound} prompt`;

        game.rounds.push({
            roundNumber: game.currentRound,
            prompt: promptText,
            promptId: currentPrompt?.id || `round_${game.currentRound}`,
            rankings: new Map(),
            submitted: new Set()
        });

        return { success: true, newRound: game.currentRound, prompt: promptText };
    }

    calculateConsensusRanking(playerRankings, players) {
        // Simple algorithm: for each position, find the player mentioned most often
        const playerNames = players.map(p => p.name);
        const consensus = [];
        const usedPlayers = new Set();

        for (let position = 0; position < playerNames.length; position++) {
            const positionCounts = new Map();
            
            playerRankings.forEach(ranking => {
                if (ranking[position] && !usedPlayers.has(ranking[position])) {
                    positionCounts.set(ranking[position], (positionCounts.get(ranking[position]) || 0) + 1);
                }
            });

            // Find player with most votes for this position
            let maxCount = 0;
            let selectedPlayer = null;
            positionCounts.forEach((count, player) => {
                if (count > maxCount && !usedPlayers.has(player)) {
                    maxCount = count;
                    selectedPlayer = player;
                }
            });

            if (selectedPlayer) {
                consensus.push(selectedPlayer);
                usedPlayers.add(selectedPlayer);
            }
        }

        // Fill in any missing players
        playerNames.forEach(name => {
            if (!usedPlayers.has(name)) {
                consensus.push(name);
            }
        });

        return consensus;
    }

    calculateRankingScore(playerRanking, consensusRanking) {
        // Score based on how many positions match the consensus
        let score = 0;
        const maxScore = 100;
        const bonusPerMatch = Math.floor(maxScore / consensusRanking.length);

        for (let i = 0; i < Math.min(playerRanking.length, consensusRanking.length); i++) {
            if (playerRanking[i] === consensusRanking[i]) {
                score += bonusPerMatch;
            }
        }

        return score;
    }

    // Prompt management methods
    getPromptStats() {
        return this.promptManager.getStats();
    }

    getPromptCategories() {
        return this.promptManager.getCategories();
    }

    getAllPrompts() {
        return this.promptManager.getAllPrompts();
    }

    reloadPrompts() {
        this.promptManager.reload();
    }
}

module.exports = GameManager;