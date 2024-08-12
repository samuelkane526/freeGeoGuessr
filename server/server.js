const express = require('express');
const cors = require('cors');
const { QuickDB } = require('quick.db');
const fs = require('fs').promises;
const os = require('os');
const db = new QuickDB();
const app = express();
const port = 3000;
let coordinates = [];

async function getCoordinates() {
    try {
        const data = await fs.readFile('./coordinates.json', 'utf8');
        coordinates = JSON.parse(data).map(coord => ({
            latitude: coord.latitude,
            longitude: coord.longitude
        }));
    } catch (error) {
        console.error('Error reading the file:', error);
    }
}

app.use(cors());
app.use(express.json());

app.post('/roomCreate', async (req, res) => {
    const { totalRounds } = req.body;
    let roomId = Math.floor(Math.random() * (9999 - 1)) + 1;
    if (await db.get(`roomId_${roomId}`)) {
        return res.status(501).json({ message: 'Error: Try Again' });
    }
    let coordList = [];
    for (let i = 0; i < totalRounds; i++) {
        coordList.push(coordinates[Math.floor(Math.random() * coordinates.length)]);
    }
    await db.set(`roomId_${roomId}`, { coordList });
    res.status(201).json({ message: roomId });
});

app.post('/roomJoin', async (req, res) => {
    const { roomId } = req.body;
    let room = await db.get(`roomId_${roomId}`);
    if (!room) return res.status(501).json({ message: 'Room Does not Exist' });
    res.status(201).json({ roomId, coordList: room.coordList });
});

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1'; // Fallback to localhost if no local IP found
}

async function startServer() {
    await getCoordinates();
    const localIp = getLocalIp();
    app.listen(port, localIp, () => {
        console.log(`Server running on http://${localIp}:${port}`);
    });
}

startServer();
