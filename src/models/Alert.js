const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  piId: {
    type: String,
    required: true,
    index: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['temperature', 'offline', 'camera'],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  severity: {
    type: String,
    enum: ['low', 'high', 'critical'],
    default: 'low',
  },
  resolved: {
    type: Boolean,
    default: false,
  },
  resolvedAt: {
    type: Date,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
}, {
  timestamps: true,
});

// Compound indexes for queries
alertSchema.index({ piId: 1, createdAt: -1 });
alertSchema.index({ type: 1, piId: 1, createdAt: -1 });
alertSchema.index({ resolved: 1, createdAt: -1 });

// TTL index - keep alerts for 30 days
alertSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

// Static method to check if similar alert exists recently (for deduplication)
alertSchema.statics.findRecentSimilar = async function(piId, type, windowMs = 300000) {
  const cutoffTime = new Date(Date.now() - windowMs);
  return this.findOne({
    piId,
    type,
    resolved: false,
    createdAt: { $gte: cutoffTime },
  }).sort({ createdAt: -1 });
};

// Instance method to resolve alert
alertSchema.methods.resolveAlert = async function() {
  this.resolved = true;
  this.resolvedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Alert', alertSchema);
