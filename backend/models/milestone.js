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
    default: 0,
    get: v => parseFloat(v.toFixed(2))
  },
  paidAmount: {
    type: Number,
    required: true,
    default: 0,
    get: v => parseFloat(v.toFixed(2))
  },
  hasTax: {
    type: Boolean,
    default: true
  },
  taxRate: {
    type: Number,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID'],
    default: 'UNPAID'
  }
}, {
  timestamps: true,
  toJSON: { getters: true }
});

// Virtual for total amount with tax
milestoneSchema.virtual('totalWithTax').get(function() {
  if (!this.hasTax) return parseFloat(this.budget.toFixed(2));
  const taxRate = this.taxRate || 21; // Default to 21% if not specified
  return parseFloat((this.budget * (1 + taxRate / 100)).toFixed(2));
});

// Virtual for remaining amount with tax
milestoneSchema.virtual('remainingWithTax').get(function() {
  if (!this.hasTax) {
    return parseFloat((this.budget - this.paidAmount).toFixed(2));
  }
  const taxRate = this.taxRate || 21;
  const totalWithTax = this.budget * (1 + taxRate / 100);
  return parseFloat((totalWithTax - this.paidAmount).toFixed(2));
});

module.exports = mongoose.model('Milestone', milestoneSchema); 