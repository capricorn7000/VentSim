/**
 * Ventilator Simulation Core
 * 
 * This file contains the core simulation logic for the ventilator model
 * and the patient model, implementing the concepts from the Simulink guide.
 */

/**
 * Class representing the ventilator generating pressure waveforms
 */
class VentilatorModel {
  constructor() {
    // Default ventilator settings
    this.settings = {
      mode: 'pressure-control',      // Ventilation mode
      pControl: 20,                  // Driving pressure (cmH₂O)
      peep: 5,                       // Positive End-Expiratory Pressure (cmH₂O)
      respiratoryRate: 15,           // Breaths per minute
      ieRatio: 0.5,                  // I:E ratio (1:2)
      fio2: 0.5,                     // Fraction of inspired oxygen
      triggerSensitivity: -2,        // Pressure trigger threshold (cmH₂O)
      riseTime: 100                  // Pressure rise time (milliseconds)
    };
    
    // Calculated parameters
    this.period = 60 / this.settings.respiratoryRate;
    this.inspirationTime = this.period * (1 / (1 + 1/this.settings.ieRatio));
    this.expirationTime = this.period - this.inspirationTime;
    
    // Internal state
    this.currentTime = 0;
    this.currentPhase = 'expiration'; // 'inspiration' or 'expiration'
    this.phaseStartTime = 0;
  }
  
  /**
   * Update ventilator settings
   * @param {Object} newSettings - Object containing settings to update
   */
  updateSettings(newSettings) {
    this.settings = {...this.settings, ...newSettings};
    
    // Recalculate timing parameters
    this.period = 60 / this.settings.respiratoryRate;
    this.inspirationTime = this.period * (1 / (1 + 1/this.settings.ieRatio));
    this.expirationTime = this.period - this.inspirationTime;
  }
  
  /**
   * Calculate target pressure based on current time in the respiratory cycle
   * @param {number} time - Current simulation time (seconds)
   * @returns {number} Target pressure at the current time
   */
  calculateTargetPressure(time) {
    // Determine which phase we're in
    this.currentTime = time;
    const cycleTime = time % this.period;
    
    // Check if we've switched phases
    if (cycleTime < this.inspirationTime) {
      if (this.currentPhase !== 'inspiration') {
        this.currentPhase = 'inspiration';
        this.phaseStartTime = time - cycleTime;
      }
      // Inspiration phase - calculate target pressure with rise time
      const percentComplete = cycleTime / this.inspirationTime;
      
      // Use rise time in calculation (convert ms to seconds)
      const riseTimeSec = this.settings.riseTime / 1000;
      const riseTimeFactor = Math.min(1, cycleTime / riseTimeSec);
      
      return this.settings.peep + (this.settings.pControl * riseTimeFactor);
    } else {
      if (this.currentPhase !== 'expiration') {
        this.currentPhase = 'expiration';
        this.phaseStartTime = time - cycleTime + this.inspirationTime;
      }
      // Expiration phase
      return this.settings.peep;
    }
  }
  
  /**
   * Get the current ventilator state
   * @param {number} time - Current simulation time
   * @returns {Object} Ventilator state object
   */
  getState(time) {
    const targetPressure = this.calculateTargetPressure(time);
    
    return {
      time,
      targetPressure,
      phase: this.currentPhase,
      phaseTime: time - this.phaseStartTime,
      settings: this.settings
    };
  }
}

/**
 * Class representing a simple single-compartment lung model
 */
class BasicPatientModel {
  constructor() {
    // Default patient parameters
    this.parameters = {
      compliance: 50,         // Lung compliance (mL/cmH₂O)
      resistance: 10,         // Airway resistance (cmH₂O·s/L)
      residualVolume: 1000,   // Residual volume (mL) - volume at PEEP
      ibw: 70,                // Ideal body weight (kg)
    };
    
    // Calculated patient parameters based on IBW
    this.calculatedParameters = {
      predictedTLC: 0,        // Total lung capacity (mL)
      predictedVC: 0,         // Vital capacity (mL)
      predictedRV: 0,         // Residual volume (mL)
      predictedFRC: 0,        // Functional residual capacity (mL)
    };
    
    // Recalculate parameters based on IBW
    this.updatePredictedValues();
    
    // Internal state
    this.currentVolume = this.parameters.residualVolume;
    this.currentFlow = 0;
    this.lastPressure = 0;
    this.lastTime = 0;
    
    // Assumptions for the model
    this.modelAssumptions = [
      { parameter: "Model Type", value: "Single-compartment linear model" },
      { parameter: "Compliance", value: "Linear and constant" },
      { parameter: "Resistance", value: "Linear and constant" },
      { parameter: "Volume at PEEP", value: "Functional residual capacity" },
      { parameter: "Chest Wall", value: "Not modeled separately" },
      { parameter: "Auto-PEEP", value: "Not modeled" },
      { parameter: "Recruitment", value: "Not modeled in basic model" },
    ];
  }
  
