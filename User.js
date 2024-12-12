const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  userName: { type: String, unique: true, required: true }, // Correct field name
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  loginHistory: [
    {
      dateTime: { type: Date, default: Date.now },
      userAgent: { type: String }
    }
  ]
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('User', userSchema);
