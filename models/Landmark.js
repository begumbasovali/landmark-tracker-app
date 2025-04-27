const mongoose = require('mongoose');

const landmarkSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    location: {
        latitude: {
            type: Number,
            required: true
        },
        longitude: {
            type: Number,
            required: true
        }
    },
    description: {
        type: String,
        default: ''
    },
    category: {
        type: String,
        enum: ['historical', 'natural', 'cultural', 'other'],
        default: 'other'
    },
    notes: [{
        content: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Landmark', landmarkSchema);