  /**
   * Update predicted respiratory values based on ideal body weight
   */
  updatePredictedValues() {
    const ibw = this.parameters.ibw;
    const isMale = true; // Default assumption, can be made configurable
    
    // Predicted values based on common formulas
    // These are simplified approximations
    if (isMale) {
      this.calculatedParameters.predictedTLC = 7.99 * ibw; // ~80 mL/kg
      this.calculatedParameters.predictedVC = 4.5 * ibw;   // ~45 mL/kg
      this.calculatedParameters.predictedRV = 1.31 * ibw;  // ~13 mL/kg
    } else {
      this.calculatedParameters.predictedTLC = 6.6 * ibw;  // ~66 mL/kg
      this.calculatedParameters.predictedVC = 3.9 * ibw;   // ~39 mL/kg
      this.calculatedParameters.predictedRV = 1.18 * ibw;  // ~12 mL/kg
    }
    
    this.calculatedParameters.predictedFRC = 2.4 * ibw;  // ~24 mL/kg
    
    // Set residual volume to predicted FRC
    this.parameters.residualVolume = this.calculatedParameters.predictedFRC;
    this.currentVolume = this.parameters.residualVolume;
  }
  
  /**
   * Update patient parameters
   * @param {Object} newParameters - Object containing parameters to update
   */
  updateParameters(newParameters) {
    this.parameters = {...this.parameters, ...newParameters};
    
    // If IBW was updated, recalculate predicted values
    if (newParameters.ibw !== undefined) {
      this.updatePredictedValues();
    }
  }
  
  /**
   * Calculate the new lung state based on the applied pressure
   * @param {number} pressure - Current airway pressure (cmH₂O)
   * @param {number} time - Current simulation time (seconds)
   * @returns {Object} Updated lung state
   */
  calculateLungState(pressure, time) {
    const deltaTime = time - this.lastTime;
    
    if (deltaTime > 0) {
      // Time constant (τ) = Resistance × Compliance
      const timeConstant = this.parameters.resistance * this.parameters.compliance * 0.001; // Convert to seconds
      
      // Target volume for current pressure (steady-state)
      const targetVolume = this.parameters.residualVolume + 
                          this.parameters.compliance * (pressure - this.parameters.residualVolume / this.parameters.compliance);
      
      // First-order response equation for volume change
      // V(t) = Vfinal - (Vfinal - Vinitial) * e^(-t/τ)
      const volumeChange = (targetVolume - this.currentVolume) * (1 - Math.exp(-deltaTime / timeConstant));
      
      // Update volume
      this.currentVolume += volumeChange;
      
      // Calculate flow as the rate of volume change
      this.currentFlow = volumeChange / deltaTime; // in mL/s
    }
    
    this.lastPressure = pressure;
    this.lastTime = time;
    
    return {
      volume: this.currentVolume,
      flow: this.currentFlow,
      pressure,
      time,
      parameters: this.parameters,
      calculatedParameters: this.calculatedParameters,
      tidalVolume: Math.max(0, this.currentVolume - this.parameters.residualVolume)
    };
  }
}

/**
 * Class implementing a multi-compartment lung model with alveolar units
 */
class AdvancedPatientModel {
  constructor(numberOfUnits = 10) {
    // Create multiple alveolar units
    this.alveolarUnits = [];
    this.numberOfUnits = numberOfUnits;
    
    // Initialize with default healthy parameters
    this.initializeHealthyLungs();
    
    // Internal state
    this.currentVolume = 0;
    this.currentFlow = 0;
    this.lastPressure = 0;
    this.lastTime = 0;
    this.unitStates = [];
  }
  
  /**
   * Initialize lungs with healthy parameters
   */
  initializeHealthyLungs() {
    this.alveolarUnits = [];
    
    for (let i = 0; i < this.numberOfUnits; i++) {
      const dorsalPosition = i / (this.numberOfUnits - 1); // 0 = ventral, 1 = dorsal
      
      this.alveolarUnits.push({
        id: i,
        position: dorsalPosition,
        openingPressure: 5 + (dorsalPosition * 2),  // Slightly higher in dorsal regions
        closingPressure: 2 + (dorsalPosition * 2),  // Lower than opening (hysteresis)
        compliance: 50 / this.numberOfUnits,        // Share of total compliance
        isOpen: true,                               // Initially open
        volume: 0,                                  // Current volume above residual
        perfusion: 1 - 0.2 * dorsalPosition,        // Better perfusion in ventral regions
        pathology: 'normal'                         // Health status
      });
    }
    
    // Base residual volume
    this.residualVolume = 1000; // mL
  }
  
