import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ContactFormData, validateContactForm, ValidationResult, EmailResult } from './emailService';

// --- UI State Types for Testing ---
export interface ContactFormUIState {
  formData: ContactFormData;
  isSubmitting: boolean;
  isSent: boolean;
  error: string | null;
}

/**
 * Simulates UI state transition after email service response
 */
export function transitionUIState(
  currentState: ContactFormUIState,
  emailResult: EmailResult
): ContactFormUIState {
  if (emailResult.success) {
    return {
      formData: { name: '', email: '', topic: 'collaboration', message: '' },
      isSubmitting: false,
      isSent: true,
      error: null,
    };
  } else {
    return {
      formData: currentState.formData,
      isSubmitting: false,
      isSent: false,
      error: emailResult.error || 'Failed to send message. Please try again.',
    };
  }
}

/**
 * Simulates UI state when submission starts
 */
export function startSubmission(currentState: ContactFormUIState): ContactFormUIState {
  return {
    ...currentState,
    isSubmitting: true,
    error: null,
  };
}

describe('Form Validation - Property Tests', () => {
  const topicArb = fc.constantFrom('collaboration', 'mentorship', 'freelance', 'other') as fc.Arbitrary<ContactFormData['topic']>;
  const emptyOrWhitespaceArb = fc.oneof(
    fc.constant(''),
    fc.constant('   '),
    fc.constant('\t'),
    fc.constant('\n')
  );
  const nonEmptyStringArb = fc.string({ minLength: 1 }).filter(s => s.trim().length > 0);

  it('Property: Form with empty name should be rejected', () => {
    fc.assert(
      fc.property(
        emptyOrWhitespaceArb,
        fc.emailAddress(),
        topicArb,
        nonEmptyStringArb,
        (name, email, topic, message) => {
          const formData: ContactFormData = { name, email, topic, message };
          const result: ValidationResult = validateContactForm(formData);
          expect(result.isValid).toBe(false);
          expect(result.errors).toContain('Name is required');
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property: Form with empty email should be rejected', () => {
    fc.assert(
      fc.property(
        nonEmptyStringArb,
        emptyOrWhitespaceArb,
        topicArb,
        nonEmptyStringArb,
        (name, email, topic, message) => {
          const formData: ContactFormData = { name, email, topic, message };
          const result: ValidationResult = validateContactForm(formData);
          expect(result.isValid).toBe(false);
          expect(result.errors).toContain('Email is required');
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property: Form with empty message should be rejected', () => {
    fc.assert(
      fc.property(
        nonEmptyStringArb,
        fc.emailAddress(),
        topicArb,
        emptyOrWhitespaceArb,
        (name, email, topic, message) => {
          const formData: ContactFormData = { name, email, topic, message };
          const result: ValidationResult = validateContactForm(formData);
          expect(result.isValid).toBe(false);
          expect(result.errors).toContain('Message is required');
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property: Form with all valid fields should pass validation', () => {
    fc.assert(
      fc.property(
        nonEmptyStringArb,
        fc.emailAddress(),
        topicArb,
        nonEmptyStringArb,
        (name, email, topic, message) => {
          const formData: ContactFormData = { name, email, topic, message };
          const result: ValidationResult = validateContactForm(formData);
          expect(result.isValid).toBe(true);
          expect(result.errors).toHaveLength(0);
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('UI State Transitions - Property Tests', () => {
  const contactFormDataArb: fc.Arbitrary<ContactFormData> = fc.record({
    name: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
    email: fc.emailAddress(),
    topic: fc.constantFrom('collaboration', 'mentorship', 'freelance', 'other') as fc.Arbitrary<ContactFormData['topic']>,
    message: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
  });

  const initialUIStateArb: fc.Arbitrary<ContactFormUIState> = contactFormDataArb.map(formData => ({
    formData,
    isSubmitting: false,
    isSent: false,
    error: null,
  }));

  const errorMessageArb = fc.oneof(
    fc.constant('Network error'),
    fc.constant('Service unavailable'),
    fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
  );

  it('Property: Success state - UI transitions correctly on success', () => {
    fc.assert(
      fc.property(initialUIStateArb, (initialState: ContactFormUIState) => {
        const submittingState = startSubmission(initialState);
        const successResult: EmailResult = { success: true };
        const finalState = transitionUIState(submittingState, successResult);

        expect(finalState.isSent).toBe(true);
        expect(finalState.isSubmitting).toBe(false);
        expect(finalState.error).toBeNull();
        expect(finalState.formData.name).toBe('');
      }),
      { numRuns: 50 }
    );
  });

  it('Property: Error state - UI preserves form data on failure', () => {
    fc.assert(
      fc.property(
        initialUIStateArb,
        errorMessageArb,
        (initialState: ContactFormUIState, errorMessage: string) => {
          const submittingState = startSubmission(initialState);
          const errorResult: EmailResult = { success: false, error: errorMessage };
          const finalState = transitionUIState(submittingState, errorResult);

          expect(finalState.isSent).toBe(false);
          expect(finalState.isSubmitting).toBe(false);
          expect(finalState.error).toBe(errorMessage);
          expect(finalState.formData.name).toBe(initialState.formData.name);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('Property: Loading state - isSubmitting is true during submission', () => {
    fc.assert(
      fc.property(initialUIStateArb, (initialState: ContactFormUIState) => {
        const submittingState = startSubmission(initialState);

        expect(submittingState.isSubmitting).toBe(true);
        expect(submittingState.error).toBeNull();
        expect(submittingState.formData.name).toBe(initialState.formData.name);
      }),
      { numRuns: 50 }
    );
  });
});
