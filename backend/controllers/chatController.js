const Conversation = require('../models/Conversation');
const PDFDocument = require('pdfkit');

/** Create a new conversation (empty) */
exports.startConversation = async (req,res) => {
  const conv = await Conversation.create({
    userId: req.user._id,
    title: req.body.title || 'New chat',
    messages:[]
  });
  res.json({ id: conv._id, title: conv.title, createdAt: conv.createdAt });
};

/** Append a message (user or AI) */
exports.addMessage = async (req,res) => {
  const { convId } = req.params;
  const { role, text } = req.body;

  if(!role || !text) return res.status(400).json({error:'role & text required'});

  const conv = await Conversation.findOne({ _id: convId, userId: req.user._id });
  if(!conv) return res.status(404).json({error:'Not found'});

  conv.messages.push({ role, text });
  // first user message becomes title if still default
  if(conv.title === 'New chat' && role==='user') conv.title = text.slice(0,60);
  await conv.save();

  res.json({ ok:true });
};

/** Get a conversation */
exports.getConversation = async (req,res) => {
  const { convId } = req.params;
  const conv = await Conversation.findOne({ _id: convId, userId: req.user._id });
  if(!conv) return res.status(404).json({error:'Not found'});
  res.json(conv);
};

/** List user conversations (latest first) */
exports.listConversations = async (req,res) => {
  const list = await Conversation
    .find({ userId: req.user._id })
    .sort({ updatedAt:-1 })
    .select('_id title updatedAt createdAt');
  res.json(list);
};

/** Generate a PDF for a conversation */
exports.pdfConversation = async (req,res) => {
  const { convId } = req.params;
  const conv = await Conversation.findOne({ _id: convId, userId: req.user._id });
  if(!conv) return res.status(404).json({error:'Not found'});

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="conversation-${convId}.pdf"`);

  const doc = new PDFDocument({ margin:40 });
  doc.pipe(res);
  doc.fontSize(16).text(conv.title, {underline:true});
  doc.moveDown();

  conv.messages.forEach(m=>{
    doc.fontSize(12).fillColor(m.role==='user' ? '#0b5ed7' : '#111');
    doc.text(`${m.role.toUpperCase()} · ${new Date(m.ts).toLocaleString()}`);
    doc.fillColor('#000').text(m.text);
    doc.moveDown(0.8);
  });

  doc.end();
};
