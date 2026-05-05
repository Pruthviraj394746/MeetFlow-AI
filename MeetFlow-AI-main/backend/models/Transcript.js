const mongoose = require('mongoose');

const TranscriptSchema = new mongoose.Schema({
  meetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting',
    required: true
  },
  speaker: {
    type: String,
    required: true,
    default: 'Speaker 1'
  },
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transcript', TranscriptSchema);
