// Input handling class
export class InputHandler {
    constructor(canvas) {
        this.mouseX = 0;
        this.mouseY = 0;
        this.callback = null;
        this.spacePressCallback = null;
        this.wPressCallback = null;
        
        // Mouse movement tracking
        canvas.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            
            if (this.callback) {
                this.callback(this.mouseX, this.mouseY);
            }
        });
        
        // Key press handling
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.spacePressCallback) {
                this.spacePressCallback();
            }
            
            if (e.code === 'KeyW' && this.wPressCallback) {
                this.wPressCallback();
            }
        });
    }
    
    // Set callback for mouse movement
    setCallback(callback) {
        this.callback = callback.bind(window.game);
    }
    
    // Set callback for space press
    setSpacePressCallback(callback) {
        this.spacePressCallback = callback;
    }
    
    // Set callback for W press
    setWPressCallback(callback) {
        this.wPressCallback = callback;
    }
    
    // Get current mouse position
    getMousePosition() {
        return { x: this.mouseX, y: this.mouseY };
    }
}