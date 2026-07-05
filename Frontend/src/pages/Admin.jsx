import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Video, ArrowLeft, ShieldCheck, Database, Layers, CheckCircle2 } from 'lucide-react';
import { NavLink } from 'react-router';
import axiosClient from '../utils/axiosclient';

function Admin() {
  const [stats, setStats] = useState({ total: 0, loading: true });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axiosClient.get('/problem/getAllProblems');
        setStats({ total: data.length || 0, loading: false });
      } catch (err) {
        setStats({ total: 0, loading: false });
      }
    };
    fetchStats();
  }, []);

  const adminOptions = [
    {
      id: 'create',
      title: 'Create Problem',
      description: 'Add a new coding challenge with test cases and solution code',
      icon: Plus,
      color: 'from-emerald-500 to-teal-600',
      btnColor: 'btn-success',
      badge: 'New',
      route: '/admin/create'
    },
    {
      id: 'update',
      title: 'Update Problem',
      description: 'Modify existing problem descriptions, difficulty, or test cases',
      icon: Edit,
      color: 'from-amber-500 to-orange-600',
      btnColor: 'btn-warning',
      badge: 'Manage',
      route: '/admin/update'
    },
    {
      id: 'delete',
      title: 'Delete Problem',
      description: 'Remove problems and their associated user submissions',
      icon: Trash2,
      color: 'from-rose-500 to-red-600',
      btnColor: 'btn-error',
      badge: 'Caution',
      route: '/admin/delete'
    },
    {
      id: 'video',
      title: 'Video Editorials',
      description: 'Upload, replace, and manage video walkthrough solutions',
      icon: Video,
      color: 'from-purple-500 to-indigo-600',
      btnColor: 'btn-primary',
      badge: 'Media',
      route: '/admin/video'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-300 via-base-200 to-base-300 pb-16">
      {/* Top Bar */}
      <div className="navbar bg-base-100/80 backdrop-blur-md border-b border-base-300 sticky top-0 z-50 px-6">
        <div className="flex-1">
          <NavLink to="/problems" className="btn btn-ghost gap-2 font-normal">
            <ArrowLeft size={18} />
            <span>Back to Platform</span>
          </NavLink>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-primary badge-outline font-medium gap-1 px-3 py-3">
            <ShieldCheck size={14} />
            Administrator Mode
          </span>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-10">
        {/* Header Section */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4 text-primary">
            <Layers size={36} />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-base-content mb-4">
            Admin Control Center
          </h1>
          <p className="text-base-content/70 text-lg">
            Create, update, and orchestrate algorithmic challenges, test cases, and video editorials.
          </p>
          
          {/* Quick Stats Pill */}
          <div className="mt-6 inline-flex items-center gap-3 bg-base-100 px-6 py-3 rounded-full shadow-md border border-base-300">
            <Database className="text-primary" size={20} />
            <span className="text-sm font-semibold text-base-content/80">Total Active Problems:</span>
            <span className="badge badge-lg badge-primary font-bold">
              {stats.loading ? '...' : stats.total}
            </span>
          </div>
        </div>

        {/* Admin Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {adminOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <NavLink
                key={option.id}
                to={option.route}
                className="group relative bg-base-100 rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-base-300 hover:border-primary/50 flex flex-col justify-between overflow-hidden transform hover:-translate-y-1.5"
              >
                {/* Top Glowing Gradient Accent */}
                <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${option.color} opacity-80 group-hover:opacity-100 transition-opacity`} />
                
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-6 pt-2">
                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${option.color} text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent size={28} />
                    </div>
                    <span className="badge badge-sm badge-ghost font-medium">
                      {option.badge}
                    </span>
                  </div>

                  {/* Title & Desc */}
                  <h2 className="text-xl font-bold text-base-content mb-2 group-hover:text-primary transition-colors">
                    {option.title}
                  </h2>
                  <p className="text-base-content/60 text-sm leading-relaxed mb-6">
                    {option.description}
                  </p>
                </div>

                {/* Action CTA */}
                <div className="pt-4 border-t border-base-200 flex items-center justify-between text-sm font-semibold text-primary group-hover:translate-x-1 transition-transform">
                  <span>Launch Tool</span>
                  <span>→</span>
                </div>
              </NavLink>
            );
          })}
        </div>

        {/* System Status Footer Banner */}
        <div className="max-w-4xl mx-auto mt-16 bg-base-100/60 backdrop-blur border border-base-300 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-success flex-shrink-0" size={24} />
            <div>
              <h4 className="font-bold text-base-content">Judge0 Compiler Engine Online</h4>
              <p className="text-xs text-base-content/60">All code executions and test case validations are active.</p>
            </div>
          </div>
          <NavLink to="/problems" className="btn btn-sm btn-outline">
            View Live Platform
          </NavLink>
        </div>
      </div>
    </div>
  );
}

export default Admin;