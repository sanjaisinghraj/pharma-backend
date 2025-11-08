const express = require('express');
const router = express.Router();
const queryController = require('../controllers/queryController');
const jwt = require('jsonwebtoken');

function authMiddleware(req,res,next){
    const header = req.headers['authorization'];
    if(!header) return res.status(401).json({error: 'no token'});
    const token = header.split(' ')[1];
    try{
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'change_this_secret');
        req.user = payload;
        next();
    }catch(e){
        return res.status(401).json({error: 'invalid token'});
    }
}

router.post('/run', authMiddleware, queryController.runQuery);
router.get('/history', authMiddleware, queryController.history);

module.exports = router;
