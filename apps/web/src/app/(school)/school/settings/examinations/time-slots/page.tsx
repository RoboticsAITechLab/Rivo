'use client';

import React, { useState } from 'react';
import { schoolStore, useSchoolStore } from '@/shared/mock-store/school-store';
import { ExamTimeSlot } from '@/features/settings/types';
import { 
  Clock, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  XCircle,
  Timer
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export default function ExamTimeSlotsSettingsPage() {
  const store = useSchoolStore();
  const timeSlots = store.examTimeSlots || [];

  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ExamTimeSlot | null>(null);

  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const calculateDuration = (start: string, end: string) => {
    try {
      const [startH, startM] = start.split(':').map(Number);
      const [endH, endM] = end.split(':').map(Number);
      const diffMinutes = (endH * 60 + endM) - (startH * 60 + startM);
      if (diffMinutes <= 0) return 'Invalid time range';
      const hours = Math.floor(diffMinutes / 60);
      const mins = diffMinutes % 60;
      if (mins === 0) return `${hours} hrs`;
      return `${hours} hrs ${mins} mins`;
    } catch {
      return '—';
    }
  };

  const openCreateDialog = () => {
    setEditingSlot(null);
    setName('');
    setStartTime('09:00');
    setEndTime('12:00');
    setStatus('ACTIVE');
    setIsDialogOpen(true);
  };

  const openEditDialog = (slot: ExamTimeSlot) => {
    setEditingSlot(slot);
    setName(slot.name);
    setStartTime(slot.startTime);
    setEndTime(slot.endTime);
    setStatus(slot.status);
    setIsDialogOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a slot name');
      return;
    }

    if (startTime >= endTime) {
      toast.error('End time must be later than start time');
      return;
    }

    if (editingSlot) {
      schoolStore.updateExamTimeSlot({
        ...editingSlot,
        name: name.trim(),
        startTime,
        endTime,
        status,
      });
      toast.success(`Exam slot "${name}" updated successfully`);
    } else {
      schoolStore.createExamTimeSlot({
        name: name.trim(),
        startTime,
        endTime,
        status,
      });
      toast.success(`Exam slot "${name}" created successfully`);
    }

    setIsDialogOpen(false);
  };

  const handleDelete = (slot: ExamTimeSlot) => {
    if (confirm(`Are you sure you want to delete time slot "${slot.name}"?`)) {
      schoolStore.deleteExamTimeSlot(slot.id);
      toast.success(`Exam time slot "${slot.name}" deleted`);
    }
  };

  const filteredSlots = timeSlots.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.startTime.includes(search) ||
    s.endTime.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            Exam Time Slots
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Preconfigure standard examination shift timings to enforce paper scheduling consistency.
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Add Time Slot
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search slots..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Configured Time Slots</CardTitle>
          <CardDescription className="text-xs">
            {filteredSlots.length} {filteredSlots.length === 1 ? 'slot' : 'slots'} available
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredSlots.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <Clock className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="font-medium text-foreground">No examination time slots configured</p>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                {search ? 'No slots matched your search.' : 'Define your school\'s examination shifts (e.g. Morning Shift: 09:00 - 12:00) to streamline date-sheet creation.'}
              </p>
              {!search && (
                <Button variant="outline" size="sm" onClick={openCreateDialog} className="gap-2">
                  <Plus className="h-3.5 w-3.5" />
                  Create First Slot
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/30 text-xs font-semibold text-muted-foreground">
                    <th className="py-3 px-4">Shift Name</th>
                    <th className="py-3 px-4">Start Time</th>
                    <th className="py-3 px-4">End Time</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredSlots.map((slot) => (
                    <tr key={slot.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-4 font-medium text-foreground">
                        {slot.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-foreground">
                        {slot.startTime}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-foreground">
                        {slot.endTime}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-xs gap-1 font-normal">
                          <Timer className="h-3 w-3 text-muted-foreground" />
                          {calculateDuration(slot.startTime, slot.endTime)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {slot.status === 'ACTIVE' ? (
                          <Badge variant="default" className="text-xs gap-1 bg-emerald-600 hover:bg-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <XCircle className="h-3 w-3" />
                            Inactive
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => openEditDialog(slot)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(slot)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{editingSlot ? 'Edit Time Slot' : 'Add Exam Time Slot'}</DialogTitle>
              <DialogDescription>
                Set the name and start/end boundaries for this exam shift.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="slotName">Shift / Slot Name *</Label>
                <Input 
                  id="slotName" 
                  placeholder="e.g. Morning Shift, Afternoon Shift"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time (24h) *</Label>
                  <Input 
                    id="startTime" 
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time (24h) *</Label>
                  <Input 
                    id="endTime" 
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/40 border border-border/40 text-xs flex items-center justify-between">
                <span className="text-muted-foreground">Calculated Paper Duration:</span>
                <span className="font-semibold text-foreground">{calculateDuration(startTime, endTime)}</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slotStatus">Status</Label>
                <Select value={status} onValueChange={(val) => setStatus(val as 'ACTIVE' | 'INACTIVE')}>
                  <SelectTrigger id="slotStatus">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active (Available for exam scheduling)</SelectItem>
                    <SelectItem value="INACTIVE">Inactive (Hidden from paper creation)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingSlot ? 'Save Changes' : 'Create Slot'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
