'use client';

import React, { useState, useEffect } from 'react';
import { schoolStore, useSchoolStore } from '@/shared/mock-store/school-store';
import { PrintSettings } from '@/features/settings/types';
import { useUnsavedChanges } from '@/features/settings/hooks/use-unsaved-changes';
import { UnsavedChangesDialog } from '@/features/settings/components/unsaved-changes-dialog';
import { 
  Printer, 
  Save, 
  FileText, 
  Stamp, 
  PenTool, 
  Eye,
  Sliders
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export default function PrintSettingsPage() {
  const store = useSchoolStore();
  const currentSettings = store.printSettings;

  const [formData, setFormData] = useState<PrintSettings>({
    paperSize: 'A4',
    orientation: 'PORTRAIT',
    marginsMM: { top: 15, bottom: 15, left: 15, right: 15 },
    showWatermark: false,
    watermarkText: 'CONFIDENTIAL',
    showAuthorizedSignature: true,
    showSchoolSeal: true,
  });

  const { isDirty, setIsDirty, showDialog, confirmLeave, cancelLeave } = useUnsavedChanges();

  useEffect(() => {
    if (currentSettings) {
      setFormData(currentSettings);
    }
  }, [currentSettings]);

  const handleChange = <K extends keyof PrintSettings>(key: K, value: PrintSettings[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  type MarginKey = 'top' | 'bottom' | 'left' | 'right';
  const handleMarginChange = (margin: MarginKey, val: number) => {
    setFormData(prev => ({
      ...prev,
      marginsMM: {
        top: prev.marginsMM?.top ?? 15,
        bottom: prev.marginsMM?.bottom ?? 15,
        left: prev.marginsMM?.left ?? 15,
        right: prev.marginsMM?.right ?? 15,
        [margin]: val,
      }
    }));
    setIsDirty(true);
  };

  const handleSave = () => {
    schoolStore.updatePrintSettings(formData);
    setIsDirty(false);
    toast.success('Document print layout and page settings saved');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Printer className="h-6 w-6 text-primary" />
            Print Layout & Page Dimensions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Standardize paper stock dimensions, printer margins, watermark stamps, and institutional endorsements.
          </p>
        </div>
        <Button onClick={handleSave} disabled={!isDirty} className="gap-2 shrink-0">
          <Save className="h-4 w-4" />
          Save Layout
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Paper & Orientation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Paper & Geometry
            </CardTitle>
            <CardDescription className="text-xs">
              Physical page dimensions for PDF report card and admit card exporters.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paperSize">Default Paper Stock</Label>
                <Select 
                  value={formData.paperSize} 
                  onValueChange={(val: any) => handleChange('paperSize', val)}
                >
                  <SelectTrigger id="paperSize">
                    <SelectValue placeholder="Size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4 (210 × 297 mm) — Standard</SelectItem>
                    <SelectItem value="LETTER">US Letter (8.5 × 11 in)</SelectItem>
                    <SelectItem value="LEGAL">Legal (8.5 × 14 in)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orientation">Page Orientation</Label>
                <Select 
                  value={formData.orientation} 
                  onValueChange={(val: any) => handleChange('orientation', val)}
                >
                  <SelectTrigger id="orientation">
                    <SelectValue placeholder="Orientation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PORTRAIT">Portrait (Vertical)</SelectItem>
                    <SelectItem value="LANDSCAPE">Landscape (Horizontal)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Label className="text-xs font-semibold">Print Margins (in millimeters)</Label>
              <div className="grid grid-cols-4 gap-2">
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground">Top</span>
                  <Input 
                    type="number" 
                    min={0} 
                    value={formData.marginsMM?.top ?? 15} 
                    onChange={(e) => handleMarginChange('top', Number(e.target.value))}
                    className="h-8 font-mono text-center text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground">Bottom</span>
                  <Input 
                    type="number" 
                    min={0} 
                    value={formData.marginsMM?.bottom ?? 15} 
                    onChange={(e) => handleMarginChange('bottom', Number(e.target.value))}
                    className="h-8 font-mono text-center text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground">Left</span>
                  <Input 
                    type="number" 
                    min={0} 
                    value={formData.marginsMM?.left ?? 15} 
                    onChange={(e) => handleMarginChange('left', Number(e.target.value))}
                    className="h-8 font-mono text-center text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground">Right</span>
                  <Input 
                    type="number" 
                    min={0} 
                    value={formData.marginsMM?.right ?? 15} 
                    onChange={(e) => handleMarginChange('right', Number(e.target.value))}
                    className="h-8 font-mono text-center text-xs"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Endorsements & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Stamp className="h-4 w-4 text-primary" />
              Security Watermarks & Seals
            </CardTitle>
            <CardDescription className="text-xs">
              Overlay institutional stamps, watermarks, and verification signatures.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-0.5">
                <div className="text-sm font-medium flex items-center gap-1.5">
                  <Stamp className="h-4 w-4 text-primary" />
                  Print Official School Seal
                </div>
                <div className="text-xs text-muted-foreground">Embed embossed digital school seal stamp on certificates</div>
              </div>
              <Switch 
                checked={formData.showSchoolSeal}
                onCheckedChange={(val) => handleChange('showSchoolSeal', val)}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/10">
              <div className="space-y-0.5">
                <div className="text-sm font-medium flex items-center gap-1.5">
                  <PenTool className="h-4 w-4 text-primary" />
                  Authorized Signature Block
                </div>
                <div className="text-xs text-muted-foreground">Append principal or registrar digital signature line</div>
              </div>
              <Switch 
                checked={formData.showAuthorizedSignature}
                onCheckedChange={(val) => handleChange('showAuthorizedSignature', val)}
              />
            </div>

            <div className="p-3 rounded-lg border border-border/40 bg-muted/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Background Watermark</div>
                  <div className="text-xs text-muted-foreground">Diagonal anti-tamper watermark text</div>
                </div>
                <Switch 
                  checked={formData.showWatermark}
                  onCheckedChange={(val) => handleChange('showWatermark', val)}
                />
              </div>

              {formData.showWatermark && (
                <div className="space-y-1.5 pt-2">
                  <Label htmlFor="watermarkText" className="text-xs">Watermark Text</Label>
                  <Input 
                    id="watermarkText" 
                    placeholder="e.g. OFFICIAL COPY, DRAFT, CONFIDENTIAL"
                    value={formData.watermarkText || ''}
                    onChange={(e) => handleChange('watermarkText', e.target.value)}
                    className="font-mono text-xs uppercase"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <UnsavedChangesDialog 
        open={showDialog} 
        onConfirm={confirmLeave} 
        onCancel={cancelLeave} 
      />
    </div>
  );
}
