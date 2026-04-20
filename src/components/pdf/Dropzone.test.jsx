import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dropzone } from './Dropzone';

describe('Dropzone', () => {
  it('renders correctly with default text', () => {
    render(<Dropzone onFilesSelected={vi.fn()} />);
    expect(screen.getByText('Click to upload')).toBeInTheDocument();
    expect(screen.getByText('PDF Files Only')).toBeInTheDocument();
  });

  it('renders custom text and hintText', () => {
    render(
      <Dropzone 
        onFilesSelected={vi.fn()} 
        text="Upload image" 
        hintText="JPG/PNG only" 
      />
    );
    expect(screen.getByText('Upload image')).toBeInTheDocument();
    expect(screen.getByText('JPG/PNG only')).toBeInTheDocument();
  });

  it('calls onFilesSelected when file is selected via input', async () => {
    const handleFiles = vi.fn();
    const { container } = render(<Dropzone onFilesSelected={handleFiles} />);
    
    const input = container.querySelector('input[type="file"]');
    const file = new File(['hello'], 'hello.pdf', { type: 'application/pdf' });
    
    await userEvent.upload(input, file);
    
    expect(handleFiles).toHaveBeenCalledTimes(1);
    expect(handleFiles).toHaveBeenCalledWith(expect.arrayContaining([file]));
  });

  it('handles drag and drop events to trigger onFilesSelected', () => {
    const handleFiles = vi.fn();
    const { container } = render(<Dropzone onFilesSelected={handleFiles} />);
    
    const dropzone = container.firstChild;
    
    // Test drag over (styling changes)
    fireEvent.dragOver(dropzone);
    expect(dropzone.className).toMatch(/border-white bg-white\/5/);
    
    // Test drag leave (styling reverts)
    fireEvent.dragLeave(dropzone);
    expect(dropzone.className).toMatch(/border-white\/20 bg-zinc-900\/30/);
    
    const file = new File(['hello'], 'test.pdf', { type: 'application/pdf' });
    const clearData = vi.fn();
    
    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file],
        clearData,
      }
    });
    
    expect(handleFiles).toHaveBeenCalledTimes(1);
    expect(handleFiles).toHaveBeenCalledWith([file]);
    expect(clearData).toHaveBeenCalledTimes(1);
  });

  it('is completely disabled and ignores events when disabled prop is true', () => {
    const handleFiles = vi.fn();
    const { container } = render(<Dropzone onFilesSelected={handleFiles} disabled />);
    
    const dropzone = container.firstChild;
    const input = container.querySelector('input[type="file"]');
    
    expect(dropzone).toHaveClass('opacity-50');
    expect(dropzone).toHaveClass('cursor-not-allowed');
    expect(input).toBeDisabled();
    
    // Try dropping a file
    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [new File([''], 'test.pdf')],
        clearData: vi.fn(),
      }
    });
    
    expect(handleFiles).not.toHaveBeenCalled();
  });
});
