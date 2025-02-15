const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  totalBudget: {
    type: Number,
    required: true,
    default: 0
  },
  startDate: Date,
  endDate: Date,
  status: {
    type: String,
    enum: ['ACTIVE', 'COMPLETED', 'ON_HOLD'],
    default: 'ACTIVE'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Project', projectSchema); 