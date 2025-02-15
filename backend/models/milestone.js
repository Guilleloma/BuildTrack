const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  dueDate: Date,
  budget: {
    type: Number,
    required: true,
    default: 0
  },
  paidAmount: {
    type: Number,
    required: true,
    default: 0
  },
  status: {
    type: String,
    enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID'],
    default: 'UNPAID'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Milestone', milestoneSchema); 