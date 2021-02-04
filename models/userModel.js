const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { default: validator } = require('validator');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    username:{
        type:"string",
        required:["true","Enter Username"],
        unique:true
    },
    email:{
        type:"string",
        required:["true","Enter Email"],
        unique:true,
        validate: [validator.isEmail,'Enter A Valid Email']
    },
    password:{
        type:"string",
        required:["true","Enter Password"],
        minlength:8,
        select:false,
    },
    confirmPassword:{
        type:"string",
        required:["true","Confirm Password"],
        minlength:8,
        validate: {
            validator: function(el){
                return el === this.password;
            }
        },
        message:'Passwords do not match',
    },
    photo:String,
    passwordResetToken:String,
});

userSchema.pre('save',async function(next){
    if(!this.isModified('password')){
        return next();
    }
    this.password = await bcrypt.hash(this.password,12);
    this.confirmPassword = undefined;
    next();
});

userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    return resetToken;
  };
const User = mongoose.model('user',userSchema);

module.exports = User;