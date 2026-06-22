import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActionModal } from '../components/ActionModal';

describe('ActionModal', () => {
  it('renders Loading state', () => {
    render(<ActionModal isOpen={true} onClose={vi.fn()} title="Test Task" content="" isLoading={true} />);
    expect(screen.getByText('Gemini is working on it...')).toBeInTheDocument();
  });

  it('calls onSaveDraft when Save draft button is clicked', () => {
    const onSaveDraft = vi.fn();
    render(<ActionModal isOpen={true} onClose={vi.fn()} title="Test Task" content="Some generated draft" isLoading={false} onSaveDraft={onSaveDraft} />);
    
    expect(screen.getByText(/Some generated draft/i)).toBeInTheDocument();
    
    const saveBtn = screen.getByText('Save draft to task');
    fireEvent.click(saveBtn);
    
    expect(onSaveDraft).toHaveBeenCalled();
  });
});
