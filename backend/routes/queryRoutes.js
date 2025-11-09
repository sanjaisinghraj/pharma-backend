// backend/routes/queryRoutes.js
const router = require("express").Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/queryController");

router.post("/run", auth, ctrl.run);
router.get("/history", auth, ctrl.history);

module.exports = router;
