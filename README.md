# PDF Annotation Application

This is a web application that allows users to upload a PDF document, render it in the browser, draw bounding box annotations, and export/import these annotations.

## Project Structure

The repository is structured as a monorepo with two main directories:

-   `backend/`: A Node.js and Express application that handles:
    -   PDF file uploads.
    -   Storing and retrieving annotation data.
    -   Serving the frontend application.
-   `frontend/`: A React with TypeScript application built with Vite that provides the user interface for:
    -   Uploading and rendering PDFs.
    -   Drawing bounding boxes on the PDF.
    -   Exporting annotations to a JSON file.
    -   Importing annotations from a JSON file.

## Prerequisites

-   Docker
-   Node.js and npm (for local development)

## How to Build and Run

The application is containerized using Docker. To build and run the application, follow these steps:

1.  **Build the Docker image:**

    ```bash
    docker build -t pdf-annotator .
    ```

2.  **Run the Docker container:**

    ```bash
    docker run -p 3001:3001 pdf-annotator
    ```

    The application will be accessible at [http://localhost:3001](http://localhost:3001).

## Local Development

### Backend

To run the backend locally:

```bash
cd backend
npm install
npm start
```

The backend server will start on `http://localhost:3001`.

### Frontend

To run the frontend locally:

```bash
cd frontend
npm install
npm run dev
```

The frontend development server will start on a different port (usually `http://localhost:5173`). The frontend is configured to make API requests to the backend at `http://localhost:3001`.

## Testing

### Backend

To run the backend tests:

```bash
cd backend
npm test
```

### Frontend

To run the frontend tests (which use Vitest):

```bash
cd frontend
npm test
```