'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Mail,
  Phone,
  Building,
  GraduationCap,
  Calendar,
  Clock,
  BookOpen,
  Camera,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Briefcase,
  User,
  Shield,
  MapPin,
  HeartHandshake,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/page-container';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function TeacherProfilePage() {
  const params = useParams();
  const router = useRouter();
  const teacherId = params.id as string;

  const [teacher, setTeacher] = React.useState<any>(null);
  const [schedule, setSchedule] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isScheduleLoading, setIsScheduleLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchProfile = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/teachers/${teacherId}`);
      if (!res.ok) {
        throw new Error('Teacher record not found');
      }
      const data = await res.json();
      setTeacher(data.teacher);
    } catch (err: any) {
      setError(err.message || 'Failed to load teacher profile');
    } finally {
      setIsLoading(false);
    }
  }, [teacherId]);

  const fetchTeacherSchedule = React.useCallback(async () => {
    setIsScheduleLoading(true);
    try {
      const res = await fetch(`/api/timetable/school?teacherId=${teacherId}`);
      if (res.ok) {
        const data = await res.json();
        setSchedule(data.slots || []);
      }
    } catch (err) {
      console.error('Failed to load teacher schedule:', err);
    } finally {
      setIsScheduleLoading(false);
    }
  }, [teacherId]);

  React.useEffect(() => {
    fetchProfile();
    fetchTeacherSchedule();
  }, [fetchProfile, fetchTeacherSchedule]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Photo must be less than 2MB');
      return;
    }

    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/teachers/${teacherId}/photo`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Photo upload failed');
      }

      const data = await res.json();
      setTeacher((prev: any) => ({ ...prev, photoUrl: data.photoUrl }));
      setToastMsg('Profile photo updated successfully!');
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Upload error');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handlePhotoRemove = async () => {
    if (!confirm('Are you sure you want to remove this profile photo?')) return;
    try {
      const res = await fetch(`/api/teachers/${teacherId}/photo`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setTeacher((prev: any) => ({ ...prev, photoUrl: null }));
        setToastMsg('Photo removed successfully.');
        setTimeout(() => setToastMsg(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="py-24 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-xs text-muted-foreground">Loading teacher faculty record...</p>
        </div>
      </PageContainer>
    );
  }

  if (error || !teacher) {
    return (
      <PageContainer>
        <div className="py-20 text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <h2 className="text-lg font-semibold">{error || 'Teacher Not Found'}</h2>
          <Button variant="outline" size="sm" onClick={() => router.push('/school/teachers')}>
            Return to Faculty Directory
          </Button>
        </div>
      </PageContainer>
    );
  }

  const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

  return (
    <PageContainer>
      {/* Toast Feedback */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
        <Link href="/school/teachers" className="hover:text-foreground flex items-center gap-1 transition-colors">
          <ChevronLeft className="h-3.5 w-3.5" />
          Faculty Directory
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{teacher.name}</span>
      </div>

      {/* Teacher Profile Banner Header */}
      <Card className="mb-6 border-slate-200 shadow-xs">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Photo Box */}
              <div className="relative group">
                <div className="h-20 w-20 rounded-full border-2 border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xl shadow-xs">
                  {teacher.photoUrl ? (
                    <img
                      src={teacher.photoUrl}
                      alt={teacher.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{teacher.name.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoUploading}
                  className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full shadow-md hover:bg-primary/90 transition-transform active:scale-95"
                  title="Upload profile photo"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoUpload}
                />
              </div>

              {/* Title & Badges */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl font-bold tracking-tight text-foreground">{teacher.name}</h1>
                  <Badge variant="secondary" className="font-mono text-[11px] font-semibold">
                    {teacher.employeeId}
                  </Badge>
                  <Badge
                    variant={teacher.status === 'ACTIVE' ? 'default' : 'outline'}
                    className={
                      teacher.status === 'ACTIVE'
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white text-[11px]'
                        : 'text-muted-foreground text-[11px]'
                    }
                  >
                    {teacher.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                    {teacher.designation || 'Faculty Member'} — {teacher.department || 'General'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5 text-slate-400" />
                    {teacher.campusName}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {teacher.photoUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePhotoRemove}
                  className="text-xs h-8 text-destructive border-destructive/20 hover:bg-destructive/10 gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove Photo
                </Button>
              )}
              <Link href={`/school/teachers/${teacher.id}/permissions`}>
                <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                  Permissions
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Navigation */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-lg">
          <TabsTrigger value="overview" className="text-xs gap-1.5">
            Overview
          </TabsTrigger>
          <TabsTrigger value="personal" className="text-xs gap-1.5">
            Personal &amp; Contact
          </TabsTrigger>
          <TabsTrigger value="professional" className="text-xs gap-1.5">
            Professional &amp; Employment
          </TabsTrigger>
          <TabsTrigger value="assignments" className="text-xs gap-1.5">
            Academic Assignments ({teacher.assignments?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="timetable" className="text-xs gap-1.5">
            Weekly Timetable ({schedule.length})
          </TabsTrigger>
        </TabsList>

        {/* 1. Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-700">Teaching Profile Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-muted-foreground">Department:</span>
                  <span className="font-medium text-foreground">{teacher.department || 'Not configured'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-muted-foreground">Designation:</span>
                  <span className="font-medium text-foreground">{teacher.designation || 'Faculty Member'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-muted-foreground">Qualification:</span>
                  <span className="font-medium text-foreground">{teacher.qualification || 'B.Ed / Master'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-muted-foreground">Specialization:</span>
                  <span className="font-medium text-foreground">{teacher.specialization || 'General Pedagogy'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Employment Type:</span>
                  <Badge variant="outline" className="text-[10px]">
                    {teacher.employmentType}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-700">Contact Channels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex items-center gap-2.5 py-1 border-b border-slate-100">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="font-medium text-foreground">{teacher.email}</span>
                </div>
                <div className="flex items-center gap-2.5 py-1 border-b border-slate-100">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span className="font-medium text-foreground">{teacher.phone || 'No phone recorded'}</span>
                </div>
                <div className="flex items-center gap-2.5 py-1">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span className="font-medium text-foreground">{teacher.address || 'Address not registered'}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-700">Workload Snapshot</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-muted-foreground">Assigned Classes:</span>
                  <span className="font-bold text-foreground text-sm">{teacher.assignments?.length || 0}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-muted-foreground">Weekly Periods Scheduled:</span>
                  <span className="font-bold text-foreground text-sm">{schedule.length}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Joining Date:</span>
                  <span className="font-medium text-foreground">{teacher.joiningDate || 'Standard Session'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 2. Personal & Contact Tab */}
        <TabsContent value="personal" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-700">Personal Demographics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-muted-foreground">Full Name:</span>
                  <span className="font-medium text-foreground">{teacher.name}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-muted-foreground">Gender:</span>
                  <span className="font-medium text-foreground">{teacher.gender || 'Not specified'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-muted-foreground">Date of Birth:</span>
                  <span className="font-medium text-foreground">{teacher.dateOfBirth || 'Not registered'}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Residential Address:</span>
                  <span className="font-medium text-foreground text-right">{teacher.address || 'Not registered'}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-slate-700">Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-muted-foreground">Contact Person:</span>
                  <span className="font-medium text-foreground">{teacher.emergencyContactName || 'Not designated'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-muted-foreground">Relationship:</span>
                  <span className="font-medium text-foreground">{teacher.emergencyContactRelation || 'Not designated'}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Emergency Telephone:</span>
                  <span className="font-medium text-foreground">{teacher.emergencyContactPhone || 'Not designated'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 3. Professional Tab */}
        <TabsContent value="professional" className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-slate-700">Employment &amp; Qualification Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                <div className="space-y-1">
                  <span className="text-muted-foreground">Employee ID</span>
                  <p className="font-bold text-sm text-foreground">{teacher.employeeId}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Designation</span>
                  <p className="font-medium text-foreground">{teacher.designation || 'Faculty Member'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Department</span>
                  <p className="font-medium text-foreground">{teacher.department || 'General'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Qualification</span>
                  <p className="font-medium text-foreground">{teacher.qualification || 'Master of Education'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Specialization</span>
                  <p className="font-medium text-foreground">{teacher.specialization || 'Not specified'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Years of Experience</span>
                  <p className="font-medium text-foreground">{teacher.experienceYears} Years</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Employment Nature</span>
                  <p className="font-medium text-foreground">{teacher.employmentType}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Official Joining Date</span>
                  <p className="font-medium text-foreground">{teacher.joiningDate || 'Session Start'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Campus Branch</span>
                  <p className="font-medium text-foreground">{teacher.campusName}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. Academic Assignments Tab */}
        <TabsContent value="assignments" className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-700">Official Class &amp; Subject Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {teacher.assignments?.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  No academic classes or subjects currently assigned to this faculty member.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Class</th>
                        <th className="py-2.5 px-3">Section</th>
                        <th className="py-2.5 px-3">Stream</th>
                        <th className="py-2.5 px-3">Subject</th>
                        <th className="py-2.5 px-3">Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {teacher.assignments.map((a: any) => (
                        <tr key={a.id} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 font-medium text-foreground">{a.className}</td>
                          <td className="py-2 px-3">{a.sectionName}</td>
                          <td className="py-2 px-3">{a.streamId || 'General'}</td>
                          <td className="py-2 px-3 font-semibold text-primary">{a.subjectName}</td>
                          <td className="py-2 px-3">
                            {a.isClassTeacher ? (
                              <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px]">
                                Class Teacher
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">Subject Teacher</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. Weekly Timetable Tab */}
        <TabsContent value="timetable" className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-slate-700">
                  Weekly Teaching Period Schedule
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Synchronized period schedule for {teacher.name} across all assigned classrooms.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="text-xs h-8 gap-1.5"
              >
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                Print Schedule
              </Button>
            </CardHeader>
            <CardContent>
              {isScheduleLoading ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  Loading timetable periods...
                </div>
              ) : schedule.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  No timetable slots scheduled for this teacher yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Day</th>
                        <th className="py-2.5 px-3">Period</th>
                        <th className="py-2.5 px-3">Time</th>
                        <th className="py-2.5 px-3">Class &amp; Section</th>
                        <th className="py-2.5 px-3">Subject</th>
                        <th className="py-2.5 px-3">Room</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {schedule.map((slot: any) => (
                        <tr key={slot.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-semibold text-slate-700">{slot.dayOfWeek}</td>
                          <td className="py-2.5 px-3">
                            <Badge variant="outline" className="text-[10px]">
                              Period {slot.periodNumber}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground">
                            {slot.startTime} – {slot.endTime}
                          </td>
                          <td className="py-2.5 px-3 font-medium text-foreground">
                            {slot.className} ({slot.sectionName})
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-primary">{slot.subjectName}</td>
                          <td className="py-2.5 px-3 text-slate-500">{slot.roomNumber}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
