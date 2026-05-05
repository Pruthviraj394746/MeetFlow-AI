const mongoose = require('mongoose');

const ActionItemSchema = new mongoose.Schema({
  meetingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting',
    required: true
  },
  task: {
    type: String,
    required: true
  },
  assignee: {
    type: String,
    default: 'Unassigned'
  },
  deadline: {
    type: String,
    default: 'No deadline'
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ActionItem', ActionItemSchema);
