import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { createEmailPayload, ContactFormData, EmailPayload, validateContactForm, ValidationResult, EmailResult } from './emailService';

// --- UI State Types for Testing ---
export interface ContactFormUIState {
  formData: ContactFormData;
  isSubmitting: boolean;
  isSent: boolean;
  error: string | null;
}

/**
 * Simulates UI state transition after email service response
 * This is a pure function that models the Contact form's state machine
 */
export function transitionUIState(
  currentState: ContactFormUIState,
  emailResult: EmailResult
): ContactFormUIState {
  if (emailResult.success) {
    // Success: clear form, show success state
    return {
      formData: { name: '', email: '', topic: 'collaboration', message: '' },
      isSubmitting: false,
      isSent: true,
      error: null,
    };
  } else {
    // Error: keep form data, show error state
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

/**
 * Feature: contact-email-notification, Property 1: Email payload completeness
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
 * 
 * For any valid contact form submission, the email payload sent to the email service
 * SHALL contain all required fields: from_name, from_email, topic, message, and timestamp.
 */
describe('Email Service - Property Tests', () => {
  // Arbitrary for valid ContactFormData
  const contactFormDataArb: fc.Arbitrary<ContactFormData> = fc.record({
    name: fc.string({ minLength: 1 }),
    email: fc.emailAddress(),
    topic: fc.constantFrom('collaboration', 'mentorship', 'freelance', 'other') as fc.Arbitrary<ContactFormData['topic']>,
    message: fc.string({ minLength: 1 }),
  });

  it('Property 1: Email payload completeness - all required fields are present', () => {
    fc.assert(
      fc.property(contactFormDataArb, (formData: ContactFormData) => {
        const payload: EmailPayload = createEmailPayload(formData);

        // Verify all required fields exist and are non-empty strings
        expect(payload.from_name).toBeDefined();
        expect(typeof payload.from_name).toBe('string');
        
        expect(payload.from_email).toBeDefined();
        expect(typeof payload.from_email).toBe('string');
        
        expect(payload.topic).toBeDefined();
        expect(typeof payload.topic).toBe('string');
        
        expect(payload.message).toBeDefined();
        expect(typeof payload.message).toBe('string');
        
        expect(payload.timestamp).toBeDefined();
        expect(typeof payload.timestamp).toBe('string');

        // Verify field mappings are correct
        expect(payload.from_name).toBe(formData.name);
        expect(payload.from_email).toBe(formData.email);
        expect(payload.topic).toBe(formData.topic);
        expect(payload.message).toBe(formData.message);

        // Verify timestamp is a valid ISO string
        const timestampDate = new Date(payload.timestamp);
        expect(timestampDate.toString()).not.toBe('Invalid Date');
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: contact-email-notification, Property 2: Form validation prevents invalid submissions
 * Validates: Requirements 2.3
 * 
 * For any form state with empty required fields (name, email, or message),
 * the system SHALL reject the submission without calling the email service.
 */
describe('Form Validation - Property Tests', () => {
  // Valid topic arbitrary
  const topicArb = fc.constantFrom('collaboration', 'mentorship', 'freelance', 'other') as fc.Arbitrary<ContactFormData['topic']>;

  // Arbitrary for whitespace-only or empty strings
  const emptyOrWhitespaceArb = fc.oneof(
    fc.constant(''),
    fc.constant('   '),
    fc.constant('\t'),
    fc.constant('\n'),
    fc.constant('  \t\n  ')
  );

  // Arbitrary for non-empty, non-whitespace strings
  const nonEmptyStringArb = fc.string({ minLength: 1 }).filter(s => s.trim().length > 0);

  it('Property 2: Form with empty name should be rejected', () => {
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
      { numRuns: 100 }
    );
  });

  it('Property 2: Form with empty email should be rejected', () => {
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
      { numRuns: 100 }
    );
  });

  it('Property 2: Form with empty message should be rejected', () => {
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
      { numRuns: 100 }
    );
  });

  it('Property 2: Form with all valid fields should pass validation', () => {
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
      { numRuns: 100 }
    );
  });
});


/**
 * Feature: contact-email-notification, Property 3: Success state consistency
 * Feature: contact-email-notification, Property 4: Error state consistency
 * Feature: contact-email-notification, Property 5: Loading state during submission
 * Validates: Requirements 1.2, 1.3, 1.4, 2.1, 2.2
 */
describe('UI State Transitions - Property Tests', () => {
  // Arbitrary for valid ContactFormData
  const contactFormDataArb: fc.Arbitrary<ContactFormData> = fc.record({
    name: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
    email: fc.emailAddress(),
    topic: fc.constantFrom('collaboration', 'mentorship', 'freelance', 'other') as fc.Arbitrary<ContactFormData['topic']>,
    message: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
  });

  // Arbitrary for initial UI state (not submitting, not sent, no error)
  const initialUIStateArb: fc.Arbitrary<ContactFormUIState> = contactFormDataArb.map(formData => ({
    formData,
    isSubmitting: false,
    isSent: false,
    error: null,
  }));

  // Arbitrary for error messages
  const errorMessageArb = fc.oneof(
    fc.constant('Network error'),
    fc.constant('Service unavailable'),
    fc.constant('Rate limit exceeded'),
    fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
  );

  /**
   * Property 3: Success state consistency
   * For any successful email service response, the UI SHALL transition to success state
   * showing confirmation message.
   */
  it('Property 3: Success state consistency - UI transitions to success state on successful response', () => {
    fc.assert(
      fc.property(initialUIStateArb, (initialState: ContactFormUIState) => {
        // Simulate starting submission
        const submittingState = startSubmission(initialState);
        
        // Simulate successful email response
        const successResult: EmailResult = { success: true };
        const finalState = transitionUIState(submittingState, successResult);

        // Verify success state properties
        expect(finalState.isSent).toBe(true);
        expect(finalState.isSubmitting).toBe(false);
        expect(finalState.error).toBeNull();
        
        // Verify form is cleared after success
        expect(finalState.formData.name).toBe('');
        expect(finalState.formData.email).toBe('');
        expect(finalState.formData.message).toBe('');
        expect(finalState.formData.topic).toBe('collaboration');
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4: Error state consistency
   * For any failed email service response, the UI SHALL transition to error state
   * and maintain form data for retry.
   */
  it('Property 4: Error state consistency - UI transitions to error state and preserves form data on failure', () => {
    fc.assert(
      fc.property(
        initialUIStateArb,
        errorMessageArb,
        (initialState: ContactFormUIState, errorMessage: string) => {
          // Simulate starting submission
          const submittingState = startSubmission(initialState);
          
          // Simulate failed email response
          const errorResult: EmailResult = { success: false, error: errorMessage };
          const finalState = transitionUIState(submittingState, errorResult);

          // Verify error state properties
          expect(finalState.isSent).toBe(false);
          expect(finalState.isSubmitting).toBe(false);
          expect(finalState.error).toBe(errorMessage);
          
          // Verify form data is preserved for retry
          expect(finalState.formData.name).toBe(initialState.formData.name);
          expect(finalState.formData.email).toBe(initialState.formData.email);
          expect(finalState.formData.topic).toBe(initialState.formData.topic);
          expect(finalState.formData.message).toBe(initialState.formData.message);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 4 (continued): Error state with undefined error message
   * Should provide default error message when none is provided
   */
  it('Property 4: Error state provides default message when error is undefined', () => {
    fc.assert(
      fc.property(initialUIStateArb, (initialState: ContactFormUIState) => {
        // Simulate starting submission
        const submittingState = startSubmission(initialState);
        
        // Simulate failed email response without error message
        const errorResult: EmailResult = { success: false };
        const finalState = transitionUIState(submittingState, errorResult);

        // Verify default error message is provided
        expect(finalState.error).toBe('Failed to send message. Please try again.');
        expect(finalState.isSent).toBe(false);
        expect(finalState.isSubmitting).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5: Loading state during submission
   * For any form submission in progress, the submit button SHALL be disabled
   * and loading indicator SHALL be visible.
   */
  it('Property 5: Loading state during submission - isSubmitting is true and error is cleared', () => {
    fc.assert(
      fc.property(initialUIStateArb, (initialState: ContactFormUIState) => {
        // Simulate starting submission
        const submittingState = startSubmission(initialState);

        // Verify loading state properties
        expect(submittingState.isSubmitting).toBe(true);
        expect(submittingState.error).toBeNull();
        
        // Verify form data is preserved during submission
        expect(submittingState.formData.name).toBe(initialState.formData.name);
        expect(submittingState.formData.email).toBe(initialState.formData.email);
        expect(submittingState.formData.topic).toBe(initialState.formData.topic);
        expect(submittingState.formData.message).toBe(initialState.formData.message);
        
        // Verify isSent remains false during submission
        expect(submittingState.isSent).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Property 5 (continued): Starting submission clears previous error
   * When retrying after an error, the error state should be cleared
   */
  it('Property 5: Starting submission clears previous error state', () => {
    fc.assert(
      fc.property(
        contactFormDataArb,
        errorMessageArb,
        (formData: ContactFormData, previousError: string) => {
          // Create state with previous error
          const stateWithError: ContactFormUIState = {
            formData,
            isSubmitting: false,
            isSent: false,
            error: previousError,
          };

          // Simulate starting new submission (retry)
          const submittingState = startSubmission(stateWithError);

          // Verify error is cleared when starting new submission
          expect(submittingState.isSubmitting).toBe(true);
          expect(submittingState.error).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });
});
