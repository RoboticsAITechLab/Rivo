# Form Architecture & Unsaved Changes

This document details the standardized form handling, validation mechanisms, and unsaved changes protection system used across `apps/web`.

---

## 1. Form Validation Architecture

Forms are built using **React Hook Form** paired with **Zod** schema validation:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const profileSchema = z.object({
  schoolName: z.string().min(3, 'School name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Valid 10-digit phone number required'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
```

- **Instant Inline Feedback**: Validation errors surface directly below the invalid input field upon blur or submit attempt.
- **Controlled vs Uncontrolled**: Form inputs use controlled React Hook Form `Controller` components when wrapping custom primitives like `Select`, `Switch`, or `DateRangePicker`.

---

## 2. Unsaved Changes Guard (`useUnsavedChanges`)

To prevent accidental data loss in configuration workflows, forms integrate with `useUnsavedChanges`:

```typescript
const { isDirty, markDirty, markClean, confirmNavigation } = useUnsavedChanges({
  initialValues: currentSettings,
  currentValues: formState,
});
```

### Protection Behaviors
1. **Dynamic Save Bar**: A sticky bar slides in from the bottom of the viewport as soon as `isDirty = true`, presenting **Save Changes** and **Discard** buttons.
2. **In-App Navigation Interception**: Clicking sidebar links while dirty halts navigation and opens the `UnsavedChangesDialog`.
3. **Browser Window Unload**: Subscribes to the native `beforeunload` browser event, displaying a native warning dialog if the user attempts to close the browser tab.
