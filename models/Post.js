const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName:    { type: String, required: true },
  profession:  { type: String, required: true },
  description: { type: String, required: true, maxlength: 280 },
  isDummy:     { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
