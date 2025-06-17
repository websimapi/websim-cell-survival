export class Food {
    constructor(id, x, y, size, color) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.size = size || 3;
        this.color = color || '#99FF99';
    }
    
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}