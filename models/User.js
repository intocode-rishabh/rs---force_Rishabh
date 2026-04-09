const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:            { type: String, required: true, trim: true },
  email:           { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:        { type: String, required: true },
  role:            { type: String, enum: ['customer', 'provider'], required: true },
  profession:      { type: String, default: null },  // only for providers
  username:        { type: String, unique: true, sparse: true, trim: true },
  about:           { type: String, default: '' },
  location:        { type: String, default: '' },
  hourlyRate:      { type: Number, default: null },
  profilePic:      { type: String, default: null },
  contacts: {
    whatsapp:  { type: String, default: null },
    instagram: { type: String, default: null },
    twitter:   { type: String, default: null }
  },
  profileComplete: { type: Boolean, default: false },
  avgRating:       { type: Number, default: null },
  isDummy:         { type: Boolean, default: false }  // flag for seed data
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Never return password
userSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
