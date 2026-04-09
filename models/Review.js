const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customerName: { type: String, required: true },
  rating:     { type: Number, required: true, min: 1, max: 5 },
  text:       { type: String, required: true, maxlength: 500 },
  isDummy:    { type: Boolean, default: false }
}, { timestamps: true });

// One review per customer per provider
reviewSchema.index({ providerId: 1, customerId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
