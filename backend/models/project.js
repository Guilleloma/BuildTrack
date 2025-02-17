const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  totalBudget: {
    type: Number,
    default: 0
  },
  startDate: Date,
  endDate: Date,
  status: {
    type: String,
    enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
    default: 'ACTIVE'
  },
  userId: {
    type: String,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Ensure userId is indexed for faster queries
projectSchema.index({ userId: 1 });

module.exports = mongoose.model('Project', projectSchema); 