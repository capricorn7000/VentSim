/**
 * Ventilator User Interface
 * 
 * This file contains the components for creating a realistic ventilator control panel
 * that mimics the interface of a real ventilator.
 */

class VentilatorControlPanel {
  constructor(containerElement, simulation) {
    this.container = containerElement;
    this.simulation = simulation;
    
    // Current ventilator settings
    this.settings = {
      mode: 'pressure-control',
      pControl: 20,
      peep: 5,
      respiratoryRate: 15,
      ieRatio: 0.5,
      fio2: 0.5,
      triggerSensitivity: -2,
      riseTime: 0.1
    };
    
    // Initialize the UI
    this.initializeUI();
  }
  
  /**
   * Initialize the ventilator control panel UI
   */
  initializeUI() {
    // Clear the container
    this.container.innerHTML = '';
    
    // Create the ventilator panel
    const panel = document.createElement('div');
    panel.className = 'ventilator-panel';
    panel.innerHTML = `
      <div class="panel-section">
        <h2>Ventilator Controls</h2>
        <div class="ventilator-display">
          <div class="display-section">
            <div class="display-value" id="pressure-display">0</div>
            <div class="display-label">Pressure<br>(cmH₂O)</div>
          </div>
          <div class="display-section">
            <div class="display-value" id="volume-display">0</div>
            <div class="display-label">Tidal Volume<br>(mL)</div>
          </div>
          <div class="display-section">
            <div class="display-value" id="rate-display">0</div>
            <div class="display-label">Rate<br>(bpm)</div>
          </div>
          <div class="display-section">
            <div class="display-value" id="peep-display">0</div>
            <div class="display-label">PEEP<br>(cmH₂O)</div>
          </div>
        </div>
      </div>
      
      <div class="panel-section">
        <div class="control-group">
          <label for="mode-select">Mode</label>
          <select id="mode-select">
            <option value="pressure-control">Pressure Control</option>
            <option value="volume-control" disabled>Volume Control</option>
            <option value="pressure-support" disabled>Pressure Support</option>
          </select>
        </div>
        
        <div class="control-group">
          <label for="pcontrol-knob">Pressure</label>
          <div class="knob-container">
            <input type="range" id="pcontrol-knob" min="5" max="40" step="1" value="${this.settings.pControl}">
            <div class="knob-value" id="pcontrol-value">${this.settings.pControl} cmH₂O</div>
          </div>
        </div>
        
        <div class="control-group">
          <label for="peep-knob">PEEP</label>
          <div class="knob-container">
            <input type="range" id="peep-knob" min="0" max="20" step="1" value="${this.settings.peep}">
            <div class="knob-value" id="peep-value">${this.settings.peep} cmH₂O</div>
          </div>
        </div>
        
        <div class="control-group">
          <label for="rate-knob">Rate</label>
          <div class="knob-container">
            <input type="range" id="rate-knob" min="6" max="40" step="1" value="${this.settings.respiratoryRate}">
            <div class="knob-value" id="rate-value">${this.settings.respiratoryRate} bpm</div>
          </div>
        </div>
        
        <div class="control-group">
          <label for="ie-knob">I:E Ratio</label>
          <div class="knob-container">
            <input type="range" id="ie-knob" min="0.25" max="1" step="0.05" value="${this.settings.ieRatio}">
            <div class="knob-value" id="ie-value">1:${Math.round(1/this.settings.ieRatio * 10) / 10}</div>
          </div>
        </div>
        
        <div class="control-group">
          <label for="fio2-knob">FiO₂</label>
          <div class="knob-container">
            <input type="range" id="fio2-knob" min="0.21" max="1" step="0.05" value="${this.settings.fio2}">
            <div class="knob-value" id="fio2-value">${Math.round(this.settings.fio2 * 100)}%</div>
          </div>
        </div>
      </div>
      
      <div class="panel-section">
        <div class="button-container">
          <button id="start-btn" class="action-button start">Start</button>
          <button id="pause-btn" class="action-button pause" disabled>Pause</button>
          <button id="alarm-silence-btn" class="action-button">Silence Alarm</button>
        </div>
        <div class="patient-model-switch">
          <label>
            <input type="checkbox" id="advanced-model-toggle">
            Use Advanced Patient Model
          </label>
        </div>
        <div id="patient-presets" class="patient-presets" style="display: none;">
          <button data-preset="normal">Normal</button>
          <button data-preset="ards-mild">ARDS (Mild)</button>
          <button data-preset="ards-severe">ARDS (Severe)</button>
          <button data-preset="copd">COPD</button>
        </div>
      </div>
    `;
    
    // Add the panel to the container
    this.container.appendChild(panel);
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Apply initial CSS
    this.applyStyles();
  }
  
