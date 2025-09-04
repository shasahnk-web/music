const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Keep original filename or generate unique name
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Accept audio files
        if (file.mimetype.startsWith('audio/')) {
            cb(null, true);
        } else {
            cb(new Error('Only audio files are allowed!'), false);
        }
    }
});

// Serve static files
app.use(express.static('.'));
app.use('/uploads', express.static(uploadsDir));

// Upload local music file
app.post('/upload', upload.single('musicFile'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        
        res.json({
            success: true,
            filename: req.file.filename,
            originalName: req.file.originalname,
            url: fileUrl,
            message: 'File uploaded successfully!'
        });
    } catch (error) {
        res.status(500).json({ error: 'Upload failed: ' + error.message });
    }
});


// Get all uploaded files
app.get('/files', (req, res) => {
    try {
        const files = fs.readdirSync(uploadsDir).map(filename => {
            const filePath = path.join(uploadsDir, filename);
            const stats = fs.statSync(filePath);
            return {
                filename,
                url: `${req.protocol}://${req.get('host')}/uploads/${filename}`,
                size: stats.size,
                uploaded: stats.mtime
            };
        });
        
        res.json({ files });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get files: ' + error.message });
    }
});

// Set cache control headers for audio files
app.use('/uploads', (req, res, next) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Music server running on http://0.0.0.0:${PORT}`);
});