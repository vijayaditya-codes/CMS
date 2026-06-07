'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/providers/AuthProvider';
import { 
  ArrowLeft, 
  Loader2, 
  UserPlus, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Trash2,
  Sliders,
  ChevronRight,
  BookOpen,
  UserCheck,
  BadgeAlert
} from 'lucide-react';

interface Learner {
  id: string;
  name: string;
  email: string;
  cohort: string;
  skillLevel: string;
}

interface Enrollment {
  id: string;
  learnerId: string;
  status: 'ACTIVE' | 'DROPPED' | 'COMPLETED';
  progressPercent: number;
  learner: {
    id: string;
    name: string;
    email: string;
    cohort: string;
  };
}

interface CourseDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  capacity: number;
  instructor: {
    name: string;
    email: string;
  };
  enrollments: Enrollment[];
}

export default function CourseRosterPage() {
  const { id: courseId } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Roster progress modifier state
  const [editingEnrollmentId, setEditingEnrollmentId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'DROPPED' | 'COMPLETED'>('ACTIVE');
  const [editProgress, setEditProgress] = useState<number>(0);
  
  // Enroll form state
  const [selectedLearnerId, setSelectedLearnerId] = useState('');
  const [enrollError, setEnrollError] = useState<string | null>(null);

  // Query: Get course details and roster
  const { data: course, isLoading, isError } = useQuery<CourseDetail>({
    queryKey: ['course-detail', courseId],
    queryFn: async () => {
      const res = await apiClient.get(`/courses/${courseId}`);
      // Retrieve enrollments directly through course query or by separate fetch
      // Wait, our backend `GET /courses/:id` currently does not include the enrollments list!
      // Let's check: in `course.controller.js`, `getCourseById` does not include `enrollments`.
      // Wait, does it? Let's check backend `getCourseById`:
      // `const course = await prisma.course.findUnique({ where: { id }, include: { instructor: true } });`
      // Ah! It does NOT include enrollments!
      // Let's adjust our fetch function: we should either modify `getCourseById` to include enrollments, 
      // or retrieve them here. Let's modify the backend controller `getCourseById` to include:
      // `enrollments: { include: { learner: true } }` so we get the roster in one clean query!
      // Yes, this is much better and avoids extra network round-trips.
      // Let's make sure we update backend/src/controllers/course.controller.js first.
      const res2 = await apiClient.get(`/courses/${courseId}`);
      return res2.data;
    },
  });

  // Query: Get all learners (to populate the select input for enrollment)
  const { data: learnersData } = useQuery({
    queryKey: ['all-learners'],
    queryFn: async () => {
      const res = await apiClient.get('/learners', { params: { limit: 100 } });
      return res.data;
    },
  });

  // Mutation: Enroll Learner
  const enrollMutation = useMutation({
    mutationFn: async (payload: { learnerId: string; courseId: string }) => {
      const res = await apiClient.post('/enrollments', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-detail', courseId] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      setSelectedLearnerId('');
      setEnrollError(null);
    },
    onError: (err: any) => {
      setEnrollError(err.response?.data?.message || 'Failed to enroll student.');
    }
  });

  // Mutation: Update Enrollment
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { status: string; progressPercent: number } }) => {
      const res = await apiClient.put(`/enrollments/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-detail', courseId] });
      setEditingEnrollmentId(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to update student progress.');
    }
  });

  // Mutation: Drop Enrollment
  const dropMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/enrollments/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-detail', courseId] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to drop student.');
    }
  });

  const handleEnrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLearnerId) return;
    setEnrollError(null);
    enrollMutation.mutate({ learnerId: selectedLearnerId, courseId: courseId as string });
  };

  const handleOpenEdit = (enrollment: Enrollment) => {
    setEditingEnrollmentId(enrollment.id);
    setEditStatus(enrollment.status);
    setEditProgress(enrollment.progressPercent);
  };

  const handleSaveEdit = (enrollmentId: string) => {
    updateMutation.mutate({
      id: enrollmentId,
      data: {
        status: editStatus,
        progressPercent: editProgress,
      },
    });
  };

  const handleDrop = (enrollmentId: string) => {
    if (confirm('Are you sure you want to drop this student from the course roster?')) {
      dropMutation.mutate(enrollmentId);
    }
  };

  if (isLoading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
        <p className="text-xs text-slate-500">Retrieving course roster...</p>
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="bg-red-500/5 border border-red-500/20 text-red-400 p-4 rounded-xl text-center">
        <p>Failed to load course detail page. Return to safety.</p>
        <button onClick={() => router.push('/dashboard/courses')} className="mt-3 text-xs bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg font-semibold hover:bg-red-500/25 transition-all">
          Back to Courses
        </button>
      </div>
    );
  }

  const rosterList = course.enrollments || [];
  const currentCount = rosterList.length;

  // Filter out learners who are already enrolled
  const allLearners: Learner[] = learnersData?.learners || [];
  const availableLearners = allLearners.filter(
    (l) => !rosterList.some((enr) => enr.learnerId === l.id)
  );

  return (
    <div className="space-y-6">
      
      {/* Back Button and Header */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => router.push('/dashboard/courses')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-250 self-start transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Courses</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{course.title}</h1>
            <p className="text-sm text-slate-400 mt-1">
              Roster management, enrollment validation, and student progress metrics.
            </p>
          </div>
          <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider self-start ${
            course.status === 'PUBLISHED'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
              : 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
          }`}>
            {course.status}
          </span>
        </div>
      </div>

      {/* Course Detail Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Core Info */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800/80 rounded-xl p-6 space-y-4 shadow-xl">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Curriculum Details</h3>
          <p className="text-sm text-slate-300 leading-relaxed">{course.description || 'No description provided.'}</p>
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800/60 text-xs">
            <div>
              <span className="text-slate-500 block">Category</span>
              <span className="text-slate-200 font-semibold mt-0.5 block">{course.category}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Assigned Instructor</span>
              <span className="text-slate-200 font-semibold mt-0.5 block">{course.instructor.name}</span>
            </div>
          </div>
        </div>

        {/* Capacity Stat */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-6 flex flex-col justify-between shadow-xl">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Classroom Load</h3>
          <div className="my-auto py-2">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white">{currentCount}</span>
              <span className="text-slate-500 text-sm">/ {course.capacity} Students Enrolled</span>
            </div>
            {/* Progress Load Bar */}
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden mt-3.5 border border-slate-800">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  currentCount >= course.capacity 
                    ? 'bg-red-500' 
                    : currentCount >= course.capacity * 0.8 
                    ? 'bg-amber-500' 
                    : 'bg-indigo-500'
                }`}
                style={{ width: `${Math.min(100, (currentCount / course.capacity) * 100)}%` }}
              />
            </div>
          </div>
          <div className="text-[10px] text-slate-500 mt-2">
            {currentCount >= course.capacity 
              ? 'Roster is at full capacity.' 
              : `${course.capacity - currentCount} remaining seats available.`}
          </div>
        </div>
      </div>

      {/* Roster & Add Enrollment sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Enrolled Students Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800/80 rounded-xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Student Roster</h3>
            <span className="text-xs text-slate-500 font-medium">{currentCount} active enrollments</span>
          </div>

          {rosterList.length === 0 ? (
            <div className="p-8 text-center">
              <UserCheck className="w-8 h-8 text-slate-700 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-350">Roster is empty</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                No students are currently enrolled. Select a student on the right panel to begin.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-900/40 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="px-6 py-3">Student Name</th>
                    <th className="px-6 py-3">Progress</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-sm">
                  {rosterList.map((enr) => {
                    const isEditing = editingEnrollmentId === enr.id;
                    return (
                      <tr key={enr.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white">{enr.learner.name}</div>
                          <div className="text-xs text-slate-500">{enr.learner.email} · {enr.learner.cohort}</div>
                        </td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={editProgress}
                                onChange={(e) => setEditProgress(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                                className="w-16 bg-slate-955 border border-slate-800 text-white rounded px-2 py-1 text-xs outline-none"
                              />
                              <span className="text-xs text-slate-500">%</span>
                            </div>
                          ) : (
                            <div className="space-y-1.5 w-32">
                              <div className="flex justify-between text-xs text-slate-400 font-semibold">
                                <span>{enr.progressPercent}%</span>
                              </div>
                              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                                <div 
                                  className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                                  style={{ width: `${enr.progressPercent}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <select
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value as any)}
                              className="bg-slate-955 border border-slate-800 text-white text-xs rounded px-2 py-1 outline-none"
                            >
                              <option value="ACTIVE">Active</option>
                              <option value="COMPLETED">Completed</option>
                              <option value="DROPPED">Dropped</option>
                            </select>
                          ) : (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              enr.status === 'COMPLETED'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                : enr.status === 'DROPPED'
                                ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                                : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                            }`}>
                              {enr.status === 'COMPLETED' ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Completed</span>
                                </>
                              ) : enr.status === 'DROPPED' ? (
                                <>
                                  <XCircle className="w-3 h-3" />
                                  <span>Dropped</span>
                                </>
                              ) : (
                                <>
                                  <TrendingUp className="w-3 h-3" />
                                  <span>Active</span>
                                </>
                              )}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => handleSaveEdit(enr.id)}
                                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingEnrollmentId(null)}
                                  className="px-2.5 py-1 border border-slate-850 hover:bg-slate-800 text-slate-300 rounded text-xs font-semibold transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleOpenEdit(enr)}
                                  className="p-1.5 bg-slate-850 hover:bg-slate-850 text-slate-400 hover:text-white rounded-md transition-colors cursor-pointer"
                                  title="Edit Progress"
                                >
                                  <Sliders className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDrop(enr.id)}
                                  className="p-1.5 bg-slate-850 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-md transition-colors cursor-pointer"
                                  title="Drop Student"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Enroll Student Panel */}
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-6 shadow-xl h-fit">
          <h3 className="text-sm font-bold text-white mb-2">Assign Student</h3>
          <p className="text-xs text-slate-400 mb-6">
            Enroll a registered learner into this course workspace. Note that course capacity is validated.
          </p>

          {enrollError && (
            <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg p-3">
              {enrollError}
            </div>
          )}

          <form onSubmit={handleEnrollSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-355 uppercase tracking-wider mb-2">
                Select Learner Profile
              </label>
              
              {availableLearners.length === 0 ? (
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-center text-xs text-slate-500 italic">
                  No registered learners available for enrollment.
                </div>
              ) : (
                <select
                  value={selectedLearnerId}
                  onChange={(e) => setSelectedLearnerId(e.target.value)}
                  className="w-full bg-slate-955 border border-slate-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-all"
                  required
                >
                  <option value="" disabled>-- Choose Learner Profile --</option>
                  {availableLearners.map((learner) => (
                    <option key={learner.id} value={learner.id}>
                      {learner.name} ({learner.cohort} · {learner.skillLevel})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <button
              type="submit"
              disabled={!selectedLearnerId || currentCount >= course.capacity || enrollMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-slate-850 disabled:to-slate-850 text-white text-sm font-semibold rounded-lg shadow-lg hover:shadow-indigo-500/20 disabled:shadow-none transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {enrollMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  <span>Enrolling...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Enroll Learner</span>
                </>
              )}
            </button>

            {currentCount >= course.capacity && (
              <div className="flex gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] rounded p-2">
                <BadgeAlert className="w-4 h-4 flex-shrink-0" />
                <span>Roster capacity limit reached. You must edit course limit size or drop a student before enrolling new ones.</span>
              </div>
            )}
          </form>
        </div>

      </div>

    </div>
  );
}
