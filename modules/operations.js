const { app, batchPlay, executeAsModal } = require('./config.js');

async function performResize(params) {
    const interpolationMap = {
        'nearestNeighbor': { "_enum": "interpolationType", "_value": "nearestNeighbor" },
        'bilinear': { "_enum": "interpolationType", "_value": "bilinear" },
        'bicubic': { "_enum": "interpolationType", "_value": "bicubic" },
        'bicubicSharper': { "_enum": "interpolationType", "_value": "bicubicSharper" }
    };

    await executeAsModal(async () => {
        await batchPlay([{
            "_obj": "imageSize",
            "width": { "_unit": "pixelsUnit", "_value": Math.round(params.width) },
            "height": { "_unit": "pixelsUnit", "_value": Math.round(params.height) },
            "interfaceIconFrameDimmed": interpolationMap[params.method || 'bicubic'],
            "_options": { "dialogOptions": "dontDisplay" }
        }], {});
    }, { commandName: "AI Resize" });
}

async function performCrop(params) {
    await executeAsModal(async () => {
        const doc = app.activeDocument;
        const docWidth = parseFloat(doc.width);
        const docHeight = parseFloat(doc.height);
        
        const targetWidth = params.width;
        const targetHeight = params.height;
        const targetRatio = targetWidth / targetHeight;
        
        let left, top;

        if (params.position === 'coordinates' && params.focusBox) {
            const fb = params.focusBox;
            const padding = params.padding || 20;

            const subjectLeft = (fb.x * docWidth) / 100;
            const subjectTop = (fb.y * docHeight) / 100;
            const subjectWidth = (fb.width * docWidth) / 100;
            const subjectHeight = (fb.height * docHeight) / 100;
            const subjectCenterX = subjectLeft + (subjectWidth / 2);
            const subjectCenterY = subjectTop + (subjectHeight / 2);

            const paddingMultiplier = 1 + (padding / 50);
            const minCropWidth = subjectWidth * paddingMultiplier;
            const minCropHeight = subjectHeight * paddingMultiplier;

            let cropWidth, cropHeight;

            cropWidth = targetWidth;
            cropHeight = targetHeight;

            const scaleForWidth = minCropWidth / targetWidth;
            const scaleForHeight = minCropHeight / targetHeight;
            const scaleNeeded = Math.max(scaleForWidth, scaleForHeight, 1);
            
            if (scaleNeeded > 1) {
                cropWidth = targetWidth * scaleNeeded;
                cropHeight = targetHeight * scaleNeeded;
            }

            const maxCropWidth = docWidth;
            const maxCropHeight = docHeight;
            
            if (cropWidth > maxCropWidth || cropHeight > maxCropHeight) {
                const downscale = Math.min(maxCropWidth / cropWidth, maxCropHeight / cropHeight);
                cropWidth *= downscale;
                cropHeight *= downscale;
            }

            left = subjectCenterX - (cropWidth / 2);
            top = subjectCenterY - (cropHeight / 2);

            if (left < 0) left = 0;
            if (top < 0) top = 0;
            if (left + cropWidth > docWidth) left = docWidth - cropWidth;
            if (top + cropHeight > docHeight) top = docHeight - cropHeight;
            
            left = Math.round(left);
            top = Math.round(top);
            cropWidth = Math.round(cropWidth);
            cropHeight = Math.round(cropHeight);
            
            await batchPlay([{
                "_obj": "crop",
                "to": {
                    "_obj": "rectangle",
                    "top": { "_unit": "pixelsUnit", "_value": top },
                    "left": { "_unit": "pixelsUnit", "_value": left },
                    "bottom": { "_unit": "pixelsUnit", "_value": top + cropHeight },
                    "right": { "_unit": "pixelsUnit", "_value": left + cropWidth }
                },
                "angle": { "_unit": "angleUnit", "_value": 0 },
                "delete": true,
                "_options": { "dialogOptions": "dontDisplay" }
            }], {});
            
            await batchPlay([{
                "_obj": "imageSize",
                "width": { "_unit": "pixelsUnit", "_value": Math.round(targetWidth) },
                "height": { "_unit": "pixelsUnit", "_value": Math.round(targetHeight) },
                "interfaceIconFrameDimmed": { "_enum": "interpolationType", "_value": "bicubic" },
                "_options": { "dialogOptions": "dontDisplay" }
            }], {});
            
        } else {
            switch(params.position) {
                case 'center':
                    left = Math.round((docWidth - targetWidth) / 2);
                    top = Math.round((docHeight - targetHeight) / 2);
                    break;
                case 'top':
                    left = Math.round((docWidth - targetWidth) / 2);
                    top = 0;
                    break;
                case 'bottom':
                    left = Math.round((docWidth - targetWidth) / 2);
                    top = Math.round(docHeight - targetHeight);
                    break;
                case 'left':
                    left = 0;
                    top = Math.round((docHeight - targetHeight) / 2);
                    break;
                case 'right':
                    left = Math.round(docWidth - targetWidth);
                    top = Math.round((docHeight - targetHeight) / 2);
                    break;
                default:
                    left = Math.round((docWidth - targetWidth) / 2);
                    top = Math.round((docHeight - targetHeight) / 2);
            }
            
            await batchPlay([{
                "_obj": "crop",
                "to": {
                    "_obj": "rectangle",
                    "top": { "_unit": "pixelsUnit", "_value": top },
                    "left": { "_unit": "pixelsUnit", "_value": left },
                    "bottom": { "_unit": "pixelsUnit", "_value": top + targetHeight },
                    "right": { "_unit": "pixelsUnit", "_value": left + targetWidth }
                },
                "angle": { "_unit": "angleUnit", "_value": 0 },
                "delete": true,
                "_options": { "dialogOptions": "dontDisplay" }
            }], {});
        }
    }, { commandName: "AI Crop" });
}

