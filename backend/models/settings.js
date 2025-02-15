const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  defaultTaxRate: {
    type: Number,
    required: true,
    default: 21, // Default Spanish IVA
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema); 