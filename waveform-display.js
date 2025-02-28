/**
 * Multi-Waveform Display Component
 * 
 * This component handles the visualization of ventilator waveforms
 * (pressure, flow, volume) as separate graphs based on simulation data.
 */

class WaveformDisplay {
  constructor(containerElement, options = {}) {
    // Get or create the container element
    this.container = typeof containerElement === 'string' ? 
                     document.getElementById(containerElement) : 
                     containerElement;
    
    if (!this.container) {
      throw new Error('Waveform container element not found');
    }
    
    // Configuration options with defaults
    this.options = {
      timeWindow: options.timeWindow || 6,  // Time window to display (seconds)
      gridColor: options.gridColor || '#ddd',
      backgroundColor: options.backgroundColor || '#f8f8f8',
      lineColors: options.lineColors || {
        pressure: '#E63946',  // Red for pressure
        flow: '#457B9D',      // Blue for flow
        volume: '#2A9D8F'     // Green for volume
      },
      lineWidth: options.lineWidth || 2,
      padding: options.padding || 30,
      yRanges: options.yRanges || {
        pressure: [0, 40],    // cmH₂O
        flow: [-60, 60],      // L/min
        volume: [0, 800]      // mL
      },
      residualVolume: 1000,  // Residual volume to subtract from total volume
      waveformHeight: options.waveformHeight || 150,  // Height of each waveform canvas
      waveformSpacing: options.waveformSpacing || 30  // Spacing between waveforms
    };
    
    // Data to display
    this.data = [];
    
    // Active waveforms and their canvases
    this.waveforms = [
      { type: 'pressure', label: 'Pressure (cmH₂O)', canvas: null, ctx: null, visible: true },
      { type: 'flow', label: 'Flow (L/min)', canvas: null, ctx: null, visible: true },
      { type: 'volume', label: 'Volume (mL)', canvas: null, ctx: null, visible: true }
    ];
    
    // Create the waveform display structure
    this.createWaveformDisplays();
    
    // Initialize event listeners
    this.setupEventListeners();
    
    // Handle window resize
    window.addEventListener('resize', () => this.resizeCanvases());
  }
  
  /**
   * Create the waveform display structure with separate canvases
   */
  createWaveformDisplays() {
    // Clear the container
    this.container.innerHTML = '';
    
    // Create waveform controls
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'waveform-global-controls';
    controlsDiv.innerHTML = `
      <div class="time-window-control">
        <label for="time-window">Time Window: </label>
        <input type="range" id="time-window" min="2" max="20" step="1" value="${this.options.timeWindow}">
        <span id="time-window-value">${this.options.timeWindow}s</span>
      </div>
    `;
    this.container.appendChild(controlsDiv);
    
    // Create individual waveform containers
    this.waveforms.forEach(waveform => {
      const waveformContainer = document.createElement('div');
      waveformContainer.className = 'waveform-container';
      waveformContainer.dataset.type = waveform.type;
      
      // Create header with controls
      const header = document.createElement('div');
      header.className = 'waveform-header';
      header.innerHTML = `
        <div class="waveform-title" style="color: ${this.options.lineColors[waveform.type]}">
          ${waveform.label}
        </div>
        <div class="waveform-controls">
          <label class="range-control">
            <span>Min:</span>
            <input type="number" class="y-min" 
                   value="${this.options.yRanges[waveform.type][0]}" 
                   data-waveform="${waveform.type}">
          </label>
          <label class="range-control">
            <span>Max:</span>
            <input type="number" class="y-max" 
                   value="${this.options.yRanges[waveform.type][1]}" 
                   data-waveform="${waveform.type}">
          </label>
          <label class="visibility-control">
            <input type="checkbox" class="visibility-toggle" 
                   data-waveform="${waveform.type}" ${waveform.visible ? 'checked' : ''}>
            <span>Show</span>
          </label>
        </div>
      `;
      waveformContainer.appendChild(header);
      
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.className = 'waveform-canvas';
      canvas.id = `waveform-${waveform.type}`;
      canvas.height = this.options.waveformHeight;
      waveformContainer.appendChild(canvas);
      
      // Store canvas reference
      waveform.canvas = canvas;
      waveform.ctx = canvas.getContext('2d');
      
      // Add to container
      this.container.appendChild(waveformContainer);
    });
    
    // Apply styles
    this.applyStyles();
    
    // Initial sizing
    this.resizeCanvases();
  }
  
