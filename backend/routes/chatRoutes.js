const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { sendChat } = require("../controllers/chatController");
router.post("/send", auth, sendChat);
module.exports = router;
