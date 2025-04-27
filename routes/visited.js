const express = require('express');
const router = express.Router();
const VisitedLandmark = require('../models/VisitedLandmark');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// GET all visited landmarks
router.get('/', async (req, res) => {
    try {
        const visitedLandmarks = await VisitedLandmark.find({ user: req.user.id })
            .populate('landmark_id')
            .sort({ visited_date: -1 });
        res.json(visitedLandmarks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// GET specific visited landmark
router.get('/:id', async (req, res) => {
    try {
        const visitedLandmark = await VisitedLandmark.findOne({
            _id: req.params.id,
            user: req.user.id
        }).populate('landmark_id');
        
        if (!visitedLandmark) return res.status(404).json({ message: 'Visit record not found' });
        res.json(visitedLandmark);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST new visited landmark
router.post('/', async (req, res) => {
    const visitedLandmark = new VisitedLandmark({
        landmark_id: req.body.landmark_id,
        user: req.user.id,
        visitor_name: req.body.visitor_name,
        notes: req.body.notes,
        rating: req.body.rating,
        visited_date: req.body.visited_date || new Date()
    });

    try {
        const newVisitedLandmark = await visitedLandmark.save();
        const populatedVisit = await VisitedLandmark.findById(newVisitedLandmark._id)
            .populate('landmark_id');
        res.status(201).json(populatedVisit);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// PUT update visited landmark
router.put('/:id', async (req, res) => {
    try {
        const visitedLandmark = await VisitedLandmark.findOne({
            _id: req.params.id,
            user: req.user.id
        });
        
        if (!visitedLandmark) return res.status(404).json({ message: 'Visit record not found' });

        if (req.body.notes) visitedLandmark.notes = req.body.notes;
        if (req.body.rating) visitedLandmark.rating = req.body.rating;
        if (req.body.visited_date) visitedLandmark.visited_date = req.body.visited_date;

        const updatedVisit = await visitedLandmark.save();
        const populatedVisit = await VisitedLandmark.findById(updatedVisit._id)
            .populate('landmark_id');
        res.json(populatedVisit);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE visited landmark
router.delete('/:id', async (req, res) => {
    try {
        const visitedLandmark = await VisitedLandmark.findOne({
            _id: req.params.id,
            user: req.user.id
        });
        
        if (!visitedLandmark) return res.status(404).json({ message: 'Visit record not found' });
        
        await VisitedLandmark.deleteOne({ _id: req.params.id, user: req.user.id });
        res.json({ message: 'Visit record deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;