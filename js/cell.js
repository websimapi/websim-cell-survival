export class Cell {
    constructor(options) {
        this.id = options.id || `cell-${Math.random().toString(36).substr(2, 9)}`;
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.size = options.size || 10;
        this.mass = this.size * this.size;
        this.color = options.color || '#FF5733';
        this.name = options.name || 'Unnamed';
        this.dirX = options.dirX || 0;
        this.dirY = options.dirY || 0;
        this.speed = 5;
        this.isPlayer = options.isPlayer || false;
        this.active = true;
        this.score = options.score || 0;
        
        // For cell splitting
        this.childCells = [];
        this.splitForce = 0;
        this.splitDirection = { x: 0, y: 0 };
        this.mergeTime = 0;
        this.mergeDelay = 10000; // 10 seconds before cells can merge back
        
        // For ejecting mass
        this.ejectedMass = [];
    }
    
    update(bounds) {
        // Apply speed based on size (bigger cells move slower)
        const baseSpeed = this.speed;
        const sizeModifier = Math.pow(100 / (this.size + 100), 1.5);
        const adjustedSpeed = baseSpeed * sizeModifier;
        
        // If cell has split, apply split force
        if (this.splitForce > 0) {
            this.x += this.splitDirection.x * this.splitForce;
            this.y += this.splitDirection.y * this.splitForce;
            this.splitForce *= 0.95; // Gradually reduce the force
            
            if (this.splitForce < 0.1) {
                this.splitForce = 0;
            }
        } else {
            // Normal movement based on direction
            this.x += this.dirX * adjustedSpeed;
            this.y += this.dirY * adjustedSpeed;
        }
        
        // Keep cell within bounds
        this.x = Math.max(bounds.minX + this.size, Math.min(this.x, bounds.maxX - this.size));
        this.y = Math.max(bounds.minY + this.size, Math.min(this.y, bounds.maxY - this.size));
        
        // Update child cells if any
        if (this.childCells.length > 0) {
            this.updateChildCells(bounds);
        }
        
        // Check for merging cells
        if (this.childCells.length > 1 && Date.now() > this.mergeTime) {
            this.mergeCells();
        }
    }
    
    updateChildCells(bounds) {
        // Update each child cell
        for (let i = 0; i < this.childCells.length; i++) {
            const cell = this.childCells[i];
            
            // Apply speed based on size
            const baseSpeed = this.speed;
            const sizeModifier = Math.pow(100 / (cell.size + 100), 1.5);
            const adjustedSpeed = baseSpeed * sizeModifier;
            
            // Apply split force or normal movement
            if (cell.splitForce > 0) {
                cell.x += cell.splitDirection.x * cell.splitForce;
                cell.y += cell.splitDirection.y * cell.splitForce;
                cell.splitForce *= 0.95;
                
                if (cell.splitForce < 0.1) {
                    cell.splitForce = 0;
                }
            } else {
                // Normal movement
                cell.x += this.dirX * adjustedSpeed;
                cell.y += this.dirY * adjustedSpeed;
            }
            
            // Keep cell within bounds
            cell.x = Math.max(bounds.minX + cell.size, Math.min(cell.x, bounds.maxX - cell.size));
            cell.y = Math.max(bounds.minY + cell.size, Math.min(cell.y, bounds.maxY - cell.size));
            
            // Check for collisions between child cells (for merging)
            if (Date.now() > this.mergeTime) {
                for (let j = i + 1; j < this.childCells.length; j++) {
                    const otherCell = this.childCells[j];
                    const dx = cell.x - otherCell.x;
                    const dy = cell.y - otherCell.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < cell.size + otherCell.size) {
                        // Cells are touching, can merge
                        this.childCells.splice(j, 1);
                        cell.size = Math.sqrt(cell.size * cell.size + otherCell.size * otherCell.size);
                        j--;
                    }
                }
            }
        }
    }
    
    mergeCells() {
        // Merge all child cells back into one
        if (this.childCells.length <= 1) return;
        
        let totalMass = 0;
        let centerX = 0;
        let centerY = 0;
        
        // Calculate total mass and center position
        for (const cell of this.childCells) {
            const mass = cell.size * cell.size;
            totalMass += mass;
            centerX += cell.x * mass;
            centerY += cell.y * mass;
        }
        
        // Calculate new position and size
        centerX /= totalMass;
        centerY /= totalMass;
        const newSize = Math.sqrt(totalMass);
        
        // Update main cell
        this.x = centerX;
        this.y = centerY;
        this.size = newSize;
        this.childCells = [];
    }
    
    split() {
        if (this.size < 35) return; // Minimum size to split
        
        if (this.childCells.length === 0) {
            // First split - create child cells
            const halfSize = this.size / Math.sqrt(2);
            
            // Create first child cell (at current position)
            const cell1 = {
                id: `${this.id}-1`,
                x: this.x,
                y: this.y,
                size: halfSize,
                color: this.color,
                splitForce: 12,
                splitDirection: { x: -this.dirX, y: -this.dirY }
            };
            
            // Create second child cell (at current position but will move away)
            const cell2 = {
                id: `${this.id}-2`,
                x: this.x,
                y: this.y,
                size: halfSize,
                color: this.color,
                splitForce: 12,
                splitDirection: { x: this.dirX, y: this.dirY }
            };
            
            this.childCells = [cell1, cell2];
        } else if (this.childCells.length < 16) { // Max number of cells is 16
            // Split each existing child cell
            const newCells = [];
            
            for (let i = 0; i < this.childCells.length; i++) {
                const cell = this.childCells[i];
                
                if (cell.size >= 35) { // Only split if big enough
                    // Calculate new size
                    const halfSize = cell.size / Math.sqrt(2);
                    
                    // Update existing cell
                    cell.size = halfSize;
                    
                    // Create new cell
                    const newCell = {
                        id: `${this.id}-${this.childCells.length + newCells.length + 1}`,
                        x: cell.x,
                        y: cell.y,
                        size: halfSize,
                        color: this.color,
                        splitForce: 12,
                        splitDirection: { x: this.dirX, y: this.dirY }
                    };
                    
                    // Update existing cell's split direction
                    cell.splitForce = 12;
                    cell.splitDirection = { x: -this.dirX, y: -this.dirY };
                    
                    newCells.push(newCell);
                }
            }
            
            this.childCells = this.childCells.concat(newCells);
        }
        
        // Set merge time
        this.mergeTime = Date.now() + this.mergeDelay;
    }
    
    ejectMass() {
        if (this.size < 35) return; // Minimum size to eject mass
        
        // Reduce size
        const ejectedSize = 4;
        this.size = Math.sqrt(this.size * this.size - ejectedSize * ejectedSize);
        
        // Create ejected mass blob
        const ejectedMass = {
            id: `mass-${Math.random().toString(36).substr(2, 9)}`,
            x: this.x + this.dirX * (this.size + ejectedSize),
            y: this.y + this.dirY * (this.size + ejectedSize),
            size: ejectedSize,
            color: this.color,
            dirX: this.dirX,
            dirY: this.dirY,
            speed: 8,
            lifespan: 5000 // ms
        };
        
        return ejectedMass;
    }
    
    draw(ctx) {
        if (this.childCells.length > 0) {
            // Draw all child cells
            for (const cell of this.childCells) {
                this.drawCell(ctx, cell.x, cell.y, cell.size, this.color, this.name);
            }
        } else {
            // Draw single cell
            this.drawCell(ctx, this.x, this.y, this.size, this.color, this.name);
        }
    }
    
    drawCell(ctx, x, y, size, color, name) {
        // Draw cell body
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        
        // Draw cell border
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw cell name
        if (size > 20) {
            ctx.fillStyle = 'black';
            ctx.font = `${Math.max(12, size / 3)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(name, x, y);
            
            // Draw cell mass
            if (size > 30) {
                const massText = Math.round(size * size);
                ctx.font = `${Math.max(8, size / 5)}px Arial`;
                ctx.fillText(massText, x, y + size / 2.5);
            }
        }
    }
    
    setDirection(dirX, dirY) {
        this.dirX = dirX;
        this.dirY = dirY;
    }
    
    grow(amount) {
        // Increase size and score
        const oldSize = this.size;
        const newSize = Math.sqrt(this.size * this.size + amount * amount);
        this.size = newSize;
        
        // Update score based on size increase
        this.score += Math.round(amount * 10);
    }
    
    canEat(otherCell) {
        if (this.childCells.length > 0) {
            // Check if any child cell can eat the other cell
            for (const cell of this.childCells) {
                if (this.cellCanEat(cell, otherCell)) {
                    return true;
                }
            }
            return false;
        } else {
            // Check if the main cell can eat the other cell
            return this.cellCanEat(this, otherCell);
        }
    }
    
    cellCanEat(cell, otherCell) {
        // Check if the cell is 30% larger than the other cell
        if (cell.size < otherCell.size * 1.3) return false;
        
        // Check if the cells are close enough
        const dx = cell.x - otherCell.x;
        const dy = cell.y - otherCell.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < cell.size - otherCell.size * 0.5;
    }
    
    collidesWithVirus(virus) {
        if (this.childCells.length > 0) {
            // Check if any child cell collides with the virus
            for (const cell of this.childCells) {
                if (this.cellCollidesWithVirus(cell, virus)) {
                    return true;
                }
            }
            return false;
        } else {
            // Check if the main cell collides with the virus
            return this.cellCollidesWithVirus(this, virus);
        }
    }
    
    cellCollidesWithVirus(cell, virus) {
        const dx = cell.x - virus.x;
        const dy = cell.y - virus.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < cell.size;
    }
    
    removeChildCell(cellId) {
        if (!this.childCells.length) return;
        
        // Remove the child cell by ID
        this.childCells = this.childCells.filter(cell => cell.id !== cellId);
        
        // If no child cells left, set the player as inactive
        if (this.childCells.length === 0) {
            this.active = false;
        }
    }
}