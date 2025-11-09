const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user','ai','note'], required: true },
  text: { type: String, required: true },
  ts: { type: Date, default: Date.now }
});

const ConversationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref:'User', required: true },
  title: { type: String, default: 'New chat' },
  messages: [MessageSchema]
}, { timestamps: true });

module.exports = mongoose.model('Conversation', ConversationSchema);
