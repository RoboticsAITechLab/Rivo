'use client';

import React, { useState } from 'react';
import { useSchoolStore } from '@/shared/mock-store/school-store';
import { 
  DownloadCloud, 
  FileSpreadsheet, 
  FileJson, 
  CheckSquare, 
  Square, 
  Download,
  Database,
  Calendar
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

type ExportDataset = 'STUDENTS' | 'CLASSES' | 'SUBJECTS' | 'TEACHERS' | 'SCHEDULES' | 'EXAMS';

export default function DataExportPage() {
  const store = useSchoolStore();

  const [selectedDatasets, setSelectedDatasets] = useState<ExportDataset[]>([
    'STUDENTS',
    'CLASSES',
    'SUBJECTS',
  ]);
  const [format, setFormat] = useState<'JSON' | 'CSV'>('JSON');
  const [isExporting, setIsExporting] = useState(false);

  const toggleDataset = (dataset: ExportDataset) => {
    setSelectedDatasets(prev => 
      prev.includes(dataset) 
        ? prev.filter(d => d !== dataset)
        : [...prev, dataset]
    );
  };

  const handleExport = () => {
    if (selectedDatasets.length === 0) {
      toast.error('Please select at least one dataset to export');
      return;
    }

    setIsExporting(true);

    setTimeout(() => {
      const exportPayload: Record<string, any> = {};

      if (selectedDatasets.includes('STUDENTS')) exportPayload.students = store.students;
      if (selectedDatasets.includes('CLASSES')) exportPayload.classes = store.classes;
      if (selectedDatasets.includes('SUBJECTS')) exportPayload.subjects = store.subjects;
      if (selectedDatasets.includes('TEACHERS')) exportPayload.teachers = store.teachers;
      if (selectedDatasets.includes('SCHEDULES')) exportPayload.schedules = store.schedules;
      if (selectedDatasets.includes('EXAMS')) exportPayload.exams = store.exams;

      if (format === 'JSON') {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
          JSON.stringify(exportPayload, null, 2)
        )}`;
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', jsonString);
        downloadAnchor.setAttribute('download', `rivo_school_export_${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      } else {
        // Flatten into CSV lines
        let csvContent = 'data:text/csv;charset=utf-8,';
        csvContent += 'Dataset,TotalRecords,ExportDate\n';
        Object.entries(exportPayload).forEach(([key, items]) => {
          csvContent += `${key},${Array.isArray(items) ? items.length : 1},${new Date().toISOString()}\n`;
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `rivo_summary_export_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      setIsExporting(false);
      toast.success('Institutional archive generated and downloaded');
    }, 800);
  };

  const datasetMetrics: { key: ExportDataset; label: string; count: number; desc: string }[] = [
    { key: 'STUDENTS', label: 'Students Directory', count: store.students.length, desc: 'Enrolled students, biodata, contact and class associations' },
    { key: 'CLASSES', label: 'Classes & Sections', count: store.classes.length, desc: 'Grades, sections, and room allocations' },
    { key: 'SUBJECTS', label: 'Subjects Catalog', count: store.subjects.length, desc: 'Academic courses, codes, and credit hours' },
    { key: 'TEACHERS', label: 'Faculty & Instructors', count: store.teachers.length, desc: 'Staff directory and subject authorizations' },
    { key: 'SCHEDULES', label: 'Period Schedules', count: store.schedules.length, desc: 'Daily bell schedules and period blocks' },
    { key: 'EXAMS', label: 'Examinations Records', count: store.exams.length, desc: 'Exams, paper date sheets, and result data' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <DownloadCloud className="h-6 w-6 text-primary" />
            Institutional Data Export
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate secure, compliant backups or migration bundles of your school's current database state.
          </p>
        </div>
        <Button onClick={handleExport} disabled={isExporting} className="gap-2 shrink-0">
          <Download className="h-4 w-4" />
          {isExporting ? 'Generating Bundle...' : 'Download Export Bundle'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Select Modules to Export</CardTitle>
              <CardDescription className="text-xs">
                Pick the institutional datasets to bundle into your export archive.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {datasetMetrics.map((item) => {
                const isSelected = selectedDatasets.includes(item.key);
                return (
                  <div
                    key={item.key}
                    onClick={() => toggleDataset(item.key)}
                    className={`flex items-center justify-between p-3.5 rounded-lg border transition-colors cursor-pointer ${
                      isSelected 
                        ? 'border-primary/60 bg-primary/5' 
                        : 'border-border/40 hover:bg-muted/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1 rounded ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                        {isSelected ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-sm font-medium text-foreground">{item.label}</div>
                        <div className="text-xs text-muted-foreground">{item.desc}</div>
                      </div>
                    </div>

                    <Badge variant="outline" className="font-mono text-xs font-semibold">
                      {item.count} Records
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Export Format</CardTitle>
              <CardDescription className="text-xs">
                Choose serialization format for downstream ingestion or compliance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="formatSelect">File Format</Label>
                <Select value={format} onValueChange={(val: any) => setFormat(val)}>
                  <SelectTrigger id="formatSelect">
                    <SelectValue placeholder="Format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JSON">Full JSON Archive (Nested Schema)</SelectItem>
                    <SelectItem value="CSV">CSV Summary Archive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 rounded-lg border border-border/40 bg-muted/20 text-xs space-y-1">
                <div className="font-semibold text-foreground">Data Confidentiality</div>
                <p className="text-muted-foreground">
                  Exports contain active student & staff metadata. Keep exported archives secure in compliance with privacy guidelines.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
