// simulation-core.js - Complete replacement file

// Simulation parameters
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

// Simulation state
let breathPhase = 'expiration'; // 'inspiration' or 'expiration'
let breathTimer = 0;           // Time since breath phase started (ms)
let totalBreathTime = 0;       // Total time for one complete breath cycle (ms)
let inspirationTime = 0;       // Time for inspiration phase (ms)
let expirationTime = 0;        // Time for expiration phase (ms)
let pressure = 0;              // Current airway pressure (cmH2O)
let volume = 0;                // Current lung volume (mL)
let flow = 0;                  // Current airflow (L/min)
let prevTime = 0;              // Previous timestamp for delta calculation
let lungUnits = [];            // Array for multi-compartment lung model

// Initialize the simulation
function initializeSimulation(settings, parameters) {
  // Update with provided settings or use defaults
  if (settings) ventilatorSettings = {...ventilatorSettings, ...settings};
  if (parameters) patientParameters = {...patientParameters, ...parameters};
  
  // Calculate breath timing
  calculateBreathTiming();
  
  // Initialize lung units for multi-compartment model
  initializeLungUnits();
  
  // Set current time
  prevTime = Date.now();
  
  console.log('Simulation Core Initialized');
}

// Calculate timing parameters for breath cycle
function calculateBreathTiming() {
  // Calculate total breath time in milliseconds
  totalBreathTime = (60 / ventilatorSettings.rate) * 1000;
  
  // Calculate inspiration time based on I:E ratio
  // I:E ratio of 0.5 means 1:2, so inspiration is 1/3 of total breath time
  const ieFraction = ventilatorSettings.ieRatio / (ventilatorSettings.ieRatio + 1);
  inspirationTime = totalBreathTime * ieFraction;
  expirationTime = totalBreathTime - inspirationTime;
  
  console.log(`Breath timing: Total ${totalBreathTime}ms, Inspiration ${inspirationTime}ms, Expiration ${expirationTime}ms`);
}

// Initialize lung units for multi-compartment model
function initializeLungUnits() {
  // Clear existing lung units
  lungUnits = [];
  
  // Number of units based on model complexity
  const numUnits = 10;
  
  // Configure based on patient condition
  let openingPressureRange, closingPressureRange, complianceRange;
  
  switch (patientParameters.lungModel) {
    case 'ards':
      openingPressureRange = [10, 25];
      closingPressureRange = [5, 15];
      complianceRange = [10, 30];
      break;
    case 'copd':
      openingPressureRange = [2, 10];
      closingPressureRange = [1, 5];
      complianceRange = [80, 120];
      break;
    case 'asthma':
      openingPressureRange = [5, 15];
      closingPressureRange = [2, 8];
      complianceRange = [30, 60];
      break;
    case 'normal':
    default:
      openingPressureRange = [2, 5];
      closingPressureRange = [1, 3];
      complianceRange = [40, 60];
      break;
  }
  
  // Create lung units
  for (let i = 0; i < numUnits; i++) {
    // Create unit with randomized properties based on ranges
    const unit = {
      id: i,
      position: i / numUnits, // 0 = ventral, 1 = dorsal
      openingPressure: randomInRange(openingPressureRange[0], openingPressureRange[1]),
      closingPressure: randomInRange(closingPressureRange[0], closingPressureRange[1]),
      compliance: randomInRange(complianceRange[0], complianceRange[1]),
      isOpen: false,
      volume: 0,
      perfusion: randomInRange(0.5, 1.5) // Blood flow variation
    };
    
    lungUnits.push(unit);
  }
  
  console.log(`Created ${numUnits} lung units for ${patientParameters.lungModel} model`);
}

// Helper function for random value in range
function randomInRange(min, max) {
  return min + Math.random() * (max - min);
}

// Update ventilator settings
function updateVentilatorSettings(newSettings) {
  ventilatorSettings = {...ventilatorSettings, ...newSettings};
  calculateBreathTiming();
  return ventilatorSettings;
}

// Update patient parameters
function updatePatientParameters(newParameters) {
  patientParameters = {...patientParameters, ...newParameters};
  // Reinitialize lung units when patient parameters change
  initializeLungUnits();
  return patientParameters;
}

