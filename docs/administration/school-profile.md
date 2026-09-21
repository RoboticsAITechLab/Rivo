# School Profile Administration

The School Profile configuration (`/school/settings/general/profile`) establishes the global institutional identity for the school. It dictates the metadata displayed on student admit cards, formal marksheets, document print headers, and portal titles.

---

## 1. Profile Attributes

| Field Name | Type | Validation / Constraints | Operational Purpose |
| :--- | :--- | :--- | :--- |
| **School Name** | Text | Required; 3-100 characters | Legal title of the institution. Appears on all formal printouts. |
| **Short Name** | Text | Required; 2-20 characters | Abbreviated institutional acronym used in navigation headers. |
| **School Code** | Text | Required; Alphanumeric | Canonical identifier registered with educational authorities. |
| **Affiliation** | Text | Optional | Board affiliation details (e.g., CBSE, ICSE, State Board, Cambridge). |
| **Registration Number** | Text | Optional | Formal government or trust registration code. |
| **Official Phone** | Tel | Valid phone number format | Main switchboard contact printed on school letterheads. |
| **Official Email** | Email | Valid RFC email address | Formal school correspondence address. |
| **Website** | URL | Valid URL | Public institutional web address. |
| **Address** | Textarea | Required | Physical street address of the headquarters / main administrative building. |
| **City, State, PIN** | Text | Required | Geographic jurisdiction and postal indexing code. |

---

## 2. Branding & Document Assets

Located at `/school/settings/general/branding`:
- **Primary Logo**: Vector or PNG transparent file used in the main application navbar and report headers.
- **Secondary Logo / Seal**: Official institutional crest rendered on certificates and formal examination admit cards.
- **Authorized Signature**: Digital signature specimen of the Principal or Controller of Examinations printed onto validated marksheets.
- **Document Header & Footer**: Legal header text, tax identification, and disclaimer strings configured for automated PDF exports.

---

## 3. Unsaved Changes & State Handling

- Changes are tracked via `useUnsavedChanges`.
- Navigating away with modified fields triggers a confirmation warning modal: *"You have unsaved configuration changes."*
- Empty profile states: If the profile is uninitialized, an attention banner prompts the administrator to complete profile setup before configuring academic sessions.
