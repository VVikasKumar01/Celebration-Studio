import { describe, it, expect } from 'vitest';
import { SAMPLE_WEDDING } from '../data/sampleEvents';
import { TimelineTask } from '../types/event';
import { hasCircularDependency } from '../components/TimelineWorkflow';

// Helper function modeling timeline dependency resolution
function checkTaskDependencyStatus(task: TimelineTask, allTasks: TimelineTask[]) {
  if (task.status === 'completed') {
    return { isBlocked: false, uncompletedPrereqs: [] };
  }

  const uncompletedPrereqs = (task.dependsOn || []).map((depId) => {
    const parent = allTasks.find((t) => t.id === depId);
    return {
      id: depId,
      title: parent ? parent.title : depId,
      isCompleted: parent ? parent.status === 'completed' : false,
    };
  }).filter((p) => !p.isCompleted);

  return {
    isBlocked: uncompletedPrereqs.length > 0,
    uncompletedPrereqs,
  };
}

describe('Sequential Timeline & Task Dependency Engine', () => {
  it('correctly marks downstream tasks as blocked when dependencies are pending', () => {
    const tasks: TimelineTask[] = [
      {
        id: 'task-1',
        title: 'Lock Venue & Target Date',
        milestone: 'T-24W',
        dueDate: '2026-06-01',
        category: 'Venue',
        priority: 'critical',
        dependsOn: [],
        actionableNote: 'Sign contract',
        status: 'pending',
      },
      {
        id: 'task-2',
        title: 'Caterer Menu Tasting & Kitchen Lock',
        milestone: 'T-16W',
        dueDate: '2026-07-15',
        category: 'Catering',
        priority: 'high',
        dependsOn: ['task-1'],
        actionableNote: 'Cannot taste until venue kitchen rules are confirmed',
        status: 'blocked',
      },
    ];

    const result = checkTaskDependencyStatus(tasks[1], tasks);
    expect(result.isBlocked).toBe(true);
    expect(result.uncompletedPrereqs).toHaveLength(1);
    expect(result.uncompletedPrereqs[0].id).toBe('task-1');
  });

  it('dynamically unblocks downstream task when prerequisite task is completed', () => {
    const tasks: TimelineTask[] = [
      {
        id: 'task-1',
        title: 'Lock Venue & Target Date',
        milestone: 'T-24W',
        dueDate: '2026-06-01',
        category: 'Venue',
        priority: 'critical',
        dependsOn: [],
        actionableNote: 'Sign contract',
        status: 'completed', // NOW COMPLETED
      },
      {
        id: 'task-2',
        title: 'Caterer Menu Tasting & Kitchen Lock',
        milestone: 'T-16W',
        dueDate: '2026-07-15',
        category: 'Catering',
        priority: 'high',
        dependsOn: ['task-1'],
        actionableNote: 'Kitchen rules confirmed',
        status: 'pending',
      },
    ];

    const result = checkTaskDependencyStatus(tasks[1], tasks);
    expect(result.isBlocked).toBe(false);
    expect(result.uncompletedPrereqs).toHaveLength(0);
  });

  it('validates mock events timeline tasks for valid status and dependencies', () => {
    const tasks = SAMPLE_WEDDING.tasks;
    expect(tasks.length).toBeGreaterThan(0);

    // Filter completed tasks
    const completed = tasks.filter((t) => t.status === 'completed');
    expect(completed.length).toBeGreaterThan(0);

    // Verify each completed task has isBlocked === false
    completed.forEach((t) => {
      const { isBlocked } = checkTaskDependencyStatus(t, tasks);
      expect(isBlocked).toBe(false);
    });
  });

  describe('Circular Dependency Guard Engine', () => {
    it('detects direct 2-node circular dependency cycle', () => {
      const tasks: TimelineTask[] = [
        {
          id: 'task-a',
          title: 'Sign Venue Contract',
          milestone: 'T-24W',
          dueDate: '2026-06-01',
          category: 'Venue',
          priority: 'critical',
          dependsOn: ['task-b'],
          actionableNote: '',
          status: 'pending',
        },
      ];

      // If task-b attempts to depend on task-a
      const isCycle = hasCircularDependency('task-b', ['task-a'], tasks);
      expect(isCycle).toBe(true);
    });

    it('detects indirect 3-node circular dependency cycle (A -> B -> C -> A)', () => {
      const tasks: TimelineTask[] = [
        {
          id: 'task-a',
          title: 'Sign Venue Contract',
          milestone: 'T-24W',
          dueDate: '2026-06-01',
          category: 'Venue',
          priority: 'critical',
          dependsOn: ['task-b'],
          actionableNote: '',
          status: 'pending',
        },
        {
          id: 'task-b',
          title: 'Catering Tasting',
          milestone: 'T-16W',
          dueDate: '2026-07-01',
          category: 'Catering',
          priority: 'high',
          dependsOn: ['task-c'],
          actionableNote: '',
          status: 'pending',
        },
      ];

      // If task-c attempts to depend on task-a
      const isCycle = hasCircularDependency('task-c', ['task-a'], tasks);
      expect(isCycle).toBe(true);
    });

    it('allows valid acyclic branching dependency chains without false positives', () => {
      const tasks: TimelineTask[] = [
        {
          id: 'task-a',
          title: 'Lock Venue',
          milestone: 'T-24W',
          dueDate: '2026-06-01',
          category: 'Venue',
          priority: 'critical',
          dependsOn: [],
          actionableNote: '',
          status: 'completed',
        },
        {
          id: 'task-b',
          title: 'Book Caterer',
          milestone: 'T-16W',
          dueDate: '2026-07-01',
          category: 'Catering',
          priority: 'high',
          dependsOn: ['task-a'],
          actionableNote: '',
          status: 'pending',
        },
        {
          id: 'task-c',
          title: 'Book Photographer',
          milestone: 'T-16W',
          dueDate: '2026-07-01',
          category: 'Photography',
          priority: 'high',
          dependsOn: ['task-a'],
          actionableNote: '',
          status: 'pending',
        },
      ];

      // New task-d depends on both task-b and task-c (valid DAG)
      const isCycle = hasCircularDependency('task-d', ['task-b', 'task-c'], tasks);
      expect(isCycle).toBe(false);
    });
  });
});
