import { useEffect, useState } from 'react';
import axiosClient from '../utils/axiosclient';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { NavLink } from 'react-router';
import { ArrowLeft, Search, Edit, Code, AlertCircle, CheckCircle, Filter, Tag, Layers } from 'lucide-react';

const ALL_TAGS = ['Array', 'String', 'LinkedList', 'Stack', 'Queue', 'Heap', 'Tree', 'Graph', 'DP', 'Math', 'Sorting', 'Greedy', 'Binary Search', 'Hash Table', 'Two Pointers', 'Backtracking', 'Bit Manipulation', 'Dynamic Programming', 'Recursion', 'Sliding Window', 'Trie', 'Matrix', 'Design', 'Union Find', 'Prefix Sum'];

// Zod schema matching the problem schema
const problemSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  tags: z.array(z.string()).min(1, 'Select at least one tag'),
  visibleTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string(),
      explanation: z.string().min(1, 'Explanation is required')
    })
  ).min(1, 'At least one visible test case required'),
  hiddenTestCases: z.array(
    z.object({
      input: z.string().min(1, 'Input is required'),
      output: z.string()
    })
  ).min(1, 'At least one hidden test case required'),
  startCode: z.array(
    z.object({
      language: z.enum(['C++', 'Java', 'JavaScript']),
      initialCode: z.string().min(1, 'Initial code is required')
    })
  ).length(3, 'All three languages required'),
  referenceSolution: z.array(
    z.object({
      language: z.enum(['C++', 'Java', 'JavaScript']),
      initialCode: z.string().min(1, 'Complete code is required')
    })
  ).length(3, 'All three languages required')
});

