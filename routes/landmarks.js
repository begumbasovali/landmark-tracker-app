const express = require('express');
const router = express.Router();
const Landmark = require('../models/Landmark');

// GET all landmarks
router.get('/', async (req, res) => {
    try {
        const landmarks = await Landmark.find();
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
        
        await Landmark.deleteOne({ _id: req.params.id });
        res.json({ message: 'Landmark deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete landmark' });
    }
});

module.exports = router; 