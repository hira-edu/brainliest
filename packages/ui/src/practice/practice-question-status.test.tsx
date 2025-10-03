import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PracticeQuestionStatus } from './practice-question-status';

describe('PracticeQuestionStatus', () => {
  it('renders alert with provided message', () => {
    render(<PracticeQuestionStatus message="Correct answer" variant="success" />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Correct answer');
  });

  it('renders title and description when supplied', () => {
    render(
      <PracticeQuestionStatus
        variant="warning"
        title="Review the solution"
        description="Compare your response with the correct steps."
      />
    );

    expect(screen.getByText('Review the solution')).toBeInTheDocument();
    expect(screen.getByText('Compare your response with the correct steps.')).toBeInTheDocument();
  });

  it('returns null when no content is provided', () => {
    const { container } = render(<PracticeQuestionStatus />);

    expect(container.firstChild).toBeNull();
  });
});
