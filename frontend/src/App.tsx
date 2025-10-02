import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { pdfjs, Document, Page } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface Annotation {
  x: number;
  y: number;
  width: number;
  height: number;
}

type AnnotationsMap = { [page: number]: Annotation[] };

const PageAnnotationCanvas: React.FC<{
  pageNumber: number;
  annotations: Annotation[];
  onNewAnnotation: (annotation: Annotation) => void;
  pageDimensions: { width: number; height: number };
}> = ({ pageNumber, annotations, onNewAnnotation, pageDimensions }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);

  const drawAnnotations = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.strokeStyle = 'red';
        context.lineWidth = 2;
        annotations.forEach(ann => {
          context.strokeRect(ann.x, ann.y, ann.width, ann.height);
        });
      }
    }
  }, [annotations]);

  useEffect(() => {
    drawAnnotations();
  }, [annotations, pageDimensions, drawAnnotations]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setStartPoint({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setDrawing(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing || !startPoint) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      const width = currentX - startPoint.x;
      const height = currentY - startPoint.y;

      const canvas = canvasRef.current;
      if (canvas) {
        const context = canvas.getContext('2d');
        if (context) {
          context.clearRect(0, 0, canvas.width, canvas.height);
          drawAnnotations(); // Redraw existing annotations
          context.strokeRect(startPoint.x, startPoint.y, width, height);
        }
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing || !startPoint) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const endX = e.clientX - rect.left;
      const endY = e.clientY - rect.top;
      const newAnnotation: Annotation = {
        x: Math.min(startPoint.x, endX),
        y: Math.min(startPoint.y, endY),
        width: Math.abs(endX - startPoint.x),
        height: Math.abs(endY - startPoint.y),
      };
      onNewAnnotation(newAnnotation);
    }
    setDrawing(false);
    setStartPoint(null);
  };

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', top: 0, left: 0, zIndex: 10 }}
      width={pageDimensions.width}
      height={pageDimensions.height}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    />
  );
};

const App: React.FC = () => {
  const [pdfFile, setPdfFile] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<AnnotationsMap>({});
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageDimensions, setPageDimensions] = useState<{ [page: number]: { width: number, height: number } }>({});

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const response = await axios.post('http://localhost:3001/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setPdfFile(`http://localhost:3001${response.data.filePath}`);
        setAnnotations({});
        setPageDimensions({});
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }
  };

  const loadAnnotations = async (pdfFilePath: string) => {
    try {
      const response = await axios.get(`http://localhost:3001/annotations/${encodeURIComponent(pdfFilePath.split('/').pop() || '')}`);
      setAnnotations(response.data || {});
    } catch (error) {
      console.error('No annotations found or error loading them', error);
      setAnnotations({});
    }
  };

  useEffect(() => {
    if (pdfFile) {
      loadAnnotations(pdfFile);
    }
  }, [pdfFile]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const onPageRenderSuccess = (page: any) => {
    setPageDimensions(prev => ({
      ...prev,
      [page.pageNumber]: { width: page.width, height: page.height }
    }));
  };

  const handleNewAnnotation = (pageNumber: number, annotation: Annotation) => {
    setAnnotations(prev => ({
      ...prev,
      [pageNumber]: [...(prev[pageNumber] || []), annotation],
    }));
  };

  const handleExport = async () => {
    if (pdfFile) {
      try {
        await axios.post('http://localhost:3001/annotations', {
          pdfFile: pdfFile.split('/').pop(),
          annotations,
        });
        alert('Annotations exported!');
      } catch (error) {
        console.error("Error exporting annotations:", error);
      }
    }
  };

  const handleAnnotationFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const newAnnotations = JSON.parse(event.target?.result as string);
          setAnnotations(newAnnotations);
        } catch (error) {
          console.error("Error parsing annotation file:", error);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <h1>PDF Annotator</h1>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      {pdfFile && (
        <div style={{ margin: '20px', border: '1px solid #ccc' }}>
          <Document file={pdfFile} onLoadSuccess={onDocumentLoadSuccess}>
            {Array.from(new Array(numPages), (el, index) => {
              const pageNumber = index + 1;
              return (
                <div key={`page_wrapper_${pageNumber}`} style={{ position: 'relative', marginBottom: '10px' }}>
                  <Page
                    pageNumber={pageNumber}
                    onSuccess={onPageRenderSuccess}
                  />
                  {pageDimensions[pageNumber] && (
                    <PageAnnotationCanvas
                      pageNumber={pageNumber}
                      annotations={annotations[pageNumber] || []}
                      onNewAnnotation={(ann) => handleNewAnnotation(pageNumber, ann)}
                      pageDimensions={pageDimensions[pageNumber]}
                    />
                  )}
                </div>
              );
            })}
          </Document>
        </div>
      )}
      {pdfFile && (
        <div>
          <button onClick={handleExport}>Export Annotations</button>
          <input type="file" accept="application/json" onChange={handleAnnotationFileChange} style={{ marginLeft: '10px' }} />
        </div>
      )}
    </div>
  );
};

export default App;