  /**
   * Set up an ARDS patient model
   * @param {string} severity - 'mild', 'moderate', or 'severe'
   */
  setupARDSModel(severity = 'moderate') {
    this.initializeHealthyLungs(); // Start fresh
    
    // Factors based on severity
    const severityFactors = {
      mild: { openingFactor: 1.5, closedUnitsPct: 0.2, complianceFactor: 0.7 },
      moderate: { openingFactor: 2, closedUnitsPct: 0.4, complianceFactor: 0.5 },
      severe: { openingFactor: 3, closedUnitsPct: 0.6, complianceFactor: 0.3 }
    };
    
    const factor = severityFactors[severity];
    
    // Modify units based on severity
    this.alveolarUnits.forEach((unit, i) => {
      // Higher opening pressures, especially in dorsal regions
      unit.openingPressure = (5 + (unit.position * 5)) * factor.openingFactor;
      unit.closingPressure = (2 + (unit.position * 5)) * factor.openingFactor;
      
      // Reduced compliance
      unit.compliance = (50 / this.numberOfUnits) * factor.complianceFactor;
      
      // Some units consolidated (especially dorsal)
      if (unit.position > (1 - factor.closedUnitsPct)) {
        unit.isOpen = false;
        unit.pathology = 'consolidated';
        unit.compliance *= 0.1; // Drastically reduced compliance in consolidated units
      }
    });
  }
  
  /**
   * Set up a COPD patient model
   */
  setupCOPDModel() {
    this.initializeHealthyLungs(); // Start fresh
    
    // Modify units to model COPD
    this.alveolarUnits.forEach((unit) => {
      // Lower opening/closing pressures (easier to open)
      unit.openingPressure = 3 + (unit.position * 1);
      unit.closingPressure = 1 + (unit.position * 0.5);
      
      // Increased compliance (hyperinflation)
      unit.compliance = (80 / this.numberOfUnits) * (1 + 0.5 * Math.random());
      
      // Air trapping in some units
      if (Math.random() < 0.3) {
        unit.pathology = 'air-trapped';
      }
    });
  }
  
  /**
   * Calculate the new lung state based on the applied pressure
   * @param {number} pressure - Current airway pressure (cmH₂O)
   * @param {number} time - Current simulation time (seconds)
   * @returns {Object} Updated lung state with individual unit details
   */
  calculateLungState(pressure, time) {
    const deltaTime = time - this.lastTime;
    let totalVolume = this.residualVolume;
    let totalFlow = 0;
    
    if (deltaTime > 0) {
      // Update each alveolar unit
      this.unitStates = this.alveolarUnits.map(unit => {
        // Calculate superimposed pressure from gravity
        // More pressure in dorsal regions when supine
        const superimposedPressure = unit.position * 2; // ~2 cmH2O in most dorsal region
        const effectivePressure = pressure - superimposedPressure;
        
        // Check for recruitment/derecruitment
        if (!unit.isOpen && effectivePressure > unit.openingPressure) {
          unit.isOpen = true; // Unit opens
        } else if (unit.isOpen && effectivePressure < unit.closingPressure) {
          unit.isOpen = false; // Unit collapses
        }
        
        // Calculate unit volume
        const timeConstant = 0.05; // Simplified time constant for alveolar unit response
        let targetVolume = 0;
        
        if (unit.isOpen) {
          // Volume response for open unit
          targetVolume = unit.compliance * effectivePressure;
        } else if (unit.pathology === 'air-trapped') {
          // Air-trapped units maintain some volume
          targetVolume = unit.volume * 0.9;
        }
        
        // First-order response for volume change
        const volumeChange = (targetVolume - unit.volume) * (1 - Math.exp(-deltaTime / timeConstant));
        unit.volume += volumeChange;
        
        // Unit flow
        const unitFlow = volumeChange / deltaTime;
        
        // Add to totals
        totalVolume += unit.volume;
        totalFlow += unitFlow;
        
        return {
          ...unit,
          effectivePressure,
          flow: unitFlow
        };
      });
    }
    
    this.currentVolume = totalVolume;
    this.currentFlow = totalFlow;
    this.lastPressure = pressure;
    this.lastTime = time;
    
    return {
      volume: this.currentVolume,
      flow: this.currentFlow,
      pressure,
      time,
      unitStates: this.unitStates,
      recruitedUnits: this.unitStates.filter(u => u.isOpen).length
    };
  }
}

