class SoundSculpture3D {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.sculpture = null;
        this.light = null;
        this.animationId = null;
        
        // Audio components
        this.isPlaying = false;
        this.oscillator = null;
        this.envelope = null;
        this.gainNode = null;
        
        // Envelope parameters
        this.envelopeParams = {
            attack: 0.5,   // seconds
            decay: 0.5,    // seconds
            sustain: 0.5,  // 0-1
            release: 1.0   // seconds
        };

        this.init();
    }

    async init() {
        await this.initAudio();
        this.initThreeJS();
        this.initUI();
        this.createSculpture();
        this.animate();
        this.hideLoading();
    }

    async initAudio() {
        try {
            await Tone.start();
            
            // Create oscillator
            this.oscillator = new Tone.Oscillator(440, "sine");
            this.gainNode = new Tone.Gain(0);
            
            // Connect audio chain
            this.oscillator.connect(this.gainNode);
            this.gainNode.toDestination();

            console.log("Audio initialized successfully");
        } catch (error) {
            console.error("Error initializing audio:", error);
        }
    }

    initThreeJS() {
        const canvas = document.getElementById('threejs-canvas');
        
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75, 
            canvas.clientWidth / canvas.clientHeight, 
            0.1, 
            1000
        );
        this.camera.position.set(0, 2, 5);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Lighting - Single directional light as specified
        this.light = new THREE.DirectionalLight(0xffffff, 1);
        this.light.position.set(5, 10, 5);
        this.light.castShadow = true;
        this.light.shadow.mapSize.width = 2048;
        this.light.shadow.mapSize.height = 2048;
        this.light.shadow.camera.near = 0.5;
        this.light.shadow.camera.far = 50;
        this.light.shadow.camera.left = -10;
        this.light.shadow.camera.right = 10;
        this.light.shadow.camera.top = 10;
        this.light.shadow.camera.bottom = -10;
        this.scene.add(this.light);

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    createSculpture() {
        // Create the base geometry for the envelope sculpture
        this.sculpture = new THREE.Group();
        
        // Create material - matte white/gray with slight texture as specified
        const material = new THREE.MeshLambertMaterial({
            color: 0xf0f0f0,
            transparent: false,
            opacity: 1.0
        });

        // Create the envelope shape based on ADSR parameters
        this.updateSculptureGeometry(material);
        
        this.scene.add(this.sculpture);
    }

    updateSculptureGeometry(material) {
        // Clear existing geometry
        this.sculpture.clear();

        const { attack, decay, sustain, release } = this.envelopeParams;
        
        // Create a mathematical spiral structure inspired by Sugimoto's Mathematical Models
        // This creates a flowing, architectural form that responds to envelope parameters
        
        // Base parameters
        const baseRadius = 0.8 + (attack * 0.4); // Attack affects base expansion
        const maxHeight = 3 + (sustain * 2); // Sustain affects height/length
        const spiralTurns = 1.5 + (sustain * 1.5); // Sustain affects spiral turns
        const spiralRadius = 1.2;
        
        // Create spiral curve points
        const segments = 200;
        const points = [];
        const radii = [];
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            
            // Calculate spiral parameters based on envelope phases
            let currentRadius, currentHeight, radiusMultiplier;
            
            if (t <= 0.2) {
                // Attack phase - affects starting angle and base expansion
                const attackPhase = t / 0.2;
                currentRadius = baseRadius * (0.3 + attackPhase * 0.7);
                currentHeight = t * maxHeight * 0.3;
                radiusMultiplier = 0.8 + attackPhase * 0.4;
            } else if (t <= 0.6) {
                // Decay phase - affects curve steepness and spiral density
                const decayPhase = (t - 0.2) / 0.4;
                const decaySteepness = 1 - (decay * 0.5); // Higher decay = gentler curve
                currentRadius = spiralRadius * (1 - decayPhase * 0.3);
                currentHeight = (0.3 + decayPhase * 0.4) * maxHeight;
                radiusMultiplier = 1.2 - (decayPhase * 0.4) * decaySteepness;
            } else {
                // Release phase - affects end tapering and curling
                const releasePhase = (t - 0.6) / 0.4;
                const releaseTaper = release * 0.8; // Higher release = more tapering
                currentRadius = spiralRadius * 0.7 * (1 - releasePhase * releaseTaper);
                currentHeight = (0.7 + releasePhase * 0.3) * maxHeight;
                radiusMultiplier = 0.8 - (releasePhase * 0.6) * releaseTaper;
            }
            
            // Create spiral coordinates
            const angle = t * spiralTurns * Math.PI * 2;
            const x = Math.cos(angle) * currentRadius;
            const y = currentHeight;
            const z = Math.sin(angle) * currentRadius;
            
            points.push(new THREE.Vector3(x, y, z));
            radii.push(radiusMultiplier);
        }

        // Create the spiral tube geometry
        const curve = new THREE.CatmullRomCurve3(points);
        const tubeGeometry = new THREE.TubeGeometry(curve, segments, 0.15, 16, false);
        
        // Apply radius variations based on envelope parameters
        const positions = tubeGeometry.attributes.position.array;
        const normals = tubeGeometry.attributes.normal.array;
        
        for (let i = 0; i < positions.length; i += 3) {
            const segmentIndex = Math.floor((i / 3) / 16); // 16 vertices per segment
            const vertexIndex = (i / 3) % 16;
            
            if (segmentIndex < radii.length) {
                const radiusMultiplier = radii[segmentIndex];
                const radius = 0.15 * radiusMultiplier;
                
                // Calculate angle around the tube
                const angle = (vertexIndex / 16) * Math.PI * 2;
                
                // Apply radius modification
                positions[i + 1] = Math.cos(angle) * radius;
                positions[i + 2] = Math.sin(angle) * radius;
            }
        }
        
        tubeGeometry.attributes.position.needsUpdate = true;
        tubeGeometry.computeVertexNormals();

        // Create the main sculpture mesh
        const sculptureMesh = new THREE.Mesh(tubeGeometry, material);
        sculptureMesh.castShadow = true;
        sculptureMesh.receiveShadow = true;
        
        this.sculpture.add(sculptureMesh);

        // Add architectural base platform
        const baseGeometry = new THREE.CylinderGeometry(baseRadius, baseRadius * 0.8, 0.15, 32);
        const baseMaterial = new THREE.MeshLambertMaterial({ color: 0xf0f0f0 });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = -0.075;
        base.receiveShadow = true;
        this.sculpture.add(base);
        
        // Add subtle architectural details
        this.addArchitecturalDetails(material);
    }
    
    addArchitecturalDetails(material) {
        const { attack, decay, sustain, release } = this.envelopeParams;
        
        // Add vertical accent lines based on attack parameter
        const accentCount = Math.floor(attack * 8) + 4;
        for (let i = 0; i < accentCount; i++) {
            const angle = (i / accentCount) * Math.PI * 2;
            const radius = 0.9 + (attack * 0.3);
            
            const accentGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8);
            const accent = new THREE.Mesh(accentGeometry, material);
            accent.position.set(
                Math.cos(angle) * radius,
                0.25,
                Math.sin(angle) * radius
            );
            accent.castShadow = true;
            this.sculpture.add(accent);
        }
        
        // Add spiral accent based on sustain parameter
        if (sustain > 0.3) {
            const spiralAccentGeometry = new THREE.TorusGeometry(0.8, 0.05, 8, 32, Math.PI * sustain * 2);
            const spiralAccent = new THREE.Mesh(spiralAccentGeometry, material);
            spiralAccent.position.y = 1 + (sustain * 0.5);
            spiralAccent.rotation.x = Math.PI / 2;
            spiralAccent.castShadow = true;
            this.sculpture.add(spiralAccent);
        }
    }

    initUI() {
        // Play/Stop button
        const playButton = document.getElementById('playButton');
        playButton.addEventListener('click', () => {
            this.togglePlayback();
        });

        // Envelope parameter sliders with enhanced 3D interaction
        this.setupSlider('attackSlider', 'attackValue', (value) => {
            this.envelopeParams.attack = value;
            // Attack affects base expansion and starting angle
            this.updateSculptureGeometry();
            this.updateAudioParameters();
        }, (value) => `${value}s`);

        this.setupSlider('decaySlider', 'decayValue', (value) => {
            this.envelopeParams.decay = value;
            // Decay affects curve steepness and spiral density
            this.updateSculptureGeometry();
            this.updateAudioParameters();
        }, (value) => `${value}s`);

        this.setupSlider('sustainSlider', 'sustainValue', (value) => {
            this.envelopeParams.sustain = value / 100;
            // Sustain affects height/length and spiral turns
            this.updateSculptureGeometry();
            this.updateAudioParameters();
        }, (value) => `${value}%`);

        this.setupSlider('releaseSlider', 'releaseValue', (value) => {
            this.envelopeParams.release = value;
            // Release affects end tapering and curling
            this.updateSculptureGeometry();
            this.updateAudioParameters();
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

    updateAudioParameters() {
        if (this.oscillator) {
            // Update oscillator frequency based on attack (affects starting pitch)
            this.oscillator.frequency.value = 440 + (this.envelopeParams.attack * 200);
            
            // Update oscillator type based on decay (affects timbre)
            const waveTypes = ['sine', 'triangle', 'square', 'sawtooth'];
            const waveIndex = Math.floor(this.envelopeParams.decay * 3.99);
            this.oscillator.type = waveTypes[waveIndex];
            
            // Update detune based on release (affects pitch variation)
            this.oscillator.detune.value = this.envelopeParams.release * 100 - 500;
            
            // Update gain based on sustain (affects volume)
            if (this.isPlaying) {
                this.gainNode.gain.value = this.envelopeParams.sustain * 0.3;
            }
        }
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
                // Start continuous playback - ensure it plays indefinitely
                this.oscillator.start();
                // Set gain to sustain level for continuous playback
                this.gainNode.gain.value = this.envelopeParams.sustain * 0.3;
                
                playButton.textContent = 'Stop';
                playButton.classList.add('playing');
                this.isPlaying = true;
                
                console.log("Continuous playback started - will play until manually stopped");
                
            } catch (error) {
                console.error("Error starting playback:", error);
            }
        }
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        // Rotate sculpture slowly
        if (this.sculpture) {
            this.sculpture.rotation.y += 0.005;
        }
        
        // Render
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        const canvas = document.getElementById('threejs-canvas');
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }

    // Cleanup method
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.oscillator) {
            this.oscillator.stop();
            this.oscillator.dispose();
        }
        if (this.gainNode) {
            this.gainNode.dispose();
        }
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.soundSculpture = new SoundSculpture3D();
});

// Cleanup when window is closed
window.addEventListener('beforeunload', () => {
    if (window.soundSculpture) {
        window.soundSculpture.destroy();
    }
});
