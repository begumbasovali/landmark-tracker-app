const express = require('express');
const router = express.Router();
const Plan = require('../models/Plan');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// GET all plans for the authenticated user
router.get('/', async (req, res) => {
    try {
        const plans = await Plan.find({ user: req.user.id })
            .populate({
                path: 'landmarks.landmark_id',
                model: 'Landmark'
            })
            .sort({ createdAt: -1 });
        res.json(plans);
    } catch (err) {
        console.error('Error fetching plans:', err);
        res.status(500).json({ message: 'Failed to fetch plans' });
    }
});

// GET specific plan
router.get('/:id', async (req, res) => {
    try {
        const plan = await Plan.findOne({ 
            _id: req.params.id,
            user: req.user.id
        }).populate({
            path: 'landmarks.landmark_id',
            model: 'Landmark'
        });

        if (!plan) return res.status(404).json({ message: 'Plan not found' });
        res.json(plan);
    } catch (err) {
        console.error('Error fetching plan:', err);
        res.status(500).json({ message: 'Failed to fetch plan' });
    }
});

// POST new plan
router.post('/', async (req, res) => {
    try {
        // Validate required fields
        if (!req.body.name) {
            return res.status(400).json({ message: 'Plan name is required' });
        }
        if (!req.body.planned_date) {
            return res.status(400).json({ message: 'Planned date is required' });
        }
        if (!req.body.landmarks || !req.body.landmarks.length) {
            return res.status(400).json({ message: 'At least one landmark must be selected' });
        }

        const plan = new Plan({
            user: req.user.id,
            name: req.body.name,
            planned_date: req.body.planned_date,
            end_date: req.body.end_date,
            notes: req.body.notes || '',
            landmarks: req.body.landmarks
        });

        const newPlan = await plan.save();
        
        // Populate landmarks for the response
        const populatedPlan = await Plan.findById(newPlan._id)
            .populate({
                path: 'landmarks.landmark_id',
                model: 'Landmark'
            });
            
        res.status(201).json(populatedPlan);
    } catch (err) {
        console.error('Error creating plan:', err);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ 
                message: 'Validation error',
                details: Object.values(err.errors).map(e => e.message)
            });
        }
        res.status(500).json({ message: 'Failed to create plan' });
    }
});

// PUT update plan
router.put('/:id', async (req, res) => {
    try {
        const plan = await Plan.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!plan) return res.status(404).json({ message: 'Plan not found' });

        // Update fields
        if (req.body.name) plan.name = req.body.name;
        if (req.body.planned_date) plan.planned_date = req.body.planned_date;
        if (req.body.end_date !== undefined) plan.end_date = req.body.end_date;
        if (req.body.notes !== undefined) plan.notes = req.body.notes;
        if (req.body.landmarks) plan.landmarks = req.body.landmarks;

        const updatedPlan = await plan.save();
        
        // Populate landmarks for the response
        const populatedPlan = await Plan.findById(updatedPlan._id)
            .populate({
                path: 'landmarks.landmark_id',
                model: 'Landmark'
            });
            
        res.json(populatedPlan);
    } catch (err) {
        console.error('Error updating plan:', err);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ 
                message: 'Validation error',
                details: Object.values(err.errors).map(e => e.message)
            });
        }
        res.status(500).json({ message: 'Failed to update plan' });
    }
});

// DELETE plan
router.delete('/:id', async (req, res) => {
    try {
        const plan = await Plan.findOne({
            _id: req.params.id,
            user: req.user.id
        });
        
        if (!plan) return res.status(404).json({ message: 'Plan not found' });
        
        await Plan.deleteOne({ _id: req.params.id, user: req.user.id });
        res.json({ message: 'Plan deleted successfully' });
    } catch (err) {
        console.error('Error deleting plan:', err);
        res.status(500).json({ message: 'Failed to delete plan' });
    }
});

module.exports = router;