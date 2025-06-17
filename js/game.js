import { Cell } from './cell.js';
import { Food } from './food.js';
import { Virus } from './virus.js';

export class Game {
    constructor(canvas, ctx, room, inputHandler, ui, audioManager) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.room = room;
        this.inputHandler = inputHandler;
        this.ui = ui;
        this.audioManager = audioManager;

        // Game state
        this.playerCell = null;
        this.otherCells = {};
        this.foods = {};
        this.viruses = {};

        // Game settings
        this.worldSize = 5000;
        this.foodCount = 200;
        this.virusCount = 20;
        this.initialPlayerSize = 10;

        // Camera/viewport
        this.camera = {
            x: 0,
            y: 0,
            scale: 1
        };

        // Game bounds
        this.bounds = {
            minX: 0,
            minY: 0,
            maxX: this.worldSize,
            maxY: this.worldSize
        };

        // Bind methods
        this.gameLoop = this.gameLoop.bind(this);
        this.handlePlayerMovement = this.handlePlayerMovement.bind(this);
        this.updatePresence = this.updatePresence.bind(this);

        // Set up event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Subscribe to room state changes
        this.room.subscribeRoomState((roomState) => {
            this.handleRoomStateUpdate(roomState);
        });

        // Subscribe to presence changes
        this.room.subscribePresence((presence) => {
            this.handlePresenceUpdate(presence);
        });

        // Subscribe to presence update requests
        this.room.subscribePresenceUpdateRequests((updateRequest, fromClientId) => {
            this.handlePresenceUpdateRequest(updateRequest, fromClientId);
        });

