import type { Task, TaskEdge } from "@nex/core";

import { StateBadge } from "./state-badge";

interface TaskGraphProps {
  tasks: Task[];
  edges: TaskEdge[];
}

export function TaskGraph({ tasks, edges }: TaskGraphProps) {
  if (!tasks.length) {
    return <p className="empty-state">No execution graph exists yet for this scope.</p>;
  }

  const taskMap = new Map(tasks.map((task) => [task.id, task]));

  return (
    <div className="graph-list">
      {tasks.map((task) => {
        const outbound = edges.filter((edge) => edge.fromTaskId === task.id);

        return (
          <article className="graph-node" key={task.id}>
            <div className="graph-node-head">
              <div>
                <h3>{task.title}</h3>
                <p>{task.objective}</p>
              </div>
              <StateBadge status={task.status} />
            </div>
            <p className="graph-owner">
              Owner: {task.ownerKind} / {task.ownerRef}
            </p>
            {outbound.length ? (
              <ul className="graph-edges">
                {outbound.map((edge) => (
                  <li key={edge.id}>
                    <strong>{edge.type}</strong> {taskMap.get(edge.toTaskId)?.title ?? edge.toTaskId}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted-text">No outbound dependencies recorded.</p>
            )}
          </article>
        );
      })}
    </div>
  );
}

