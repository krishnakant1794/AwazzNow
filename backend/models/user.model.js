
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto'; 

const userSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true, 
    },
    email: {
      type: String,
      required: true,
      unique: true, 
    },
    password: {
      type: String,
      required: true,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true, 
  }
);


userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next(); 
  }

  const salt = await bcrypt.genSalt(10); 
  this.password = await bcrypt.hash(this.password, salt); 
});


userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};


userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex'); 

  
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; 

  return resetToken; 
};

const User = mongoose.model('User', userSchema);

export default User;

