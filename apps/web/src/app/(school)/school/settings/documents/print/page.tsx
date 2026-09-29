'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Printer, 
  Save, 
  FileText, 
  Stamp, 
  PenTool, 
  Eye,
  Sliders,
  RefreshCw,
  CheckCircle2,
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

interface DocumentsPrintConfig {
  pageSize: 'A4' | 'LETTER' | 'LEGAL';
  orientation: 'PORTRAIT' | 'LANDSCAPE';
  marginsMM: { top: number; bottom: number; left: number; right: number };
  showHeader: boolean;
  showFooter: boolean;
  showSeal: boolean;
  showSignature: boolean;
  watermarkText: string;
}

export default function PrintSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState<DocumentsPrintConfig>({
    pageSize: 'A4',
    orientation: 'PORTRAIT',
    marginsMM: { top: 15, bottom: 15, left: 15, right: 15 },
    showHeader: true,
    showFooter: true,
    showSeal: true,
    showSignature: true,
    watermarkText: '',
  });

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/school/settings?category=documents');
      const json = await res.json();
      if (res.ok && json.data) {
        setFormData(json.data);
      }
    } catch (err) {
      console.error('Failed to load print settings:', err);
      toast.error('Failed to load document print configuration');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = <K extends keyof DocumentsPrintConfig>(key: K, value: DocumentsPrintConfig[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  type MarginKey = 'top' | 'bottom' | 'left' | 'right';
  const handleMarginChange = (margin: MarginKey, val: number) => {
    setFormData(prev => ({
      ...prev,
      marginsMM: {
        ...prev.marginsMM,
        [margin]: val,
      }
    }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/school/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'documents',
          value: formData,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to save print settings');
      }
      setIsDirty(false);
      setSaveSuccess(true);
      toast.success('Document print layout and page settings saved');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save print configuration');
    } finally {
      setSaving(false);
    }
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
        <Button onClick={handleSave} disabled={!isDirty || saving || loading} className="gap-2 shrink-0">
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving...' : 'Save Layout'}
        </Button>
      </div>

      {saveSuccess && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Print layout configurations persisted to database.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Paper & Orientation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Paper &amp; Physical Geometry
            </CardTitle>
            <CardDescription className="text-xs">
              Baseline paper sheet size and default print orientation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Paper Stock Standard</Label>
              <Select 
                value={formData.pageSize} 
                onValueChange={(val: any) => handleChange('pageSize', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select paper size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A4">A4 (210 × 297 mm) — Standard School Format</SelectItem>
                  <SelectItem value="LETTER">US Letter (8.5 × 11 in)</SelectItem>
                  <SelectItem value="LEGAL">US Legal (8.5 × 14 in)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Default Orientation</Label>
              <Select 
                value={formData.orientation} 
                onValueChange={(val: any) => handleChange('orientation', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select orientation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PORTRAIT">Portrait (Vertical documents, Marksheets)</SelectItem>
                  <SelectItem value="LANDSCAPE">Landscape (Horizontal timetables, Schedules)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Margins */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Sliders className="h-4 w-4 text-primary" />
              Page Margins (Millimeters)
            </CardTitle>
            <CardDescription className="text-xs">
              Ensure proper spacing for school letterhead, headers, and binding borders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Top Margin (mm)</Label>
                <Input 
                  type="number" 
                  min={0} 
                  max={50}
                  value={formData.marginsMM?.top ?? 15}
                  onChange={e => handleMarginChange('top', parseInt(e.target.value) || 0)}
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Bottom Margin (mm)</Label>
                <Input 
                  type="number" 
                  min={0} 
                  max={50}
                  value={formData.marginsMM?.bottom ?? 15}
                  onChange={e => handleMarginChange('bottom', parseInt(e.target.value) || 0)}
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Left Margin (mm)</Label>
                <Input 
                  type="number" 
                  min={0} 
                  max={50}
                  value={formData.marginsMM?.left ?? 15}
                  onChange={e => handleMarginChange('left', parseInt(e.target.value) || 0)}
                  className="font-mono text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Right Margin (mm)</Label>
                <Input 
                  type="number" 
                  min={0} 
                  max={50}
                  value={formData.marginsMM?.right ?? 15}
                  onChange={e => handleMarginChange('right', parseInt(e.target.value) || 0)}
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Official Endorsements & Seals */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Stamp className="h-4 w-4 text-primary" />
              Institutional Seals, Signatures &amp; Endorsements
            </CardTitle>
            <CardDescription className="text-xs">
              Toggle automatic overlay of official authenticity marks on generated documents.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
              <div className="space-y-0.5">
                <div className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Stamp className="h-4 w-4 text-primary" />
                  Official Institutional Seal / Stamp
                </div>
                <div className="text-xs text-muted-foreground">
                  Print official institutional seal on admit cards, certificates, and marksheets.
                </div>
              </div>
              <Switch 
                checked={formData.showSeal} 
                onCheckedChange={checked => handleChange('showSeal', checked)} 
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
              <div className="space-y-0.5">
                <div className="text-sm font-medium text-foreground flex items-center gap-2">
                  <PenTool className="h-4 w-4 text-primary" />
                  Principal / Controller of Examinations Signature
                </div>
                <div className="text-xs text-muted-foreground">
                  Print authorized signatory image on report cards, fee receipts, and official transcripts.
                </div>
              </div>
              <Switch 
                checked={formData.showSignature} 
                onCheckedChange={checked => handleChange('showSignature', checked)} 
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