// Perform one step of the simulation
function simulationStep() {
  const currentTime = Date.now();
  const deltaTime = currentTime - prevTime;
  prevTime = currentTime;
  
  // Update breath timer and phase
  breathTimer += deltaTime;
  
  // Check if we need to switch breath phase
  if (breathPhase === 'inspiration' && breathTimer >= inspirationTime) {
    breathPhase = 'expiration';
    breathTimer = 0;
  } else if (breathPhase === 'expiration' && breathTimer >= expirationTime) {
    breathPhase = 'inspiration';
    breathTimer = 0;
  }
  
  // Calculate target pressure based on breath phase
  let targetPressure;
  if (breathPhase === 'inspiration') {
    // Calculate how far through inspiration (0 to 1)
    const inspirationProgress = Math.min(breathTimer / inspirationTime, 1);
    
    // Pressure ramps up during inspiration with a slight curve
    targetPressure = ventilatorSettings.peep + 
      (ventilatorSettings.pip - ventilatorSettings.peep) * 
      Math.pow(inspirationProgress, 0.7); // Curved ramp
  } else {
    // Calculate how far through expiration (0 to 1)
    const expirationProgress = Math.min(breathTimer / expirationTime, 1);
    
    // Pressure decays during expiration with an exponential curve
    targetPressure = ventilatorSettings.pip - 
      (ventilatorSettings.pip - ventilatorSettings.peep) * 
      (1 - Math.exp(-5 * expirationProgress)); // Exponential decay
  }
  
  // Pressure changes with some lag (not instantaneous)
  const pressureResponse = 0.1; // lower = slower response
  pressure = pressure + (targetPressure - pressure) * pressureResponse;
  
  // Update lung units (for multi-compartment model)
  updateLungUnits(pressure, deltaTime);
  
  // Calculate total volume and flow across all lung units
  volume = calculateTotalVolume();
  
  // Calculate flow based on volume change
  // Convert mL/ms to L/min: (mL/ms) * (1000 ms/s) * (60 s/min) * (1 L/1000 mL)
  const volumeChangeRate = (volume - previousVolume) / deltaTime;
  flow = volumeChangeRate * 60; // mL/ms to L/min
  previousVolume = volume;
  
  // Return current simulation state
  return {
    time: currentTime,
    breathPhase: breathPhase,
    pressure: pressure,
    volume: volume,
    flow: flow,
    lungUnits: lungUnits.map(unit => ({ 
      id: unit.id, 
      isOpen: unit.isOpen, 
      volume: unit.volume 
    }))
  };
}

// Update all lung units
let previousVolume = 0;
function updateLungUnits(currentPressure, deltaTime) {
  // Time constant in milliseconds (resistance * compliance)
  const baseTimeConstant = patientParameters.resistance * patientParameters.compliance;
  
  // Update each lung unit
  lungUnits.forEach(unit => {
    // Apply superimposed pressure based on position (dorsal units have more superimposed pressure)
    const superimposedPressure = unit.position * 5; // Up to 5 cmH2O at dorsal units
    const effectivePressure = currentPressure - superimposedPressure;
    
    // Check for recruitment/derecruitment
    if (!unit.isOpen && effectivePressure >= unit.openingPressure) {
      unit.isOpen = true;
    } else if (unit.isOpen && effectivePressure <= unit.closingPressure) {
      unit.isOpen = false;
    }
    
    // Calculate volume change
    if (unit.isOpen) {
      // Transpulmonary pressure (pressure across the lung)
      const transpulmonaryPressure = effectivePressure - ventilatorSettings.peep;
      
      // Target volume based on compliance
      const targetVolume = transpulmonaryPressure * (unit.compliance / lungUnits.length);
      
      // Unit-specific time constant
      const unitTimeConstant = baseTimeConstant * (0.8 + unit.position * 0.4); // Dorsal units slower
      
      // Rate of volume change (smaller time constant = faster response)
      const volumeResponse = 1 - Math.exp(-deltaTime / unitTimeConstant);
      
      // Update unit volume
      unit.volume = unit.volume + (targetVolume - unit.volume) * volumeResponse;
    } else {
      // If unit is closed, apply passive emptying
      unit.volume = unit.volume * Math.exp(-deltaTime / 100); // Passive emptying time constant
    }
  });
}

// Calculate total lung volume across all units
function calculateTotalVolume() {
  return lungUnits.reduce((total, unit) => total + unit.volume, 0);
}

// Export functions
window.SimulationCore = {
  initialize: initializeSimulation,
  updateVentilatorSettings: updateVentilatorSettings,
  updatePatientParameters: updatePatientParameters,
  step: simulationStep
};