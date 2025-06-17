export class InputHandler {
    constructor(canvas) {
        this.canvas = canvas;
        this.mouseX = 0;
        this.mouseY = 0;
        this.touchX = 0;
        this.touchY = 0;
        this.isTouching = false;
        this.isKeyDown = {};
        this.callback = null;
        
        // Set up event listeners
        this.setupListeners();
    }
    
    setupListeners() {
        // Mouse movement
        this.canvas.addEventListener('mousemove', (event) => {
            this.mouseX = event.clientX;
            this.mouseY = event.clientY;
            
            if (this.callback) {
                this.callback(this.mouseX, this.mouseY);
            }
        });
        
        // Touch input for mobile devices
        this.canvas.addEventListener('touchstart', (event) => {
            event.preventDefault();
            this.isTouching = true;
            this.updateTouchPosition(event);
        });
        
        this.canvas.addEventListener('touchmove', (event) => {
            event.preventDefault();
            this.updateTouchPosition(event);
        });
        
        this.canvas.addEventListener('touchend', (event) => {
            event.preventDefault();
            this.isTouching = false;
        });
        
        // Keyboard input
        window.addEventListener('keydown', (event) => {
            this.isKeyDown[event.key] = true;
            
            // Space key for splitting
            if (event.key === ' ' && this.onSpacePress) {
                this.onSpacePress();
            }
            
            // W key for ejecting mass
            if (event.key === 'w' && this.onWPress) {
                this.onWPress();
            }
        });
        
        window.addEventListener('keyup', (event) => {
            this.isKeyDown[event.key] = false;
        });
        
        // Double tap for mobile splitting
        let lastTap = 0;
        this.canvas.addEventListener('touchstart', (event) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            
            if (tapLength < 300 && tapLength > 0 && this.onSpacePress) {
                this.onSpacePress();
            }
            
            lastTap = currentTime;
        });
    }
    
    updateTouchPosition(event) {
        if (event.touches.length > 0) {
            const touch = event.touches[0];
            this.touchX = touch.clientX;
            this.touchY = touch.clientY;
            
            if (this.callback) {
                this.callback(this.touchX, this.touchY);
            }
        }
    }
    
    setCallback(callback) {
        this.callback = callback;
    }
    
    setSpacePressCallback(callback) {
        this.onSpacePress = callback;
    }
    
    setWPressCallback(callback) {
        this.onWPress = callback;
    }
}