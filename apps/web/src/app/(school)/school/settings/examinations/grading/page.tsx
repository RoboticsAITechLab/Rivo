'use client';

import React, { useState } from 'react';
import { schoolStore, useSchoolStore } from '@/shared/mock-store/school-store';
import { GradingScheme, GradeRule } from '@/features/settings/types';
import { 
  Award, 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  Star,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function GradingSchemesSettingsPage() {
  const store = useSchoolStore();
  const gradingSchemes = store.gradingSchemes || [];

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<GradingScheme | null>(null);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [rules, setRules] = useState<GradeRule[]>([]);

  const defaultStarterRules: GradeRule[] = [
    { grade: 'A+', minPercentage: 90, maxPercentage: 100, gradePoints: 10, isPass: true },
    { grade: 'A', minPercentage: 80, maxPercentage: 89, gradePoints: 9, isPass: true },
    { grade: 'B', minPercentage: 70, maxPercentage: 79, gradePoints: 8, isPass: true },
    { grade: 'C', minPercentage: 60, maxPercentage: 69, gradePoints: 7, isPass: true },
    { grade: 'D', minPercentage: 50, maxPercentage: 59, gradePoints: 6, isPass: true },
    { grade: 'E', minPercentage: 40, maxPercentage: 49, gradePoints: 5, isPass: true },
    { grade: 'F', minPercentage: 0, maxPercentage: 39, gradePoints: 0, isPass: false },
  ];

  const openCreateDialog = () => {
    setEditingScheme(null);
    setName('');
    setCode('');
    setIsDefault(gradingSchemes.length === 0);
    setRules(defaultStarterRules);
    setIsDialogOpen(true);
  };

  const openEditDialog = (scheme: GradingScheme) => {
    setEditingScheme(scheme);
    setName(scheme.name);
    setCode(scheme.code);
    setIsDefault(scheme.isDefault);
    setRules([...scheme.rules]);
    setIsDialogOpen(true);
  };

  const handleAddRuleRow = () => {
    setRules([
      ...rules,
      { grade: 'New', minPercentage: 0, maxPercentage: 0, gradePoints: 0, isPass: true }
    ]);
  };

  const handleRemoveRuleRow = (index: number) => {
    setRules(rules.filter((_, idx) => idx !== index));
  };

  const handleUpdateRule = (index: number, field: keyof GradeRule, val: any) => {
    setRules(rules.map((r, idx) => {
      if (idx === index) {
        return { ...r, [field]: val };
      }
      return r;
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      toast.error('Please enter scheme name and code');
      return;
    }

    if (rules.length === 0) {
      toast.error('Please configure at least one grade tier rule');
      return;
    }

    // If marked default, remove default flag from others
    if (isDefault) {
      gradingSchemes.forEach(s => {
        if (s.isDefault && (!editingScheme || s.id !== editingScheme.id)) {
          schoolStore.updateGradingScheme({ ...s, isDefault: false });
        }
      });
    }

    if (editingScheme) {
      schoolStore.updateGradingScheme({
        ...editingScheme,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        isDefault,
        rules,
      });
      toast.success(`Grading scheme "${name}" updated`);
    } else {
      schoolStore.createGradingScheme({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        isDefault,
        rules,
      });
      toast.success(`Grading scheme "${name}" created`);
    }

    setIsDialogOpen(false);
  };

  const handleSetDefault = (scheme: GradingScheme) => {
    gradingSchemes.forEach(s => {
      schoolStore.updateGradingScheme({ ...s, isDefault: s.id === scheme.id });
    });
    toast.success(`"${scheme.name}" is now the default grading scheme`);
  };

  const handleDelete = (scheme: GradingScheme) => {
    if (scheme.isDefault && gradingSchemes.length > 1) {
      toast.error('Cannot delete the default grading scheme. Please set another scheme as default first.');
      return;
    }
    if (confirm(`Are you sure you want to delete "${scheme.name}"?`)) {
      schoolStore.deleteGradingScheme(scheme.id);
      toast.success(`Grading scheme deleted`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            Grading Schemes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure letter grade cutoffs, grade points (GPA), and pass/fail thresholds for academic performance.
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Add Grading Scheme
        </Button>
      </div>

      {gradingSchemes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <Award className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <h3 className="font-semibold text-lg text-foreground">No grading schemes configured</h3>
            <p className="text-sm text-muted-foreground max-w-md mt-1 mb-6">
              Create a grading scheme to define how student marks map to letter grades, pass criteria, and grade points for report cards.
            </p>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Create First Grading Scheme
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {gradingSchemes.map((scheme) => (
            <Card key={scheme.id} className={scheme.isDefault ? 'border-primary/50 shadow-sm' : ''}>
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-semibold">{scheme.name}</CardTitle>
                      <Badge variant="outline" className="font-mono text-xs">
                        {scheme.code}
                      </Badge>
                      {scheme.isDefault && (
                        <Badge variant="default" className="text-xs gap-1 bg-amber-500 hover:bg-amber-600 text-white">
                          <Star className="h-3 w-3 fill-current" />
                          Default System
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-xs mt-1">
                      {scheme.rules.length} grade bands configured
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {!scheme.isDefault && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-xs gap-1.5"
                        onClick={() => handleSetDefault(scheme)}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Set Default
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                      onClick={() => openEditDialog(scheme)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(scheme)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border/40 bg-muted/20 text-xs font-semibold text-muted-foreground">
                        <th className="py-2.5 px-4">Grade</th>
                        <th className="py-2.5 px-4">Score Range (%)</th>
                        <th className="py-2.5 px-4">Grade Points</th>
                        <th className="py-2.5 px-4">Evaluation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {scheme.rules.map((rule, idx) => (
                        <tr key={idx} className="hover:bg-muted/10 transition-colors">
                          <td className="py-2.5 px-4 font-bold text-foreground">
                            {rule.grade}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-xs">
                            {rule.minPercentage}% – {rule.maxPercentage}%
                          </td>
                          <td className="py-2.5 px-4 font-mono text-xs">
                            {rule.gradePoints.toFixed(1)}
                          </td>
                          <td className="py-2.5 px-4">
                            {rule.isPass ? (
                              <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                                Pass
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs text-destructive border-destructive/30 bg-destructive/10">
                                Fail
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Scheme Editor Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{editingScheme ? 'Edit Grading Scheme' : 'Add Grading Scheme'}</DialogTitle>
              <DialogDescription>
                Define scheme identifiers and the individual grade percentage brackets.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schemeName">Scheme Name *</Label>
                  <Input 
                    id="schemeName" 
                    placeholder="e.g. CBSE 10-Point Scale, Percentage Default"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schemeCode">Code / Slug *</Label>
                  <Input 
                    id="schemeCode" 
                    placeholder="e.g. CBSE-10PT"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="font-mono uppercase"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20">
                <div className="space-y-0.5">
                  <Label htmlFor="defaultScheme" className="text-sm font-medium">Default System Grading Scheme</Label>
                  <p className="text-xs text-muted-foreground">Auto-assigned to new examination sessions and report card generators</p>
                </div>
                <Switch 
                  id="defaultScheme"
                  checked={isDefault}
                  onCheckedChange={setIsDefault}
                />
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Grade Brackets & Thresholds</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddRuleRow} className="h-7 text-xs gap-1">
                    <Plus className="h-3 w-3" />
                    Add Tier
                  </Button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {rules.map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-md border border-border/40 bg-muted/10 text-xs">
                      <div className="w-16">
                        <Input 
                          placeholder="Grade" 
                          value={rule.grade}
                          onChange={(e) => handleUpdateRule(idx, 'grade', e.target.value)}
                          className="h-8 font-bold text-center"
                          required
                        />
                      </div>
                      <div className="flex items-center gap-1 w-32">
                        <Input 
                          type="number"
                          min={0}
                          max={100}
                          placeholder="Min %" 
                          value={rule.minPercentage}
                          onChange={(e) => handleUpdateRule(idx, 'minPercentage', Number(e.target.value))}
                          className="h-8 font-mono text-center"
                          required
                        />
                        <span className="text-muted-foreground">-</span>
                        <Input 
                          type="number"
                          min={0}
                          max={100}
                          placeholder="Max %" 
                          value={rule.maxPercentage}
                          onChange={(e) => handleUpdateRule(idx, 'maxPercentage', Number(e.target.value))}
                          className="h-8 font-mono text-center"
                          required
                        />
                      </div>
                      <div className="w-24">
                        <Input 
                          type="number"
                          step="0.1"
                          placeholder="GPA Pts" 
                          value={rule.gradePoints}
                          onChange={(e) => handleUpdateRule(idx, 'gradePoints', Number(e.target.value))}
                          className="h-8 font-mono text-center"
                          required
                        />
                      </div>
                      <div className="flex items-center gap-1.5 px-2">
                        <Switch 
                          checked={rule.isPass}
                          onCheckedChange={(val) => handleUpdateRule(idx, 'isPass', val)}
                        />
                        <span className="text-[11px] font-medium text-muted-foreground w-8">
                          {rule.isPass ? 'Pass' : 'Fail'}
                        </span>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => handleRemoveRuleRow(idx)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingScheme ? 'Save Scheme' : 'Create Scheme'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
