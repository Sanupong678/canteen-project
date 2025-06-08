import mongoose from 'mongoose';

const loginSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'shop'],
    required: true
  },
  loginTime: {
    type: Date,
    default: Date.now
  },
  logoutTime: {
    type: Date,
    default: null
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'logged_out'],
    default: 'active'
  },
  token: {
    type: String,
    required: true
  },
  deviceInfo: {
    userAgent: String,
    platform: String,
    browser: String
  }
});

const Login = mongoose.model('Login', loginSchema);

export default Login; 