// ventilator-ui.js - Complete replacement file

// Reference to the callback function for settings updates
let updateSettingsCallback = null;

// Current settings
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

// Initialize the user interface
function initializeUI(initialVentSettings, initialPatientParams, callback) {
  console.log('Ventilator UI Initializing...');
  
  // Store the callback function
  updateSettingsCallback = callback;
  
  // Initialize with provided settings or use defaults
  if (initialVentSettings) ventilatorSettings = {...ventilatorSettings, ...initialVentSettings};
  if (initialPatientParams) patientParameters = {...patientParameters, ...initialPatientParams};
  
  // Set up UI controls
  setupVentilatorControls();
  setupPatientControls();
  setupPresetButtons();
  
  // Update UI to reflect initial settings
  updateUIFromSettings();
  
  console.log('Ventilator UI Initialized');
}

// Set up ventilator control elements
function setupVentilatorControls() {
  // Mode selector
  const modeSelector = document.getElementById('ventilator-mode');
  if (modeSelector) {
    modeSelector.addEventListener('change', function(e) {
      updateSetting('mode', e.target.value);
      updateModeSpecificControls(e.target.value);
    });
  }
  
  // PEEP control
  setupRangeControl('peep-control', 'peep-value', 0, 20, 1, ventilatorSettings.peep, function(value) {
    updateSetting('peep', parseFloat(value));
  });
  
  // PIP control
  setupRangeControl('pip-control', 'pip-value', 5, 40, 1, ventilatorSettings.pip, function(value) {
    updateSetting('pip', parseFloat(value));
  });
  
  // Respiratory Rate control
  setupRangeControl('rate-control', 'rate-value', 8, 30, 1, ventilatorSettings.rate, function(value) {
    updateSetting('rate', parseFloat(value));
  });
  
  // I:E Ratio control
  setupRangeControl('ie-ratio-control', 'ie-ratio-value', 0.25, 1, 0.05, ventilatorSettings.ieRatio, function(value) {
    updateSetting('ieRatio', parseFloat(value));
  });
  
  // Tidal Volume control
  setupRangeControl('tidal-volume-control', 'tidal-volume-value', 200, 800, 10, ventilatorSettings.tidalVolume, function(value) {
    updateSetting('tidalVolume', parseFloat(value));
  });
  
  // FiO2 control
  setupRangeControl('fio2-control', 'fio2-value', 21, 100, 1, ventilatorSettings.fio2, function(value) {
    updateSetting('fio2', parseFloat(value));
  });
  
  // Trigger Sensitivity control
  setupRangeControl('trigger-control', 'trigger-value', 0.5, 5, 0.1, ventilatorSettings.triggerSensitivity, function(value) {
    updateSetting('triggerSensitivity', parseFloat(value));
  });
}

// Set up patient parameter controls
function setupPatientControls() {
  // Compliance control
  setupRangeControl('compliance-control', 'compliance-value', 10, 100, 1, patientParameters.compliance, function(value) {
    updatePatientParam('compliance', parseFloat(value));
  });
  
  // Resistance control
  setupRangeControl('resistance-control', 'resistance-value', 1, 25, 0.5, patientParameters.resistance, function(value) {
    updatePatientParam('resistance', parseFloat(value));
  });
  
  // Lung model selector
  const modelSelector = document.getElementById('lung-model');
  if (modelSelector) {
    modelSelector.addEventListener('change', function(e) {
      updatePatientParam('lungModel', e.target.value);
    });
  }
}

// Set up preset condition buttons
function setupPresetButtons() {
  // Normal preset
  setupPresetButton('normal-preset', {
    compliance: 50,
    resistance: 10,
    lungModel: 'normal'
  });
  
  // ARDS preset
  setupPresetButton('ards-preset', {
    compliance: 20,
    resistance: 15,
    lungModel: 'ards'
  });
  
  // COPD preset
  setupPresetButton('copd-preset', {
    compliance: 80,
    resistance: 20,
    lungModel: 'copd'
  });
  
  // Asthma preset
  setupPresetButton('asthma-preset', {
    compliance: 40,
    resistance: 25,
    lungModel: 'asthma'
  });
}

