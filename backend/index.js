const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../frontend/dist')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

app.post('/upload', upload.single('file'), (req, res) => {
  res.json({ filePath: `/uploads/${req.file.originalname}` });
});

app.post('/annotations', (req, res) => {
  const { pdfFile, annotations } = req.body;
  const annotationsDir = 'annotations/';
  if (!fs.existsSync(annotationsDir)) {
    fs.mkdirSync(annotationsDir);
  }
  const filePath = path.join(annotationsDir, `${path.basename(pdfFile, '.pdf')}.json`);
  fs.writeFileSync(filePath, JSON.stringify(annotations, null, 2));
  res.json({ message: 'Annotations saved' });
});

app.get('/annotations/:pdfFile', (req, res) => {
  const { pdfFile } = req.params;
  const filePath = path.join('annotations/', `${path.basename(pdfFile, '.pdf')}.json`);
  if (fs.existsSync(filePath)) {
    res.sendFile(path.resolve(filePath));
  } else {
    res.status(404).json({ message: 'Annotations not found' });
  }
});

// Catch-all route to serve the frontend's index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
  });
}

module.exports = app;