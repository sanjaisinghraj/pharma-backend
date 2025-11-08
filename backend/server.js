require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const queryRoutes = require('./routes/queryRoutes');

const app = express();

const allowedOrigins = [
  'https://your-solution.space'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/pharmaintel';

mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(()=> console.log('MongoDB connected'))
    .catch((err)=> console.error('MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/query', queryRoutes);
app.get('/api/health', (req,res)=> res.json({status: 'ok'}));

app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));
