const express = require('express');
const router = express.Router();
const Settings = require('../models/settings');

// GET settings
router.get('/', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT update settings
router.put('/', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    if (req.body.defaultTaxRate !== undefined) {
      if (req.body.defaultTaxRate < 0 || req.body.defaultTaxRate > 100) {
        return res.status(400).json({ message: 'Tax rate must be between 0 and 100' });
      }
      settings.defaultTaxRate = req.body.defaultTaxRate;
    }

    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 