class EtchASketch {
  constructor() {
    this.canvas = document.getElementById('etchCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.instructions = document.getElementById('instructions');
    this.glitchOverlay = document.getElementById('glitch-overlay');
    
    this.isDrawing = false;
    this.knobMode = false;
    this.currentX = 0;
    this.currentY = 0;
    this.lastX = 0;
    this.lastY = 0;
    this.lastDirection = null;
    this.speed = 0;
    this.lastTime = Date.now();
    
    this.setupCanvas();
    this.setupEventListeners();
    this.drawInitialPattern();
  }
  
  setupCanvas() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }
  
  resizeCanvas() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.ctx.lineCap = 'square';
    this.ctx.lineJoin = 'miter';
    this.drawInitialPattern(); // Redraw pattern on resize
  }
  
  setupEventListeners() {
    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e));
    this.canvas.addEventListener('mouseup', () => this.stopDrawing());
    this.canvas.addEventListener('mouseleave', () => this.stopDrawing());
    
    // Touch events for mobile
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.canvas.dispatchEvent(mouseEvent);
    });
    
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.canvas.dispatchEvent(mouseEvent);
    });
    
    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      const mouseEvent = new MouseEvent('mouseup', {});
      this.canvas.dispatchEvent(mouseEvent);
    });
    
    // Keyboard events
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));
  }
  
  startDrawing(e) {
    this.isDrawing = true;
    this.currentX = e.clientX;
    this.currentY = e.clientY;
    this.lastX = this.currentX;
    this.lastY = this.currentY;
  }
  
  draw(e) {
    if (!this.isDrawing || this.knobMode) return;
    
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    // Calculate movement delta
    const deltaX = Math.abs(mouseX - this.lastX);
    const deltaY = Math.abs(mouseY - this.lastY);
    
    // Determine direction based on larger movement
    let direction;
    if (deltaX > deltaY) {
      direction = mouseX > this.lastX ? 'right' : 'left';
    } else {
      direction = mouseY > this.lastY ? 'down' : 'up';
    }
    
    // Calculate speed for line thickness
    const currentTime = Date.now();
    const timeDelta = Math.max(1, currentTime - this.lastTime); // Avoid division by zero
    this.speed = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / timeDelta;
    this.lastTime = currentTime;
    
    // Draw only horizontal or vertical lines
    this.ctx.beginPath();
    this.ctx.moveTo(this.currentX, this.currentY);
    
    if (direction === 'left' || direction === 'right') {
      this.currentX = mouseX;
    } else {
      this.currentY = mouseY;
    }
    
    // Variable line thickness based on speed and direction changes
    let lineWidth = 1.5;
    if (this.speed > 1) {
      lineWidth = Math.min(3, 1.5 + this.speed * 0.3);
    }
    if (direction !== this.lastDirection && this.lastDirection !== null) {
      lineWidth += 0.5; // Thicker on direction changes
      this.addGlitchEffect();
    }
    
    this.ctx.lineWidth = lineWidth;
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineTo(this.currentX, this.currentY);
    this.ctx.stroke();
    
    this.lastX = mouseX;
    this.lastY = mouseY;
    this.lastDirection = direction;
  }
  
  stopDrawing() {
    this.isDrawing = false;
    this.lastDirection = null;
  }
  
  handleKeyboard(e) {
    const key = e.key.toLowerCase();
    
    // Clear canvas
    if (key === 'c') {
      this.clearCanvas();
      return;
    }
    
    // Toggle instructions
    if (key === 'h') {
      this.instructions.classList.toggle('hidden');
      return;
    }
    
    // Knob mode with arrow keys
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
      e.preventDefault();
      this.knobMode = true;
      
      // Initialize position if not set
      if (this.currentX === 0 && this.currentY === 0) {
        this.currentX = this.canvas.width / 2;
        this.currentY = this.canvas.height / 2;
      }
      
      const step = e.shiftKey ? 10 : 3; // Hold shift for faster movement
      let newX = this.currentX;
      let newY = this.currentY;
      
      switch(key) {
        case 'arrowup':
          newY = Math.max(0, this.currentY - step);
          break;
        case 'arrowdown':
          newY = Math.min(this.canvas.height, this.currentY + step);
          break;
        case 'arrowleft':
          newX = Math.max(0, this.currentX - step);
          break;
        case 'arrowright':
          newX = Math.min(this.canvas.width, this.currentX + step);
          break;
      }
      
      // Draw line
      this.ctx.beginPath();
      this.ctx.moveTo(this.currentX, this.currentY);
      this.ctx.lineWidth = 2;
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineTo(newX, newY);
      this.ctx.stroke();
      
      this.currentX = newX;
      this.currentY = newY;
    }
  }
  
  clearCanvas() {
    // Add shake effect
    this.canvas.style.animation = 'shake 0.5s';
    this.addGlitchEffect();
    
    setTimeout(() => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.canvas.style.animation = 'subtlePulse 4s ease-in-out infinite'; // Restore original animation
      this.drawInitialPattern();
    }, 500);
  }
  
  drawInitialPattern() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); // Clear before drawing
    this.ctx.strokeStyle = 'rgba(0,0,0,0.2)'; // Lighter color for initial pattern
    this.ctx.lineWidth = 1;
    
    // Draw a simple border
    const padding = 20;
    this.ctx.strokeRect(padding, padding, this.canvas.width - padding*2, this.canvas.height - padding*2);
  }
  
  addGlitchEffect() {
    this.glitchOverlay.classList.add('active');
    setTimeout(() => {
      this.glitchOverlay.classList.remove('active');
    }, 100);
  }
}

// Initialize the app
const etchASketch = new EtchASketch();