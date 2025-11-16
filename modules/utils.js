function showStatus(message, type = 'success') {
    const status = document.getElementById('status');
    if (!status) return;
    
    status.textContent = message;
    status.className = `status ${type}`;
    
    setTimeout(() => {
        status.className = 'status';
    }, 3000);
}

function showError(message) {
    showStatus(message, 'error');
}

function checkDocument(app) {
    try {
        if (!app.activeDocument) {
            showError('No active document. Please open a file');
            return false;
        }
        return true;
    } catch (e) {
        showError('No active document. Please open a file');
        return false;
    }
}

module.exports = {
    showStatus,
    showError,
    checkDocument
};