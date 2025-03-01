// waveform-display.js - Complete replacement file

// Canvas and context references
let pressureCanvas, pressureCtx;
let volumeCanvas, volumeCtx;
let flowCanvas, flowCtx;

// Data arrays for waveforms
let pressureData = [];
let volumeData = [];
let flowData = [];

// Display settings
let timeScale = 10; // seconds visible on screen
let yScalePressure = 50; // cmH2O max
let yScaleVolume = 800; // mL max
let yScaleFlow = 60; // L/min max

// Initialize all waveform displays
function initializeWaveformDisplays() {
  // Get canvas references
  pressureCanvas = document.getElementById('pressure-canvas');
  volumeCanvas = document.getElementById('volume-canvas');
  flowCanvas = document.getElementById('flow-canvas');

  // Get drawing contexts
  if (pressureCanvas) pressureCtx = pressureCanvas.getContext('2d');
  if (volumeCanvas) volumeCtx = volumeCanvas.getContext('2d');
  if (flowCanvas) flowCtx = flowCanvas.getContext('2d');

  // Set up canvases
  setupWaveformCanvases();
  
  // Initial render of empty waveforms
  renderAllWaveforms();
  
  // Set a timeout to refresh again after data is likely loaded
  setTimeout(renderAllWaveforms, 200);
}

// Set up canvas dimensions properly
function setupWaveformCanvases() {
  const canvases = [pressureCanvas, volumeCanvas, flowCanvas];
  
  canvases.forEach(canvas => {
    if (!canvas) return;
    
    // Get the computed dimensions of the container
    const container = canvas.parentElement;
    const computedStyle = getComputedStyle(container);
    
    // Set canvas dimensions to match container
    canvas.width = parseInt(computedStyle.width, 10);
    canvas.height = parseInt(computedStyle.height, 10);
  });
}

// Main function to refresh all waveforms
function renderAllWaveforms() {
  renderPressureWaveform();
  renderVolumeWaveform();
  renderFlowWaveform();
}

// Render pressure waveform
function renderPressureWaveform() {
  if (!pressureCanvas || !pressureCtx) return;
  
  // Clear canvas
  pressureCtx.clearRect(0, 0, pressureCanvas.width, pressureCanvas.height);
  
  // Draw axes
  drawAxes(pressureCtx, pressureCanvas, "Pressure (cmH2O)", yScalePressure);
  
  // Draw waveform
  drawWaveform(pressureCtx, pressureCanvas, pressureData, yScalePressure, 'red');
}

// Render volume waveform
function renderVolumeWaveform() {
  if (!volumeCanvas || !volumeCtx) return;
  
  // Clear canvas
  volumeCtx.clearRect(0, 0, volumeCanvas.width, volumeCanvas.height);
  
  // Draw axes
  drawAxes(volumeCtx, volumeCanvas, "Volume (mL)", yScaleVolume);
  
  // Draw waveform
  drawWaveform(volumeCtx, volumeCanvas, volumeData, yScaleVolume, 'blue');
}

// Render flow waveform
function renderFlowWaveform() {
  if (!flowCanvas || !flowCtx) return;
  
  // Clear canvas
  flowCtx.clearRect(0, 0, flowCanvas.width, flowCanvas.height);
  
  // Draw axes
  drawAxes(flowCtx, flowCanvas, "Flow (L/min)", yScaleFlow);
  
  // Draw waveform
  drawWaveform(flowCtx, flowCanvas, flowData, yScaleFlow, 'green');
}

// Helper function to draw axes
function drawAxes(ctx, canvas, label, maxValue) {
  const width = canvas.width;
  const height = canvas.height;
  const padding = 40; // Padding from edges
  
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 1;
  ctx.font = '12px Arial';
  ctx.fillStyle = '#333';
  
  // Draw Y axis
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.stroke();
  
  // Draw X axis
  ctx.beginPath();
  ctx.moveTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();
  
  // Draw Y axis label
  ctx.save();
  ctx.translate(15, height/2);
  ctx.rotate(-Math.PI/2);
  ctx.textAlign = 'center';
  ctx.fillText(label, 0, 0);
  ctx.restore();
  
  // Draw Y axis ticks
  const numTicks = 5;
  for (let i = 0; i <= numTicks; i++) {
    const y = padding + (height - 2 * padding) * (1 - i / numTicks);
    const value = (maxValue * i / numTicks).toFixed(0);
    
    ctx.beginPath();
    ctx.moveTo(padding - 5, y);
    ctx.lineTo(padding, y);
    ctx.stroke();
    
    ctx.textAlign = 'right';
    ctx.fillText(value, padding - 8, y + 4);
  }
  
  // Draw X axis time ticks
  const timePoints = 5;
  for (let i = 0; i <= timePoints; i++) {
    const x = padding + (width - 2 * padding) * (i / timePoints);
    const value = (timeScale * i / timePoints).toFixed(1);
    
    ctx.beginPath();
    ctx.moveTo(x, height - padding);
    ctx.lineTo(x, height - padding + 5);
    ctx.stroke();
    
    ctx.textAlign = 'center';
    ctx.fillText(value + 's', x, height - padding + 18);
  }
}

// Helper function to draw waveform
function drawWaveform(ctx, canvas, data, maxValue, color) {
  if (!data || data.length < 2) return;
  
  const width = canvas.width;
  const height = canvas.height;
  const padding = 40;
  
  const drawWidth = width - 2 * padding;
  const drawHeight = height - 2 * padding;
  
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  const timeRange = timeScale * 1000; // convert to ms
  const currentTime = Date.now();
  const startTime = currentTime - timeRange;
  
  // Find data points within the time range
  const visibleData = data.filter(point => point.time > startTime && point.time <= currentTime);
  
  if (visibleData.length < 2) return;
  
  for (let i = 0; i < visibleData.length; i++) {
    const point = visibleData[i];
    const x = padding + drawWidth * ((point.time - startTime) / timeRange);
    const y = padding + drawHeight * (1 - point.value / maxValue);
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  
  ctx.stroke();
}

// Update data for waveforms
function updateWaveformData(type, value) {
  const time = Date.now();
  
  switch(type) {
    case 'pressure':
      pressureData.push({ time, value });
      // Keep only recent data points (last 30 seconds)
      pressureData = pressureData.filter(point => time - point.time < 30000);
      break;
    case 'volume':
      volumeData.push({ time, value });
      volumeData = volumeData.filter(point => time - point.time < 30000);
      break;
    case 'flow':
      flowData.push({ time, value });
      flowData = flowData.filter(point => time - point.time < 30000);
      break;
  }
  
  // Trigger a render
  renderAllWaveforms();
}

// Update time scale
function updateTimeScale(newScale) {
  timeScale = newScale;
  renderAllWaveforms();
}

// Create a simulation update listener
function listenForSimulationUpdates() {
  // Listen for custom event
  document.addEventListener('simulation-updated', function(e) {
    renderAllWaveforms();
  });
  
  // Also listen for window resize
  window.addEventListener('resize', function() {
    setupWaveformCanvases();
    renderAllWaveforms();
  });
}

// Start periodic refresh (as backup)
function startPeriodicRefresh() {
  setInterval(renderAllWaveforms, 100); // Refresh 10 times per second
}

// Export functions
window.WaveformDisplay = {
  initialize: function() {
    initializeWaveformDisplays();
    listenForSimulationUpdates();
    startPeriodicRefresh();
  },
  updateData: updateWaveformData,
  updateTimeScale: updateTimeScale,
  refresh: renderAllWaveforms
};

// Initialize on load
document.addEventListener('DOMContentLoaded', function() {
  window.WaveformDisplay.initialize();
});