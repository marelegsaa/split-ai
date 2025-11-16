const { app, GEMINI_API_KEY, GEMINI_MODELS } = require('./config.js');
const { getDocumentImageAsBase64, getLayersInfo } = require('./document.js');
const { selectLayerByName, performSelectSubject, performMergeLayers } = require('./layers.js');
const { performResize, performCrop, performBlur, performColorCorrection, performSharpness } = require('./operations.js');
const { buildSystemPrompt } = require('./prompts.js');
const { showStatus, showError, checkDocument } = require('./utils.js');

let aiPlan = null;

async function analyzeWithAI() {
    const prompt = document.getElementById('aiPrompt').value.trim();
    
    if (!prompt) {
        showError('Please enter a description of what you want to do');
        return;
    }

    if (!checkDocument(app)) return;

    const aiBtn = document.getElementById('aiAnalyzeBtn');
    aiBtn.disabled = true;
    aiBtn.textContent = 'Analyzing...';

    try {
        showStatus('Capturing image...', 'success');
        const base64Image = await getDocumentImageAsBase64();
        
        showStatus('Getting layers info...', 'success');
        const layers = await getLayersInfo();
        
        const doc = app.activeDocument;
        const docInfo = {
            width: parseFloat(doc.width),
            height: parseFloat(doc.height),
            name: doc.name,
            layers: layers
        };

        const systemPrompt = buildSystemPrompt(docInfo, layers, prompt);

        let lastError = null;
        let apiResponse = null;
        
        showStatus('Analyzing with AI...', 'success');
        
        for (const modelName of GEMINI_MODELS) {
            try {
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
                
                const fetchResponse = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                {
                                    text: systemPrompt
                                },
                                {
                                    inline_data: {
                                        mime_type: "image/jpeg",
                                        data: base64Image
                                    }
                                }
                            ]
                        }],
                        generationConfig: {
                            temperature: 0.1,
                            topK: 40,
                            topP: 0.95
                        }
                    })
                });

                if (fetchResponse.ok) {
                    apiResponse = fetchResponse;
                    break;
                } else {
                    const errorText = await fetchResponse.text();
                    lastError = `${fetchResponse.status} - ${errorText}`;
                    
                    if (fetchResponse.status === 503) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            } catch (error) {
                lastError = error.message;
            }
        }
        
        if (!apiResponse || !apiResponse.ok) {
            throw new Error(`All models failed. Last error: ${lastError}`);
        }

        const data = await apiResponse.json();
        const aiText = data.candidates[0].content.parts[0].text;
        
        let jsonText = aiText;
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonText = jsonMatch[0];
        }
        
        aiPlan = JSON.parse(jsonText);
        
        displayAIPlan(aiPlan);
        
    } catch (error) {
        showError(`AI Analysis failed: ${error.message}`);
    } finally {
        aiBtn.disabled = false;
        aiBtn.textContent = 'Analyze & Apply';
    }
}

async function executeAIPlan() {
    if (!aiPlan || !aiPlan.operations) {
        showError('No AI plan to execute');
        return;
    }

    const executeBtn = document.getElementById('executeBtn');
    executeBtn.disabled = true;
    executeBtn.textContent = 'Executing...';

    try {
        let newLayerCreated = false;
        
        for (let i = 0; i < aiPlan.operations.length; i++) {
            const operation = aiPlan.operations[i];
            
            showStatus(`Executing operation ${i + 1}/${aiPlan.operations.length}...`, 'success');

            if (operation.type === 'selectSubject') {
                await performSelectSubject(operation.params);
                newLayerCreated = true;
                continue;
            }

            if (operation.layerName !== null && operation.layerName !== undefined) {
                if (!(newLayerCreated && i === 1)) {
                    await selectLayerByName(operation.layerName);
                }
            }
            
            switch (operation.type) {
                case 'resize':
                    await performResize(operation.params);
                    break;
                case 'crop':
                    await performCrop(operation.params);
                    break;
                case 'blur':
                    await performBlur(operation.params);
                    break;
                case 'colorCorrection':
                    await performColorCorrection(operation.params);
                    break;
                case 'sharpness':
                    await performSharpness(operation.params);
                    break;
                case 'mergeLayers':
                    await performMergeLayers(operation.params);
                    break;
            }
        }
        
        showStatus('All operations completed successfully');
        document.getElementById('responseSection').style.display = 'none';
        aiPlan = null;
        
    } catch (error) {
        showError(`Execution failed: ${error.message}`);
    } finally {
        executeBtn.disabled = false;
        executeBtn.textContent = 'Execute Changes';
    }
}

function displayAIPlan(plan) {
    const responseSection = document.getElementById('responseSection');
    const responseDiv = document.getElementById('aiResponse');
    
    let html = `<strong>Plan:</strong> ${plan.explanation}<br><br><strong>Operations:</strong><ul style="margin: 8px 0; padding-left: 20px;">`;
    
    plan.operations.forEach((op, index) => {
        const layerInfo = op.layerName !== null && op.layerName !== undefined 
            ? ` on "${op.layerName}"`
            : ' on ALL layers';
        
        html += `<li style="margin: 4px 0;">${index + 1}. ${op.type.toUpperCase()}${layerInfo}: `;
        
        if (op.type === 'resize') {
            html += `${op.params.width}x${op.params.height}px (${op.params.method})`;
        } else if (op.type === 'crop') {
            html += `${op.params.width}x${op.params.height}px`;
            if (op.params.focusBox) {
                html += ` (smart crop on subject at ${op.params.focusBox.x}%, ${op.params.focusBox.y}%)`;
            } else {
                html += ` at ${op.params.position}`;
            }
        } else if (op.type === 'blur') {
            html += `${op.params.blurType} blur, radius: ${op.params.radius}`;
        } else if (op.type === 'colorCorrection') {
            const adjustments = [];
            if (op.params.brightness) adjustments.push(`brightness: ${op.params.brightness}`);
            if (op.params.contrast) adjustments.push(`contrast: ${op.params.contrast}`);
            if (op.params.saturation) adjustments.push(`saturation: ${op.params.saturation}`);
            if (op.params.temperature) adjustments.push(`temperature: ${op.params.temperature}`);
            html += adjustments.join(', ');
        } else if (op.type === 'sharpness') {
            html += `amount: ${op.params.amount}, radius: ${op.params.radius}`;
        } else if (op.type === 'selectSubject') {
            html += `select subject and copy to new layer`;
        } else if (op.type === 'mergeLayers') {
            html += `merge layers: ${op.params.layerNames.join(', ')}`;
        }
        html += `</li>`;
    });
    
    html += `</ul>`;
    responseDiv.innerHTML = html;
    responseSection.style.display = 'block';
}

module.exports = {
    analyzeWithAI,
    executeAIPlan
};