        // Handle messages
        this.room.onmessage = (event) => {
            const data = event.data;
            switch (data.type) {
                case "connected":
                    console.log(`Player connected: ${data.username} (${data.clientId})`);
                    break;
                case "disconnected":
                    console.log(`Player disconnected: ${data.username} (${data.clientId})`);
                    break;
                case "cellEaten":
                    this.handleCellEaten(data);
                    break;
                case "virusHit":
                    this.handleVirusHit(data);
                    break;
                default:
                    break;
            }
        };
    }

    start() {
        // Initialize game world if we're the first player
        if (Object.keys(this.room.roomState).length === 0) {
            this.initializeGameWorld();
        }

        // Start game loop
        requestAnimationFrame(this.gameLoop);
    }

    initializeGameWorld() {
        const foodData = {};
        for (let i = 0; i < this.foodCount; i++) {
            const id = `food-${i}`;
            foodData[id] = {
                x: Math.random() * this.worldSize,
                y: Math.random() * this.worldSize,
                color: this.getRandomFoodColor(),
                size: 3 + Math.random() * 2
            };
        }

        const virusData = {};
        for (let i = 0; i < this.virusCount; i++) {
            const id = `virus-${i}`;
            virusData[id] = {
                x: Math.random() * this.worldSize,
                y: Math.random() * this.worldSize,
                size: 20 + Math.random() * 10
            };
        }

        this.room.updateRoomState({
            foodItems: foodData,
            virusItems: virusData,
            worldSize: this.worldSize
        });
    }

    joinGame(playerName) {
        // Create player cell
        const spawnX = Math.random() * this.worldSize;
        const spawnY = Math.random() * this.worldSize;

        this.playerCell = new Cell({
            id: this.room.clientId,
            x: spawnX,
            y: spawnY,
            size: this.initialPlayerSize,
            color: this.getRandomCellColor(),
            name: playerName || this.room.peers[this.room.clientId].username,
            isPlayer: true
        });

        // Update player presence
        this.room.updatePresence({
            x: spawnX,
            y: spawnY,
            size: this.initialPlayerSize,
            color: this.playerCell.color,
            name: this.playerCell.name,
            active: true,
            cells: [{
                id: this.room.clientId,
                x: spawnX,
                y: spawnY,
                size: this.initialPlayerSize
            }]
        });

        // Initialize input handling
        this.inputHandler.setCallback(this.handlePlayerMovement);
    }

    handlePlayerMovement(targetX, targetY) {
        if (!this.playerCell || !this.playerCell.active) return;

        // Calculate direction vector
        const dx = targetX - this.canvas.width / 2;
        const dy = targetY - this.canvas.height / 2;

        // Normalize direction
        const length = Math.sqrt(dx * dx + dy * dy);
        const normalizedDx = length > 0 ? dx / length : 0;
        const normalizedDy = length > 0 ? dy / length : 0;

        // Update player direction
        this.playerCell.setDirection(normalizedDx, normalizedDy);

        // Update presence every few frames to reduce network traffic
        if (this.frameCount % 5 === 0) {
            this.updatePresence();
        }
    }

    updatePresence() {
        if (!this.playerCell) return;

        const cellsData = [];
        // If player has multiple cells (after splitting)
        if (this.playerCell.childCells && this.playerCell.childCells.length > 0) {
            this.playerCell.childCells.forEach(cell => {
                cellsData.push({
                    id: cell.id,
                    x: cell.x,
                    y: cell.y,
                    size: cell.size
                });
            });
        } else {
            cellsData.push({
                id: this.playerCell.id,
                x: this.playerCell.x,
                y: this.playerCell.y,
                size: this.playerCell.size
            });
        }

        this.room.updatePresence({
            x: this.playerCell.x,
            y: this.playerCell.y,
            dirX: this.playerCell.dirX,
            dirY: this.playerCell.dirY,
            size: this.playerCell.size,
            active: this.playerCell.active,
            cells: cellsData,
            score: this.playerCell.score
        });
    }

    handleRoomStateUpdate(roomState) {
        // Update food items
        if (roomState.foodItems) {
            this.foods = {};
            for (const id in roomState.foodItems) {
                const foodData = roomState.foodItems[id];
                if (foodData) {
                    this.foods[id] = new Food(id, foodData.x, foodData.y, foodData.size, foodData.color);
                }
            }
        }

        // Update virus items
        if (roomState.virusItems) {
            this.viruses = {};
            for (const id in roomState.virusItems) {
                const virusData = roomState.virusItems[id];
                if (virusData) {
                    this.viruses[id] = new Virus(id, virusData.x, virusData.y, virusData.size);
                }
            }
        }

        // Update world size
        if (roomState.worldSize) {
            this.worldSize = roomState.worldSize;
            this.bounds.maxX = this.worldSize;
            this.bounds.maxY = this.worldSize;
        }
    }

    handlePresenceUpdate(presence) {
        // Update other players
        this.otherCells = {};

        for (const clientId in presence) {
            if (clientId === this.room.clientId) continue; // Skip self

            const playerData = presence[clientId];
            if (!playerData || !playerData.active) continue;

            if (playerData.cells) {
                playerData.cells.forEach(cellData => {
                    const cell = new Cell({
                        id: cellData.id,
                        x: cellData.x,
                        y: cellData.y,
                        size: cellData.size,
                        color: playerData.color,
                        name: playerData.name,
                        dirX: playerData.dirX || 0,
                        dirY: playerData.dirY || 0,
                        isPlayer: false
                    });

                    this.otherCells[cellData.id] = cell;
                });
            }
        }

        // Update leaderboard
        this.updateLeaderboard(presence);
    }

    handlePresenceUpdateRequest(updateRequest, fromClientId) {
        if (!this.playerCell || !this.playerCell.active) return;

        if (updateRequest.type === 'eaten') {
            // Our cell was eaten by another player
            if (updateRequest.cellId === this.playerCell.id) {
                this.gameOver();
            } else if (this.playerCell.childCells) {
                // One of our child cells was eaten
                this.playerCell.removeChildCell(updateRequest.cellId);
                this.updatePresence();
            }
        }
    }

    handleCellEaten(data) {
        if (data.eatenBy === this.room.clientId) {
            // We ate another cell or food
            if (data.foodId) {
                // We ate food
                this.playerCell.grow(1);
                this.updatePresence();

                // Respawn food
                setTimeout(() => {
                    if (Object.keys(this.room.presence).length > 0) {
                        const foodUpdate = {};
                        foodUpdate[data.foodId] = {
                            x: Math.random() * this.worldSize,
                            y: Math.random() * this.worldSize,
                            color: this.getRandomFoodColor(),
                            size: 3 + Math.random() * 2
                        };

                        this.room.updateRoomState({
                            foodItems: foodUpdate
                        });
                    }
                }, 5000);
            } else if (data.cellId) {
                // We ate another player's cell
                const growAmount = data.size / 4;
                this.playerCell.grow(growAmount);
                this.updatePresence();

                // Play sound
                this.audioManager.play('cellEaten');
            }
        }
    }

    handleVirusHit(data) {
        if (data.cellId === this.playerCell.id) {
            // Split the player's cell
            this.playerCell.split();
            this.updatePresence();
        }
    }

    updateLeaderboard(presence) {
        const players = [];

        for (const clientId in presence) {
            const playerData = presence[clientId];
            if (playerData && playerData.active) {
                players.push({
                    id: clientId,
                    name: playerData.name,
                    score: playerData.score || 0,
                    size: playerData.size || 0
                });
            }
        }

        // Sort by score (or size if score is equal)
        players.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return b.size - a.size;
        });

        this.ui.updateLeaderboard(players, this.room.clientId);
    }

    checkCollisions() {
        if (!this.playerCell || !this.playerCell.active) return;

        // Check collision with food
        for (const foodId in this.foods) {
            const food = this.foods[foodId];
            if (this.playerCell.canEat(food)) {
                // We ate food
                delete this.foods[foodId];
                this.playerCell.grow(1);
                this.room.send({
                    type: 'cellEaten',
                    foodId: foodId,
                    eatenBy: this.room.clientId
                });
            }
        }

        // Check collision with other cells
        for (const cellId in this.otherCells) {
            const otherCell = this.otherCells[cellId];

            if (this.playerCell.canEat(otherCell)) {
                // We can eat the other cell
                delete this.otherCells[cellId];
                const growAmount = otherCell.size / 4;
                this.playerCell.grow(growAmount);

                // Play sound
                this.audioManager.play('cellEaten');

                // Notify the other player that they've been eaten
                this.room.requestPresenceUpdate(otherCell.id.split('-')[0], {
                    type: 'eaten',
                    cellId: otherCell.id,
                    eatenBy: this.room.clientId,
                    size: otherCell.size
                });

                this.room.send({
                    type: 'cellEaten',
                    cellId: otherCell.id,
                    eatenBy: this.room.clientId,
                    size: otherCell.size
                });
            } else if (otherCell.canEat(this.playerCell)) {
                // We've been eaten
                this.gameOver();
                return;
            }
        }

        // Check collision with viruses
        for (const virusId in this.viruses) {
            const virus = this.viruses[virusId];
            if (this.playerCell.collidesWithVirus(virus) && this.playerCell.size > virus.size * 1.5) {
                // We hit a virus and are big enough to split
                delete this.viruses[virusId];
                this.playerCell.split();

                // Play sound
                this.audioManager.play('cellSplit');

                this.room.send({
                    type: 'virusHit',
                    virusId: virusId,
                    cellId: this.playerCell.id
                });

                // Respawn virus
                setTimeout(() => {
                    if (Object.keys(this.room.presence).length > 0) {
                        const virusUpdate = {};
                        virusUpdate[virusId] = {
                            x: Math.random() * this.worldSize,
                            y: Math.random() * this.worldSize,
                            size: 20 + Math.random() * 10
                        };

                        this.room.updateRoomState({
                            virusItems: virusUpdate
                        });
                    }
                }, 10000);

                break;
            }
        }
    }

    gameOver() {
        if (!this.playerCell) return;

        this.playerCell.active = false;
        this.room.updatePresence({
            active: false,
            score: this.playerCell.score
        });

        // Show game over screen
        document.getElementById('final-score').textContent = this.playerCell.score;
        document.getElementById('game-over').classList.remove('hidden');

        // Save high score to database
        this.saveHighScore(this.playerCell.score);
    }

    async saveHighScore(score) {
        try {
            await this.room.collection('highscores').create({
                score: score,
                name: this.playerCell.name
            });
        } catch (error) {
            console.error('Error saving high score:', error);
        }
    }

    reset() {
        this.playerCell = null;
    }

    updateCamera() {
        if (!this.playerCell) return;

        // Calculate camera position to center on player
        this.camera.x = this.playerCell.x - this.canvas.width / 2 / this.camera.scale;
        this.camera.y = this.playerCell.y - this.canvas.height / 2 / this.camera.scale;

        // Calculate camera scale based on player size
        const targetScale = Math.max(0.7, 40 / this.playerCell.size);
        this.camera.scale = this.camera.scale * 0.9 + targetScale * 0.1;
    }

    gameLoop(timestamp) {
        this.frameCount = this.frameCount || 0;
        this.frameCount++;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update player cell if active
        if (this.playerCell && this.playerCell.active) {
            this.playerCell.update(this.bounds);
            this.checkCollisions();
            this.updateCamera();

            // Update player stats
            this.ui.updatePlayerStats(this.playerCell);
        }

        // Draw game world
        this.drawGameWorld();

        // Continue game loop
        requestAnimationFrame(this.gameLoop);
    }

    drawGameWorld() {
        this.ctx.save();

        // Apply camera transformations
        this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
        this.ctx.scale(this.camera.scale, this.camera.scale);
        this.ctx.translate(-this.playerCell.x, -this.playerCell.y);

        // Draw grid
        this.drawGrid();

        // Draw boundaries
        this.drawBoundaries();

        // Draw food
        for (const foodId in this.foods) {
            this.foods[foodId].draw(this.ctx);
        }

        // Draw viruses
        for (const virusId in this.viruses) {
            this.viruses[virusId].draw(this.ctx);
        }

        // Draw other cells
        for (const cellId in this.otherCells) {
            this.otherCells[cellId].draw(this.ctx);
        }

        // Draw player cell
        if (this.playerCell && this.playerCell.active) {
            this.playerCell.draw(this.ctx);
        }

        this.ctx.restore();
    }

    drawGrid() {
        const gridSize = 100;
        const gridColor = 'rgba(200, 200, 200, 0.2)';

        const startX = Math.floor(this.camera.x / gridSize) * gridSize;
        const startY = Math.floor(this.camera.y / gridSize) * gridSize;
        const endX = Math.min(this.bounds.maxX, this.camera.x + this.canvas.width / this.camera.scale);
        const endY = Math.min(this.bounds.maxY, this.camera.y + this.canvas.height / this.camera.scale);

        this.ctx.strokeStyle = gridColor;
        this.ctx.lineWidth = 1;

        // Vertical lines
        for (let x = startX; x <= endX; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.bounds.minY);
            this.ctx.lineTo(x, this.bounds.maxY);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = startY; y <= endY; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.bounds.minX, y);
            this.ctx.lineTo(this.bounds.maxX, y);
            this.ctx.stroke();
        }
    }

    drawBoundaries() {
        this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        this.ctx.lineWidth = 10;
        this.ctx.strokeRect(this.bounds.minX, this.bounds.minY, this.bounds.maxX - this.bounds.minX, this.bounds.maxY - this.bounds.minY);
    }

    getRandomCellColor() {
        const colors = [
            '#FF5733', '#33FF57', '#3357FF', '#FF33F5', '#F5FF33',
            '#33FFF5', '#FF5733', '#C733FF', '#33FFBD', '#FFB533'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    getRandomFoodColor() {
        const colors = [
            '#FF9999', '#99FF99', '#9999FF', '#FFFF99', '#FF99FF',
            '#99FFFF', '#FFCC99', '#CC99FF', '#99FFCC', '#FFCC99'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
}