import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { HabitTracker } from '../components/HabitTracker';

describe('HabitTracker', () => {
  it('renders initial habits', () => {
    render(<HabitTracker />);
    expect(screen.getByText('Drink Water')).toBeInTheDocument();
    expect(screen.getByText('Read 20 Mins')).toBeInTheDocument();
  });

  it('adds a new habit', () => {
    render(<HabitTracker />);
    const input = screen.getByPlaceholderText('New habit...');
    const buttons = screen.getAllByRole('button');
    const submitBtn = buttons[buttons.length - 1]; // The last button is the form submit button

    fireEvent.change(input, { target: { value: 'Code for 1 hour' } });
    fireEvent.click(submitBtn);

    expect(screen.getByText('Code for 1 hour')).toBeInTheDocument();
  });
});
