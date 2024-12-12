const bcrypt = require('bcryptjs');
const User = require('./User');

function registerUser(userData) {
  return new Promise(async (resolve, reject) => {
    console.log('Register User Data:', userData); // Debug: Log input data
    try {
      const { userName, email, password } = userData;
      const user = new User({ userName, email, password });
      await user.save();
      resolve('User registered successfully.');
    } catch (err) {
      console.error('Register User Error:', err); // Debug: Log error
      if (err.code === 11000) {
        reject(new Error('Username or email already exists.'));
      } else {
        reject(new Error('Error registering the user.'));
      }
    }
  });
}



function checkUser(userData) {
  return new Promise(async (resolve, reject) => {
    try {
      const { userName, password, userAgent } = userData;
      const user = await User.findOne({ userName });
      if (!user) return reject('User not found.');

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) return reject('Incorrect password.');

      // Update login history
      user.loginHistory.push({ dateTime: new Date(), userAgent });
      await user.save();

      resolve(user);
    } catch (err) {
      reject('Error authenticating the user.');
    }
  });
}

module.exports = { registerUser, checkUser };
