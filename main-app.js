// main-app.js - Complete replacement file

// Application state
let simulationRunning = false;
let ventilatorSettings = {
  mode: 'PCV',          // Pressure Control Ventilation
  peep: 5,              // Positive End-Expiratory Pressure (cmH2O)
  pip: 20,              // Peak Inspiratory Pressure (cmH2O)
  rate: 15,             // Respiratory Rate (breaths/min)
  ieRatio: 0.5,         // I:E Ratio (1:2)
  tidalVolume: 500,     // Tidal Volume (mL)
  fio2: 40,             // Fraction of Inspired Oxygen (%)
  triggerSensitivity: 2 // Trigger Sensitivity (cmH2O)
};

let patientParameters = {
  compliance: 50,       // Lung Compliance (mL/cmH2O)
  resistance: 10,       // Airway Resistance (cmH2O·s/L)
  lungModel: 'normal'   // Patient condition: normal, ards, copd, asthma
};

// Initialize the application
function initializeApp() {
  console.log('Ventilator Simulation App Initializing...');
  
  // Initialize the simulation engine
  if (window.SimulationCore) {
    window.SimulationCore.initialize(ventilatorSettings, patientParameters);
  } else {
    console.error('Simulation Core not loaded!');
  }
  
  // Initialize the UI controls
  if (window.VentilatorUI) {
    window.VentilatorUI.initialize(ventilatorSettings, patientParameters, updateSettings);
  } else {
    console.error('Ventilator UI not loaded!');
  }
  
  // Initialize waveform display
  if (window.WaveformDisplay) {
    window.WaveformDisplay.initialize();
    
    // Force a refresh after everything is loaded
    setTimeout(function() {
      window.WaveformDisplay.refresh();
      notifySimulationUpdated();
    }, 500);
  } else {
    console.error('Waveform Display not loaded!');
  }
  
  // Set up event listeners
  setupEventListeners();
  
  // Start the simulation loop
  startSimulation();
  
  console.log('Ventilator Simulation App Initialized');
}

// Set up event listeners
function setupEventListeners() {
  // Start/Stop button
  const startStopButton = document.getElementById('start-stop-button');
  if (startStopButton) {
    startStopButton.addEventListener('click', function() {
      toggleSimulation();
    });
  }
  
  // Time scale control
  const timeScaleControl = document.getElementById('time-scale-control');
  if (timeScaleControl) {
    timeScaleControl.addEventListener('change', function(e) {
      const newScale = parseFloat(e.target.value);
      if (window.WaveformDisplay) {
        window.WaveformDisplay.updateTimeScale(newScale);
      }
      // Force an additional refresh to ensure display updates
      setTimeout(function() {
        if (window.WaveformDisplay) {
          window.WaveformDisplay.refresh();
        }
      }, 100);
    });
  }
  
  // Listen for window resize to adjust displays
  window.addEventListener('resize', function() {
    if (window.WaveformDisplay) {
      window.WaveformDisplay.refresh();
    }
  });
}

// Update settings when controls change
function updateSettings(newSettings, type) {
  if (type === 'ventilator') {
    ventilatorSettings = {...ventilatorSettings, ...newSettings};
    if (window.SimulationCore) {
      window.SimulationCore.updateVentilatorSettings(ventilatorSettings);
    }
  } else if (type === 'patient') {
    patientParameters = {...patientParameters, ...newSettings};
    if (window.SimulationCore) {
      window.SimulationCore.updatePatientParameters(patientParameters);
    }
  }
  
  // Notify that simulation parameters have been updated
  notifySimulationUpdated();
}

// Start the simulation loop
function startSimulation() {
  simulationRunning = true;
  
  // Update simulation at 60Hz
  const simulationInterval = setInterval(function() {
    if (!simulationRunning) {
      clearInterval(simulationInterval);
      return;
    }
    
    // Run one step of simulation
    if (window.SimulationCore) {
      const results = window.SimulationCore.step();
      
      // Update waveform displays with new data
      if (window.WaveformDisplay && results) {
        window.WaveformDisplay.updateData('pressure', results.pressure);
        window.WaveformDisplay.updateData('volume', results.volume);
        window.WaveformDisplay.updateData('flow', results.flow);
      }
    }
  }, 16); // ~60 frames per second
}

// Toggle simulation on/off
function toggleSimulation() {
  simulationRunning = !simulationRunning;
  
  if (simulationRunning) {
    startSimulation();
    document.getElementById('start-stop-button').textContent = 'Stop';
  } else {
    document.getElementById('start-stop-button').textContent = 'Start';
  }
}

// Notify that simulation has been updated (for observers)
function notifySimulationUpdated() {
  // Create and dispatch a custom event
  const event = new CustomEvent('simulation-updated');
  document.dispatchEvent(event);
}

// Ensure the simulator refreshes waveforms periodically
function ensureWaveformRefresh() {
  // Set up a periodic refresh as a backup
  setInterval(function() {
    if (window.WaveformDisplay) {
      window.WaveformDisplay.refresh();
    }
  }, 1000); // Refresh once per second as a fallback
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
  ensureWaveformRefresh();
});