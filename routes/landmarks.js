const express = require('express');
const router = express.Router();
const Landmark = require('../models/Landmark');
const auth = require('../middleware/auth');

// Tüm rotaları auth middleware'i ile korumalıyız
router.use(auth);

// GET all landmarks for the authenticated user
router.get('/', async (req, res) => {
    try {
        const landmarks = await Landmark.find({ user: req.user.id });
        res.json(landmarks);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch landmarks' });
    }
});

// GET specific landmark
router.get('/:id', async (req, res) => {
    try {
        const landmark = await Landmark.findById(req.params.id);
        if (!landmark) return res.status(404).json({ message: 'Landmark not found' });
        
        // Kullanıcı sadece kendi landmark'larına erişebilmeli
        if (landmark.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to access this landmark' });
        }
        
        res.json(landmark);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch landmark' });
    }
});

// POST new landmark
router.post('/', async (req, res) => {
    try {
        // Validate required fields
        if (!req.body.name) {
            return res.status(400).json({ message: 'Landmark name is required' });
        }

        if (!req.body.location || !req.body.location.latitude || !req.body.location.longitude) {
            return res.status(400).json({ message: 'Valid location (latitude and longitude) is required' });
        }

        const landmark = new Landmark({
            name: req.body.name,
            user: req.user.id, // Kullanıcı ID'sini ekle
            location: {
                latitude: req.body.location.latitude,
                longitude: req.body.location.longitude
            },
            description: req.body.description || '',
            category: req.body.category || 'other',
            notes: req.body.notes || []
        });

        const newLandmark = await landmark.save();
        res.status(201).json(newLandmark);
    } catch (err) {
        console.error('Error saving landmark:', err);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ 
                message: 'Validation error',
                details: Object.values(err.errors).map(e => e.message)
            });
        }
        res.status(500).json({ message: 'Failed to save landmark' });
    }
});

// PUT update landmark
router.put('/:id', async (req, res) => {
    try {
        const landmark = await Landmark.findById(req.params.id);
        if (!landmark) return res.status(404).json({ message: 'Landmark not found' });

        // Kullanıcı sadece kendi landmark'larını güncelleyebilmeli
        if (landmark.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this landmark' });
        }

        if (req.body.name) landmark.name = req.body.name;
        if (req.body.location) landmark.location = req.body.location;
        if (req.body.description) landmark.description = req.body.description;
        if (req.body.category) landmark.category = req.body.category;
        if (req.body.notes) landmark.notes.push({ content: req.body.notes });

        const updatedLandmark = await landmark.save();
        res.json(updatedLandmark);
    } catch (err) {
        if (err.name === 'ValidationError') {
            return res.status(400).json({ 
                message: 'Validation error',
                details: Object.values(err.errors).map(e => e.message)
            });
        }
        res.status(500).json({ message: 'Failed to update landmark' });
    }
});

// DELETE landmark
router.delete('/:id', async (req, res) => {
    try {
        const landmark = await Landmark.findById(req.params.id);
        if (!landmark) return res.status(404).json({ message: 'Landmark not found' });
        
        // Kullanıcı sadece kendi landmark'larını silebilmeli
        if (landmark.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this landmark' });
        }
        
        await Landmark.deleteOne({ _id: req.params.id });
        res.json({ message: 'Landmark deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete landmark' });
    }
});

module.exports = router;