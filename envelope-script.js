class EnvelopeModule {
    constructor() {
        this.isPlaying = false;
        this.oscillator = null;
        this.envelope = null;
        this.gainNode = null;
        
        this.envelopeParams = {
            attack: 0.5,   // seconds
            decay: 0.5,    // seconds
            sustain: 0.5,  // 0-1
            release: 1.0   // seconds
        };

        this.initAudio();
        this.initUI();
        this.initVisualEffects();
    }

    async initAudio() {
        try {
            // Wait for Tone.js to be ready
            await Tone.start();
            
            // Create simple oscillator with gain control for continuous sound
            this.oscillator = new Tone.Oscillator(440, "sine");
            this.gainNode = new Tone.Gain(0);
            
            // Connect the audio chain - simple and direct
            this.oscillator.connect(this.gainNode);
            this.gainNode.toDestination();

            console.log("Audio initialized successfully");
        } catch (error) {
            console.error("Error initializing audio:", error);
        }
    }

    initUI() {
        // Play/Stop button
        const playButton = document.getElementById('playButton');
        playButton.addEventListener('click', () => {
            this.togglePlayback();
        });

        // Envelope parameter sliders with immediate audio parameter updates
        this.setupSlider('attackSlider', 'attackValue', (value) => {
            this.envelopeParams.attack = value;
            // Map attack to frequency change for immediate audio feedback
            if (this.oscillator) {
                this.oscillator.frequency.value = 440 + (value * 200); // 440Hz to 640Hz
            }
            this.updateVisual();
        }, (value) => `${value}s`);

        this.setupSlider('decaySlider', 'decayValue', (value) => {
            this.envelopeParams.decay = value;
            // Map decay to waveform type for immediate audio feedback
            if (this.oscillator) {
                const waveTypes = ['sine', 'triangle', 'square', 'sawtooth'];
                const waveIndex = Math.floor(value * 3.99); // 0-3
                this.oscillator.type = waveTypes[waveIndex];
            }
            this.updateVisual();
        }, (value) => `${value}s`);

        this.setupSlider('sustainSlider', 'sustainValue', (value) => {
            this.envelopeParams.sustain = value / 100; // Convert percentage to 0-1
            // Map sustain to volume for immediate audio feedback
            if (this.gainNode && this.isPlaying) {
                this.gainNode.gain.value = (value / 100) * 0.3; // 0 to 0.3
            }
            this.updateVisual();
        }, (value) => `${value}%`);

        this.setupSlider('releaseSlider', 'releaseValue', (value) => {
            this.envelopeParams.release = value;
            // Map release to detune for immediate audio feedback
            if (this.oscillator) {
                this.oscillator.detune.value = value * 100 - 500; // -500 to 0 cents
            }
            this.updateVisual();
        }, (value) => `${value}s`);
    }

    setupSlider(sliderId, valueId, callback, formatter) {
        const slider = document.getElementById(sliderId);
        const valueDisplay = document.getElementById(valueId);
        
        // Update slider fill
        const updateSliderFill = () => {
            const percentage = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
            const controlGroup = slider.closest('.control-group');
            controlGroup.style.setProperty(`--${sliderId.replace('Slider', '')}-range`, `${percentage}%`);
        };

        slider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            valueDisplay.textContent = formatter(value);
            updateSliderFill();
            callback(value);
        });

        // Initialize slider fill
        updateSliderFill();
    }

    async togglePlayback() {
        const playButton = document.getElementById('playButton');
        
        if (this.isPlaying) {
            // Stop playback
            this.oscillator.stop();
            this.gainNode.gain.value = 0;
            playButton.textContent = 'Play';
            playButton.classList.remove('playing');
            this.isPlaying = false;
        } else {
            try {
                // Start continuous playback
                this.oscillator.start();
                this.gainNode.gain.value = (this.envelopeParams.sustain * 0.3);
                
                playButton.textContent = 'Stop';
                playButton.classList.add('playing');
                this.isPlaying = true;
                
            } catch (error) {
                console.error("Error starting playback:", error);
            }
        }
    }

    initVisualEffects() {
        this.updateVisual();
    }

    updateVisual() {
        const envelopeShape = document.getElementById('envelopeShape');
        
        // Calculate the envelope shape based on parameters
        const attack = this.envelopeParams.attack;
        const decay = this.envelopeParams.decay;
        const sustain = this.envelopeParams.sustain;
        const release = this.envelopeParams.release;
        
        // Normalize values for visual representation
        const totalDuration = attack + decay + release;
        const attackPercent = (attack / totalDuration) * 100;
        const decayPercent = (decay / totalDuration) * 100;
        const releasePercent = (release / totalDuration) * 100;
        
        // Create dynamic clip-path based on envelope parameters
        // The shape represents the envelope curve: attack -> decay -> sustain -> release
        const clipPath = `polygon(
            0% 100%, 
            0% ${100 - (sustain * 100)}%, 
            ${attackPercent}% 0%, 
            ${attackPercent + decayPercent}% ${100 - (sustain * 100)}%, 
            ${100 - releasePercent}% ${100 - (sustain * 100)}%, 
            100% 100%
        )`;
        
        envelopeShape.style.clipPath = clipPath;
        
        // Update shape color based on sustain level
        const intensity = 0.3 + (sustain * 0.7); // 0.3 to 1.0
        envelopeShape.style.background = `linear-gradient(45deg, 
            rgba(231, 76, 60, ${intensity}), 
            rgba(192, 57, 43, ${intensity})
        )`;
    }

    // Method to trigger envelope manually (for testing)
    triggerEnvelope() {
        if (!this.isPlaying && this.envelope) {
            this.envelope.triggerAttack();
            setTimeout(() => {
                this.envelope.triggerRelease();
            }, (this.envelopeParams.attack + this.envelopeParams.decay + this.envelopeParams.release) * 1000);
        }
    }

    // Cleanup method
    destroy() {
        if (this.oscillator) {
            this.oscillator.stop();
            this.oscillator.dispose();
        }
        if (this.envelope) {
            this.envelope.dispose();
        }
        if (this.gainNode) {
            this.gainNode.dispose();
        }
    }
}

// Initialize the envelope module when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.envelopeModule = new EnvelopeModule();
});

// Cleanup when window is closed
window.addEventListener('beforeunload', () => {
    if (window.envelopeModule) {
        window.envelopeModule.destroy();
    }
});

