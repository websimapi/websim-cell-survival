export class UI {
    constructor() {
        this.playerSizeElement = document.getElementById('player-size');
        this.playerRankElement = document.getElementById('player-rank');
        this.playerScoreElement = document.getElementById('player-score');
        this.leaderboardListElement = document.getElementById('leaderboard-list');
        this.finalScoreElement = document.getElementById('final-score');
        this.gameOverElement = document.getElementById('game-over');
    }
    
    updatePlayerStats(player) {
        if (!player) return;
        
        // Update size, score
        const size = Math.round(player.size);
        const mass = Math.round(player.size * player.size);
        const score = player.score;
        
        this.playerSizeElement.textContent = `Mass: ${mass}`;
        this.playerScoreElement.textContent = `Score: ${score}`;
    }
    
    updateLeaderboard(players, clientId) {
        // Clear leaderboard
        this.leaderboardListElement.innerHTML = '';
        
        // Show top 10 players
        const topPlayers = players.slice(0, 10);
        
        // Find current player's rank
        const playerRank = players.findIndex(player => player.id === clientId) + 1;
        this.playerRankElement.textContent = `Rank: #${playerRank}`;
        
        // Populate leaderboard
        topPlayers.forEach((player, index) => {
            const li = document.createElement('li');
            
            // Highlight current player
            if (player.id === clientId) {
                li.classList.add('current-player');
                li.style.fontWeight = 'bold';
                li.style.color = '#FF5733';
            }
            
            const rankSpan = document.createElement('span');
            rankSpan.textContent = `#${index + 1}`;
            
            const nameSpan = document.createElement('span');
            nameSpan.textContent = player.name;
            
            const scoreSpan = document.createElement('span');
            scoreSpan.textContent = player.score;
            
            li.appendChild(rankSpan);
            li.appendChild(nameSpan);
            li.appendChild(scoreSpan);
            
            this.leaderboardListElement.appendChild(li);
        });
    }
    
    showGameOver(score) {
        this.finalScoreElement.textContent = score;
        this.gameOverElement.classList.remove('hidden');
    }
    
    hideGameOver() {
        this.gameOverElement.classList.add('hidden');
    }
}