  /**
   * Set up the event listeners for the control panel
   */
  setupEventListeners() {
    // Pressure Control knob
    const pControlKnob = document.getElementById('pcontrol-knob');
    pControlKnob.addEventListener('input', () => {
      const value = parseInt(pControlKnob.value);
      document.getElementById('pcontrol-value').textContent = `${value} cmH₂O`;
      this.settings.pControl = value;
      this.updateVentilatorSettings();
    });
    
    // PEEP knob
    const peepKnob = document.getElementById('peep-knob');
    peepKnob.addEventListener('input', () => {
      const value = parseInt(peepKnob.value);
      document.getElementById('peep-value').textContent = `${value} cmH₂O`;
      this.settings.peep = value;
      this.updateVentilatorSettings();
    });
    
    // Rate knob
    const rateKnob = document.getElementById('rate-knob');
    rateKnob.addEventListener('input', () => {
      const value = parseInt(rateKnob.value);
      document.getElementById('rate-value').textContent = `${value} bpm`;
      this.settings.respiratoryRate = value;
      this.updateVentilatorSettings();
    });
    
    // I:E Ratio knob
    const ieKnob = document.getElementById('ie-knob');
    ieKnob.addEventListener('input', () => {
      const value = parseFloat(ieKnob.value);
      document.getElementById('ie-value').textContent = `1:${Math.round(1/value * 10) / 10}`;
      this.settings.ieRatio = value;
      this.updateVentilatorSettings();
    });
    
    // FiO2 knob
    const fio2Knob = document.getElementById('fio2-knob');
    fio2Knob.addEventListener('input', () => {
      const value = parseFloat(fio2Knob.value);
      document.getElementById('fio2-value').textContent = `${Math.round(value * 100)}%`;
      this.settings.fio2 = value;
      this.updateVentilatorSettings();
    });
    
    // Mode selector
    const modeSelect = document.getElementById('mode-select');
    modeSelect.addEventListener('change', () => {
      this.settings.mode = modeSelect.value;
      this.updateVentilatorSettings();
    });
    
    // Start button
    const startBtn = document.getElementById('start-btn');
    startBtn.addEventListener('click', () => {
      this.simulation.start(this.updateDisplays.bind(this));
      startBtn.disabled = true;
      document.getElementById('pause-btn').disabled = false;
    });
    
    // Pause button
    const pauseBtn = document.getElementById('pause-btn');
    pauseBtn.addEventListener('click', () => {
      this.simulation.pause();
      pauseBtn.disabled = true;
      startBtn.disabled = false;
    });
    
    // Advanced model toggle
    const advancedModelToggle = document.getElementById('advanced-model-toggle');
    advancedModelToggle.addEventListener('change', () => {
      const useAdvanced = advancedModelToggle.checked;
      this.simulation.setPatientModel(useAdvanced);
      
      // Show/hide patient presets
      document.getElementById('patient-presets').style.display = 
        useAdvanced ? 'block' : 'none';
    });
    
    // Patient presets
    const presetButtons = document.querySelectorAll('#patient-presets button');
    presetButtons.forEach(button => {
      button.addEventListener('click', () => {
        const preset = button.dataset.preset;
        this.applyPatientPreset(preset);
        
        // Update active button
        presetButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
      });
    });
  }
  
  /**
   * Update the ventilator settings in the simulation
   */
  updateVentilatorSettings() {
    this.simulation.updateVentilatorSettings(this.settings);
  }
  
