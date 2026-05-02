const mongoose = require('mongoose');

const MeetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: 'Untitled Meeting'
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  },
  participants: [{
    type: String
  }],
  passcode: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date
  }
});

module.exports = mongoose.model('Meeting', MeetingSchema);
