'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/providers/AuthProvider';
import Link from 'next/link';
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Loader2,
  CheckCircle,
  FileText,
  GraduationCap
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  category: string;
  status: 'DRAFT' | 'PUBLISHED';
  capacity: number;
  instructor: {
    name: string;
  };
  _count?: {
    enrollments: number;
  };
}

interface Stats {
  totalCourses: number;
  activeLearners: number;
  averageCompletionRate: number;
}

export default function DashboardPage() {
  const { user } = useAuth();

  // Search, filter and pagination state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const limit = 5; // Concise table for dashboard view

  // Query: Get dashboard summary stats
  const { data: stats, isLoading: isStatsLoading } = useQuery<Stats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/dashboard/stats');
      return res.data;
    },
  });

  // Query: Get paginated courses list
  const { data: coursesData, isLoading: isCoursesLoading, isError } = useQuery({
    queryKey: ['dashboard-courses', page, search, statusFilter],
    queryFn: async () => {
      const params: any = { page, limit };
      if (search) params.search = search;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await apiClient.get('/courses', { params });
      return res.data;
    },
  });

  const coursesList: Course[] = coursesData?.courses || [];
  const pagination = coursesData?.pagination || { page: 1, totalPages: 1, total: 0 };

  return (
    <div className="space-y-8">
      
      {/* Greetings */}
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Welcome back, {user?.name}
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Here is a summary of the learning system metrics and course configurations.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Card 1: Total Courses */}
        <div className="relative overflow-hidden bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl flex items-center justify-between group hover:border-indigo-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl group-hover:bg-indigo-500/10 transition-all pointer-events-none" />
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-450 uppercase tracking-wider block">Total Courses</span>
            {isStatsLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            ) : (
              <span className="text-3xl font-extrabold text-white block">
                {stats?.totalCourses || 0}
              </span>
            )}
            <span className="text-[10px] text-slate-500 block">Active listings in database</span>
          </div>
          <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/20 text-indigo-400 shadow-lg shadow-indigo-500/5 group-hover:scale-105 transition-all">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Active Learners */}
        <div className="relative overflow-hidden bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl flex items-center justify-between group hover:border-emerald-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all pointer-events-none" />
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-450 uppercase tracking-wider block">Active Learners</span>
            {isStatsLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
            ) : (
              <span className="text-3xl font-extrabold text-white block">
                {stats?.activeLearners || 0}
              </span>
            )}
            <span className="text-[10px] text-slate-500 block">Enrolled in active courses</span>
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/5 group-hover:scale-105 transition-all">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Avg Completion Rate */}
        <div className="relative overflow-hidden bg-slate-900 border border-slate-800/80 rounded-2xl p-6 shadow-xl flex items-center justify-between group hover:border-violet-500/30 transition-all duration-300">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-24 h-24 bg-violet-500/5 rounded-full blur-xl group-hover:bg-violet-500/10 transition-all pointer-events-none" />
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-455 uppercase tracking-wider block">Avg Progress Rate</span>
            {isStatsLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
            ) : (
              <span className="text-3xl font-extrabold text-white block">
                {stats?.averageCompletionRate || 0}%
              </span>
            )}
            <span className="text-[10px] text-slate-500 block">Average student module progress</span>
          </div>
          <div className="w-12 h-12 bg-violet-500/10 rounded-xl flex items-center justify-center border border-violet-500/20 text-violet-400 shadow-lg shadow-violet-500/5 group-hover:scale-105 transition-all">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Course Table Section */}
      <div className="space-y-4">
        
        {/* Table Filters Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-455" />
            <span>Course Catalog Overview</span>
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search catalog..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-950/60 border border-slate-800/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 text-white rounded-lg pl-9 pr-4 py-1.5 text-xs transition-all outline-none"
              />
            </div>

            {/* Status Selector */}
            <div className="flex bg-slate-955 border border-slate-800/80 rounded-lg p-0.5">
              {['ALL', 'PUBLISHED', 'DRAFT'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => {
                    setStatusFilter(filter);
                    setPage(1);
                  }}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                    statusFilter === filter
                      ? 'bg-slate-850 text-indigo-400 shadow-sm border border-slate-800/40'
                      : 'text-slate-450 hover:text-slate-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Rendering */}
        {isCoursesLoading ? (
          <div className="h-48 flex flex-col items-center justify-center border border-slate-805/60 bg-slate-900/10 rounded-xl">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-550 mb-2" />
            <p className="text-xs text-slate-500">Loading catalog logs...</p>
          </div>
        ) : isError ? (
          <div className="h-48 flex flex-col items-center justify-center border border-red-500/20 bg-red-500/5 rounded-xl">
            <p className="text-sm text-red-400">Failed to retrieve course table list.</p>
          </div>
        ) : coursesList.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center border border-slate-805/60 bg-slate-900/10 rounded-xl text-center">
            <BookOpen className="w-8 h-8 text-slate-700 mb-2" />
            <h3 className="text-sm font-semibold text-slate-300">No courses match filters</h3>
          </div>
        ) : (
          <div className="border border-slate-805/60 bg-slate-900/20 backdrop-blur-md rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-805/80 bg-slate-900/60 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="px-6 py-3.5">Title</th>
                    <th className="px-6 py-3.5">Category</th>
                    <th className="px-6 py-3.5">Instructor</th>
                    <th className="px-6 py-3.5">Enrollment / Capacity</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-805/50 text-xs text-slate-300">
                  {coursesList.map((course) => (
                    <tr key={course.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-3.5">
                        <div className="font-semibold text-white truncate max-w-xs">{course.title}</div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="px-2 py-0.5 bg-slate-850 text-slate-350 rounded font-medium">
                          {course.category}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="font-medium text-slate-200">{course.instructor.name}</span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-slate-100">{course._count?.enrollments || 0}</span>
                          <span className="text-slate-600">/</span>
                          <span className="text-slate-450">{course.capacity}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          course.status === 'PUBLISHED'
                            ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/15'
                            : 'bg-amber-500/10 text-amber-455 border border-amber-500/15'
                        }`}>
                          {course.status === 'PUBLISHED' ? (
                            <>
                              <CheckCircle className="w-2.5 h-2.5" />
                              <span>Published</span>
                            </>
                          ) : (
                            <>
                              <FileText className="w-2.5 h-2.5" />
                              <span>Draft</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <Link
                          href={`/dashboard/courses/${course.id}`}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          <span>Manage Roster</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-805/80 px-6 py-3 bg-slate-900/30">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <div className="flex gap-1.5">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="p-1.5 border border-slate-850 disabled:border-slate-900 text-slate-400 disabled:text-slate-700 hover:bg-slate-800 rounded transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={page === pagination.totalPages}
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    className="p-1.5 border border-slate-850 disabled:border-slate-900 text-slate-400 disabled:text-slate-700 hover:bg-slate-800 rounded transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
