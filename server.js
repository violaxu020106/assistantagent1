const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'db.json');

// Middleware
app.use(cors()); // Allow cross-origin requests from the frontend
app.use(express.json()); // Allow the server to parse JSON in request bodies

// --- Helper function to read from db.json ---
const readData = () => {
    try {
        if (fs.existsSync(DB_PATH)) {
            const data = fs.readFileSync(DB_PATH, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error("Error reading from database file:", error);
    }
    // Return a default structure if file doesn't exist or is empty/corrupt
    return { events: {}, todos: [] };
};

// --- Helper function to write to db.json ---
const writeData = (data) => {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error("Error writing to database file:", error);
    }
};

// --- API Routes ---

// GET /api/data - Fetch all data
app.get('/api/data', (req, res) => {
    console.log("GET /api/data: Fetching all data.");
    const data = readData();
    res.json(data);
});

// POST /api/data - Save all data
app.post('/api/data', (req, res) => {
    const { events, todos } = req.body;
    
    if (typeof events === 'undefined' || typeof todos === 'undefined') {
        return res.status(400).json({ message: "Invalid data format. 'events' and 'todos' are required." });
    }

    console.log("POST /api/data: Receiving data to save.");
    writeData({ events, todos });
    res.status(200).json({ message: "Data saved successfully." });
});


// --- Start the server ---
app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
    // Initialize db.json if it doesn't exist
    if (!fs.existsSync(DB_PATH)) {
        console.log("Initializing new db.json file.");
        writeData({ events: {}, todos: [] });
    }
}); 