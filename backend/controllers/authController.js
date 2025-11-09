// backend/controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');          // ⬅️ changed
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

exports.register = async (req,res)=>{
  try{
    const {name, email, password} = req.body;
    if(!email || !password) return res.status(400).json({error: 'missing fields'});
    const existing = await User.findOne({email});
    if(existing) return res.status(400).json({error: 'user exists'});
    const passwordHash = await bcrypt.hash(password, 10);  // works the same
    const user = new User({name, email, passwordHash});
    await user.save();
    return res.json({message: 'registered'});
  }catch(err){
    console.error(err);
    return res.status(500).json({error: 'server error'});
  }
};

exports.login = async (req,res)=>{
  try{
    const {email, password} = req.body;
    const user = await User.findOne({email});
    if(!user) return res.status(400).json({error: 'invalid credentials'});
    const match = await bcrypt.compare(password, user.passwordHash); // same
    if(!match) return res.status(400).json({error: 'invalid credentials'});
    const token = jwt.sign(
      {id: user._id, email: user.email, name: user.name, role: user.role},
      JWT_SECRET,
      {expiresIn: '8h'}
    );
    return res.json({token, user: {email: user.email, name: user.name, role: user.role}});
  }catch(err){
    console.error(err);
    return res.status(500).json({error: 'server error'});
  }
};
