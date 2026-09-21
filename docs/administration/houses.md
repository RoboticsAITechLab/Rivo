# Houses Administration

The Houses module (`/school/settings/academic/houses`) manages the school's pastoral and co-curricular house system.

---

## 1. Strictly Optional Policy

The house system in Rivo is **completely optional**:

- No student enrollment or academic operation is blocked if a house is unassigned.
- Institutions that do not practice a house system can leave this configuration uninitialized with zero negative operational impacts.
- Students may have `houseId = null`.

---

## 2. House Entity Attributes

| Field Name | Description | Constraints |
| :--- | :--- | :--- |
| **House Name** | Title of the house (e.g., Red House, Eagles, Tagore) | Required, unique within school |
| **House Code** | Short identifier | Required |
| **House Color** | Hex color code or color identifier for UI badges | Optional |
| **House Mentor / Master**| Faculty member leading the house | Optional teacher reference |
| **Status** | Lifecycle state | `ACTIVE` or `INACTIVE` |

---

## 3. Co-Curricular & Reporting Usage

- **Student 360 View**: Displays the student's assigned house crest/color tag.
- **Directory Filtering**: Allows sports coordinators to filter student cohorts by house for intramural competitions and pastoral activities.