async function performBlur(params) {
    let command;
    
    if (params.blurType === 'gaussian') {
        command = {
            "_obj": "gaussianBlur",
            "radius": { "_unit": "pixelsUnit", "_value": parseFloat(params.radius) },
            "_options": { "dialogOptions": "dontDisplay" }
        };
    } else if (params.blurType === 'motion') {
        command = {
            "_obj": "motionBlur",
            "angle": { "_unit": "angleUnit", "_value": Math.round(params.angle || 0) },
            "distance": { "_unit": "pixelsUnit", "_value": Math.round(params.radius) },
            "_options": { "dialogOptions": "dontDisplay" }
        };
    } else if (params.blurType === 'radial') {
        command = {
            "_obj": "radialBlur",
            "amount": Math.min(100, Math.round(params.radius)),
            "blurMethod": { "_enum": "radialBlurMethod", "_value": "spin" },
            "blurQuality": { "_enum": "radialBlurQuality", "_value": "good" },
            "_options": { "dialogOptions": "dontDisplay" }
        };
    }
    
    if (command) {
        await executeAsModal(async () => {
            await batchPlay([command], {});
        }, { commandName: "AI Blur" });
    }
}

async function performColorCorrection(params) {
    const commands = [];
    
    if ((params.brightness && params.brightness !== 0) || (params.contrast && params.contrast !== 0)) {
        commands.push({
            "_obj": "brightnessEvent",
            "brightness": params.brightness || 0,
            "center": params.contrast || 0,
            "useLegacy": false,
            "_options": { "dialogOptions": "dontDisplay" }
        });
    }
    
    if (params.saturation && params.saturation !== 0) {
        commands.push({
            "_obj": "hueSaturation",
            "adjustment": [{
                "_obj": "hueSatAdjustmentV2",
                "hue": 0,
                "saturation": params.saturation,
                "lightness": 0
            }],
            "_options": { "dialogOptions": "dontDisplay" }
        });
    }
    
    if (params.temperature && params.temperature !== 0) {
        const temp = params.temperature;
        const cyan = temp > 0 ? -temp : Math.abs(temp);
        const red = temp > 0 ? temp : -Math.abs(temp);
        
        commands.push({
            "_obj": "colorBalance",
            "shadows": [cyan, 0, 0],
            "midtones": [red, 0, 0],
            "highlights": [red * 0.5, 0, 0],
            "preserveLuminosity": true,
            "_options": { "dialogOptions": "dontDisplay" }
        });
    }
    
    if (commands.length > 0) {
        await executeAsModal(async () => {
            await batchPlay(commands, {});
        }, { commandName: "AI Color Correction" });
    }
}

async function performSharpness(params) {
    await executeAsModal(async () => {
        await batchPlay([{
            "_obj": "unsharpMask",
            "amount": { "_unit": "percentUnit", "_value": parseFloat(params.amount) },
            "radius": { "_unit": "pixelsUnit", "_value": parseFloat(params.radius) },
            "threshold": { "_unit": "levelUnit", "_value": 0 },
            "_options": { "dialogOptions": "dontDisplay" }
        }], {});
    }, { commandName: "Apply Sharpness" });
}

module.exports = {
    performResize,
    performCrop,
    performBlur,
    performColorCorrection,
    performSharpness
};