const AdminUpdate = () => {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProblem, setEditingProblem] = useState(null);
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(problemSchema)
  });

  const {
    fields: visibleFields,
    append: appendVisible,
    remove: removeVisible
  } = useFieldArray({
    control,
    name: 'visibleTestCases'
  });

  const {
    fields: hiddenFields,
    append: appendHidden,
    remove: removeHidden
  } = useFieldArray({
    control,
    name: 'hiddenTestCases'
  });

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const { data } = await axiosClient.get('/problem/getAllProblems');
      setProblems(data);
    } catch (err) {
      setError('Failed to fetch problems');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = async (problem) => {
    try {
      setLoading(true);
      const { data: fullProblem } = await axiosClient.get(`/problem/admin/problemById/${problem._id}`);
      setEditingProblem(fullProblem);
      setFormError(null);
      setActiveTab(0);
      reset({
        title: fullProblem.title || '',
        description: fullProblem.description || '',
        difficulty: fullProblem.difficulty || 'Easy',
        tags: Array.isArray(fullProblem.tags) ? fullProblem.tags : (fullProblem.tags ? [fullProblem.tags] : ['Array']),
        visibleTestCases: fullProblem.visibleTestCases || [{ input: '', output: '', explanation: '' }],
        hiddenTestCases: fullProblem.hiddenTestCases || [{ input: '', output: '' }],
        startCode: fullProblem.startCode?.length === 3 ? fullProblem.startCode : [
          { language: 'C++', initialCode: '' },
          { language: 'Java', initialCode: '' },
          { language: 'JavaScript', initialCode: '' }
        ],
        referenceSolution: fullProblem.referenceSolution?.length === 3 ? fullProblem.referenceSolution : [
          { language: 'C++', initialCode: '' },
          { language: 'Java', initialCode: '' },
          { language: 'JavaScript', initialCode: '' }
        ]
      });
    } catch (err) {
      console.error("Error fetching full problem details:", err);
      alert("Failed to load problem details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      setFormError(null);
      const payload = {
        ...data,
        tags: Array.isArray(data.tags) ? data.tags : [data.tags]
      };
      await axiosClient.put(`/problem/update/${editingProblem._id}`, payload);
      alert('Problem updated successfully!');
      setEditingProblem(null);
      fetchProblems();
    } catch (error) {
      console.error("Update Problem Error:", error);
      const errObj = error.response?.data;
      let msg = errObj?.message || typeof errObj === 'string' ? errObj : error.message;
      if (errObj?.status && errObj?.expected) {
        msg = `Test case validation failed (${errObj.status})! Expected: ${errObj.expected}, but got: ${errObj.stdout || 'empty'}`;
      } else if (typeof errObj === 'object' && errObj !== null) {
        msg = JSON.stringify(errObj);
      }
      setFormError(`Error: ${msg}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFlatErrors = (errs) => {
    const flat = [];
    const traverse = (obj, path = "") => {
      if (!obj) return;
      if (obj.message) {
        let cleanPath = path
          .replace(/startCode -> (\d+) -> initialCode/, (m, idx) => `${idx === '0' ? 'C++' : idx === '1' ? 'Java' : 'JavaScript'} Starter Code`)
          .replace(/referenceSolution -> (\d+) -> initialCode/, (m, idx) => `${idx === '0' ? 'C++' : idx === '1' ? 'Java' : 'JavaScript'} Reference Solution`)
          .replace(/visibleTestCases -> (\d+) -> (\w+)/, (m, idx, field) => `Visible Case #${Number(idx) + 1} ${field}`)
          .replace(/hiddenTestCases -> (\d+) -> (\w+)/, (m, idx, field) => `Hidden Case #${Number(idx) + 1} ${field}`);

        flat.push(`${cleanPath}: ${obj.message}`);
        return;
      }
      Object.entries(obj).forEach(([key, value]) => {
        traverse(value, path ? `${path} -> ${key}` : key);
      });
    };
    traverse(errs);
    return flat;
  };

  const validationErrors = getFlatErrors(errors);

  const filteredProblems = problems.filter(prob => {
    const matchesSearch = prob.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDiff = difficultyFilter === 'All' || prob.difficulty === difficultyFilter;
    return matchesSearch && matchesDiff;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex justify-center items-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  // If editing a problem, render the modern update form
  if (editingProblem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-base-300 via-base-200 to-base-300 pb-16">
        {/* Top Navbar */}
        <div className="navbar bg-base-100/80 backdrop-blur-md border-b border-base-300 sticky top-0 z-50 px-6 mb-8">
          <div className="flex-1">
            <button onClick={() => setEditingProblem(null)} className="btn btn-ghost gap-2 font-normal">
              <ArrowLeft size={18} />
              <span>Back to Problem List</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge badge-warning font-semibold px-3 py-3">
              ✏️ Editing: {editingProblem.title}
            </span>
          </div>
        </div>

        <div className="container mx-auto max-w-5xl px-4">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold text-base-content mb-2">Update Problem</h1>
            <p className="text-base-content/60">Modify problem specifications, test cases, and solution skeletons.</p>
          </div>

          {validationErrors.length > 0 && (
            <div className="alert alert-error shadow-lg mb-6 rounded-2xl border border-error/20 flex flex-col items-start gap-2 p-5">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertCircle size={20} className="flex-shrink-0" />
                <span>Please fill in the required fields:</span>
              </div>
              <ul className="list-disc pl-8 text-xs space-y-1">
                {validationErrors.map((msg, idx) => (
                  <li key={idx} className="font-semibold text-error-content/90">{msg}</li>
                ))}
              </ul>
            </div>
          )}

          {formError && (
            <div className="alert alert-error shadow-lg mb-6 rounded-2xl border border-error/20">
              <AlertCircle size={20} className="flex-shrink-0" />
              <span className="font-medium">{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="card bg-base-100 shadow-xl border border-base-300 p-6">
              <h2 className="text-xl font-bold mb-6 border-b border-base-200 pb-3">Basic Information</h2>
              <div className="space-y-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-base-content/85">Title</label>
                  <input
                    {...register('title')}
                    placeholder="Enter problem title"
                    className={`input input-bordered w-full focus:border-primary ${errors.title && 'input-error'}`}
                  />
                  {errors.title && (
                    <span className="text-error text-xs mt-1">{errors.title.message}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-base-content/85">Description</label>
                  <textarea
                    {...register('description')}
                    placeholder="Enter problem description"
                    className={`textarea textarea-bordered h-40 w-full focus:border-primary ${errors.description && 'textarea-error'}`}
                  />
                  {errors.description && (
                    <span className="text-error text-xs mt-1">{errors.description.message}</span>
                  )}
                </div>

                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5 w-full sm:w-1/3">
                    <label className="text-sm font-bold text-base-content/85">Difficulty</label>
                    <select
                      {...register('difficulty')}
                      className={`select select-bordered w-full focus:border-primary ${errors.difficulty && 'select-error'}`}
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2 w-full">
                    <label className="text-sm font-bold text-base-content/85 flex items-center justify-between">
                      <span>Tags (Select multiple)</span>
                      <span className="text-xs font-normal text-base-content/60">Click tags to toggle</span>
                    </label>
                    <div className={`flex flex-wrap gap-2 p-3 bg-base-200/50 rounded-xl border max-h-40 overflow-y-auto ${errors.tags ? 'border-error' : 'border-base-300'}`}>
                      {ALL_TAGS.map((tag) => {
                        const selectedTags = watch('tags') || [];
                        const isSelected = selectedTags.includes(tag);
                        return (
                          <label
                            key={tag}
                            className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-bold transition-all border select-none flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-primary text-primary-content border-primary shadow-sm scale-105'
                                : 'bg-base-100 text-base-content/70 border-base-300 hover:border-primary/50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              value={tag}
                              {...register('tags')}
                              className="hidden"
                            />
                            {tag}
                          </label>
                        );
                      })}
                    </div>
                    {errors.tags && <span className="text-error text-xs mt-1 block font-semibold">{errors.tags.message}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Test Cases */}
            <div className="card bg-base-100 shadow-xl border border-base-300 p-6">
              <h2 className="text-xl font-bold mb-6 border-b border-base-200 pb-3">Test Cases Suite</h2>

              {/* Visible Test Cases */}
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center bg-base-200/50 p-3 rounded-2xl border border-base-300">
                  <div>
                    <h3 className="font-bold text-sm text-base-content">Visible Test Cases</h3>
                    <p className="text-[10px] text-base-content/50">These will be shown to users as examples.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => appendVisible({ input: '', output: '', explanation: '' })}
                    className="btn btn-sm btn-primary rounded-xl font-bold"
                  >
                    Add Visible Case
                  </button>
                </div>

                {visibleFields.map((field, index) => (
                  <details
                    key={field.id}
                    className="collapse collapse-arrow bg-base-200/30 border border-base-300 rounded-2xl shadow-sm"
                    open={index === 0}
                  >
                    <summary className="collapse-title text-xs font-bold flex items-center justify-between pr-12 min-h-0 py-3">
                      <span>Visible Test Case #{index + 1}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeVisible(index);
                        }}
                        className="btn btn-xs btn-error rounded-lg"
                      >
                        Remove
                      </button>
                    </summary>
                    <div className="collapse-content space-y-4 pt-4 border-t border-base-300 bg-base-100/30">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-base-content/60">Input</label>
                        <textarea
                          {...register(`visibleTestCases.${index}.input`)}
                          placeholder="Input (Multi-line supported)"
                          rows={3}
                          className="textarea textarea-bordered font-mono text-xs w-full focus:border-primary"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-base-content/60">Output</label>
                        <textarea
                          {...register(`visibleTestCases.${index}.output`)}
                          placeholder="Expected Output (Multi-line supported)"
                          rows={2}
                          className="textarea textarea-bordered font-mono text-xs w-full focus:border-primary"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-base-content/60">Explanation</label>
                        <textarea
                          {...register(`visibleTestCases.${index}.explanation`)}
                          placeholder="Explanation of the result..."
                          rows={2}
                          className="textarea textarea-bordered text-xs w-full focus:border-primary"
                        />
                      </div>
                    </div>
                  </details>
                ))}
              </div>

              {/* Hidden Test Cases */}
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-base-200/50 p-3 rounded-2xl border border-base-300">
                  <div>
                    <h3 className="font-bold text-sm text-base-content">Hidden Test Cases</h3>
                    <p className="text-[10px] text-base-content/50">Used to comprehensively test solutions. Kept secret from users.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => appendHidden({ input: '', output: '' })}
                    className="btn btn-sm btn-primary rounded-xl font-bold"
                  >
                    Add Hidden Case
                  </button>
                </div>

                {hiddenFields.map((field, index) => (
                  <details
                    key={field.id}
                    className="collapse collapse-arrow bg-base-200/30 border border-base-300 rounded-2xl shadow-sm"
                    open={index === 0}
                  >
                    <summary className="collapse-title text-xs font-bold flex items-center justify-between pr-12 min-h-0 py-3">
                      <span>Hidden Test Case #{index + 1}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeHidden(index);
                        }}
                        className="btn btn-xs btn-error rounded-lg"
                      >
                        Remove
                      </button>
                    </summary>
                    <div className="collapse-content space-y-4 pt-4 border-t border-base-300 bg-base-100/30">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-base-content/60">Input</label>
                        <textarea
                          {...register(`hiddenTestCases.${index}.input`)}
                          placeholder="Input (Multi-line supported)"
                          rows={3}
                          className="textarea textarea-bordered font-mono text-xs w-full focus:border-primary"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-base-content/60">Output</label>
                        <textarea
                          {...register(`hiddenTestCases.${index}.output`)}
                          placeholder="Expected Output (Multi-line supported)"
                          rows={2}
                          className="textarea textarea-bordered font-mono text-xs w-full focus:border-primary"
                        />
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </div>

            {/* Code Templates with Language Tabs */}
            <div className="card bg-base-100 shadow-xl border border-base-300 p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-base-200">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Code className="text-primary" size={22} />
                    Code Templates & Solutions
                  </h2>
                  <p className="text-sm text-base-content/60">Configure initial starter skeletons and complete reference solutions for evaluation.</p>
                </div>

                {/* Language Tab Switcher */}
                <div className="join bg-base-200 p-1 rounded-xl border border-base-300">
                  {['C++', 'Java', 'JavaScript'].map((lang, idx) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setActiveTab(idx)}
                      className={`join-item btn btn-sm font-semibold ${activeTab === idx ? 'btn-primary shadow-sm' : 'btn-ghost text-base-content/70'}`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                {[0, 1, 2].map((index) => (
                  <div key={index} className={index === activeTab ? 'space-y-6 animate-fadeIn' : 'hidden'}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Initial Code Starter */}
                      <div className="form-control flex flex-col h-full">
                        <label className="label justify-between">
                          <span className="label-text font-bold flex items-center gap-2">
                            <span className="badge badge-sm badge-ghost">Starter</span>
                            Initial Code Skeleton ({index === 0 ? 'C++' : index === 1 ? 'Java' : 'JavaScript'})
                          </span>
                          <span className="text-xs text-base-content/50">Given to users</span>
                        </label>
                        <div className="bg-base-300/80 rounded-2xl p-4 border border-base-300 flex-1 focus-within:border-primary transition-colors">
                          <textarea
                            {...register(`startCode.${index}.initialCode`)}
                            placeholder={`// Write starter code for ${index === 0 ? 'C++' : index === 1 ? 'Java' : 'JavaScript'}...`}
                            className="w-full bg-transparent font-mono text-sm leading-relaxed focus:outline-none resize-y min-h-[220px]"
                          />
                        </div>
                      </div>

                      {/* Reference Complete Solution */}
                      <div className="form-control flex flex-col h-full">
                        <label className="label justify-between">
                          <span className="label-text font-bold flex items-center gap-2">
                            <span className="badge badge-sm badge-success text-white">Solution</span>
                            Reference Solution ({index === 0 ? 'C++' : index === 1 ? 'Java' : 'JavaScript'})
                          </span>
                          <span className="text-xs text-base-content/50">Used for evaluation</span>
                        </label>
                        <div className="bg-base-300/80 rounded-2xl p-4 border border-base-300 flex-1 focus-within:border-success transition-colors">
                          <textarea
                            {...register(`referenceSolution.${index}.initialCode`)}
                            placeholder={`// Write complete working solution for ${index === 0 ? 'C++' : index === 1 ? 'Java' : 'JavaScript'}...`}
                            className="w-full bg-transparent font-mono text-sm leading-relaxed focus:outline-none resize-y min-h-[220px]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg w-full rounded-2xl shadow-lg hover:shadow-primary/30 transition-all font-bold text-base gap-2">
              {isSubmitting ? <span className="loading loading-spinner"></span> : (
                <>
                  <CheckCircle size={20} />
                  <span>Update Problem & Re-Test Solutions</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Render list of problems to edit
  return (
    <div className="min-h-screen bg-gradient-to-br from-base-300 via-base-200 to-base-300 pb-16">
      {/* Top Navbar */}
      <div className="navbar bg-base-100/80 backdrop-blur-md border-b border-base-300 sticky top-0 z-50 px-6 mb-8">
        <div className="flex-1">
          <NavLink to="/admin" className="btn btn-ghost gap-2 font-normal">
            <ArrowLeft size={18} />
            <span>Back to Admin Dashboard</span>
          </NavLink>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-warning font-semibold px-3 py-3">
            🔧 Update Manager
          </span>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-base-content">Select Problem to Update</h1>
            <p className="text-base-content/60">Choose a problem from the catalog below to edit its specifications or code.</p>
          </div>

          {/* Filter Pill */}
          <div className="flex items-center gap-2 bg-base-100 p-1.5 rounded-2xl border border-base-300 shadow-sm">
            <Filter size={16} className="text-base-content/60 ml-2" />
            {['All', 'Easy', 'Medium', 'Hard'].map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficultyFilter(diff)}
                className={`btn btn-xs rounded-xl ${difficultyFilter === diff ? 'btn-neutral' : 'btn-ghost'}`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-base-content/40" size={20} />
          <input
            type="text"
            placeholder="Search problems by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-bordered w-full pl-12 rounded-2xl bg-base-100 shadow-sm focus:border-primary"
          />
        </div>

        {/* Problem Table Card */}
        <div className="bg-base-100 rounded-3xl shadow-xl border border-base-300 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-base-200/60 text-base-content/70">
                <tr>
                  <th className="w-1/12 py-4 pl-6">#</th>
                  <th className="w-5/12 py-4">Title</th>
                  <th className="w-2/12 py-4">Difficulty</th>
                  <th className="w-2/12 py-4">Tags</th>
                  <th className="w-2/12 py-4 text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200">
                {filteredProblems.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-base-content/50">
                      No matching problems found.
                    </td>
                  </tr>
                ) : (
                  filteredProblems.map((problem, index) => (
                    <tr key={problem._id} className="hover:bg-base-200/40 transition-colors">
                      <th className="pl-6 text-base-content/50">{index + 1}</th>
                      <td className="font-bold text-base-content">{problem.title}</td>
                      <td>
                        <span className={`badge font-semibold ${problem.difficulty === 'Easy'
                          ? 'badge-success badge-outline'
                          : problem.difficulty === 'Medium'
                            ? 'badge-warning badge-outline'
                            : 'badge-error badge-outline'
                          }`}>
                          {problem.difficulty}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap items-center gap-1">
                          {(Array.isArray(problem.tags) ? problem.tags : (problem.tags ? [problem.tags] : ['General'])).map((tag, idx) => (
                            <span key={idx} className="badge badge-ghost gap-1 text-xs whitespace-nowrap">
                              <Tag size={10} />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="text-right pr-6">
                        <button
                          onClick={() => handleEditClick(problem)}
                          className="btn btn-sm btn-warning gap-1.5 font-bold rounded-xl shadow-sm"
                        >
                          <Edit size={14} />
                          Edit Problem
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUpdate;