  /**
   * Apply a patient preset
   * @param {string} preset - Preset identifier ('normal', 'ards-mild', etc.)
   */
  applyPatientPreset(preset) {
    switch (preset) {
      case 'normal':
        this.simulation.updatePatientParameters({}, 'normal');
        break;
      case 'ards-mild':
        this.simulation.updatePatientParameters({ severity: 'mild' }, 'ARDS');
        break;
      case 'ards-severe':
        this.simulation.updatePatientParameters({ severity: 'severe' }, 'ARDS');
        break;
      case 'copd':
        this.simulation.updatePatientParameters({}, 'COPD');
        break;
    }
  }
  
  /**
   * Update the display values based on simulation state
   * @param {Object} state - Current simulation state
   */
  updateDisplays(state) {
    if (!state) return;
    
    // Update the digital displays
    document.getElementById('pressure-display').textContent = 
      Math.round(state.patient.pressure);
    
    // Calculate tidal volume (current volume - residual)
    const tidalVolume = Math.max(0, Math.round(state.patient.volume - 1000));
    document.getElementById('volume-display').textContent = tidalVolume;
    
    document.getElementById('rate-display').textContent = 
      this.settings.respiratoryRate;
    
    document.getElementById('peep-display').textContent = 
      this.settings.peep;
    
    // Add ventilation phase indicator
    if (state.ventilator && state.ventilator.phase) {
      document.querySelectorAll('.display-section').forEach(section => {
        section.classList.remove('inspiration', 'expiration');
        section.classList.add(state.ventilator.phase);
      });
    }
  }
  
  /**
   * Apply CSS styles for the ventilator UI
   */
  applyStyles() {
    // Create a style element
    const style = document.createElement('style');
    style.textContent = `
      .ventilator-panel {
        background-color: #2c3e50;
        color: #ecf0f1;
        border-radius: 10px;
        padding: 20px;
        font-family: sans-serif;
      }
      
      .panel-section {
        margin-bottom: 20px;
        padding: 15px;
        background-color: #34495e;
        border-radius: 8px;
      }
      
      .ventilator-display {
        display: flex;
        justify-content: space-between;
        margin-top: 15px;
      }
      
      .display-section {
        background-color: #2c3e50;
        border-radius: 5px;
        padding: 10px;
        text-align: center;
        width: 22%;
        transition: background-color 0.3s;
      }
      
      .display-section.inspiration {
        background-color: #3498db;
      }
      
      .display-section.expiration {
        background-color: #2c3e50;
      }
      
      .display-value {
        font-size: 28px;
        font-weight: bold;
        margin-bottom: 5px;
      }
      
      .display-label {
        font-size: 12px;
        opacity: 0.8;
      }
      
      .control-group {
        margin-bottom: 15px;
        display: flex;
        align-items: center;
      }
      
      .control-group label {
        width: 100px;
        font-weight: bold;
      }
      
      .knob-container {
        flex-grow: 1;
        display: flex;
        align-items: center;
      }
      
      .knob-container input[type="range"] {
        flex-grow: 1;
        height: 10px;
        -webkit-appearance: none;
        background: #2c3e50;
        border-radius: 5px;
        margin-right: 10px;
      }
      
      .knob-container input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 20px;
        height: 20px;
        background: #3498db;
        border-radius: 50%;
        cursor: pointer;
      }
      
      .knob-value {
        width: 80px;
        text-align: right;
      }
      
      select {
        background-color: #2c3e50;
        color: #ecf0f1;
        border: 1px solid #3498db;
        padding: 5px 10px;
        border-radius: 5px;
      }
      
      .button-container {
        display: flex;
        justify-content: space-between;
        margin-bottom: 15px;
      }
      
      .action-button {
        padding: 10px 20px;
        border: none;
        border-radius: 5px;
        font-weight: bold;
        cursor: pointer;
        transition: background-color 0.3s;
      }
      
      .action-button.start {
        background-color: #2ecc71;
        color: white;
      }
      
      .action-button.start:disabled {
        background-color: #27ae60;
        opacity: 0.7;
        cursor: not-allowed;
      }
      
      .action-button.pause {
        background-color: #e74c3c;
        color: white;
      }
      
      .action-button.pause:disabled {
        background-color: #c0392b;
        opacity: 0.7;
        cursor: not-allowed;
      }
      
      .action-button:hover:not(:disabled) {
        opacity: 0.9;
      }
      
      .patient-model-switch {
        margin: 15px 0;
      }
      
      .patient-presets {
        display: flex;
        justify-content: space-between;
        margin-top: 10px;
      }
      
      .patient-presets button {
        background-color: #7f8c8d;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 5px;
        cursor: pointer;
      }
      
      .patient-presets button.active {
        background-color: #3498db;
      }
      
      .patient-presets button:hover {
        opacity: 0.9;
      }
    `;
    
    // Add the style to the document
    document.head.appendChild(style);
  }
}

