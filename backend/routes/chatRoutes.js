const router = require('express').Router();
const auth = require('../middleware/auth'); // you already have auth middleware
const ctrl = require('../controllers/chatController');

router.use(auth);

// POST /api/chat/start        → create conversation
router.post('/start', ctrl.startConversation);

// POST /api/chat/:convId/msg  → append message
router.post('/:convId/msg', ctrl.addMessage);

// GET  /api/chat/:convId      → get a conversation
router.get('/:convId', ctrl.getConversation);

// GET  /api/chat              → list conversations
router.get('/', ctrl.listConversations);

// GET  /api/chat/:convId/pdf  → download pdf
router.get('/:convId/pdf', ctrl.pdfConversation);

module.exports = router;
