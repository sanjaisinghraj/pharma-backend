// backend/routes/chatRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/chatController");

router.get("/history", auth, ctrl.history);
router.post("/new", auth, ctrl.newChat);
router.get("/:id", auth, ctrl.getChat);
router.post("/send", auth, ctrl.sendChat);

module.exports = router;
