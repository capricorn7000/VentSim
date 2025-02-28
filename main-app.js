/**
 * Ventilator Simulation - Main Application
 * 
 * This file brings together all the components of the ventilator simulation
 * and initializes the application.
 */

// Import the simulation core
import { VentilatorSimulation } from './simulation-core.js';

// Import the visualization components
import { WaveformDisplay, LungVisualization } from './waveform-display.js';

// Import the UI components
import { VentilatorControlPanel, PatientStatusDisplay } from './ventilator-ui.js';

/**
 * Main application class
 */
class VentilatorSimulationApp {
  constructor() {
    // Create the simulation instance
    this.simulation = new VentilatorSimulation();
    
    // Current application state
    this.state = {
      isAdvancedModel: false,
      currentPatientType: 'normal',
      patientSeverity: 'moderate'
    };
    
    // Initialize the application when DOM is fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize());
    } else {
      // If DOM is already loaded, initialize immediately
      this.initialize();
    }
  }
  
  /**
   * Initialize the application and UI components
   */
  initialize() {
    console.log("Initializing application...");
    
    // Create the main layout first
    this.createLayout();
    
    console.log("Layout created, initializing components...");
    
    // Check if waveform container exists
    const waveformContainer = document.getElementById('waveform-container');
    if (!waveformContainer) {
      console.error("Waveform container not found in DOM!");
    } else {
      console.log("Waveform container found, dimensions:", 
                  waveformContainer.offsetWidth, "x", waveformContainer.offsetHeight);
    }
    
    // Create the display components after the layout is ready
    try {
      this.waveformDisplay = new WaveformDisplay(waveformContainer, {
        timeWindow: 8, // Show 8 seconds of data
        yRanges: {
          pressure: [0, 40],    // cmH₂O
          flow: [-100, 100],    // L/min
          volume: [0, 800]      // mL
        }
      });
      console.log("Waveform display created successfully");
    } catch (e) {
      console.error("Error creating waveform display:", e);
    }
    
    try {
      this.lungVisualization = new LungVisualization('lung-canvas');
      console.log("Lung visualization created successfully");
    } catch (e) {
      console.error("Error creating lung visualization:", e);
    }
    
    // Create the UI components
    try {
      this.ventilatorControls = new VentilatorControlPanel(
        document.getElementById('ventilator-controls'),
        this.simulation
      );
      console.log("Ventilator controls created successfully");
    } catch (e) {
      console.error("Error creating ventilator controls:", e);
    }
    
    try {
      this.patientStatus = new PatientStatusDisplay(
        document.getElementById('patient-status')
      );
      console.log("Patient status display created successfully");
    } catch (e) {
      console.error("Error creating patient status display:", e);
    }
    
    // Set up the simulation update loop
    this.simulation.start(state => this.updateDisplays(state));
    
    // Add event listener for model toggle
    const advancedModelToggle = document.getElementById('advanced-model-toggle');
    if (advancedModelToggle) {
      advancedModelToggle.addEventListener('change', (e) => {
        this.state.isAdvancedModel = e.target.checked;
      });
    }
    
    // Add event listeners for patient preset buttons
    const presetButtons = document.querySelectorAll('#patient-presets button');
    presetButtons.forEach(button => {
      button.addEventListener('click', () => {
        const preset = button.dataset.preset;
        
        if (preset === 'ards-mild') {
          this.state.currentPatientType = 'ARDS';
          this.state.patientSeverity = 'mild';
        } else if (preset === 'ards-severe') {
          this.state.currentPatientType = 'ARDS';
          this.state.patientSeverity = 'severe';
        } else {
          this.state.currentPatientType = preset;
        }
      });
    });
    
    console.log("Application initialization complete");
  }
  
  /**
   * Create the application layout structure
   */
  createLayout() {
    // Create the main container
    const mainContainer = document.createElement('div');
    mainContainer.className = 'ventilator-simulator';
    
    // Create the layout structure
    mainContainer.innerHTML = `
      <div class="simulator-header">
        <h1>Ventilator Simulation</h1>
      </div>
      
      <div class="simulator-body">
        <div class="left-panel">
          <div id="ventilator-controls"></div>
          <div id="patient-status"></div>
        </div>
        
        <div class="right-panel">
          <div class="waveform-panel">
            <h2>Ventilator Waveforms</h2>
            <div id="waveform-container"></div>
          </div>
          
          <div class="lung-visualization-container">
            <h2>Lung Visualization</h2>
            <canvas id="lung-canvas"></canvas>
          </div>
        </div>
      </div>
    `;
    
    // Add the layout to the document
    document.body.appendChild(mainContainer);
    
    // Apply styles
    this.applyStyles();
  }
  
  /**
   * Update all displays with the current simulation state
   * @param {Object} state - Current simulation state
   */
  updateDisplays(state) {
    if (!state) return;
    
    // Update the waveform display
    this.waveformDisplay.updateData(this.simulation.getData());
    
    // Update patient status display
    this.patientStatus.updateStatus(state, {
      hasAdvancedModel: this.state.isAdvancedModel,
      pathology: this.state.currentPatientType,
      severity: this.state.patientSeverity
    });
    
    // Update lung visualization if using advanced model
    if (this.state.isAdvancedModel && state.patient.unitStates) {
      this.lungVisualization.updateUnits(state.patient.unitStates);
    }
  }
  
  /**
   * Apply CSS styles for the overall application
   */
  applyStyles() {
    // Create a style element
    const style = document.createElement('style');
    style.textContent = `
      body {
        font-family: sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f0f0f0;
      }
      
      .ventilator-simulator {
        max-width: 1400px;
        margin: 0 auto;
        padding: 20px;
      }
      
      .simulator-header {
        text-align: center;
        margin-bottom: 20px;
      }
      
      .simulator-header h1 {
        color: #2c3e50;
        margin: 0;
      }
      
      .simulator-body {
        display: flex;
        gap: 20px;
      }
      
      .left-panel {
        width: 40%;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      
      .right-panel {
        width: 60%;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      
      .waveform-panel, .lung-visualization-container {
        background-color: white;
        border-radius: 10px;
        padding: 20px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      }
      
      .waveform-panel h2, .lung-visualization-container h2 {
        color: #2c3e50;
        margin-top: 0;
        margin-bottom: 15px;
      }
      
      #waveform-container {
        margin-top: 15px;
      }
      
      canvas {
        background-color: #f8f8f8;
        border: 1px solid #ddd;
        border-radius: 5px;
        width: 100%;
      }
      
      /* Responsive layout */
      @media (max-width: 1000px) {
        .simulator-body {
          flex-direction: column;
        }
        
        .left-panel, .right-panel {
          width: 100%;
        }
      }
    `;
    
    // Add the style to the document
    document.head.appendChild(style);
  }
}

// Initialize the application
const app = new VentilatorSimulationApp();

// Make available globally for debugging
window.ventilatorApp = app;