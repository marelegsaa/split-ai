const { analyzeWithAI, executeAIPlan } = require('./ai.js');

function initializePlugin() {
    const aiAnalyzeBtn = document.getElementById('aiAnalyzeBtn');
    if (aiAnalyzeBtn) {
        aiAnalyzeBtn.addEventListener('click', analyzeWithAI);
    }

    const executeBtn = document.getElementById('executeBtn');
    if (executeBtn) {
        executeBtn.addEventListener('click', executeAIPlan);
    }

    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            document.getElementById('responseSection').style.display = 'none';
        });
    }

    const manualToggle = document.getElementById('manualToggle');
    if (manualToggle) {
        manualToggle.addEventListener('click', () => {
            const controls = document.getElementById('manualControls');
            const icon = document.querySelector('.toggle-icon');
            if (controls.style.display === 'none') {
                controls.style.display = 'block';
                icon.classList.add('open');
            } else {
                controls.style.display = 'none';
                icon.classList.remove('open');
            }
        });
    }

    setupSliderListeners();

    const blurType = document.getElementById('blurType');
    if (blurType) {
        blurType.addEventListener('change', (e) => {
            const motionGroup = document.getElementById('motionAngleGroup');
            if (motionGroup) {
                motionGroup.style.display = e.target.value === 'motion' ? 'block' : 'none';
            }
        });
    }
}

function setupSliderListeners() {
    const sliders = [
        { id: 'blurRadius', valueId: 'blurRadiusValue', decimals: 1 },
        { id: 'brightness', valueId: 'brightnessValue', decimals: 0 },
        { id: 'contrast', valueId: 'contrastValue', decimals: 0 },
        { id: 'saturation', valueId: 'saturationValue', decimals: 0 },
        { id: 'temperature', valueId: 'temperatureValue', decimals: 0 },
        { id: 'motionAngle', valueId: 'motionAngleValue', decimals: 0 },
        { id: 'sharpness', valueId: 'sharpnessValue', decimals: 1 },
        { id: 'sharpnessRadius', valueId: 'sharpnessRadiusValue', decimals: 1 }
    ];

    sliders.forEach(slider => {
        const el = document.getElementById(slider.id);
        const valueEl = document.getElementById(slider.valueId);
        if (el && valueEl) {
            el.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                valueEl.textContent = slider.decimals > 0 ? value.toFixed(slider.decimals) : Math.round(value);
            });
        }
    });
}

module.exports = {
    initializePlugin
};