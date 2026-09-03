'use client';

import { useUser } from '@/components/providers/user-provider';
import { getInitials } from '@/lib/utils';

export default function DashboardPage() {
  const { profile, activeRole } = useUser();

  const getRoleBadgeColor = () => {
    switch (activeRole) {
      case 'teacher_admin': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'student_admin': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'teacher': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Semester */}
      <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl shrink-0">
            {getInitials(profile.full_name)}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome back, {profile.full_name}!</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-muted-foreground text-sm">Here's what's happening today.</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium capitalize ${getRoleBadgeColor()}`}>
                {activeRole.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Role-Specific Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {activeRole === 'student' && (
          <>
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-64">
              <h2 className="font-semibold text-lg mb-4">My Subjects</h2>
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-lg">
                Loading subjects...
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-64">
              <h2 className="font-semibold text-lg mb-4">Upcoming Assignments</h2>
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-lg">
                No upcoming assignments
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-64">
              <h2 className="font-semibold text-lg mb-4">Recent Announcements</h2>
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-lg">
                No recent announcements
              </div>
            </div>
          </>
        )}

        {activeRole === 'teacher' && (
          <>
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-64">
              <h2 className="font-semibold text-lg mb-4">My Departments</h2>
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-lg">
                Loading departments...
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col h-64 lg:col-span-2">
              <h2 className="font-semibold text-lg mb-4">Recent Submissions</h2>
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-lg">
                No recent submissions to grade
              </div>
            </div>
          </>
        )}

        {activeRole === 'student_admin' && (
          <>
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Students</h3>
              <p className="text-3xl font-bold">-</p>
              <span className="text-xs text-emerald-500 font-medium mt-2 block">Loading...</span>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Teachers</h3>
              <p className="text-3xl font-bold">-</p>
              <span className="text-xs text-emerald-500 font-medium mt-2 block">Loading...</span>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Active Departments</h3>
              <p className="text-3xl font-bold">-</p>
              <span className="text-xs text-muted-foreground mt-2 block">Loading...</span>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm lg:col-span-3 min-h-[300px] flex flex-col">
              <h2 className="font-semibold text-lg mb-4">Quick Actions</h2>
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-lg">
                Action panel loading...
              </div>
            </div>
          </>
        )}

        {activeRole === 'teacher_admin' && (
          <>
             <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Universitys</h3>
              <p className="text-3xl font-bold">-</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Platform Users</h3>
              <p className="text-3xl font-bold">-</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm lg:col-span-3 min-h-[300px] flex flex-col">
              <h2 className="font-semibold text-lg mb-4">System Overview</h2>
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-lg">
                System analytics loading...
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
