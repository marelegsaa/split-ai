const { app, batchPlay, executeAsModal, fs } = require('./config.js');
const uxp = require("uxp");

async function getDocumentImageAsBase64() {
    const originalDoc = app.activeDocument;
    let tempDoc;

    await executeAsModal(async () => {
        await batchPlay([{
            "_obj": "duplicate",
            "_target": [{ "_ref": "document", "_enum": "ordinal", "_value": "targetEnum" }],
            "name": "temp_preview"
        }], {});
    }, { commandName: "Create Preview" });
    
    tempDoc = app.activeDocument;

    await executeAsModal(async () => {
        await batchPlay([{
            "_obj": "flattenImage"
        }], {});
    }, { commandName: "Flatten Preview" });

    const tempFolder = await fs.getTemporaryFolder();
    const tempFile = await tempFolder.createFile("temp_preview.jpg", { overwrite: true });
    
    await executeAsModal(async () => {
        await tempDoc.saveAs.jpg(tempFile, { quality: 12 }, true);
    }, { commandName: "Save Preview" });

    const arrayBuffer = await tempFile.read({ format: uxp.storage.formats.binary });
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);

    await executeAsModal(async () => {
        await tempDoc.closeWithoutSaving();
    }, { commandName: "Close Preview" });

    await executeAsModal(async () => {
        await batchPlay([{
            "_obj": "select",
            "_target": [{ "_ref": "document", "_name": originalDoc.name }]
        }], {});
    }, { commandName: "Restore Original" });

    return base64;
}

async function getLayersInfo() {
    const doc = app.activeDocument;
    const layers = [];
    
    for (let i = 0; i < doc.layers.length; i++) {
        const layer = doc.layers[i];
        layers.push({
            index: i,
            name: layer.name,
            visible: layer.visible,
            opacity: layer.opacity,
            kind: layer.kind
        });
    }
    
    return layers;
}

module.exports = {
    getDocumentImageAsBase64,
    getLayersInfo
};