/**
 * Main simulation controller that connects ventilator and patient models
 */
class VentilatorSimulation {
  constructor() {
    this.ventilator = new VentilatorModel();
    this.patient = new BasicPatientModel(); // Start with basic model
    this.useAdvancedModel = false;
    this.advancedPatient = new AdvancedPatientModel(10);
    
    this.currentTime = 0;
    this.timeStep = 0.01; // 10ms simulation steps
    this.simulationData = [];
    this.isRunning = false;
    this.simulationInterval = null;
    
    // Initialize with some data points so displays have something to show
    this.initializeData();
  }
  
  /**
   * Initialize with a few data points to populate displays
   */
  initializeData() {
    // Create a few initial data points for display
    const initialState = {
      time: 0,
      ventilator: this.ventilator.getState(0),
      patient: {
        volume: this.patient.parameters.residualVolume,
        flow: 0,
        pressure: this.ventilator.settings.peep,
        time: 0,
        parameters: this.patient.parameters,
        calculatedParameters: this.patient.calculatedParameters,
        tidalVolume: 0
      }
    };
    
    // Add a few data points to make initial display look good
    this.simulationData.push(initialState);
  }
  
  /**
   * Set simulation to use basic or advanced patient model
   * @param {boolean} useAdvanced - Whether to use the advanced model
   */
  setPatientModel(useAdvanced) {
    this.useAdvancedModel = useAdvanced;
    this.resetSimulation();
  }
  
  /**
   * Update ventilator settings
   * @param {Object} settings - New ventilator settings
   */
  updateVentilatorSettings(settings) {
    this.ventilator.updateSettings(settings);
  }
  
  /**
   * Update patient parameters
   * @param {Object} parameters - New patient parameters
   * @param {string} patientType - Optional preset (e.g., 'ARDS', 'COPD')
   */
  updatePatientParameters(parameters, patientType = null) {
    if (!this.useAdvancedModel) {
      this.patient.updateParameters(parameters);
    } else {
      if (patientType === 'ARDS') {
        this.advancedPatient.setupARDSModel(parameters.severity || 'moderate');
      } else if (patientType === 'COPD') {
        this.advancedPatient.setupCOPDModel();
      } else {
        // Custom parameter updates could be applied here
      }
    }
  }
  
  /**
   * Run a single simulation step
   * @returns {Object} Current simulation state
   */
  step() {
    this.currentTime += this.timeStep;
    
    // Get ventilator pressure
    const ventilatorState = this.ventilator.getState(this.currentTime);
    const pressure = ventilatorState.targetPressure;
    
    // Calculate patient response
    let patientState;
    if (this.useAdvancedModel) {
      patientState = this.advancedPatient.calculateLungState(pressure, this.currentTime);
    } else {
      patientState = this.patient.calculateLungState(pressure, this.currentTime);
    }
    
    // Combined state
    const state = {
      time: this.currentTime,
      ventilator: ventilatorState,
      patient: patientState
    };
    
    // Record data
    this.simulationData.push(state);
    
    // Keep only last ~10 seconds of data
    const maxDataPoints = 10 / this.timeStep;
    if (this.simulationData.length > maxDataPoints) {
      this.simulationData.shift();
    }
    
    return state;
  }
  
  /**
   * Start continuous simulation
   * @param {Function} callback - Called after each step with current state
   */
  start(callback) {
    if (!this.isRunning) {
      this.isRunning = true;
      this.simulationInterval = setInterval(() => {
        const state = this.step();
        if (callback) callback(state);
      }, this.timeStep * 1000); // Convert to milliseconds
    }
  }
  
  /**
   * Pause the simulation
   */
  pause() {
    if (this.isRunning) {
      clearInterval(this.simulationInterval);
      this.isRunning = false;
    }
  }
  
  /**
   * Reset the simulation
   */
  resetSimulation() {
    this.pause();
    this.currentTime = 0;
    this.simulationData = [];
    this.ventilator = new VentilatorModel();
    
    if (!this.useAdvancedModel) {
      this.patient = new BasicPatientModel();
    } else {
      this.advancedPatient = new AdvancedPatientModel(10);
    }
    
    // Initialize with some data points
    this.initializeData();
  }
  
  /**
   * Get the current simulation data
   * @returns {Array} Array of simulation state objects
   */
  getData() {
    return this.simulationData;
  }
}

// Export the classes for use in other modules
export {
  VentilatorModel,
  BasicPatientModel,
  AdvancedPatientModel,
  VentilatorSimulation
};