'use client';

import * as React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Download,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { StudentDetail } from '@/types/student';

interface StudentImportSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (newStudents: StudentDetail[]) => void;
}

type ImportStep = 1 | 2 | 3 | 4;

export function StudentImportSheet({
  isOpen,
  onClose,
  onImportComplete,
}: StudentImportSheetProps) {
  const [step, setStep] = React.useState<ImportStep>(1);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const selectedFileName = 'student_roster_template.csv';

  const handleClose = () => {
    setStep(1);
    setIsProcessing(false);
    onClose();
  };

  const handleSimulateFileSelect = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setStep(2);
    }, 600);
  };

  const handleProceedToImport = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onImportComplete([]);
      onClose();
    }, 500);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl overflow-y-auto p-4 sm:p-6"
      >
        <SheetHeader className="mb-3">
          <div className="flex items-center gap-2 text-primary">
            <Upload className="h-5 w-5" />
            <SheetTitle className="text-xl font-bold">Import Students</SheetTitle>
          </div>
          <SheetDescription className="text-xs text-muted-foreground">
            Bulk ingest student enrollment, guardian contacts, and class allocations via CSV or Excel.
          </SheetDescription>
        </SheetHeader>

        {/* 4 Steps Indicator */}
        <div className="grid grid-cols-4 gap-2 border-b pb-4 mb-4 text-xs font-semibold">
          {[
            { num: 1, label: 'Upload' },
            { num: 2, label: 'Preview' },
            { num: 3, label: 'Validation' },
            { num: 4, label: 'Import' },
          ].map((item) => (
            <div
              key={item.num}
              className={cn(
                'flex flex-col items-center gap-1 text-center pb-1 border-b-2 transition-colors',
                step === item.num
                  ? 'border-primary text-primary'
                  : step > item.num
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-muted-foreground',
              )}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold border border-current">
                {step > item.num ? '✓' : item.num}
              </span>
              <span className="text-[11px] hidden sm:inline">{item.label}</span>
            </div>
          ))}
        </div>

        {/* STEP 1: Upload */}
        {step === 1 && (
          <div className="space-y-4 text-xs">
            <div
              onClick={handleSimulateFileSelect}
              className="border-2 border-dashed border-border hover:border-primary/60 rounded-xl p-8 text-center cursor-pointer transition-colors bg-muted/20 hover:bg-muted/30 group"
            >
              <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                {isProcessing ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-6 w-6" />
                )}
              </div>
              <h4 className="mt-3 font-semibold text-foreground text-sm">
                Choose CSV or Excel file to upload
              </h4>
              <p className="text-muted-foreground text-[11px] mt-1 max-w-sm mx-auto">
                Drag and drop your structured spreadsheet, or browse your local file system (.csv, .xlsx)
              </p>
              <div className="mt-4">
                <Button size="sm" type="button" className="gap-1.5 pointer-events-none">
                  <Upload className="h-3.5 w-3.5" />
                  Select File
                </Button>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-3.5 flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="font-semibold text-foreground text-xs">Download CSV Template</p>
                <p className="text-[11px] text-muted-foreground">
                  Pre-configured headers with all required student & guardian fields
                </p>
              </div>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                <Download className="h-3.5 w-3.5" />
                Template
              </Button>
            </div>

            <div className="rounded-md bg-muted/40 p-3 text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">Note:</span> Frontend simulation preview. Real files are parsed locally without transmitting to external servers.
            </div>
          </div>
        )}

        {/* STEP 2: Preview */}
        {step === 2 && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-3">
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <p className="font-semibold text-foreground text-xs">{selectedFileName}</p>
                  <p className="text-[11px] text-muted-foreground">128 records detected • 48 KB</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-semibold">
                Parsed Successfully
              </span>
            </div>

            <div className="border rounded-md overflow-hidden">
              <div className="bg-muted/50 px-3 py-2 border-b font-semibold text-[11px] text-muted-foreground">
                First 3 Sample Rows Preview
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b bg-muted/20 text-[10px] text-muted-foreground">
                      <th className="py-2 px-2.5">Admission No</th>
                      <th className="py-2 px-2.5">Student Name</th>
                      <th className="py-2 px-2.5">Class</th>
                      <th className="py-2 px-2.5">Sec</th>
                      <th className="py-2 px-2.5">Guardian</th>
                      <th className="py-2 px-2.5">Phone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60 text-[11px]">
                    <tr>
                      <td className="py-2 px-2.5 font-mono text-primary">ADM-2082</td>
                      <td className="py-2 px-2.5 font-semibold">Tanmay Bhatia</td>
                      <td className="py-2 px-2.5">Class 10</td>
                      <td className="py-2 px-2.5">A</td>
                      <td className="py-2 px-2.5">Mukul Bhatia</td>
                      <td className="py-2 px-2.5 font-mono">+91 98888 12345</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2.5 font-mono text-primary">ADM-2083</td>
                      <td className="py-2 px-2.5 font-semibold">Ritika Sen</td>
                      <td className="py-2 px-2.5">Class 10</td>
                      <td className="py-2 px-2.5">B</td>
                      <td className="py-2 px-2.5">Subir Sen</td>
                      <td className="py-2 px-2.5 font-mono">+91 98999 54321</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-2.5 font-mono text-primary">ADM-2084</td>
                      <td className="py-2 px-2.5 font-semibold">Aakash Nair</td>
                      <td className="py-2 px-2.5">Class 9</td>
                      <td className="py-2 px-2.5">A</td>
                      <td className="py-2 px-2.5">Raman Nair</td>
                      <td className="py-2 px-2.5 font-mono">+91 98777 99881</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
              </Button>
              <Button size="sm" onClick={() => setStep(3)}>
                Run Validation <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Validation Summary */}
        {step === 3 && (
          <div className="space-y-4 text-xs">
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider text-muted-foreground">
                Validation Summary (128 Records Analyzed)
              </h4>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-semibold text-foreground">121 Ready for Import</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">All required data present</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="font-semibold text-foreground">5 Warnings: Missing Secondary Phone</span>
                  </div>
                  <span className="text-[11px] text-amber-700 dark:text-amber-300">Will use primary phone</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg border border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/20">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                    <span className="font-semibold text-foreground">2 Duplicate Admission IDs Flagged</span>
                  </div>
                  <span className="text-[11px] text-rose-700 dark:text-rose-300">Skipped automatically</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep(2)}>
                <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
              </Button>
              <Button size="sm" onClick={() => setStep(4)}>
                Proceed to Import <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: Import Confirmation */}
        {step === 4 && (
          <div className="space-y-4 text-xs text-center py-4">
            <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-primary/10 text-primary">
              <CheckCircle2 className="h-7 w-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">Ready to Ingest Students</h3>
              <p className="text-muted-foreground text-xs max-w-sm mx-auto">
                Confirming will append verified student records directly into the institution student directory.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-4">
              <Button variant="outline" size="sm" onClick={() => setStep(3)} disabled={isProcessing}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleProceedToImport} disabled={isProcessing}>
                {isProcessing && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                {isProcessing ? 'Importing Records...' : 'Confirm & Complete Import'}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
