import React, { useState } from 'react';
import { 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  Lock, 
  Unlock, 
  Plus, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  ChevronRight,
  Filter,
  Trash2
} from 'lucide-react';
import { EventState, TimelineTask, MilestoneKey } from '../types/event';
import { SectionQuickActions } from './SectionQuickActions';

interface TimelineWorkflowProps {
  currentEvent: EventState;
  onUpdateEvent: (updated: EventState) => void;
  onRequestAiAssistance: (prompt: string) => void;
}

const MILESTONE_ORDER: MilestoneKey[] = [
  'T-24W',
  'T-16W',
  'T-12W',
  'T-8W',
  'T-4W',
  'T-2W',
  'T-1W',
  'T-1D',
  'Day-Of',
  'Post-Event'
];

const MILESTONE_LABELS: Record<MilestoneKey, string> = {
  'T-24W': 'T-24 Weeks (6 Months Out) — Venue & Foundations',
  'T-16W': 'T-16 Weeks (4 Months Out) — Vendors & Vision',
  'T-12W': 'T-12 Weeks (3 Months Out) — Media & Key Bookings',
  'T-8W': 'T-8 Weeks (2 Months Out) — Invitations & Decor',
  'T-4W': 'T-4 Weeks (1 Month Out) — RSVPs & Kitchen Lock',
  'T-2W': 'T-2 Weeks (Final Countdown) — Run-of-Show & Rehearsals',
  'T-1W': 'T-1 Week — Final Pack & Vendor Manifests',
  'T-1D': 'T-1 Day — Rehearsal & Gratuity Envelopes',
  'Day-Of': 'Day-Of Celebration Execution',
  'Post-Event': 'Post-Event — Wrap-Up & Reviews',
};

/**
 * Detects if adding or updating dependencies introduces a circular dependency cycle.
 * Returns true if a cycle is detected.
 */
export function hasCircularDependency(
  targetTaskId: string,
  proposedPrereqs: string[],
  existingTasks: TimelineTask[]
): boolean {
  const visited = new Set<string>();
  const recStack = new Set<string>();

  const depMap = new Map<string, string[]>();
  for (const t of existingTasks) {
    depMap.set(t.id, t.id === targetTaskId ? proposedPrereqs : (t.dependsOn || []));
  }
  if (!depMap.has(targetTaskId)) {
    depMap.set(targetTaskId, proposedPrereqs);
  }

  function dfs(currId: string): boolean {
    visited.add(currId);
    recStack.add(currId);

    const neighbors = depMap.get(currId) || [];
    for (const neighborId of neighbors) {
      if (!visited.has(neighborId)) {
        if (dfs(neighborId)) return true;
      } else if (recStack.has(neighborId)) {
        return true;
      }
    }

    recStack.delete(currId);
    return false;
  }

  for (const [id] of depMap) {
    if (!visited.has(id)) {
      if (dfs(id)) return true;
    }
  }

  return false;
}

