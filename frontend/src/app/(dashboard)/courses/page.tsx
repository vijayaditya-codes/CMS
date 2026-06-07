'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/providers/AuthProvider';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Filter,
  CheckCircle,
  FileText,
  Users
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'DRAFT' | 'PUBLISHED';
  capacity: number;
  instructorId: string;
  instructor: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    enrollments: number;
  };
}

interface Instructor {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function CoursesPage() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Search, filter and pagination state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const limit = 8;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formCapacity, setFormCapacity] = useState(30);
  const [formStatus, setFormStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
  const [formInstructorId, setFormInstructorId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Query: Get courses
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['courses', page, search, statusFilter],
    queryFn: async () => {
      const params: any = { page, limit };
      if (search) params.search = search;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await apiClient.get('/courses', { params });
      return res.data;
    },
  });

  // Query: Get instructors (only for Admins to select)
  const { data: instructors } = useQuery<Instructor[]>({
    queryKey: ['instructors'],
    queryFn: async () => {
      const res = await apiClient.get('/users/instructors');
      return res.data;
    },
    enabled: !!isAdmin,
  });

  // Mutation: Create Course
  const createMutation = useMutation({
    mutationFn: async (newCourse: any) => {
      const res = await apiClient.post('/courses', newCourse);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      closeModal();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Failed to create course.');
    }
  });

  // Mutation: Update Course
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiClient.put(`/courses/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      closeModal();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Failed to update course.');
    }
  });

  // Mutation: Delete Course
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/courses/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to delete course.');
    }
  });

  // Modal Open for Create
  const handleOpenCreate = () => {
    setSelectedCourse(null);
    setFormTitle('');
    setFormDescription('');
    setFormCategory('');
    setFormCapacity(30);
    setFormStatus('DRAFT');
    setFormInstructorId(user?.id || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Modal Open for Edit
  const handleOpenEdit = (course: Course) => {
    setSelectedCourse(course);
    setFormTitle(course.title);
    setFormDescription(course.description);
    setFormCategory(course.category);
    setFormCapacity(course.capacity);
    setFormStatus(course.status);
    setFormInstructorId(course.instructorId);
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCourse(null);
    setFormError(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formCategory || formCapacity <= 0) {
      setFormError('Please enter a valid title, category, and capacity.');
      return;
    }

    const payload: any = {
      title: formTitle,
      description: formDescription,
      category: formCategory,
      capacity: formCapacity,
      status: formStatus,
    };

    if (isAdmin) {
      payload.instructorId = formInstructorId;
    }

    if (selectedCourse) {
      updateMutation.mutate({ id: selectedCourse.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  const coursesList: Course[] = data?.courses || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Courses Workspace
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {isAdmin ? 'Manage platform course listings and assign staff.' : 'Manage your course curriculum and configurations.'}
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 self-start px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-indigo-500/10 transition-all hover:shadow-indigo-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Course</span>
        </button>
      </div>

      {/* Query Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-slate-900/40 border border-slate-800/60 rounded-xl p-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by title, description, or category..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-950/60 border border-slate-800/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-white rounded-lg pl-10 pr-4 py-2 text-sm transition-all outline-none"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <div className="flex bg-slate-955 border border-slate-800/80 rounded-lg p-0.5">
            {['ALL', 'PUBLISHED', 'DRAFT'].map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setStatusFilter(filter);
                  setPage(1);
                }}
                className={`px-3.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${statusFilter === filter
                    ? 'bg-slate-800 text-indigo-400 shadow-sm border border-slate-700/60'
                    : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                {filter.charAt(0) + filter.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Courses Table/Grid view */}
      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center border border-slate-805/60 bg-slate-900/10 rounded-xl">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
          <p className="text-xs text-slate-500">Retrieving course list...</p>
        </div>
      ) : isError ? (
        <div className="h-64 flex flex-col items-center justify-center border border-red-500/20 bg-red-500/5 rounded-xl">
          <p className="text-sm text-red-400">Failed to fetch courses. Please try again.</p>
        </div>
      ) : coursesList.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center border border-slate-805/60 bg-slate-900/10 rounded-xl text-center px-4">
          <BookOpen className="w-10 h-10 text-slate-600 mb-2" />
          <h3 className="text-sm font-semibold text-slate-300">No courses found</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Try resetting your filters or create a new course structure.
          </p>
        </div>
      ) : (
        <div className="border border-slate-805/60 bg-slate-900/20 backdrop-blur-md rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-805/80 bg-slate-900/60 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Course Details</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Instructor</th>
                  <th className="px-6 py-4">Enrollment / Capacity</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-805/50 text-sm text-slate-300">
                {coursesList.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white truncate max-w-xs">{course.title}</div>
                      <div className="text-xs text-slate-500 line-clamp-1 max-w-xs mt-0.5">{course.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.75 bg-slate-800 text-slate-300 rounded-md text-xs font-semibold">
                        {course.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-200">{course.instructor.name}</div>
                      <div className="text-xs text-slate-500">{course.instructor.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-100">{course._count?.enrollments || 0}</span>
                        <span className="text-slate-600">/</span>
                        <span className="text-slate-400">{course.capacity}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.75 rounded-full text-xs font-semibold ${course.status === 'PUBLISHED'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                        }`}>
                        {course.status === 'PUBLISHED' ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            <span>Published</span>
                          </>
                        ) : (
                          <>
                            <FileText className="w-3 h-3" />
                            <span>Draft</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/dashboard/courses/${course.id}`}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-450 hover:text-white rounded-md transition-colors"
                          title="Manage Roster"
                        >
                          <Users className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => handleOpenEdit(course)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-405 hover:text-white rounded-md transition-colors cursor-pointer"
                          title="Edit Course"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(course.id)}
                          className="p-1.5 bg-slate-850 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-md transition-colors cursor-pointer"
                          title="Delete Course"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-805/80 px-6 py-4 bg-slate-900/30">
              <span className="text-xs text-slate-500 font-medium">
                Showing Page <span className="text-slate-300 font-semibold">{pagination.page}</span> of <span className="text-slate-300 font-semibold">{pagination.totalPages}</span>
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="p-2 border border-slate-800 disabled:border-slate-850 text-slate-400 disabled:text-slate-650 hover:bg-slate-805 rounded-lg transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page === pagination.totalPages}
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  className="p-2 border border-slate-800 disabled:border-slate-850 text-slate-400 disabled:text-slate-650 hover:bg-slate-805 rounded-lg transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Editor Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={closeModal} />

          {/* Modal Container */}
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800/90 rounded-2xl shadow-2xl p-6 md:p-8 z-10 animate-fadeIn">

            <button
              onClick={closeModal}
              className="absolute right-4 top-4 p-1 text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">
              {selectedCourse ? 'Configure Course Curriculum' : 'Create Course Curriculum'}
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Enter core details about course status, categories, and capacities.
            </p>

            {formError && (
              <div className="mb-5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg p-3">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-1.5">
                  Course Title
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., Mastering Algorithms with Python"
                  className="w-full bg-slate-955 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-white rounded-lg px-3.5 py-2 text-sm transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-355 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Course curriculum layout and details..."
                  rows={3}
                  className="w-full bg-slate-955 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-white rounded-lg px-3.5 py-2 text-sm transition-all outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-355 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <input
                    type="text"
                    required
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="e.g., Computer Science"
                    className="w-full bg-slate-955 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-white rounded-lg px-3.5 py-2 text-sm transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-355 uppercase tracking-wider mb-1.5">
                    Max Capacity
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(parseInt(e.target.value) || 0)}
                    placeholder="30"
                    className="w-full bg-slate-955 border border-slate-805 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-white rounded-lg px-3.5 py-2 text-sm transition-all outline-none"
                  />
                </div>
              </div>

              {/* Instructor select dropdown for Admin role */}
              {isAdmin && instructors && (
                <div>
                  <label className="block text-xs font-semibold text-slate-355 uppercase tracking-wider mb-1.5">
                    Assign Instructor
                  </label>
                  <select
                    value={formInstructorId}
                    onChange={(e) => setFormInstructorId(e.target.value)}
                    className="w-full bg-slate-955 border border-slate-805 focus:border-indigo-500 text-white rounded-lg px-3 py-2 text-sm outline-none transition-all"
                  >
                    <option value="" disabled>Select Staff Instructor</option>
                    {instructors.map((ins) => (
                      <option key={ins.id} value={ins.id}>
                        {ins.name} ({ins.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-355 uppercase tracking-wider mb-1.5">
                  Publishing Status
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={formStatus === 'DRAFT'}
                      onChange={() => setFormStatus('DRAFT')}
                      className="accent-indigo-500"
                    />
                    <span>Draft Structure</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={formStatus === 'PUBLISHED'}
                      onChange={() => setFormStatus('PUBLISHED')}
                      className="accent-indigo-500"
                    />
                    <span>Publish Curriculum</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-300 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold rounded-lg transition-all cursor-pointer"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  )}
                  <span>{selectedCourse ? 'Save Changes' : 'Create Course'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
