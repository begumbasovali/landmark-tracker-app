const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    planned_date: {
        type: Date,
        required: true
    },
    end_date: {
        type: Date
    },
    notes: {
        type: String,
        default: ''
    },
    landmarks: [
        {
            landmark_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Landmark',
                required: true
            },
            notes: {
                type: String,
                default: ''
            }
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Plan', planSchema);