  /**
   * Set up event listeners for controls
   */
  setupEventListeners() {
    // Time window control
    const timeWindowInput = document.getElementById('time-window');
    if (timeWindowInput) {
      timeWindowInput.addEventListener('input', () => {
        this.options.timeWindow = parseInt(timeWindowInput.value);
        document.getElementById('time-window-value').textContent = `${this.options.timeWindow}s`;
        this.draw();
      });
    }
    
    // Y-axis range controls
    document.querySelectorAll('.y-min, .y-max').forEach(input => {
      input.addEventListener('change', () => {
        const waveformType = input.dataset.waveform;
        const isMin = input.classList.contains('y-min');
        const value = parseFloat(input.value);
        
        if (!isNaN(value)) {
          if (isMin) {
            this.options.yRanges[waveformType][0] = value;
          } else {
            this.options.yRanges[waveformType][1] = value;
          }
          this.draw();
        }
      });
    });
    
    // Visibility toggles
    document.querySelectorAll('.visibility-toggle').forEach(toggle => {
      toggle.addEventListener('change', () => {
        const waveformType = toggle.dataset.waveform;
        const waveform = this.waveforms.find(w => w.type === waveformType);
        if (waveform) {
          waveform.visible = toggle.checked;
          
          // Show/hide the canvas container
          const container = toggle.closest('.waveform-container');
          if (container) {
            container.querySelector('canvas').style.display = toggle.checked ? 'block' : 'none';
          }
          
          this.draw();
        }
      });
    });
  }
  
  /**
   * Apply CSS styles to the waveform displays
   */
  applyStyles() {
    // Create a style element if it doesn't exist
    let styleElement = document.getElementById('waveform-display-styles');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'waveform-display-styles';
      document.head.appendChild(styleElement);
    }
    
