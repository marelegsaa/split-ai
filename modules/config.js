const photoshop = require("photoshop");
const uxp = require("uxp");

const app = photoshop.app;
const batchPlay = photoshop.action.batchPlay;
const executeAsModal = photoshop.core.executeAsModal;
const fs = uxp.storage.localFileSystem;

const GEMINI_API_KEY = "enter_your_api_key";

const GEMINI_MODELS = [
    'models/gemini-2.0-flash-exp',
    'models/gemini-1.5-flash',
    'models/gemini-1.5-flash-latest',
    'models/gemini-1.5-pro',
    'models/gemini-1.5-pro-latest'
];

module.exports = {
    app,
    batchPlay,
    executeAsModal,
    fs,
    GEMINI_API_KEY,
    GEMINI_MODELS
};