const fs = require("fs");
const config = require("config");
const File = require("../models/File");
const fileService = require("../services/fileService");
const User = require("../models/User");

class FileController {
  async createDir(req, res) {
    try {
      const { name, type, parent } = req.body;
      const file = new File({ name, type, parent, user: req.user.id });

      const parentFile = await File.findOne({ _id: parent });
      if (!parentFile) {
        file.path = name;
        await fileService.createDir(file);
      } else {
        file.path = `${parentFile.path}\\${file.name}`;
        await fileService.createDir(file);
        parentFile.childs.push(file._id);
        await parentFile.save();
      }
      await file.save();
      res.status(200).json(file);
    } catch (error) {
      console.log(error);
      return res.status(400).json({ message: "Server error!" });
    }
  }

  async getFiles(req, res) {
    try {
      const files = await File.find({
        user: req.user.id,
        parent: req.query.parent,
      });
      return res.status(200).json(files);
    } catch (error) {
      return res.status(500).json({ message: "Cannot get files" });
    }
  }

  async uploadFile(req, res) {
    try {
      const file = req.files.file;

      const parent = await File.findOne({
        user: req.user.id,
        _id: req.body.parent,
      });

      const user = await User.findOne({ _id: req.user.id });

      if (user.usedSpace + file.size > user.diskSpace) {
        return res
          .status(400)
          .json({ message: "There are no space on the disk" });
      }

      user.usedSpace = user.usedSpace + file.size;

      let path;
      if (parent) {
        path = `${config.get("filePath")}\\${user._id}\\${parent.path}\\${
          file.name
        }`;
      } else {
        path = `${config.get("filePath")}\\${user._id}\\${file.name}`;
      }

      if (fs.existsSync(path)) {
        return res.status(400).json({ message: "File already exist" });
      }
      file.mv(path);

      const type = file.name.split(".").pop();
      let filePath = file.name;
      if (parent) {
        filePath = parent.path + "\\" + file.name;
      }

      const dbFile = new File({
        name: file.name,
        size: file.size,
        type,
        parent: parent?._id,
        path: filePath,
        user: user._id,
      });

      await dbFile.save();
      await user.save();

      res.status(200).json(dbFile);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: " Server error" });
    }
  }

  async deleteFile(req, res) {
    try {
      const file = await File.findOne({ _id: req.query.id, user: req.user.id });
      if (!file) {
        return res.status(400).json({ message: "file not found" });
      }
      fileService.deleteFile(file);
      await file.remove();
      return res.status(400).json({ message: "File was deleted" });
    } catch (error) {
      console.log(error);
      return res.status(400).json({ message: "Dir is not empty" });
    }
  }
}

module.exports = new FileController();