/**
 * Class for displaying patient status and metrics
 */
class PatientStatusDisplay {
  constructor(containerElement) {
    this.container = containerElement;
    
    // Initialize the UI
    this.initializeUI();
  }
  
  /**
   * Initialize the patient status display UI
   */
  initializeUI() {
    // Clear the container
    this.container.innerHTML = '';
    
    // Create the status panel
    const panel = document.createElement('div');
    panel.className = 'patient-status-panel';
    panel.innerHTML = `
      <div class="status-header">
        <h2>Patient Status</h2>
      </div>
      
      <div class="status-metrics">
        <div class="metric-group">
          <h3>Ventilation</h3>
          <div class="metric">
            <span class="metric-label">Minute Volume</span>
            <span class="metric-value" id="minute-volume">-- L/min</span>
          </div>
          <div class="metric">
            <span class="metric-label">Peak Pressure</span>
            <span class="metric-value" id="peak-pressure">-- cmH₂O</span>
          </div>
          <div class="metric">
            <span class="metric-label">Dynamic Compliance</span>
            <span class="metric-value" id="compliance">-- mL/cmH₂O</span>
          </div>
        </div>
        
        <div class="metric-group">
          <h3>Gas Exchange</h3>
          <div class="metric">
            <span class="metric-label">SpO₂</span>
            <span class="metric-value" id="spo2">-- %</span>
          </div>
          <div class="metric">
            <span class="metric-label">etCO₂</span>
            <span class="metric-value" id="etco2">-- mmHg</span>
          </div>
        </div>
        
        <div class="metric-group">
          <h3>Hemodynamics</h3>
          <div class="metric">
            <span class="metric-label">Heart Rate</span>
            <span class="metric-value" id="heart-rate">-- bpm</span>
          </div>
          <div class="metric">
            <span class="metric-label">Blood Pressure</span>
            <span class="metric-value" id="blood-pressure">--/-- mmHg</span>
          </div>
        </div>
      </div>
      
      <div id="advanced-metrics" class="advanced-metrics" style="display: none;">
        <h3>Advanced Metrics</h3>
        <div class="metric">
          <span class="metric-label">Recruited Alveoli</span>
          <span class="metric-value" id="recruited-alveoli">--/--</span>
        </div>
        <div class="metric">
          <span class="metric-label">Ventilation/Perfusion</span>
          <span class="metric-value" id="ventilation-perfusion">--</span>
        </div>
      </div>
    `;
    
    // Add the panel to the container
    this.container.appendChild(panel);
    
    // Apply styles
    this.applyStyles();
  }
  
