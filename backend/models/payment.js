const mongoose = require('mongoose');

const paymentDistributionSchema = new mongoose.Schema({
  milestone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Milestone',
    required: true
  },
  amount: {
    type: Number,
    required: true
  }
});

const paymentSchema = new mongoose.Schema({
  distributions: {
    type: [paymentDistributionSchema],
    default: []
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
    enum: ['EFECTIVO', 'TRANSFERENCIA_BANCARIA', 'BIZUM', 'PAYPAL'],
    default: 'TRANSFERENCIA_BANCARIA'
  },
  type: {
    type: String,
    enum: ['SINGLE', 'DISTRIBUTED'],
    default: 'SINGLE'
  },
  milestone: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Milestone',
    required: function() {
      return this.type === 'SINGLE';
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', paymentSchema); 