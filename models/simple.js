const mongoose = require('mongoose');

// Simple Pi Status Schema
const piStatusSchema = new mongoose.Schema({
  piId: { type: String, required: true, index: true },
  temperature: Number,
  cameraOk: Boolean,
  isOnline: { type: Boolean, default: true },
  lastSeen: { type: Date, default: Date.now, index: true },
  uptime: Number
}, { timestamps: true });

// TTL index - keep data for 7 days
piStatusSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

// Simple Alert Schema
const alertSchema = new mongoose.Schema({
  piId: { type: String, required: true, index: true },
  type: { type: String, enum: ['temperature', 'offline', 'camera'], required: true },
  message: String,
  severity: { type: String, enum: ['low', 'high', 'critical'], default: 'low' },
  resolved: { type: Boolean, default: false }
}, { timestamps: true });

// TTL index - keep alerts for 3 days
alertSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3 * 24 * 60 * 60 });

module.exports = {
  PiStatus: mongoose.model('PiStatus', piStatusSchema),
  Alert: mongoose.model('Alert', alertSchema)
};
