export class Virus {
    constructor(id, x, y, size) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.size = size || 20;
        this.color = '#33FF33';
        this.spikes = 10; // Number of spikes
    }
    
    draw(ctx) {
        ctx.beginPath();
        
        // Draw spiky virus
        const outerRadius = this.size;
        const innerRadius = this.size * 0.7;
        
        for (let i = 0; i < this.spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (Math.PI * 2 * i) / (this.spikes * 2);
            const x = this.x + radius * Math.cos(angle);
            const y = this.y + radius * Math.sin(angle);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}