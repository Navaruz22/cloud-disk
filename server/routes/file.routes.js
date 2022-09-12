const { Router } = require("express");
const fileController = require("../controllers/fileController");
const authMiddleware = require("../middlewares/authMiddleware");
const router = new Router();

router.post("/create", authMiddleware, fileController.createDir);
router.get("/get", authMiddleware, fileController.getFiles);
router.post("/upload", authMiddleware, fileController.uploadFile);
router.delete("/delete", authMiddleware, fileController.deleteFile);

module.exports = router;
