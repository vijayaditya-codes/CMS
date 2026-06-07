'use client';

import React, { useState } from 'react';
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
  Users,
  Compass,
  Mail,
  Sliders,
  BadgeAlert
} from 'lucide-react';

interface Enrollment {
  id: string;
  courseId: string;
  status: 'ACTIVE' | 'DROPPED' | 'COMPLETED';
  progressPercent: number;
  course: {
    id: string;
    title: string;
  };
}

interface Learner {
  id: string;
  name: string;
  email: string;
  skillLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  cohort: string;
  enrollments: Enrollment[];
}

export default function LearnersPage() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 8;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLearner, setSelectedLearner] = useState<Learner | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formSkillLevel, setFormSkillLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('BEGINNER');
  const [formCohort, setFormCohort] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Query: Get learners list
  const { data, isLoading, isError } = useQuery({
    queryKey: ['learners', page, search],
    queryFn: async () => {
      const params: any = { page, limit };
      if (search) params.search = search;
      const res = await apiClient.get('/learners', { params });
      return res.data;
    },
  });

  // Mutation: Create Learner
  const createMutation = useMutation({
    mutationFn: async (newLearner: any) => {
      const res = await apiClient.post('/learners', newLearner);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learners'] });
      closeModal();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Failed to register learner.');
    }
  });

  // Mutation: Update Learner
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiClient.put(`/learners/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learners'] });
      closeModal();
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Failed to edit learner.');
    }
  });

  // Mutation: Delete Learner
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`/learners/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learners'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to remove learner.');
    }
  });

  const handleOpenCreate = () => {
    setSelectedLearner(null);
    setFormName('');
    setFormEmail('');
    setFormSkillLevel('BEGINNER');
    setFormCohort('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (learner: Learner) => {
    setSelectedLearner(learner);
    setFormName(learner.name);
    setFormEmail(learner.email);
    setFormSkillLevel(learner.skillLevel);
    setFormCohort(learner.cohort);
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedLearner(null);
    setFormError(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail || !formCohort) {
      setFormError('Please fill in all required fields.');
      return;
    }

    const payload = {
      name: formName,
      email: formEmail,
      skillLevel: formSkillLevel,
      cohort: formCohort,
    };

    if (selectedLearner) {
      updateMutation.mutate({ id: selectedLearner.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this learner? This will delete all course enrollments linked to this learner.')) {
      deleteMutation.mutate(id);
    }
  };

  const learnersList: Learner[] = data?.learners || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Learners Database
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {isAdmin 
              ? 'Add, edit, and orchestrate learners profiles and skill levels.' 
              : 'View learners enrolled across your instruction courses.'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 self-start px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-indigo-500/10 transition-all hover:shadow-indigo-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Learner</span>
          </button>
        )}
      </div>

      {/* Query Filters */}
      <div className="flex bg-slate-900/40 border border-slate-800/60 rounded-xl p-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search learners by name, email, or cohort year..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-955 border border-slate-800/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-white rounded-lg pl-10 pr-4 py-2 text-sm transition-all outline-none"
          />
        </div>
      </div>

      {/* Learners Table grid */}
      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center border border-slate-800/60 bg-slate-900/10 rounded-xl">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
          <p className="text-xs text-slate-500">Retrieving student records...</p>
        </div>
      ) : isError ? (
        <div className="h-64 flex flex-col items-center justify-center border border-red-500/20 bg-red-500/5 rounded-xl">
          <p className="text-sm text-red-400">Failed to fetch learners data. Please try again.</p>
        </div>
      ) : learnersList.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center border border-slate-800/60 bg-slate-900/10 rounded-xl text-center px-4">
          <Users className="w-10 h-10 text-slate-600 mb-2" />
          <h3 className="text-sm font-semibold text-slate-300">No learners found</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            {isAdmin 
              ? 'Get started by creating your first student profile.' 
              : 'There are currently no learners enrolled in your active courses.'}
          </p>
        </div>
      ) : (
        <div className="border border-slate-800/60 bg-slate-900/20 backdrop-blur-md rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 bg-slate-900/60 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Student Profile</th>
                  <th className="px-6 py-4">Cohort</th>
                  <th className="px-6 py-4">Skill level</th>
                  <th className="px-6 py-4">Enrolled Courses</th>
                  {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm text-slate-300">
                {learnersList.map((learner) => (
                  <tr key={learner.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{learner.name}</div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <Mail className="w-3.5 h-3.5 text-slate-600" />
                        <span>{learner.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-300">{learner.cohort}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.75 rounded-full text-xs font-semibold ${
                        learner.skillLevel === 'BEGINNER' 
                          ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' 
                          : learner.skillLevel === 'INTERMEDIATE'
                          ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                          : 'bg-violet-500/15 text-violet-400 border border-violet-500/20'
                      }`}>
                        {learner.skillLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {learner.enrollments.length === 0 ? (
                        <span className="text-xs text-slate-600 italic">Not enrolled</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 max-w-sm">
                          {learner.enrollments.map((enr) => (
                            <span 
                              key={enr.id} 
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                enr.status === 'COMPLETED'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                  : enr.status === 'DROPPED'
                                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                  : 'bg-slate-800 text-slate-300 border-slate-700/60'
                              }`}
                              title={`Status: ${enr.status} · Progress: ${enr.progressPercent}%`}
                            >
                              {enr.course.title} ({enr.progressPercent}%)
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(learner)}
                            className="p-1.5 bg-slate-850 hover:bg-slate-800 text-slate-450 hover:text-white rounded-md transition-colors cursor-pointer"
                            title="Edit Profile"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(learner.id)}
                            className="p-1.5 bg-slate-850 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded-md transition-colors cursor-pointer"
                            title="Remove Learner"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-800/80 px-6 py-4 bg-slate-900/30">
              <span className="text-xs text-slate-500 font-medium">
                Showing Page <span className="text-slate-300 font-semibold">{pagination.page}</span> of <span className="text-slate-300 font-semibold">{pagination.totalPages}</span>
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="p-2 border border-slate-800 disabled:border-slate-850 text-slate-400 disabled:text-slate-650 hover:bg-slate-800 rounded-lg transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page === pagination.totalPages}
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  className="p-2 border border-slate-800 disabled:border-slate-850 text-slate-400 disabled:text-slate-650 hover:bg-slate-800 rounded-lg transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Editor Modal */}
      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={closeModal} />
          
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800/90 rounded-2xl shadow-2xl p-6 md:p-8 z-10 animate-fadeIn">
            
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 p-1 text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">
              {selectedLearner ? 'Configure Learner Record' : 'Enroll New Learner Profile'}
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Create platform profiles for students and structure their skill classifications.
            </p>

            {formError && (
              <div className="mb-5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg p-3">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Alexander Mercer"
                  className="w-full bg-slate-955 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-white rounded-lg px-3.5 py-2 text-sm transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-355 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="e.g., alex@university.edu"
                  className="w-full bg-slate-955 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-white rounded-lg px-3.5 py-2 text-sm transition-all outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-355 uppercase tracking-wider mb-1.5">
                    Skill Level Classification
                  </label>
                  <select
                    value={formSkillLevel}
                    onChange={(e) => setFormSkillLevel(e.target.value as any)}
                    className="w-full bg-slate-955 border border-slate-800 focus:border-indigo-500 text-white rounded-lg px-3 py-2 text-sm outline-none transition-all"
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-355 uppercase tracking-wider mb-1.5">
                    Cohort Group
                  </label>
                  <input
                    type="text"
                    required
                    value={formCohort}
                    onChange={(e) => setFormCohort(e.target.value)}
                    placeholder="e.g., 2026-Q3"
                    className="w-full bg-slate-955 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-white rounded-lg px-3.5 py-2 text-sm transition-all outline-none"
                  />
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
                  <span>{selectedLearner ? 'Save Changes' : 'Register Learner'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
