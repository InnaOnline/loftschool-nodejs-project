const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    date: {
        type: Date,
        default: new Date()
    },
    text: {
        type: String,
        default: ''
    },
    title: {
        type: String,
        default: ''
    },
    userId: {
        type: String,
        required: true
    },
});

const News = module.exports = mongoose.model('News', schema);
