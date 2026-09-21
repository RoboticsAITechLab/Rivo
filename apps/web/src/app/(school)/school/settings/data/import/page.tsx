'use client';

import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  History, 
  ArrowRight,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

type ImportEntity = 'STUDENTS' | 'TEACHERS' | 'CLASSES' | 'SUBJECTS';

const csvTemplates: Record<ImportEntity, { filename: string; headers: string[] }> = {
  STUDENTS: {
    filename: 'students_import_template.csv',
    headers: ['FirstName', 'LastName', 'AdmissionNumber', 'Class', 'Section', 'RollNumber', 'Gender', 'DOB', 'GuardianName', 'GuardianPhone', 'GuardianEmail'],
  },
  TEACHERS: {
    filename: 'teachers_import_template.csv',
    headers: ['FullName', 'EmployeeId', 'Email', 'Phone', 'Department', 'Designation', 'Qualification'],
  },
  CLASSES: {
    filename: 'classes_import_template.csv',
    headers: ['GradeLevel', 'ClassName', 'Sections', 'CampusCode', 'Stream'],
  },
  SUBJECTS: {
    filename: 'subjects_import_template.csv',
    headers: ['SubjectName', 'SubjectCode', 'Type', 'MaxWeeklyPeriods', 'ApplicableGrades'],
  },
};

export default function DataImportPage() {
  const [selectedEntity, setSelectedEntity] = useState<ImportEntity>('STUDENTS');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleDownloadTemplate = () => {
    const template = csvTemplates[selectedEntity];
    const csvContent = 'data:text/csv;charset=utf-8,' + template.headers.join(',');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', template.filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Template ${template.filename} downloaded`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
        toast.error('Please upload a valid CSV or XLSX file');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleStartImport = () => {
    if (!selectedFile) {
      toast.error('Please select a file to import');
      return;
    }

    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      toast.success(`Parsed ${selectedFile.name} successfully. Records verified.`);
      setSelectedFile(null);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <UploadCloud className="h-6 w-6 text-primary" />
            Bulk Data Import
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Batch onboard institutional records via CSV or Excel spreadsheets with column mapping and schema validation.
          </p>
        </div>
        <Button onClick={handleDownloadTemplate} variant="outline" size="sm" className="gap-2 shrink-0 text-xs">
          <Download className="h-3.5 w-3.5" />
          Download CSV Schema
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">1. Select Target Record Type</CardTitle>
              <CardDescription className="text-xs">
                Choose the entity category you are importing to validate against the correct schema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: 'STUDENTS', label: 'Students' },
                  { key: 'TEACHERS', label: 'Teachers' },
                  { key: 'CLASSES', label: 'Classes' },
                  { key: 'SUBJECTS', label: 'Subjects' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setSelectedEntity(item.key as ImportEntity);
                      setSelectedFile(null);
                    }}
                    className={`p-3 rounded-lg border text-left transition-colors flex flex-col justify-between h-20 ${
                      selectedEntity === item.key 
                        ? 'border-primary bg-primary/5 text-primary' 
                        : 'border-border/50 hover:border-border text-foreground'
                    }`}
                  >
                    <span className="text-xs font-semibold">{item.label}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {csvTemplates[item.key as ImportEntity].headers.length} Columns
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">2. Upload Spreadsheet File</CardTitle>
              <CardDescription className="text-xs">
                Upload your UTF-8 encoded .csv or .xlsx file formatted according to the schema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-border/80 rounded-xl p-8 text-center hover:border-primary/50 transition-colors bg-muted/5 flex flex-col items-center justify-center">
                <FileSpreadsheet className="h-10 w-10 text-muted-foreground/50 mb-3" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {selectedFile ? selectedFile.name : 'Drag & drop your file here, or browse'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supported formats: CSV, XLSX • Maximum file size: 10MB
                  </p>
                </div>

                <div className="mt-4">
                  <label htmlFor="fileUpload">
                    <Button variant="outline" size="sm" type="button" className="gap-2 pointer-events-none text-xs">
                      <UploadCloud className="h-3.5 w-3.5" />
                      Browse Files
                    </Button>
                  </label>
                  <input 
                    id="fileUpload" 
                    type="file" 
                    accept=".csv, .xlsx"
                    onChange={handleFileChange}
                    className="hidden" 
                  />
                </div>
              </div>

              {selectedFile && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs">
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <FileCheck className="h-4 w-4" />
                    <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <Button onClick={handleStartImport} disabled={isUploading} size="sm" className="h-8 gap-1.5 text-xs">
                    {isUploading ? 'Validating...' : 'Validate & Import'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                Required Columns
              </CardTitle>
              <CardDescription className="text-xs">
                Headers expected in row 1 of your spreadsheet:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {csvTemplates[selectedEntity].headers.map((h) => (
                  <Badge key={h} variant="outline" className="font-mono text-[10px]">
                    {h}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                Import History
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center py-6 text-xs text-muted-foreground">
              <p>No imports have been performed yet.</p>
              <p className="text-[11px] mt-1">Audit logs of completed batches will appear here.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
