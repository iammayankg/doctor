const request = require('supertest');
const app = require('../index');
const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, '../uploads');
const annotationsDir = path.join(__dirname, '../annotations');

// Helper to clean up directories
const cleanup = () => {
  if (fs.existsSync(uploadsDir)) {
    fs.rmSync(uploadsDir, { recursive: true, force: true });
  }
  if (fs.existsSync(annotationsDir)) {
    fs.rmSync(annotationsDir, { recursive: true, force: true });
  }
};

beforeEach(() => {
  cleanup();
  // Ensure directories exist before each test
  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.mkdirSync(annotationsDir, { recursive: true });
});

afterAll(() => {
  cleanup();
});

describe('File Upload API', () => {
  it('POST /upload - should upload a file and return the file path', async () => {
    const filePath = path.join(__dirname, 'test.pdf');
    fs.writeFileSync(filePath, 'dummy pdf content');

    const res = await request(app)
      .post('/upload')
      .attach('file', filePath);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('filePath', '/uploads/test.pdf');

    // Check if file exists on server
    expect(fs.existsSync(path.join(uploadsDir, 'test.pdf'))).toBe(true);

    // Clean up the test file
    fs.unlinkSync(filePath);
  });
});

describe('Annotations API', () => {
  const pdfFileName = 'sample.pdf';
  const annotationFilePath = path.join(annotationsDir, 'sample.json');

  it('POST /annotations - should save annotations for a PDF file', async () => {
    const annotations = {
      "1": [{ "x": 10, "y": 20, "width": 100, "height": 50 }]
    };

    const res = await request(app)
      .post('/annotations')
      .send({
        pdfFile: pdfFileName,
        annotations: annotations,
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Annotations saved');

    // Verify the file was created with the correct content
    expect(fs.existsSync(annotationFilePath)).toBe(true);
    const savedAnnotations = JSON.parse(fs.readFileSync(annotationFilePath, 'utf8'));
    expect(savedAnnotations).toEqual(annotations);
  });

  it('GET /annotations/:pdfFile - should retrieve annotations for a PDF file', async () => {
    const annotations = {
      "1": [{ "x": 10, "y": 20, "width": 100, "height": 50 }]
    };
    fs.writeFileSync(annotationFilePath, JSON.stringify(annotations));

    const res = await request(app).get(`/annotations/${pdfFileName}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(annotations);
  });

  it('GET /annotations/:pdfFile - should return 404 if annotations are not found', async () => {
    const res = await request(app).get('/annotations/nonexistent.pdf');
    expect(res.statusCode).toEqual(404);
    expect(res.body).toHaveProperty('message', 'Annotations not found');
  });
});