  /**
   * Update patient status based on simulation state
   * @param {Object} state - Current simulation state
   * @param {Object} options - Display options
   */
  updateStatus(state, options = {}) {
    if (!state) return;
    
    // Calculate derived values
    const peakPressure = Math.round(state.patient.pressure);
    
    // Calculate tidal volume (current volume - residual)
    const tidalVolume = Math.max(0, Math.round(state.patient.volume - 1000));
    
    // Simple compliance calculation (tidal volume / (peak pressure - PEEP))
    const pressureDelta = peakPressure - state.ventilator.settings.peep;
    const compliance = pressureDelta > 0 
      ? Math.round(tidalVolume / pressureDelta) 
      : '--';
    
    // Update basic metrics
    this.updateMetric('peak-pressure', `${peakPressure} cmH₂O`);
    this.updateMetric('compliance', `${compliance} mL/cmH₂O`);
    
    // Calculate minute volume (respiratory rate * tidal volume)
    const minuteVolume = (tidalVolume * state.ventilator.settings.respiratoryRate / 1000).toFixed(1);
    this.updateMetric('minute-volume', `${minuteVolume} L/min`);
    
    // Update simulated physiological values
    // These are just simulated based on ventilation parameters
    // In a real patient, these would be measured independently
    
    // SpO2 simulation (affected by FiO2 and minute ventilation)
    const baseSpO2 = 97; // baseline for healthy lungs
    const fio2Effect = (state.ventilator.settings.fio2 - 0.21) * 10;
    const ventilationEffect = Math.min(0, (minuteVolume - 5) * 2);
    
    // Reduced SpO2 if using advanced model with ARDS
    let pathologyEffect = 0;
    if (options.hasAdvancedModel && options.pathology === 'ARDS') {
      pathologyEffect = options.severity === 'severe' ? -10 : -5;
    }
    
    const spo2 = Math.min(100, Math.max(70, Math.round(baseSpO2 + fio2Effect + ventilationEffect + pathologyEffect)));
    this.updateMetric('spo2', `${spo2} %`);
    
    // End-tidal CO2 simulation
    const baseEtco2 = 40;
    const etco2 = Math.round(baseEtco2 * (5 / Math.max(1, minuteVolume)));
    this.updateMetric('etco2', `${etco2} mmHg`);
    
    // Heart rate simulation (higher with lower SpO2)
    const baseHR = 80;
    const hrVariation = Math.max(0, (100 - spo2) * 1.5);
    const heartRate = Math.round(baseHR + hrVariation);
    this.updateMetric('heart-rate', `${heartRate} bpm`);
    
    // Blood pressure simulation
    const baseSystolic = 120;
    const baseDiastolic = 80;
    const systolic = Math.round(baseSystolic - (minuteVolume > 10 ? (minuteVolume - 10) * 5 : 0));
    const diastolic = Math.round(baseDiastolic - (minuteVolume > 10 ? (minuteVolume - 10) * 3 : 0));
    this.updateMetric('blood-pressure', `${systolic}/${diastolic} mmHg`);
    
    // Advanced metrics for multi-compartment model
    if (options.hasAdvancedModel && state.patient.unitStates) {
      document.getElementById('advanced-metrics').style.display = 'block';
      
      // Recruited alveoli
      const recruitedCount = state.patient.unitStates.filter(unit => unit.isOpen).length;
      const totalCount = state.patient.unitStates.length;
      this.updateMetric('recruited-alveoli', `${recruitedCount}/${totalCount}`);
      
      // V/Q ratio simulation
      // Simplified calculation based on recruited units and their perfusion
      const ventilatedUnits = state.patient.unitStates
        .filter(unit => unit.isOpen)
        .reduce((sum, unit) => sum + unit.volume, 0);
      
      const perfusedUnits = state.patient.unitStates
        .reduce((sum, unit) => sum + unit.perfusion, 0);
      
      const vqRatio = (ventilatedUnits / Math.max(1, perfusedUnits)).toFixed(2);
      this.updateMetric('ventilation-perfusion', vqRatio);
    } else {
      document.getElementById('advanced-metrics').style.display = 'none';
    }
  }
  
  /**
   * Update a specific metric value
   * @param {string} id - Element ID
   * @param {string} value - New value to display
   */
  updateMetric(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  }
  
  /**
   * Apply CSS styles for the patient status display
   */
  applyStyles() {
    // Create a style element
    const style = document.createElement('style');
    style.textContent = `
      .patient-status-panel {
        background-color: #2c3e50;
        color: #ecf0f1;
        border-radius: 10px;
        padding: 20px;
        font-family: sans-serif;
      }
      
      .status-metrics {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        margin-top: 15px;
      }
      
      .metric-group {
        background-color: #34495e;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 15px;
        width: 30%;
      }
      
      .metric-group h3 {
        margin-top: 0;
        margin-bottom: 10px;
        color: #3498db;
        font-size: 16px;
      }
      
      .metric {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
      }
      
      .metric-label {
        font-size: 14px;
        opacity: 0.9;
      }
      
      .metric-value {
        font-weight: bold;
      }
      
      .advanced-metrics {
        background-color: #34495e;
        border-radius: 8px;
        padding: 15px;
      }
      
      .advanced-metrics h3 {
        margin-top: 0;
        margin-bottom: 10px;
        color: #3498db;
        font-size: 16px;
      }
    `;
    
    // Add the style to the document
    document.head.appendChild(style);
  }
}

// Export the classes for use in other modules
export { VentilatorControlPanel, PatientStatusDisplay };
