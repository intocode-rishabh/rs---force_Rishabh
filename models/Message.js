const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Conversation room = sorted pair of user IDs joined by '_'
  roomId:     { type: String, required: true, index: true },
  senderId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:       { type: String, required: true, maxlength: 1000 }
}, { timestamps: true });

// Helper to generate stable room ID from two user IDs
messageSchema.statics.roomId = function(id1, id2) {
  return [id1.toString(), id2.toString()].sort().join('_');
};

module.exports = mongoose.model('Message', messageSchema);
