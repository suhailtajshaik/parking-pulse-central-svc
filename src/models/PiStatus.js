const mongoose = require('mongoose');

const piStatusSchema = new mongoose.Schema({
  piId: {
    type: String,
    required: true,
    index: true,
    trim: true,
    minlength: 3,
    maxlength: 50,
  },
  temperatureC: {
    type: Number,
    min: -50,
    max: 150,
  },
  temperatureF: {
    type: Number,
    min: -58,
    max: 302,
  },
  cameraOk: {
    type: Boolean,
    required: true,
  },
  systemOnline: {
    type: Boolean,
    default: true,
  },
  isOnline: {
    type: Boolean,
    default: true,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
    index: true,
  },
  uptime: {
    type: Number,
    min: 0,
  },
  deviceTimestamp: {
    type: Number, // Unix timestamp in milliseconds from the device
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Compound index for common queries
piStatusSchema.index({ piId: 1, createdAt: -1 });

// TTL index - keep data for 7 days
piStatusSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

// Virtual for temperature consistency check
piStatusSchema.virtual('temperatureConsistent').get(function() {
  if (this.temperatureC && this.temperatureF) {
    const calculatedF = (this.temperatureC * 9/5) + 32;
    return Math.abs(calculatedF - this.temperatureF) < 1; // Allow 1 degree tolerance
  }
  return true;
});

// Instance method to check if device is online
piStatusSchema.methods.isDeviceOnline = function(timeoutMs = 120000) {
  return (Date.now() - this.lastSeen.getTime()) <= timeoutMs;
};

module.exports = mongoose.model('PiStatus', piStatusSchema);
