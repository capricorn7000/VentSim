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
      riseTime: 100
    };
    
    // Initialize the UI
    this.initializeUI();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Initialize patient parameters based on simulation
    this.updatePatientParameterControls();
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
        <h2>Ventilator Monitoring</h2>
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
        <div class="panel-header">
          <h3>Ventilator Settings</h3>
          <div class="mode-selector">
            <label for="mode-select">Mode:</label>
            <select id="mode-select">
              <option value="pressure-control">Pressure Control</option>
              <option value="volume-control" disabled>Volume Control</option>
              <option value="pressure-support" disabled>Pressure Support</option>
            </select>
          </div>
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
            <input type="range" id="rate-knob" min="1" max="60" step="1" value="${this.settings.respiratoryRate}">
            <div class="knob-value" id="rate-value">${this.settings.respiratoryRate} bpm</div>
          </div>
        </div>
        
        <div class="control-group">
          <label for="ie-knob">I:E Ratio</label>
          <div class="knob-container">
            <input type="range" id="ie-knob" min="0.167" max="6" step="0.05" value="${this.settings.ieRatio}">
            <div class="knob-value" id="ie-value">1:${Math.round(1/this.settings.ieRatio * 10) / 10}</div>
          </div>
        </div>
        
        <div class="control-group">
          <label for="risetime-knob">Rise Time</label>
          <div class="knob-container">
            <input type="range" id="risetime-knob" min="0" max="10000" step="100" value="${this.settings.riseTime}">
            <div class="knob-value" id="risetime-value">${this.settings.riseTime} ms</div>
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
        <div class="simulation-controls">
          <button id="start-btn" class="action-button start">Start</button>
          <button id="pause-btn" class="action-button pause" disabled>Pause</button>
          <button id="reset-btn" class="action-button reset">Reset</button>
        </div>
        
        <div class="patient-model-section">
          <h3>Patient Parameters</h3>
          
          <div class="control-group">
            <label for="ibw-knob">IBW/PBW</label>
            <div class="knob-container">
              <input type="range" id="ibw-knob" min="10" max="120" step="5" value="70">
              <div class="knob-value" id="ibw-value">70 kg</div>
            </div>
          </div>
          
          <div class="control-group">
            <label for="compliance-knob">Compliance</label>
            <div class="knob-container">
              <input type="range" id="compliance-knob" min="10" max="100" step="5" value="50">
              <div class="knob-value" id="compliance-value">50 mL/cmH₂O</div>
            </div>
          </div>
          
          <div class="control-group">
            <label for="resistance-knob">Resistance</label>
            <div class="knob-container">
              <input type="range" id="resistance-knob" min="5" max="50" step="1" value="10">
              <div class="knob-value" id="resistance-value">10 cmH₂O·s/L</div>
            </div>
          </div>
          
          <div class="patient-model-toggle">
            <label class="toggle-switch">
              <input type="checkbox" id="advanced-model-toggle">
              <span class="toggle-slider"></span>
              <span class="toggle-label">Use Advanced Patient Model</span>
            </label>
          </div>
          
          <div id="patient-presets" class="patient-presets" style="display: none;">
            <button data-preset="normal" class="preset-button">Normal</button>
            <button data-preset="ards-mild" class="preset-button">ARDS (Mild)</button>
            <button data-preset="ards-severe" class="preset-button">ARDS (Severe)</button>
            <button data-preset="copd" class="preset-button">COPD</button>
          </div>
        </div>
        
        <div class="model-assumptions">
          <h3>Model Assumptions</h3>
          <table class="assumptions-table">
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody id="assumptions-table-body">
              <!-- Will be populated dynamically -->
            </tbody>
          </table>
          
          <div class="patient-predictions">
            <h4>Predicted Values</h4>
            <div class="prediction-values">
              <div class="prediction-item">
                <span class="prediction-label">TLC:</span>
                <span class="prediction-value" id="pred-tlc">0 mL</span>
              </div>
              <div class="prediction-item">
                <span class="prediction-label">VC:</span>
                <span class="prediction-value" id="pred-vc">0 mL</span>
              </div>
              <div class="prediction-item">
                <span class="prediction-label">FRC:</span>
                <span class="prediction-value" id="pred-frc">0 mL</span>
              </div>
              <div class="prediction-item">
                <span class="prediction-label">RV:</span>
                <span class="prediction-value" id="pred-rv">0 mL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Add the panel to the container
    this.container.appendChild(panel);
    
    // Populate the assumptions table
    this.populateAssumptionsTable();
    
    // Update predicted values
    this.updatePredictedValues();
    
    // Apply initial CSS
    this.applyStyles();
  }
  
  /**
   * Populate the assumptions table with model parameters
   */
  populateAssumptionsTable() {
    const tableBody = document.getElementById('assumptions-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    // Get the assumptions from patient model
    const assumptions = this.simulation.patient.modelAssumptions;
    
    assumptions.forEach(assumption => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${assumption.parameter}</td>
        <td>${assumption.value}</td>
      `;
      tableBody.appendChild(row);
    });
  }
  
  /**
   * Update predicted values display based on patient parameters
   */
  updatePredictedValues() {
    const calculatedParams = this.simulation.patient.calculatedParameters;
    
    // Update the predicted values display
    document.getElementById('pred-tlc').textContent = `${Math.round(calculatedParams.predictedTLC)} mL`;
    document.getElementById('pred-vc').textContent = `${Math.round(calculatedParams.predictedVC)} mL`;
    document.getElementById('pred-frc').textContent = `${Math.round(calculatedParams.predictedFRC)} mL`;
    document.getElementById('pred-rv').textContent = `${Math.round(calculatedParams.predictedRV)} mL`;
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
      // For display, if value > 1, show as I:E = X:1, else show as I:E = 1:X
      let ieDisplay;
      if (value >= 1) {
        ieDisplay = `${value.toFixed(1)}:1`;
      } else {
        ieDisplay = `1:${(1/value).toFixed(1)}`;
      }
      document.getElementById('ie-value').textContent = ieDisplay;
      this.settings.ieRatio = value;
      this.updateVentilatorSettings();
    });
    
    // Rise Time knob
    const riseTimeKnob = document.getElementById('risetime-knob');
    riseTimeKnob.addEventListener('input', () => {
      const value = parseInt(riseTimeKnob.value);
      document.getElementById('risetime-value').textContent = `${value} ms`;
      this.settings.riseTime = value;
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
      document.getElementById('reset-btn').disabled = false;
    });
    
    // Pause button
    const pauseBtn = document.getElementById('pause-btn');
    pauseBtn.addEventListener('click', () => {
      this.simulation.pause();
      pauseBtn.disabled = true;
      startBtn.disabled = false;
    });
    
    // Reset button
    const resetBtn = document.getElementById('reset-btn');
    resetBtn.addEventListener('click', () => {
      this.simulation.resetSimulation();
      this.updateDisplays(this.simulation.simulationData[0]);
      startBtn.disabled = false;
      pauseBtn.disabled = true;
      resetBtn.disabled = false;
      
      // Update UI with reset values
      this.updatePatientParameterControls();
      this.updatePredictedValues();
    });
    
    // IBW/PBW knob
    const ibwKnob = document.getElementById('ibw-knob');
    ibwKnob.addEventListener('input', () => {
      const value = parseInt(ibwKnob.value);
      document.getElementById('ibw-value').textContent = `${value} kg`;
      
      // Update patient parameters with new IBW
      this.simulation.updatePatientParameters({
        ibw: value
      });
      
      // Update predicted values display
      this.updatePredictedValues();
    });
    
    // Patient parameters - Compliance
    const complianceKnob = document.getElementById('compliance-knob');
    complianceKnob.addEventListener('input', () => {
      const value = parseInt(complianceKnob.value);
      document.getElementById('compliance-value').textContent = `${value} mL/cmH₂O`;
      
      // Update basic patient model parameters
      this.simulation.updatePatientParameters({
        compliance: value
      });
    });
    
    // Patient parameters - Resistance
    const resistanceKnob = document.getElementById('resistance-knob');
    resistanceKnob.addEventListener('input', () => {
      const value = parseInt(resistanceKnob.value);
      document.getElementById('resistance-value').textContent = `${value} cmH₂O·s/L`;
      
      // Update basic patient model parameters
      this.simulation.updatePatientParameters({
        resistance: value
      });
    });
    
    // Advanced model toggle
    const advancedModelToggle = document.getElementById('advanced-model-toggle');
    advancedModelToggle.addEventListener('change', () => {
      const useAdvanced = advancedModelToggle.checked;
      this.simulation.setPatientModel(useAdvanced);
      
      // Show/hide patient presets and basic patient controls
      document.getElementById('patient-presets').style.display = 
        useAdvanced ? 'flex' : 'none';
      
      // Update the UI with current parameters
      this.updatePatientParameterControls();
      
      // Update model assumptions
      this.populateAssumptionsTable();
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
        
        // Update assumptions and predicted values
        this.populateAssumptionsTable();
        this.updatePredictedValues();
      });
    });
  }
  
  /**
   * Update patient parameter controls based on current simulation state
   */
  updatePatientParameterControls() {
    // Get current patient parameters from the simulation
    let patientParams;
    
    if (this.simulation.useAdvancedModel) {
      // For advanced model, controls are disabled as parameters are set by presets
      document.getElementById('compliance-knob').disabled = true;
      document.getElementById('resistance-knob').disabled = true;
      document.getElementById('ibw-knob').disabled = true;
    } else {
      // For basic model, enable controls and set to current values
      document.getElementById('compliance-knob').disabled = false;
      document.getElementById('resistance-knob').disabled = false;
      document.getElementById('ibw-knob').disabled = false;
      
      patientParams = this.simulation.patient.parameters;
      
      // Update the UI controls to match the current parameters
      if (patientParams) {
        const complianceKnob = document.getElementById('compliance-knob');
        const resistanceKnob = document.getElementById('resistance-knob');
        const ibwKnob = document.getElementById('ibw-knob');
        
        complianceKnob.value = patientParams.compliance;
        resistanceKnob.value = patientParams.resistance;
        ibwKnob.value = patientParams.ibw;
        
        document.getElementById('compliance-value').textContent = 
          `${patientParams.compliance} mL/cmH₂O`;
        document.getElementById('resistance-value').textContent = 
          `${patientParams.resistance} cmH₂O·s/L`;
        document.getElementById('ibw-value').textContent = 
          `${patientParams.ibw} kg`;
      }
      
      // Update the predicted values display
      this.updatePredictedValues();
      
      // Update model assumptions table
      this.populateAssumptionsTable();
    }
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
    const tidalVolume = state.patient.tidalVolume !== undefined ? 
      Math.round(state.patient.tidalVolume) : 
      Math.max(0, Math.round(state.patient.volume - 1000));
      
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
      :root {
        --primary-color: #2196F3;
        --primary-dark: #0D47A1;
        --primary-light: #64B5F6;
        --secondary-color: #607D8B;
        --background-dark: #263238;
        --background-medium: #37474F;
        --background-light: #455A64;
        --text-light: #ECEFF1;
        --text-medium: #B0BEC5;
        --accent-color: #00BCD4;
        --success-color: #4CAF50;
        --warning-color: #FFC107;
        --danger-color: #F44336;
        --border-radius: 8px;
        --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        --transition: all 0.3s ease;
      }
      
      .ventilator-panel {
        background-color: var(--background-dark);
        color: var(--text-light);
        border-radius: var(--border-radius);
        padding: 20px;
        font-family: 'Roboto', sans-serif;
        box-shadow: var(--shadow);
      }
      
      .panel-section {
        margin-bottom: 20px;
        padding: 15px;
        background-color: var(--background-medium);
        border-radius: var(--border-radius);
        box-shadow: var(--shadow);
        transition: var(--transition);
      }
      
      .panel-section:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
      }
      
      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      }
      
      .panel-section h2, .panel-section h3, .panel-section h4 {
        color: var(--primary-light);
        margin-top: 0;
        font-weight: 500;
      }
      
      .ventilator-display {
        display: flex;
        justify-content: space-between;
        margin-top: 15px;
        background-color: var(--background-light);
        border-radius: var(--border-radius);
        padding: 10px;
      }
      
      .display-section {
        background-color: var(--background-dark);
        border-radius: var(--border-radius);
        padding: 15px;
        text-align: center;
        width: 22%;
        transition: background-color 0.3s;
        box-shadow: var(--shadow);
      }
      
      .display-section.inspiration {
        background-color: var(--primary-color);
        box-shadow: 0 0 10px var(--primary-color);
      }
      
      .display-section.expiration {
        background-color: var(--background-dark);
      }
      
      .display-value {
        font-size: 28px;
        font-weight: bold;
        margin-bottom: 5px;
        color: var(--text-light);
      }
      
      .display-label {
        font-size: 12px;
        opacity: 0.8;
        color: var(--text-medium);
      }
      
      .control-group {
        margin-bottom: 15px;
        display: flex;
        align-items: center;
        background-color: var(--background-light);
        border-radius: var(--border-radius);
        padding: 12px;
      }
      
      .control-group label {
        width: 110px;
        font-weight: 500;
        color: var(--text-medium);
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
        background: var(--background-dark);
        border-radius: 5px;
        margin-right: 10px;
      }
      
      .knob-container input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 20px;
        height: 20px;
        background: var(--primary-color);
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
        transition: var(--transition);
      }
      
      .knob-container input[type="range"]::-webkit-slider-thumb:hover {
        background: var(--primary-light);
        transform: scale(1.1);
      }
      
      .knob-value {
        width: 90px;
        text-align: right;
        font-weight: 500;
        color: var(--text-light);
      }
      
      select {
        background-color: var(--background-dark);
        color: var(--text-light);
        border: 1px solid var(--primary-color);
        padding: 8px 12px;
        border-radius: var(--border-radius);
        outline: none;
        transition: var(--transition);
      }
      
      select:focus {
        border-color: var(--primary-light);
        box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.3);
      }
      
      .simulation-controls {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20px;
      }
      
      .action-button {
        padding: 10px 20px;
        border: none;
        border-radius: var(--border-radius);
        font-weight: 500;
        cursor: pointer;
        transition: var(--transition);
        min-width: 100px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      
      .action-button.start {
        background-color: var(--success-color);
        color: white;
      }
      
      .action-button.start:disabled {
        background-color: rgba(76, 175, 80, 0.5);
        opacity: 0.7;
        cursor: not-allowed;
      }
      
      .action-button.pause {
        background-color: var(--warning-color);
        color: black;
      }
      
      .action-button.pause:disabled {
        background-color: rgba(255, 193, 7, 0.5);
        opacity: 0.7;
        cursor: not-allowed;
      }
      
      .action-button.reset {
        background-color: var(--secondary-color);
        color: white;
      }
      
      .action-button:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }
      
      .action-button:active:not(:disabled) {
        transform: translateY(1px);
      }
      
      .patient-model-toggle {
        margin: 20px 0;
      }
      
      .toggle-switch {
        position: relative;
        display: inline-flex;
        align-items: center;
        cursor: pointer;
      }
      
      .toggle-switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }
      
      .toggle-slider {
        position: relative;
        display: inline-block;
        width: 50px;
        height: 24px;
        background-color: var(--background-dark);
        border-radius: 34px;
        transition: var(--transition);
        margin-right: 10px;
      }
      
      .toggle-slider:before {
        content: "";
        position: absolute;
        height: 16px;
        width: 16px;
        left: 4px;
        bottom: 4px;
        background-color: var(--text-light);
        border-radius: 50%;
        transition: var(--transition);
      }
      
      input:checked + .toggle-slider {
        background-color: var(--primary-color);
      }
      
      input:checked + .toggle-slider:before {
        transform: translateX(26px);
      }
      
      .toggle-label {
        color: var(--text-light);
        font-weight: 500;
      }
      
      .patient-presets {
        display: none;
        justify-content: space-between;
        margin-top: 15px;
        flex-wrap: wrap;
        gap: 10px;
      }
      
      .preset-button {
        background-color: var(--background-light);
        color: var(--text-light);
        border: none;
        padding: 8px 16px;
        border-radius: var(--border-radius);
        cursor: pointer;
        transition: var(--transition);
        flex-grow: 1;
        text-align: center;
        min-width: 100px;
      }
      
      .preset-button.active {
        background-color: var(--primary-color);
        box-shadow: 0 0 10px rgba(33, 150, 243, 0.5);
      }
      
      .preset-button:hover {
        background-color: var(--primary-dark);
        transform: translateY(-2px);
      }
      
      .model-assumptions {
        margin-top: 20px;
        background-color: var(--background-light);
        border-radius: var(--border-radius);
        padding: 15px;
      }
      
      .assumptions-table {
        width: 100%;
        border-collapse: collapse;
        margin: 15px 0;
        color: var(--text-light);
      }
      
      .assumptions-table th {
        background-color: var(--background-dark);
        padding: 8px 12px;
        text-align: left;
        border-bottom: 2px solid var(--primary-color);
      }
      
      .assumptions-table td {
        padding: 8px 12px;
        border-bottom: 1px solid var(--background-medium);
      }
      
      .assumptions-table tr:last-child td {
        border-bottom: none;
      }
      
      .assumptions-table tr:nth-child(even) {
        background-color: rgba(0, 0, 0, 0.1);
      }
      
      .patient-predictions {
        margin-top: 20px;
        background-color: var(--background-dark);
        border-radius: var(--border-radius);
        padding: 15px;
      }
      
      .patient-predictions h4 {
        margin-top: 0;
        color: var(--primary-light);
        margin-bottom: 10px;
      }
      
      .prediction-values {
        display: flex;
        flex-wrap: wrap;
        gap: 15px;
      }
      
      .prediction-item {
        background-color: var(--background-medium);
        padding: 8px 12px;
        border-radius: var(--border-radius);
        flex-grow: 1;
        min-width: 100px;
      }
      
      .prediction-label {
        font-weight: 500;
        color: var(--text-medium);
        margin-right: 8px;
      }
      
      .prediction-value {
        font-weight: 500;
        color: var(--text-light);
      }
      
      @media (max-width: 768px) {
        .ventilator-display {
          flex-wrap: wrap;
        }
        
        .display-section {
          width: 45%;
          margin-bottom: 10px;
        }
        
        .simulation-controls {
          flex-direction: column;
          gap: 10px;
        }
        
        .action-button {
          width: 100%;
        }
      }
    `;
    
    // Add the style to the document
    document.head.appendChild(style);
    
    // Add Google Fonts
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);
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