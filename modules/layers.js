const { batchPlay, executeAsModal } = require('./config.js');

async function selectLayer(layerIndex) {
    await executeAsModal(async () => {
        await batchPlay([{
            "_obj": "select",
            "_target": [{
                "_ref": "layer",
                "_index": layerIndex + 1
            }],
            "makeVisible": false
        }], {});
    }, { commandName: "Select Layer" });
}

async function selectLayerByName(layerName) {
    await executeAsModal(async () => {
        await batchPlay([{
            "_obj": "select",
            "_target": [{
                "_ref": "layer",
                "_name": layerName
            }],
            "makeVisible": false
        }], {});
    }, { commandName: "Select Layer by Name" });
}

async function performMergeLayers(params) {
    if (!params.layerNames || params.layerNames.length < 2) {
        throw new Error("Need at least 2 layers to merge");
    }

    await executeAsModal(async () => {
        await batchPlay([{
            "_obj": "select",
            "_target": [{
                "_ref": "layer",
                "_name": params.layerNames[0]
            }],
            "makeVisible": false
        }], {});

        for (let i = 1; i < params.layerNames.length; i++) {
            await batchPlay([{
                "_obj": "select",
                "_target": [{
                    "_ref": "layer",
                    "_name": params.layerNames[i]
                }],
                "selectionModifier": { "_enum": "selectionModifierType", "_value": "addToSelection" },
                "makeVisible": false
            }], {});
        }

        await batchPlay([{
            "_obj": "mergeLayersNew"
        }], {});
    }, { commandName: "Merge Layers" });
}

async function performSelectSubject(params) {
    await executeAsModal(async () => {
        const result = await batchPlay([
            {
                "_obj": "autoCutout",
                "sampleAllLayers": false
            }
        ], {
            "synchronousExecution": false,
            "modalBehavior": "execute"
        });

        await new Promise(resolve => setTimeout(resolve, 300));

        if (params.copyToNewLayer) {
            const copyResult = await batchPlay([
                {
                    "_obj": "copyToLayer",
                    "_target": [{"_ref": "layer", "_enum": "ordinal", "_value": "targetEnum"}]
                }
            ], {
                "synchronousExecution": false,
                "modalBehavior": "execute"
            });
        }
    }, { commandName: "Select Subject and Copy" });
}

module.exports = {
    selectLayer,
    selectLayerByName,
    performMergeLayers,
    performSelectSubject
};