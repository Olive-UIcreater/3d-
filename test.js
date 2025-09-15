// Test script for 3D Sound Sculpture
// This script can be run in the browser console to test functionality

console.log("🎵 3D Sound Sculpture - Test Suite");

// Test 1: Check if Three.js is loaded
if (typeof THREE !== 'undefined') {
    console.log("✅ Three.js loaded successfully");
    console.log("   Version:", THREE.REVISION);
} else {
    console.log("❌ Three.js not loaded");
}

// Test 2: Check if Tone.js is loaded
if (typeof Tone !== 'undefined') {
    console.log("✅ Tone.js loaded successfully");
    console.log("   Version:", Tone.version);
} else {
    console.log("❌ Tone.js not loaded");
}

// Test 3: Check if main application is initialized
if (window.soundSculpture) {
    console.log("✅ Sound Sculpture application initialized");
    
    // Test envelope parameters
    const params = window.soundSculpture.envelopeParams;
    console.log("   Envelope Parameters:", params);
    
    // Test 3D scene
    if (window.soundSculpture.scene) {
        console.log("✅ 3D Scene created");
        console.log("   Objects in scene:", window.soundSculpture.scene.children.length);
    }
    
    // Test audio components
    if (window.soundSculpture.oscillator) {
        console.log("✅ Audio oscillator created");
    }
    
    if (window.soundSculpture.gainNode) {
        console.log("✅ Audio gain node created");
    }
    
} else {
    console.log("❌ Sound Sculpture application not initialized");
}

// Test 4: Check UI elements
const playButton = document.getElementById('playButton');
if (playButton) {
    console.log("✅ Play button found");
} else {
    console.log("❌ Play button not found");
}

const sliders = ['attackSlider', 'decaySlider', 'sustainSlider', 'releaseSlider'];
sliders.forEach(sliderId => {
    const slider = document.getElementById(sliderId);
    if (slider) {
        console.log(`✅ ${sliderId} found`);
    } else {
        console.log(`❌ ${sliderId} not found`);
    }
});

// Test 5: Performance check
if (window.soundSculpture && window.soundSculpture.renderer) {
    const info = window.soundSculpture.renderer.info;
    console.log("✅ Renderer performance info:");
    console.log("   Triangles:", info.render.triangles);
    console.log("   Calls:", info.render.calls);
    console.log("   Memory:", info.memory);
}

console.log("🎵 Test suite completed!");