export const TimelineWorkflow: React.FC<TimelineWorkflowProps> = ({
  currentEvent,
  onUpdateEvent,
  onRequestAiAssistance,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'blocked' | 'pending' | 'completed'>('all');
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [unblockedToast, setUnblockedToast] = useState<string | null>(null);
  const [constraintModalTask, setConstraintModalTask] = useState<{
    task: TimelineTask;
    blockingTasks: TimelineTask[];
  } | null>(null);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newMilestone, setNewMilestone] = useState<MilestoneKey>('T-8W');
  const [newCategory, setNewCategory] = useState('Logistics');
  const [newPriority, setNewPriority] = useState<'critical' | 'high' | 'medium'>('high');
  const [newDueDate, setNewDueDate] = useState('');
  const [newDependsOn, setNewDependsOn] = useState<string[]>([]);
  const [newNote, setNewNote] = useState('');

  const tasks = currentEvent.tasks;

  const getTaskDependencyStatus = (task: TimelineTask): { isBlocked: boolean; blockingTasks: TimelineTask[] } => {
    if (!task.dependsOn || task.dependsOn.length === 0) {
      return { isBlocked: false, blockingTasks: [] };
    }

    const uncompletedPrereqs = task.dependsOn
      .map(id => tasks.find(t => t.id === id))
      .filter((t): t is TimelineTask => t !== undefined && t.status !== 'completed');

    return {
      isBlocked: uncompletedPrereqs.length > 0,
      blockingTasks: uncompletedPrereqs,
    };
  };

  const handleToggleTaskStatus = (taskId: string, forceOverride = false) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const isCurrentlyComplete = task.status === 'completed';

    // Norman Constraint Gate: Intercept if user tries to mark a blocked task complete without override
    if (!isCurrentlyComplete && !forceOverride) {
      const { isBlocked, blockingTasks } = getTaskDependencyStatus(task);
      if (isBlocked) {
        setConstraintModalTask({ task, blockingTasks });
        return;
      }
    }

    const nextStatus = isCurrentlyComplete ? 'pending' : 'completed';

    const updatedTasks = tasks.map((t) => {
      if (t.id === taskId) {
        return { ...t, status: nextStatus as any };
      }
      return t;
    });

    let newlyUnblockedNames: string[] = [];
    if (!isCurrentlyComplete) {
      tasks.forEach((other) => {
        if (other.dependsOn && other.dependsOn.includes(taskId)) {
          const stillBlocked = other.dependsOn
            .filter(depId => depId !== taskId)
            .some(depId => {
              const dep = updatedTasks.find(x => x.id === depId);
              return !dep || dep.status !== 'completed';
            });

          if (!stillBlocked && other.status === 'blocked') {
            newlyUnblockedNames.push(other.title);
          }
        }
      });
    }

    const resolvedTasks = updatedTasks.map((t) => {
      if (t.status === 'completed') return t;
      const { isBlocked } = getTaskDependencyStatus(t);
      if (isBlocked) {
        return { ...t, status: 'blocked' as const };
      } else if (t.status === 'blocked') {
        return { ...t, status: 'pending' as const };
      }
      return t;
    });

    onUpdateEvent({
      ...currentEvent,
      tasks: resolvedTasks,
      lastUpdated: new Date().toISOString(),
    });

    if (newlyUnblockedNames.length > 0) {
      setUnblockedToast(`🎉 Downstream tasks unblocked: ${newlyUnblockedNames.join(', ')}`);
      setTimeout(() => setUnblockedToast(null), 5000);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = tasks
      .filter(t => t.id !== taskId)
      .map(t => ({
        ...t,
        dependsOn: (t.dependsOn || []).filter(depId => depId !== taskId)
      }));

    onUpdateEvent({
      ...currentEvent,
      tasks: updatedTasks,
      lastUpdated: new Date().toISOString(),
    });
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const tempTaskId = `task-${Date.now()}`;
    if (newDependsOn.length > 0 && hasCircularDependency(tempTaskId, newDependsOn, tasks)) {
      setTaskError('Circular dependency detected. A task cannot depend on a downstream step that depends on itself.');
      return;
    }
    setTaskError(null);

    const newTask: TimelineTask = {
      id: tempTaskId,
      title: newTitle.trim(),
      milestone: newMilestone,
      dueDate: newDueDate || currentEvent.targetDate,
      category: newCategory,
      priority: newPriority,
      dependsOn: newDependsOn,
      actionableNote: newNote.trim(),
      status: newDependsOn.length > 0 ? 'blocked' : 'pending',
    };

    const updatedTasks = [...tasks, newTask];

    const resolvedTasks = updatedTasks.map((t) => {
      if (t.status === 'completed') return t;
      const { isBlocked } = getTaskDependencyStatus(t);
      return isBlocked ? { ...t, status: 'blocked' as const } : t;
    });

    onUpdateEvent({
      ...currentEvent,
      tasks: resolvedTasks,
      lastUpdated: new Date().toISOString(),
    });

    setNewTitle('');
    setNewNote('');
    setNewDependsOn([]);
    setTaskError(null);
    setIsAddTaskModalOpen(false);
  };

  const filteredTasks = tasks.filter((t) => {
    const { isBlocked } = getTaskDependencyStatus(t);
    const effectiveStatus = t.status === 'completed' ? 'completed' : isBlocked ? 'blocked' : t.status;
    if (statusFilter === 'all') return true;
    if (statusFilter === 'blocked') return effectiveStatus === 'blocked';
    if (statusFilter === 'completed') return effectiveStatus === 'completed';
    if (statusFilter === 'pending') return effectiveStatus === 'pending' || effectiveStatus === 'in_progress';
    return true;
  });

  const totalCount = tasks.length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const blockedCount = tasks.filter(t => t.status !== 'completed' && getTaskDependencyStatus(t).isBlocked).length;
  const pendingCount = totalCount - completedCount - blockedCount;

  return (
    <section id="timeline" className="scroll-mt-32 space-y-8">
      {/* Toast Alert for Dynamic Unblocking with WCAG live region */}
      {unblockedToast && (
        <div 
          role="status" 
          aria-live="polite"
          className="bg-emerald-600 text-white px-5 py-3.5 rounded-2xl font-semibold text-xs shadow-lg flex items-center justify-between animate-bounce"
        >
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{unblockedToast}</span>
          </div>
          <button 
            onClick={() => setUnblockedToast(null)} 
            aria-label="Dismiss notification"
            className="font-bold ml-4 cursor-pointer hover:text-emerald-200 transition"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-100 text-indigo-900 border border-indigo-200">
              Step 3 • Flow &amp; Timeline
            </span>
            <span className="text-xs text-stone-500 font-medium">Your Serene Countdown to the Big Day</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            A Calm, Seamless Day-Of Timeline
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-2xl leading-relaxed">
            Every detail unfolds in natural harmony. We gently hold downstream steps until foundational pieces are locked in, ensuring you never face rushed decisions or wasted deposits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <SectionQuickActions
            sectionType="timeline"
            sectionTitle="Timeline"
            currentEvent={currentEvent}
            onUpdateEvent={onUpdateEvent}
          />
          <button
            onClick={() => setIsAddTaskModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Celebration Step</span>
          </button>
        </div>
      </div>

      {/* Progress & Steps Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200/90 p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-medium text-stone-500">Total Celebration Steps</span>
          <div className="text-2xl font-black text-stone-900 mt-1">{totalCount}</div>
          <div className="text-[11px] text-stone-500 mt-1">From early planning to celebration day</div>
        </div>

        <div className="bg-white border border-emerald-300/80 p-5 rounded-2xl shadow-xs bg-gradient-to-b from-emerald-50/20 to-white">
          <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Completed
          </span>
          <div className="text-2xl font-black text-emerald-900 mt-1">
            {completedCount} <span className="text-xs text-stone-500 font-medium">({Math.round((completedCount / (totalCount || 1)) * 100)}%)</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Wonderful progress made</div>
        </div>

        <div className="bg-white border border-amber-300/80 p-5 rounded-2xl shadow-xs bg-gradient-to-b from-amber-50/20 to-white">
          <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-600" />
            Awaiting Next Step
          </span>
          <div className="text-2xl font-black text-amber-950 mt-1">
            {blockedCount}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Unlocks smoothly after earlier steps</div>
        </div>

        <div className="bg-white border border-stone-200/90 p-5 rounded-2xl shadow-xs">
          <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
            <Unlock className="w-4 h-4 text-indigo-600" />
            Ready to Take Care Of
          </span>
          <div className="text-2xl font-black text-indigo-950 mt-1">
            {pendingCount}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">Open to tackle whenever you wish</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              statusFilter === 'all' ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            All Steps ({totalCount})
          </button>
          <button
            onClick={() => setStatusFilter('blocked')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'blocked' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'text-stone-600 hover:text-amber-800 hover:bg-amber-50'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Up Next ({blockedCount})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'pending' ? 'bg-indigo-100 text-indigo-900 border border-indigo-300' : 'text-stone-600 hover:text-indigo-700 hover:bg-indigo-50'
            }`}
          >
            <Unlock className="w-3.5 h-3.5 text-indigo-600" />
            Ready Now ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'completed' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'text-stone-600 hover:text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Done ({completedCount})
          </button>
        </div>

        <button
          onClick={() => onRequestAiAssistance(`Review my celebration timeline for ${currentEvent.name}. How can we make the upcoming tasks feel calm, fun, and easy before ${currentEvent.targetDate}?`)}
          className="flex items-center gap-1.5 text-xs text-indigo-700 hover:text-indigo-900 cursor-pointer font-bold px-2 py-1"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Ask for Timeline Guidance</span>
        </button>
      </div>

      {/* Sequential Milestone Roadmaps */}
      <div className="space-y-6">
        {MILESTONE_ORDER.map((milestone) => {
          const milestoneTasks = filteredTasks.filter(t => t.milestone === milestone);
          if (milestoneTasks.length === 0 && statusFilter !== 'all') return null;

          return (
            <div key={milestone} className="bg-white border border-stone-200/90 rounded-3xl overflow-hidden shadow-xs">
              {/* Milestone Header */}
              <div className="bg-stone-50 px-6 py-3.5 border-b border-stone-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-0.5 rounded-md bg-stone-200/80 text-stone-800 font-mono text-xs font-bold">
                    {milestone}
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-stone-900">
                    {MILESTONE_LABELS[milestone] || milestone}
                  </h3>
                </div>
                <span className="text-xs font-semibold text-stone-500">
                  {milestoneTasks.filter(t => t.status === 'completed').length}/{milestoneTasks.length} Done
                </span>
              </div>

              {/* Tasks in Milestone */}
              <div className="divide-y divide-stone-100">
                {milestoneTasks.map((task) => {
                  const { isBlocked, blockingTasks } = getTaskDependencyStatus(task);
                  const isCompleted = task.status === 'completed';

                  return (
                    <div
                      key={task.id}
                      className={`p-4 sm:p-5 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isCompleted 
                          ? 'bg-stone-50/50 opacity-80' 
                          : isBlocked 
                          ? 'bg-rose-50/30' 
                          : 'hover:bg-stone-50/60'
                      }`}
                    >
                      <div className="flex items-start gap-3.5 flex-1">
                        {/* Status Checkbox */}
                        <button
                          onClick={() => handleToggleTaskStatus(task.id)}
                          className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition cursor-pointer shrink-0 ${
                            isCompleted
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                              : isBlocked
                              ? 'border-rose-400 bg-rose-50 text-rose-600'
                              : 'border-stone-300 bg-white hover:border-indigo-600'
                          }`}
                          title={isCompleted ? 'Mark incomplete' : 'Click to complete (unblocks downstream tasks)'}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          ) : isBlocked ? (
                            <Lock className="w-3 h-3 text-rose-600" />
                          ) : null}
                        </button>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-sm font-bold ${isCompleted ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                              {task.title}
                            </span>

                            {/* Status Tag */}
                            {isCompleted ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                [Completed]
                              </span>
                            ) : isBlocked ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1">
                                <Lock className="w-3 h-3 text-rose-600" />
                                [Blocked by {blockingTasks.map(b => b.title).join(', ')}]
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                                [Ready for Execution]
                              </span>
                            )}

                            {/* Priority Tag */}
                            <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold uppercase ${
                              task.priority === 'critical' ? 'bg-amber-100 text-amber-900' : 'bg-stone-100 text-stone-600'
                            }`}>
                              {task.priority}
                            </span>
                          </div>

                          {/* Notes and Actionable Guidance */}
                          {task.actionableNote && (
                            <p className="text-xs text-stone-600 leading-relaxed">
                              {task.actionableNote}
                            </p>
                          )}

                          {/* Dependency Links */}
                          {task.dependsOn && task.dependsOn.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-stone-500 pt-1">
                              <span className="text-stone-400 font-medium">Prerequisites:</span>
                              {task.dependsOn.map(depId => {
                                const dep = tasks.find(t => t.id === depId);
                                const isDepDone = dep?.status === 'completed';
                                return (
                                  <span
                                    key={depId}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] ${
                                      isDepDone ? 'bg-emerald-50 text-emerald-700 line-through' : 'bg-rose-50 text-rose-700 font-bold border border-rose-200'
                                    }`}
                                  >
                                    {isDepDone ? '✓' : '🔒'} {dep?.title || depId}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] text-stone-400 font-semibold uppercase block">Due Date</span>
                          <span className="text-xs font-mono font-bold text-stone-800">{task.dueDate}</span>
                        </div>

                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-stone-300 hover:text-rose-600 transition p-1 cursor-pointer"
                          title="Remove task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {milestoneTasks.length === 0 && (
                  <div className="py-5 text-center text-xs text-stone-400 italic">
                    No tasks assigned to this milestone window.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      {isAddTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                Add Roadmap Task &amp; Dependencies
              </h3>
              <button
                onClick={() => setIsAddTaskModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-3.5">
              {taskError && (
                <div role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{taskError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule Cake Tasting & Select Flavors"
                  value={newTitle}
                  onChange={(e) => {
                    setNewTitle(e.target.value);
                    if (taskError) setTaskError(null);
                  }}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">Milestone Phase</label>
                  <select
                    aria-label="Milestone Phase"
                    value={newMilestone}
                    onChange={(e) => setNewMilestone(e.target.value as MilestoneKey)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900"
                  >
                    {MILESTONE_ORDER.map(m => (
                      <option key={m} value={m}>{m} - {MILESTONE_LABELS[m]?.split('—')[1] || m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">Priority</label>
                  <select
                    aria-label="Task Priority"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900"
                  >
                    <option value="critical">Critical (Must Have)</option>
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">
                  Hard Prerequisites (Tasks that must complete first)
                </label>
                <div className="max-h-36 overflow-y-auto space-y-1.5 bg-stone-50 p-3 rounded-xl border border-stone-200">
                  {tasks.map(t => (
                    <label key={t.id} className="flex items-center gap-2 text-xs text-stone-700 hover:text-stone-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newDependsOn.includes(t.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewDependsOn([...newDependsOn, t.id]);
                          } else {
                            setNewDependsOn(newDependsOn.filter(id => id !== t.id));
                          }
                        }}
                        className="rounded border-stone-300 text-indigo-600 focus:ring-0"
                      />
                      <span className="truncate">{t.title} ({t.milestone})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1">Actionable Instructions / Note</label>
                <textarea
                  rows={2}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="e.g. Confirm minimum order requirement and vegan options with bakery chef."
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddTaskModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-500 hover:text-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Don Norman Constraint Gate Modal */}
      {constraintModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-rose-600" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  Don Norman Constraint Gate: Dependency Enforced
                </span>
                <h3 className="text-base font-bold text-stone-900">
                  Prerequisite Incomplete for "{constraintModalTask.task.title}"
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              In real-world celebration planning, executing downstream tasks without locking prerequisites leads to costly re-work, cancellation penalties, or vendor disputes.
            </p>

            <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-stone-800">Unfinished Prerequisite(s):</span>
              <ul className="space-y-1.5">
                {constraintModalTask.blockingTasks.map((blocking) => (
                  <li key={blocking.id} className="flex items-center justify-between text-xs bg-white p-2 rounded-xl border border-stone-200">
                    <span className="font-semibold text-stone-900">{blocking.title}</span>
                    <button
                      onClick={() => {
                        handleToggleTaskStatus(blocking.id);
                        setConstraintModalTask(null);
                      }}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold cursor-pointer transition"
                    >
                      Complete Prerequisite
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setConstraintModalTask(null)}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
              >
                Keep Blocked (Cancel)
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetId = constraintModalTask.task.id;
                  setConstraintModalTask(null);
                  handleToggleTaskStatus(targetId, true);
                }}
                className="w-full sm:w-auto px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl border border-stone-300 transition cursor-pointer"
              >
                Force Complete (Override Constraint)
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
