const mongoose = require('mongoose');

const visitedLandmarkSchema = new mongoose.Schema({
    landmark_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Landmark',
        required: true
    },
    visited_date: {
        type: Date,
        default: Date.now
    },
    visitor_name: {
        type: String,
        required: true
    },
    notes: {
        type: String,
        default: ''
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        default: 5
    }
});

module.exports = mongoose.model('VisitedLandmark', visitedLandmarkSchema); 