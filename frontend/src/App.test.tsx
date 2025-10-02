import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import App from './App';
import axios from 'axios';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

// Mock react-pdf
vi.mock('react-pdf', async () => {
  const actual = await vi.importActual('react-pdf');
  return {
    ...actual,
    Document: vi.fn(({ onLoadSuccess, children }) => {
      onLoadSuccess({ numPages: 2 });
      return <div>{children}</div>;
    }),
    Page: vi.fn(({ pageNumber, onSuccess }) => {
      // Mock the onSuccess callback with some dimensions
      onSuccess({ width: 600, height: 800, pageNumber });
      return <div>Page {pageNumber}</div>;
    }),
  };
});


describe('App', () => {
  it('renders the main page with a title and file input', () => {
    render(<App />);
    expect(screen.getByText(/PDF Annotator/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/PDF Annotator/i)).toBeInTheDocument();
  });

  it('allows a user to upload a PDF and displays the document view', async () => {
    // Arrange
    mockedAxios.post.mockResolvedValue({
      data: { filePath: '/uploads/test.pdf' },
    });
    mockedAxios.get.mockResolvedValue({ data: {} }); // For annotations

    render(<App />);

    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/PDF Annotator/i);

    // Act
    await userEvent.upload(input, file);

    // Assert
    await waitFor(() => {
      // Check if the upload request was made
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:3001/upload',
        expect.any(FormData),
        expect.any(Object)
      );
    });

    // Check if the document and annotation tools are displayed
    await waitFor(() => {
        expect(screen.getByText('Page 1')).toBeInTheDocument();
        expect(screen.getByText('Page 2')).toBeInTheDocument();
        expect(screen.getByText('Export Annotations')).toBeInTheDocument();
    });
  });
});