// Helper function to set up range controls
function setupRangeControl(sliderId, valueId, min, max, step, initialValue, callback) {
  const slider = document.getElementById(sliderId);
  const valueDisplay = document.getElementById(valueId);
  
  if (slider && valueDisplay) {
    // Set initial values
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = initialValue;
    valueDisplay.textContent = initialValue;
    
    // Set up event listener
    slider.addEventListener('input', function(e) {
      const newValue = e.target.value;
      valueDisplay.textContent = newValue;
      callback(newValue);
    });
  }
}

// Helper function to set up preset buttons
function setupPresetButton(buttonId, presetValues) {
  const button = document.getElementById(buttonId);
  if (button) {
    button.addEventListener('click', function() {
      // Update patient parameters
      Object.keys(presetValues).forEach(key => {
        updatePatientParam(key, presetValues[key]);
      });
      
      // Update UI controls to match preset values
      updateUIFromSettings();
    });
  }
}

// Update ventilator settings and notify callback
function updateSetting(key, value) {
  ventilatorSettings[key] = value;
  if (updateSettingsCallback) {
    updateSettingsCallback(ventilatorSettings, 'ventilator');
  }
}

// Update patient parameters and notify callback
function updatePatientParam(key, value) {
  patientParameters[key] = value;
  if (updateSettingsCallback) {
    updateSettingsCallback(patientParameters, 'patient');
  }
}

// Update UI controls to match current settings
function updateUIFromSettings() {
  // Update ventilator control displays
  updateRangeControl('peep-control', 'peep-value', ventilatorSettings.peep);
  updateRangeControl('pip-control', 'pip-value', ventilatorSettings.pip);
  updateRangeControl('rate-control', 'rate-value', ventilatorSettings.rate);
  updateRangeControl('ie-ratio-control', 'ie-ratio-value', ventilatorSettings.ieRatio);
  updateRangeControl('tidal-volume-control', 'tidal-volume-value', ventilatorSettings.tidalVolume);
  updateRangeControl('fio2-control', 'fio2-value', ventilatorSettings.fio2);
  updateRangeControl('trigger-control', 'trigger-value', ventilatorSettings.triggerSensitivity);
  
  // Update patient parameter displays
  updateRangeControl('compliance-control', 'compliance-value', patientParameters.compliance);
  updateRangeControl('resistance-control', 'resistance-value', patientParameters.resistance);
  
  // Update select elements
  updateSelectControl('ventilator-mode', ventilatorSettings.mode);
  updateSelectControl('lung-model', patientParameters.lungModel);
  
  // Update mode-specific controls
  updateModeSpecificControls(ventilatorSettings.mode);
}

// Helper function to update range control UI
function updateRangeControl(sliderId, valueId, value) {
  const slider = document.getElementById(sliderId);
  const valueDisplay = document.getElementById(valueId);
  
  if (slider) slider.value = value;
  if (valueDisplay) valueDisplay.textContent = value;
}

// Helper function to update select control UI
function updateSelectControl(selectId, value) {
  const select = document.getElementById(selectId);
  if (select) select.value = value;
}

// Update UI based on selected ventilator mode
function updateModeSpecificControls(mode) {
  const pipControls = document.getElementById('pip-controls');
  const tidalVolumeControls = document.getElementById('tidal-volume-controls');
  
  if (pipControls && tidalVolumeControls) {
    if (mode === 'PCV') {
      // Pressure Control Mode
      pipControls.style.display = 'block';
      tidalVolumeControls.style.display = 'none';
    } else if (mode === 'VCV') {
      // Volume Control Mode
      pipControls.style.display = 'none';
      tidalVolumeControls.style.display = 'block';
    } else {
      // Other modes
      pipControls.style.display = 'block';
      tidalVolumeControls.style.display = 'block';
    }
  }
}

// Export functions
window.VentilatorUI = {
  initialize: initializeUI
};