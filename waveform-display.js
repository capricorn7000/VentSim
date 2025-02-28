/**
 * Waveform Display Component
 * 
 * This component handles the visualization of ventilator waveforms
 * (pressure, flow, volume) based on simulation data.
 */

class WaveformDisplay {
  constructor(canvasId, options = {}) {
    // Get the canvas element
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      throw new Error(`Canvas element with ID "${canvasId}" not found`);
    }
    
    // Set up canvas context
    this.ctx = this.canvas.getContext('2d');
    
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
      }
    };
    
    // Data to display
    this.data = [];
    
    // Active waveforms to display
    this.activeWaveforms = options.activeWaveforms || ['pressure', 'flow', 'volume'];
    
    // Initialize the canvas
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }
  
  /**
   * Resize the canvas to fill its container while maintaining aspect ratio
   */
  resizeCanvas() {
    const container = this.canvas.parentElement;
    const containerWidth = container.clientWidth;
    
    this.canvas.width = containerWidth;
    this.canvas.height = containerWidth * 0.4; // 5:2 aspect ratio
    
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
   * Toggle the visibility of a specific waveform
   * @param {string} waveformName - Name of the waveform to toggle
   */
  toggleWaveform(waveformName) {
    const index = this.activeWaveforms.indexOf(waveformName);
    if (index === -1) {
      this.activeWaveforms.push(waveformName);
    } else {
      this.activeWaveforms.splice(index, 1);
    }
    this.draw();
  }
  
  /**
   * Draw the waveform display
   */
  draw() {
    const { ctx, canvas, options } = this;
    const { width, height } = canvas;
    const padding = options.padding;
    
    // Clear the canvas
    ctx.fillStyle = options.backgroundColor;
    ctx.fillRect(0, 0, width, height);
    
    // If no data, just draw the grid and exit
    if (!this.data || this.data.length === 0) {
      this.drawGrid();
      return;
    }
    
    // Draw grid
    this.drawGrid();
    
    // Calculate the visible time range
    const latestTime = this.data[this.data.length - 1].time;
    const startTime = Math.max(0, latestTime - options.timeWindow);
    
    // Draw each active waveform
    this.activeWaveforms.forEach(waveform => {
      this.drawWaveform(waveform, startTime, latestTime);
    });
    
    // Add legends for active waveforms
    this.drawLegends();
  }
  
  /**
   * Draw the background grid
   */
  drawGrid() {
    const { ctx, canvas, options } = this;
    const { width, height } = canvas;
    const padding = options.padding;
    
    ctx.strokeStyle = options.gridColor;
    ctx.lineWidth = 0.5;
    
    // Draw vertical time grid lines (every second)
    for (let i = 0; i <= options.timeWindow; i++) {
      const x = padding + ((width - 2 * padding) * i / options.timeWindow);
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
    
    // Draw horizontal grid lines (4 divisions)
    for (let i = 0; i <= 4; i++) {
      const y = padding + ((height - 2 * padding) * i / 4);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
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
   * Draw a specific waveform
   * @param {string} waveformType - Type of waveform ('pressure', 'flow', or 'volume')
   * @param {number} startTime - Start time for the visible window
   * @param {number} endTime - End time for the visible window
   */
  drawWaveform(waveformType, startTime, endTime) {
    const { ctx, canvas, options, data } = this;
    const { width, height } = canvas;
    const padding = options.padding;
    const plotWidth = width - 2 * padding;
    const plotHeight = height - 2 * padding;
    
    // Select data points in the visible time range
    const visibleData = data.filter(point => 
      point.time >= startTime && point.time <= endTime
    );
    
    if (visibleData.length < 2) return;
    
    // Get the y-value range for this waveform
    const [minY, maxY] = options.yRanges[waveformType];
    const yRange = maxY - minY;
    
    // Path for the waveform
    ctx.beginPath();
    ctx.strokeStyle = options.lineColors[waveformType];
    ctx.lineWidth = options.lineWidth;
    
    // Map the first point
    let value;
    switch (waveformType) {
      case 'pressure':
        value = visibleData[0].patient.pressure;
        break;
      case 'flow':
        // Convert mL/s to L/min
        value = visibleData[0].patient.flow * 0.06;
        break;
      case 'volume':
        // Adjust volume to show tidal volume (current - residual)
        value = visibleData[0].patient.volume - 
                (waveformType === 'volume' ? 1000 : 0); // Remove residual volume
        break;
    }
    
    // Scale to canvas coordinates
    const x0 = padding + ((visibleData[0].time - startTime) / (endTime - startTime)) * plotWidth;
    const y0 = height - padding - ((value - minY) / yRange) * plotHeight;
    
    ctx.moveTo(x0, y0);
    
    // Draw the rest of the points
    for (let i = 1; i < visibleData.length; i++) {
      switch (waveformType) {
        case 'pressure':
          value = visibleData[i].patient.pressure;
          break;
        case 'flow':
          // Convert mL/s to L/min
          value = visibleData[i].patient.flow * 0.06;
          break;
        case 'volume':
          // Adjust volume to show tidal volume
          value = visibleData[i].patient.volume - 
                  (waveformType === 'volume' ? 1000 : 0); // Remove residual volume
          break;
      }
      
      const x = padding + ((visibleData[i].time - startTime) / (endTime - startTime)) * plotWidth;
      const y = height - padding - ((value - minY) / yRange) * plotHeight;
      
      ctx.lineTo(x, y);
    }
    
    ctx.stroke();
  }
  
  /**
   * Draw the legend for active waveforms
   */
  drawLegends() {
    const { ctx, canvas, options } = this;
    const { width } = canvas;
    const legendY = 15;
    const legendSpacing = 100;
    
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    this.activeWaveforms.forEach((waveform, index) => {
      const legendX = width - 350 + (index * legendSpacing);
      
      // Draw color indicator
      ctx.fillStyle = options.lineColors[waveform];
      ctx.fillRect(legendX, legendY - 5, 15, 10);
      
      // Draw label
      ctx.fillStyle = '#333';
      let label = waveform.charAt(0).toUpperCase() + waveform.slice(1);
      
      // Add units
      switch (waveform) {
        case 'pressure':
          label += ' (cmH₂O)';
          break;
        case 'flow':
          label += ' (L/min)';
          break;
        case 'volume':
          label += ' (mL)';
          break;
      }
      
      ctx.fillText(label, legendX + 20, legendY);
    });
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
