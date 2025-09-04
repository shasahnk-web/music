// Global variables
let musicFiles = [];
const musicPlayer = document.getElementById('musicPlayer');
const currentTrack = document.getElementById('currentTrack');
const generatedLinks = document.getElementById('generatedLinks');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadExistingFiles();
});

// Function to show status messages
function showStatus(elementId, message, type = 'loading') {
    const statusElement = document.getElementById(elementId);
    statusElement.textContent = message;
    statusElement.className = `status-message ${type}`;
    statusElement.style.display = 'block';
    
    // Auto-hide success and error messages after 5 seconds
    if (type === 'success' || type === 'error') {
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, 5000);
    }
}

// Function to upload local file
async function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        showStatus('upload-status', 'Please select a file to upload', 'error');
        return;
    }
    
    if (!file.type.startsWith('audio/')) {
        showStatus('upload-status', 'Please select an audio file', 'error');
        return;
    }
    
    showStatus('upload-status', 'Uploading file...', 'loading');
    
    const formData = new FormData();
    formData.append('musicFile', file);
    
    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showStatus('upload-status', result.message, 'success');
            fileInput.value = ''; // Clear the input
            loadExistingFiles(); // Refresh the file list
        } else {
            showStatus('upload-status', result.error, 'error');
        }
    } catch (error) {
        showStatus('upload-status', 'Upload failed: ' + error.message, 'error');
    }
}


// Function to  load existing files
async function loadExistingFiles() {
    try {
        const response = await fetch('/files');
        const result = await response.json();
        
        if (result.files) {
            musicFiles = result.files;
            displayFiles(result.files);
        }
    } catch (error) {
        console.error('Failed to load files:', error);
    }
}

// Function to display files
function displayFiles(files) {
    if (files.length === 0) {
        generatedLinks.innerHTML = '<div class="empty-state">No music files uploaded yet. Upload a file or download from YouTube to get started!</div>';
        return;
    }
    
    generatedLinks.innerHTML = files.map(file => {
        const fileName = file.filename;
        const displayName = fileName.length > 30 ? fileName.substring(0, 30) + '...' : fileName;
        
        return `
            <div class="file-item">
                <div class="file-info">
                    <div class="file-name">${displayName}</div>
                    <div class="file-url">${file.url}</div>
                </div>
                <div class="file-actions">
                    <button class="btn-small play" onclick="playMusic('${file.url}', '${fileName}')">▶ Play</button>
                    <button class="btn-small copy" onclick="copyToClipboard('${file.url}')">📋 Copy Link</button>
                </div>
            </div>
        `;
    }).join('');
}

// Function to play music
function playMusic(url, filename) {
    musicPlayer.src = url;
    musicPlayer.load();
    musicPlayer.play();
    currentTrack.textContent = `Now playing: ${filename}`;
    
    // Scroll to player
    document.querySelector('.player-section').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

// Function to copy URL to clipboard
async function copyToClipboard(url) {
    try {
        await navigator.clipboard.writeText(url);
        
        // Show temporary feedback
        const event = window.event;
        const button = event.target;
        const originalText = button.textContent;
        
        button.textContent = '✅ Copied!';
        button.style.background = '#48bb78';
        
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '';
        }, 2000);
        
    } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        alert('Link copied to clipboard!');
    }
}


// Add drag and drop support for file upload
document.addEventListener('DOMContentLoaded', function() {
    const fileUploadSection = document.querySelector('.file-upload');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        fileUploadSection.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        fileUploadSection.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        fileUploadSection.addEventListener(eventName, unhighlight, false);
    });
    
    fileUploadSection.addEventListener('drop', handleDrop, false);
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight(e) {
        fileUploadSection.classList.add('highlight');
    }
    
    function unhighlight(e) {
        fileUploadSection.classList.remove('highlight');
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            const fileInput = document.getElementById('fileInput');
            fileInput.files = files;
            uploadFile();
        }
    }
});

// Add CSS for drag and drop highlight
const style = document.createElement('style');
style.textContent = `
    .file-upload.highlight {
        border-color: #667eea !important;
        background-color: #ebf4ff !important;
        transform: scale(1.02);
    }
`;
document.head.appendChild(style);
