const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { promisify } = require('util');
const sendEmail = require('./../email');
const crypto = require('crypto');   

exports.signUp = (req, res)=>{
    res.status(200).send('<h3> SignUp </h3>');
}

exports.createUser = async (req,res)=>{
    try{
        const user = await User.create(req.body);
        let token; 
        token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        res.status(201).json({
            user:user,
            token
        });
    } catch(err){
        console.log(err);
        res.status(400).json({
            message:"err",
            err
        })
    }
}

exports.logIn = (req, res)=>{
    res.status(200).send('<h3> LogIn </h3>');
}

exports.login = async (req,res) => {
    const { username , password } = req.body;
    console.log(req.body);
    if(!req.body.username || !req.body.password){
        res.status(400).json({
            message:"Enter All Details",
        });
    }
    let user;
    try{
        user = await User.findOne({username}).select('+password');
        const flag = await bcrypt.compare(password,user.password);
        if(!flag){
            throw new Error({message:"test"});
        }
        let token; 
        token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        
        res.status(201).json({
            token
        });
    } catch(err){
        res.status(404).json({
            message:"Username or Password Incorrect",
            err:err
        });
    }
}
exports.logOut = (req, res)=>{
    res.status(200).send('<h3> LogOut </h3>');
}

exports.forgotPassword = async (req,res) =>{
    if(!req.body.username){
        res.status(400).json({
            message:"Username not found",
        });
    }
    let user;

    try{
        user = await User.findOne({username:req.body.username});
        const token = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false }); 
        await sendEmail({
            email: user.email,
            subject:'Reset password',
            message : `Your token is ${token}`,
        });

        res.status(201).json({
            message:"mail sent",
        })

    } catch(err){
        if(user){
            user.passwordResetToken = undefined;
            await user.save({ validateBeforeSave: false }); 
        }
        res.status(400).json({
            message:"Username not found or Email not sent",
            err:err
        });
    }
}

exports.resetPassword = async (req,res) => {
    const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
    console.log(hashedToken);

    try{
        const user = await User.findOne({passwordResetToken: hashedToken});
        console.log(user);
        
        user.password = req.body.password;
        user.confirmPassword = req.body.passwordConfirm;
        user.passwordResetToken = undefined;
        await user.save();
        token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        res.status(201).json({
            token
        });


    } catch(err){
        res.status(400).json({
            err:err
        });
    } 
}

exports.protect = async (req,res) =>{
    console.log(req.headers.authorization.startsWith('Bearer') === true);
    console.log(!req.headers.authorization);
    if(!req.headers.authorization || !req.headers.authorization.startsWith('Bearer')){
        console.log('err');
        res.status(400).json({
            message:"Please Login In"
        });
    }else{
        const token = req.headers.authorization.split(' ')[1];
        try{
            const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
            const user = await User.findById(decode.id);
            console.log(user);
            res.status(200).json({
                message:"Hii"
            });
        } catch(err){
            res.status(200).json({
                message:"Invalid User"
            });
        }
    }
};