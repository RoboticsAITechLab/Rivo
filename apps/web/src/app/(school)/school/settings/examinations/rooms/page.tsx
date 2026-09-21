'use client';

import React, { useState } from 'react';
import { schoolStore, useSchoolStore } from '@/shared/mock-store/school-store';
import { Room } from '@/shared/types';
import { DependencyAlert } from '@/features/settings/components/dependency-alert';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users, 
  Grid, 
  MapPin,
  CheckCircle2,
  XCircle
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

export default function ExamRoomsSettingsPage() {
  const store = useSchoolStore();
  const rooms = store.rooms || [];
  const campuses = store.campuses || [];

  const [search, setSearch] = useState('');
  const [selectedCampusId, setSelectedCampusId] = useState<string>('ALL');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const [name, setName] = useState('');
  const [campusId, setCampusId] = useState('');
  const [capacity, setCapacity] = useState(40);
  const [rows, setRows] = useState(5);
  const [columns, setColumns] = useState(8);
  const [type, setType] = useState<'CLASSROOM' | 'LAB' | 'HALL' | 'AUDITORIUM'>('HALL');

  const openCreateDialog = () => {
    setEditingRoom(null);
    setName('');
    setCampusId(campuses[0]?.id || '');
    setCapacity(40);
    setRows(5);
    setColumns(8);
    setType('HALL');
    setIsDialogOpen(true);
  };

  const openEditDialog = (room: Room) => {
    setEditingRoom(room);
    setName(room.name);
    setCampusId(room.campusId || campuses[0]?.id || '');
    setCapacity(room.capacity || 40);
    setRows(room.rows || 5);
    setColumns(room.columns || 8);
    setType((room.type as any) || 'HALL');
    setIsDialogOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter room name or hall number');
      return;
    }

    if (editingRoom) {
      schoolStore.updateRoom({
        ...editingRoom,
        name: name.trim(),
        campusId,
        capacity: Number(capacity) || 0,
        rows: Number(rows) || 0,
        columns: Number(columns) || 0,
        type,
      });
      toast.success(`Exam venue "${name}" updated`);
    } else {
      schoolStore.createRoom({
        name: name.trim(),
        code: name.trim().replace(/\s+/g, '-').toUpperCase(),
        building: 'Main Block',
        floor: 'Ground',
        campusId,
        capacity: Number(capacity) || 0,
        rows: Number(rows) || 0,
        columns: Number(columns) || 0,
        type,
        status: 'ACTIVE',
      });
      toast.success(`Exam venue "${name}" registered`);
    }

    setIsDialogOpen(false);
  };

  const filteredRooms = rooms
    .filter(r => selectedCampusId === 'ALL' || r.campusId === selectedCampusId)
    .filter(r => 
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.type.toLowerCase().includes(search.toLowerCase())
    );

  const totalExamCapacity = filteredRooms.reduce((acc, r) => acc + (r.capacity || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Examination Halls & Rooms
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure examination venues, seating capacities, and bench matrices across school campuses.
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Add Venue
        </Button>
      </div>

      {campuses.length === 0 && (
        <DependencyAlert 
          title="Campuses Not Configured"
          message="No campuses have been created yet. Venues should be associated with a physical campus for accurate seating allocation."
          actionText="Configure Campuses"
          actionHref="/school/settings/campuses"
          severity="warning"
        />
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search rooms or halls..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          {campuses.length > 0 && (
            <Select value={selectedCampusId} onValueChange={setSelectedCampusId}>
              <SelectTrigger className="w-[180px] h-9 text-xs">
                <SelectValue placeholder="All Campuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Campuses</SelectItem>
                {campuses.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground self-start sm:self-auto">
          <span>Total Seating Capacity:</span>
          <Badge variant="outline" className="font-mono text-foreground font-semibold">
            {totalExamCapacity} seats
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Venues & Room Specifications</CardTitle>
          <CardDescription className="text-xs">
            {filteredRooms.length} {filteredRooms.length === 1 ? 'venue' : 'venues'} listed
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <Building2 className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="font-medium text-foreground">No examination venues found</p>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                {search ? 'No rooms matched your search.' : 'Add halls or standard classrooms available for student exam seating.'}
              </p>
              {!search && (
                <Button variant="outline" size="sm" onClick={openCreateDialog} className="gap-2">
                  <Plus className="h-3.5 w-3.5" />
                  Add First Venue
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/30 text-xs font-semibold text-muted-foreground">
                    <th className="py-3 px-4">Room / Hall</th>
                    <th className="py-3 px-4">Campus</th>
                    <th className="py-3 px-4">Facility Type</th>
                    <th className="py-3 px-4">Exam Capacity</th>
                    <th className="py-3 px-4">Grid Setup (Rows × Cols)</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredRooms.map((room) => {
                    const campus = campuses.find(c => c.id === room.campusId);
                    return (
                      <tr key={room.id} className="hover:bg-muted/20 transition-colors">
                        <td className="py-3 px-4 font-medium text-foreground">
                          {room.name}
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground">
                          {campus ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {campus.name}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="text-xs uppercase font-mono">
                            {room.type}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 text-xs font-mono font-medium">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            {room.capacity || 0} students
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground font-mono">
                          {room.rows && room.columns ? `${room.rows} × ${room.columns} benches` : 'Standard'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => openEditDialog(room)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
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
              <DialogTitle>{editingRoom ? 'Edit Venue' : 'Add Examination Venue'}</DialogTitle>
              <DialogDescription>
                Configure exam seating capacity and physical layout for invigilation planning.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="roomName">Room / Hall Name *</Label>
                <Input 
                  id="roomName" 
                  placeholder="e.g. Hall A, Main Auditorium, Room 204"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {campuses.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="campusSelect">Campus</Label>
                  <Select value={campusId} onValueChange={setCampusId}>
                    <SelectTrigger id="campusSelect">
                      <SelectValue placeholder="Select campus" />
                    </SelectTrigger>
                    <SelectContent>
                      {campuses.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="roomType">Facility Type</Label>
                  <Select value={type} onValueChange={(val: any) => setType(val)}>
                    <SelectTrigger id="roomType">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HALL">Exam Hall</SelectItem>
                      <SelectItem value="CLASSROOM">Classroom</SelectItem>
                      <SelectItem value="AUDITORIUM">Auditorium</SelectItem>
                      <SelectItem value="LAB">Computer/Science Lab</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Total Exam Capacity</Label>
                  <Input 
                    id="capacity" 
                    type="number"
                    min={1}
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg border border-border/40 bg-muted/20 space-y-3">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Grid className="h-3.5 w-3.5" />
                  Seating Matrix Grid (Optional)
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground">Rows</span>
                    <Input 
                      type="number" 
                      min={1} 
                      value={rows} 
                      onChange={(e) => setRows(Number(e.target.value))}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground">Columns</span>
                    <Input 
                      type="number" 
                      min={1} 
                      value={columns} 
                      onChange={(e) => setColumns(Number(e.target.value))}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingRoom ? 'Save Changes' : 'Create Venue'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
