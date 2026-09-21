# Form Validation & Unsaved Changes Troubleshooting

This guide addresses form behavior, validation errors, and unsaved changes modals.

---

## 1. Unsaved Changes Guard

### Issue: "Unsaved Changes" Dialog Appears Unexpectedly
- **Cause**: An input field was modified (dirty state) and the user attempted to click a navigation link.
- **Resolution**:
  - Click **Save Changes** in the bottom floating save bar before navigating away.
  - Or click **Discard Changes** to intentionally revert to previous values.

---

## 2. Validation Field Errors

### Issue: Submit Button Does Not Respond
- **Cause**: One or more fields have failed Zod schema validation (often scrolled out of the current viewport).
- **Resolution**:
  1. Scroll through the entire form to locate input fields with red borders or helper error messages.
  2. Common omissions include:
     - Missing required National ID proof in Student Admission.
     - End Date prior to Start Date in Academic Session.
     - Invalid email address format.

### Issue: Duplicate Student Dialog Blocks Submission
- **Cause**: The combination of First Name, Last Name, Date of Birth, and Primary Guardian Phone matches an existing student record.
- **Resolution**:
  1. Inspect the matched student profile presented in the modal.
  2. If the student is already enrolled, cancel the duplicate intake and update the existing profile instead.
  3. If it is an intentional separate enrollment, confirm the override in the dialog.
