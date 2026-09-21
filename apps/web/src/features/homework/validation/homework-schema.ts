import { z } from 'zod';

export const homeworkFormSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(120, 'Title cannot exceed 120 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description cannot exceed 2000 characters'),
  classId: z.string().min(1, 'Class is required'),
  sectionId: z.string().min(1, 'Section is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  teacherId: z.string().min(1, 'Teacher is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH']),
  notifyStudents: z.boolean().default(true),
  attachments: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      size: z.string(),
      type: z.string(),
    })
  ).default([]),
});

export type HomeworkFormValues = z.infer<typeof homeworkFormSchema>;