    // Set the CSS
    styleElement.textContent = `
      .waveform-global-controls {
        margin-bottom: 15px;
        display: flex;
        justify-content: space-between;
        background-color: #f0f0f0;
        padding: 10px;
        border-radius: 5px;
      }
      
      .time-window-control {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .waveform-container {
        margin-bottom: ${this.options.waveformSpacing}px;
        background-color: white;
        border-radius: 5px;
        border: 1px solid #ddd;
        overflow: hidden;
      }
      
      .waveform-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        background-color: #f7f7f7;
        border-bottom: 1px solid #ddd;
      }
      
      .waveform-title {
        font-weight: bold;
        font-size: 14px;
      }
      
      .waveform-controls {
        display: flex;
        gap: 15px;
        align-items: center;
      }
      
      .range-control {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 12px;
      }
      
      .range-control input[type="number"] {
        width: 60px;
        padding: 2px 5px;
        border: 1px solid #ccc;
        border-radius: 3px;
      }
      
      .visibility-control {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 12px;
      }
      
      .waveform-canvas {
        display: block;
        width: 100%;
        background-color: ${this.options.backgroundColor};
      }
    `;
  }
  
  /**
   * Resize all waveform canvases to fill the container width
   */
  resizeCanvases() {
    const containerWidth = this.container.clientWidth;
    
    this.waveforms.forEach(waveform => {
      if (waveform.canvas) {
        waveform.canvas.width = containerWidth;
        // Height is fixed by the options.waveformHeight value
      }
    });
    
    // Redraw after resize
    this.draw();
  }
  
  /**
   * Update the data to be displayed
   * @param {Array} newData - Array of simulation data points
   */
  updateData(newData) {
    this.data = newData;
    this.draw();
  }
  
  /**
   * Draw all visible waveforms
   */
  draw() {
    if (!this.data || this.data.length === 0) {
      // Clear all canvases and draw empty grids
      this.waveforms.forEach(waveform => {
        if (waveform.visible) {
          this.clearAndDrawGrid(waveform);
        }
      });
      return;
    }
    
    // Calculate the visible time range
    const latestTime = this.data[this.data.length - 1].time;
    const startTime = Math.max(0, latestTime - this.options.timeWindow);
    
    // Draw each visible waveform
    this.waveforms.forEach(waveform => {
      if (waveform.visible) {
        this.drawSingleWaveform(waveform, startTime, latestTime);
      }
    });
  }
  
  /**
   * Clear a canvas and draw the grid
   * @param {Object} waveform - Waveform configuration object
   */
  clearAndDrawGrid(waveform) {
    const { ctx, canvas } = waveform;
    const { width, height } = canvas;
    const padding = this.options.padding;
    
    // Clear the canvas
    ctx.fillStyle = this.options.backgroundColor;
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    this.drawGridForWaveform(waveform);
  }
  
  /**
   * Draw grid for a specific waveform
   * @param {Object} waveform - Waveform configuration object
   */
  drawGridForWaveform(waveform) {
    const { ctx, canvas, type } = waveform;
    const { width, height } = canvas;
    const padding = this.options.padding;
    const [minY, maxY] = this.options.yRanges[type];
    
    ctx.strokeStyle = this.options.gridColor;
    ctx.lineWidth = 0.5;
    
    // Draw vertical time grid lines (every second)
    for (let i = 0; i <= this.options.timeWindow; i++) {
      const x = padding + ((width - 2 * padding) * i / this.options.timeWindow);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
      
      // Add time labels
      ctx.fillStyle = '#333';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`${i}s`, x, height - padding / 2);
    }
    
    // Draw horizontal grid lines (5 divisions)
    const yRange = maxY - minY;
    const yStep = yRange / 4;
    
    for (let i = 0; i <= 4; i++) {
      const y = padding + ((height - 2 * padding) * i / 4);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
      
      // Add y-axis labels
      const yValue = maxY - (i * yStep);
      ctx.fillStyle = '#333';
      ctx.font = '10px Arial';
      ctx.textAlign = 'right';
      ctx.fillText(yValue.toFixed(1), padding - 5, y);
    }
    
    // Draw axes
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000';
    
    // X-axis (time)
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.stroke();
  }
  
  /**
   * Draw a single waveform graph
   * @param {Object} waveform - Waveform configuration object
   * @param {number} startTime - Start time for the visible window
   * @param {number} endTime - End time for the visible window
   */
  drawSingleWaveform(waveform, startTime, endTime) {
    const { ctx, canvas, type } = waveform;
    const { width, height } = canvas;
    const padding = this.options.padding;
    const plotWidth = width - 2 * padding;
    const plotHeight = height - 2 * padding;
    
    // Clear and draw grid
    this.clearAndDrawGrid(waveform);
    
    // Select data points in the visible time range
    const visibleData = this.data.filter(point => 
      point.time >= startTime && point.time <= endTime
    );
    
    if (visibleData.length < 2) return;
    
    // Get the y-value range for this waveform
    const [minY, maxY] = this.options.yRanges[type];
    const yRange = maxY - minY;
    
    // Path for the waveform
    ctx.beginPath();
    ctx.strokeStyle = this.options.lineColors[type];
    ctx.lineWidth = this.options.lineWidth;
    
    // Map the first point
    let value;
    switch (type) {
      case 'pressure':
        value = visibleData[0].patient.pressure;
        break;
      case 'flow':
        // Convert mL/s to L/min
        value = visibleData[0].patient.flow * 0.06;
        break;
      case 'volume':
        // Use tidal volume if available, otherwise calculate from residual
        if (visibleData[0].patient.tidalVolume !== undefined) {
          value = Math.max(0, visibleData[0].patient.tidalVolume);
        } else {
          // Adjust volume to show tidal volume (current - residual)
          // Make sure it doesn't go below zero for display purposes
          value = Math.max(0, visibleData[0].patient.volume - this.options.residualVolume);
        }
        break;
    }
    
    // Scale to canvas coordinates
    const x0 = padding + ((visibleData[0].time - startTime) / (endTime - startTime)) * plotWidth;
    const y0 = height - padding - ((value - minY) / yRange) * plotHeight;
    
    ctx.moveTo(x0, y0);
    
    // Draw the rest of the points
    for (let i = 1; i < visibleData.length; i++) {
      switch (type) {
        case 'pressure':
          value = visibleData[i].patient.pressure;
          break;
        case 'flow':
          // Convert mL/s to L/min
          value = visibleData[i].patient.flow * 0.06;
          break;
        case 'volume':
          // Use tidal volume if available, otherwise calculate from residual
          if (visibleData[i].patient.tidalVolume !== undefined) {
            value = Math.max(0, visibleData[i].patient.tidalVolume);
          } else {
            // Adjust volume to show tidal volume (current - residual)
            // Make sure it doesn't go below zero for display purposes
            value = Math.max(0, visibleData[i].patient.volume - this.options.residualVolume);
          }
          break;
      }
      
      const x = padding + ((visibleData[i].time - startTime) / (endTime - startTime)) * plotWidth;
      const y = height - padding - ((value - minY) / yRange) * plotHeight;
      
      ctx.lineTo(x, y);
    }
    
    ctx.stroke();
    
    // Add zero line for flow (since it can be negative)
    if (type === 'flow' && minY < 0 && maxY > 0) {
      const zeroY = height - padding - ((0 - minY) / yRange) * plotHeight;
      
      ctx.beginPath();
      ctx.strokeStyle = '#999';
      ctx.setLineDash([5, 5]);
      ctx.moveTo(padding, zeroY);
      ctx.lineTo(width - padding, zeroY);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  
  /**
   * Set the Y-axis range for a specific waveform
   * @param {string} waveformType - Type of waveform ('pressure', 'flow', or 'volume')
   * @param {Array} range - [min, max] array for Y-axis range
   */
  setYAxisRange(waveformType, range) {
    if (this.options.yRanges[waveformType]) {
      this.options.yRanges[waveformType] = range;
      
      // Update input fields if they exist
      const minInput = document.querySelector(`.y-min[data-waveform="${waveformType}"]`);
      const maxInput = document.querySelector(`.y-max[data-waveform="${waveformType}"]`);
      
      if (minInput) minInput.value = range[0];
      if (maxInput) maxInput.value = range[1];
      
      this.draw();
    }
  }
  
  /**
   * Toggle the visibility of a specific waveform
   * @param {string} waveformType - Type of waveform to toggle
   */
  toggleWaveform(waveformType) {
    const waveform = this.waveforms.find(w => w.type === waveformType);
    if (waveform) {
      waveform.visible = !waveform.visible;
      
      // Update checkbox if it exists
      const checkbox = document.querySelector(`.visibility-toggle[data-waveform="${waveformType}"]`);
      if (checkbox) checkbox.checked = waveform.visible;
      
      // Show/hide the canvas
      if (waveform.canvas) {
        waveform.canvas.style.display = waveform.visible ? 'block' : 'none';
      }
      
      this.draw();
    }
  }
}

/**
 * Class for lung visualization showing alveolar units
 */
class LungVisualization {
  constructor(canvasId) {
    // Get the canvas element
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      throw new Error(`Canvas element with ID "${canvasId}" not found`);
    }
    
    // Set up canvas context
    this.ctx = this.canvas.getContext('2d');
    
    // Array of alveolar units
    this.units = [];
    
    // Initialize the canvas
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }
  
  /**
   * Resize the canvas to fill its container
   */
  resizeCanvas() {
    const container = this.canvas.parentElement;
    const containerWidth = container.clientWidth;
    
    this.canvas.width = containerWidth;
    this.canvas.height = containerWidth * 1.2; // Taller than wide for lung shape
    
    // Redraw after resize
    this.draw();
  }
  
  /**
   * Update alveolar unit data
   * @param {Array} unitStates - Array of alveolar unit states
   */
  updateUnits(unitStates) {
    this.units = unitStates || [];
    this.draw();
  }
  
  /**
   * Draw the lung visualization
   */
  draw() {
    const { ctx, canvas } = this;
    const { width, height } = canvas;
    
    // Clear the canvas
    ctx.fillStyle = '#f8f8f8';
    ctx.fillRect(0, 0, width, height);
    
    // Draw lung outline
    this.drawLungOutline();
    
    // Draw alveolar units if available
    if (this.units && this.units.length > 0) {
      this.drawAlveolarUnits();
    }
  }
  
  /**
   * Draw a stylized lung outline
   */
  drawLungOutline() {
    const { ctx, canvas } = this;
    const { width, height } = canvas;
    
    // Calculate dimensions
    const centerX = width / 2;
    const lungWidth = width * 0.4;
    const lungHeight = height * 0.7;
    const topY = height * 0.2;
    
    // Draw trachea
    ctx.beginPath();
    ctx.moveTo(centerX, topY - height * 0.1);
    ctx.lineTo(centerX, topY);
    ctx.lineWidth = width * 0.05;
    ctx.strokeStyle = '#ddd';
    ctx.stroke();
    
    // Draw main bronchi
    ctx.beginPath();
    ctx.moveTo(centerX, topY);
    ctx.lineTo(centerX - lungWidth * 0.5, topY + lungHeight * 0.2);
    ctx.moveTo(centerX, topY);
    ctx.lineTo(centerX + lungWidth * 0.5, topY + lungHeight * 0.2);
    ctx.lineWidth = width * 0.03;
    ctx.strokeStyle = '#ddd';
    ctx.stroke();
    
    // Left lung outline
    ctx.beginPath();
    ctx.moveTo(centerX - lungWidth * 0.2, topY);
    ctx.bezierCurveTo(
      centerX - lungWidth * 0.8, topY + lungHeight * 0.2,
      centerX - lungWidth * 1.0, topY + lungHeight * 0.5,
      centerX - lungWidth * 0.7, topY + lungHeight
    );
    ctx.bezierCurveTo(
      centerX - lungWidth * 0.3, topY + lungHeight * 1.1,
      centerX - lungWidth * 0.1, topY + lungHeight * 0.7,
      centerX - lungWidth * 0.2, topY
    );
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#666';
    ctx.stroke();
    
    // Right lung outline (slightly larger)
    ctx.beginPath();
    ctx.moveTo(centerX + lungWidth * 0.2, topY);
    ctx.bezierCurveTo(
      centerX + lungWidth * 0.8, topY + lungHeight * 0.2,
      centerX + lungWidth * 1.0, topY + lungHeight * 0.5,
      centerX + lungWidth * 0.7, topY + lungHeight
    );
    ctx.bezierCurveTo(
      centerX + lungWidth * 0.3, topY + lungHeight * 1.1,
      centerX + lungWidth * 0.1, topY + lungHeight * 0.7,
      centerX + lungWidth * 0.2, topY
    );
    ctx.stroke();
  }
  
  /**
   * Draw alveolar units as circles distributed throughout the lungs
   */
  drawAlveolarUnits() {
    const { ctx, canvas, units } = this;
    const { width, height } = canvas;
    
    // Calculate dimensions
    const centerX = width / 2;
    const lungWidth = width * 0.35;
    const lungHeight = height * 0.6;
    const topY = height * 0.25;
    
    // Left lung units (first half of units)
    const leftUnits = units.slice(0, Math.ceil(units.length / 2));
    
    // Right lung units (second half of units)
    const rightUnits = units.slice(Math.ceil(units.length / 2));
    
    // Draw left lung units
    leftUnits.forEach((unit, index) => {
      const verticalPosition = unit.position;
      const horizontalOffset = Math.sin(index * 2.5) * 0.5 + 0.5; // 0-1 range
      
      // Calculate position 
      const unitX = centerX - (lungWidth * 0.4 + horizontalOffset * lungWidth * 0.4);
      const unitY = topY + verticalPosition * lungHeight;
      
      this.drawAlveolarUnit(unitX, unitY, unit);
    });
    
    // Draw right lung units
    rightUnits.forEach((unit, index) => {
      const verticalPosition = unit.position;
      const horizontalOffset = Math.sin(index * 2.5) * 0.5 + 0.5; // 0-1 range
      
      // Calculate position 
      const unitX = centerX + (lungWidth * 0.4 + horizontalOffset * lungWidth * 0.4);
      const unitY = topY + verticalPosition * lungHeight;
      
      this.drawAlveolarUnit(unitX, unitY, unit);
    });
  }
  
  /**
   * Draw a single alveolar unit
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Object} unit - Alveolar unit data
   */
  drawAlveolarUnit(x, y, unit) {
    const { ctx } = this;
    const radius = 15 + (unit.volume / 10); // Size based on volume
    
    // Background circle based on unit status
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    
    // Fill color based on unit state
    if (!unit.isOpen) {
      if (unit.pathology === 'consolidated') {
        ctx.fillStyle = '#E76F51'; // Orange-red for consolidated
      } else {
        ctx.fillStyle = '#999'; // Gray for collapsed
      }
    } else if (unit.pathology === 'air-trapped') {
      ctx.fillStyle = '#E9C46A'; // Yellow for air-trapped
    } else {
      // Calculate color based on ventilation (volume/flow)
      const ventilationIntensity = Math.min(255, Math.max(100, 100 + unit.volume / 2));
      ctx.fillStyle = `rgb(${255-ventilationIntensity}, ${255-ventilationIntensity}, 255)`;
    }
    
    ctx.fill();
    
    // Unit outline
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Add a small indicator for perfusion
    const perfusionRadius = radius * 0.3;
    ctx.beginPath();
    ctx.arc(x, y, perfusionRadius, 0, Math.PI * 2);
    
    // Perfusion color (red with opacity based on perfusion value)
    ctx.fillStyle = `rgba(220, 20, 60, ${unit.perfusion})`;
    ctx.fill();
  }
}

// Export the classes for use in other modules
export { WaveformDisplay, LungVisualization };