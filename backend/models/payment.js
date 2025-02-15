const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  milestone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Milestone',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: String,
  paymentDate: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['BANK_TRANSFER', 'CREDIT_CARD', 'CASH', 'OTHER'],
    default: 'BANK_TRANSFER'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema); 