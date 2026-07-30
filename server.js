const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const uploadsDir = path.join(__dirname, "uploads");
const metadataFile = path.join(uploadsDir, "lessons.json");

fs.mkdirSync(uploadsDir, { recursive: true });

function readLessons() {
  try {
    return JSON.parse(fs.readFileSync(metadataFile, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") console.error("Khong the doc metadata:", error);
    return [];
  }
}

function writeLessons(lessons) {
  const tempFile = `${metadataFile}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(lessons, null, 2));
  fs.renameSync(tempFile, metadataFile);
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadsDir),
  filename: (_req, _file, callback) => callback(null, `${crypto.randomUUID()}.pdf`),
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const isPdf = file.mimetype === "application/pdf" && path.extname(file.originalname).toLowerCase() === ".pdf";
    callback(isPdf ? null : new Error("Chi chap nhan tep PDF."), isPdf);
  },
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(uploadsDir, {
  setHeaders: (res, filePath) => {
    if (path.extname(filePath) === ".pdf") {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "inline");
    }
  },
}));

app.get("/api/lessons", (_req, res) => {
  const lessons = readLessons().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(lessons);
});

app.post("/api/lessons", (req, res) => {
  upload.single("pdf")(req, res, (error) => {
    if (error) {
      const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      return res.status(status).json({ message: error.code === "LIMIT_FILE_SIZE" ? "Tep vuot qua gioi han 50 MB." : error.message });
    }

    if (!req.file) return res.status(400).json({ message: "Vui long chon mot tep PDF." });

    const fd = fs.openSync(req.file.path, "r");
    const signature = Buffer.alloc(5);
    fs.readSync(fd, signature, 0, 5, 0);
    fs.closeSync(fd);

    if (signature.toString() !== "%PDF-") {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "Tep tai len khong phai PDF hop le." });
    }

    const fallbackTitle = path.basename(req.file.originalname, path.extname(req.file.originalname));
    const title = String(req.body.title || fallbackTitle).trim().slice(0, 120) || fallbackTitle;
    const lesson = {
      id: path.basename(req.file.filename, ".pdf"),
      title,
      originalName: req.file.originalname,
      filename: req.file.filename,
      size: req.file.size,
      createdAt: new Date().toISOString(),
      url: `/uploads/${encodeURIComponent(req.file.filename)}`,
    };

    const lessons = readLessons();
    lessons.push(lesson);
    writeLessons(lessons);
    return res.status(201).json(lesson);
  });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Da co loi xay ra. Vui long thu lai." });
});

app.listen(PORT, () => {
  console.log(`SlideShelf dang chay tai http://localhost:${PORT}`);
});
