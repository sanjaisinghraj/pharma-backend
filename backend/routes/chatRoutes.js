// backend/routes/chatRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/chatController");

router.get("/list", auth, ctrl.list);
router.post("/new", auth, ctrl.newChat);
router.get("/:id", auth, ctrl.getChat);
router.post("/send", auth, ctrl.sendChat);
router.post("/:id/pdf", auth, ctrl.pdf);

module.exports = router;
