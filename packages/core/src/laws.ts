export interface NexLaw {
  id: string;
  title: string;
  statement: string;
}

export const NEX_CONSTITUTION: NexLaw[] = [
  { id: "LAW_01", title: "NEX owns truth", statement: "No external tool owns operational truth. NEX owns truth." },
  { id: "LAW_02", title: "No task without owner", statement: "Every task must have a clear owner: tool, agent, or manual founder action." },
  { id: "LAW_03", title: "No completion without proof", statement: "No task may close without real proof." },
  { id: "LAW_04", title: "No proof without verification", statement: "Artifact alone is not enough. Verification is mandatory." },
  { id: "LAW_05", title: "No memory in chat only", statement: "Anything important must not live only in chat." },
  { id: "LAW_06", title: "No silent drift", statement: "Any drift from plan or scope must be detectable and recordable." },
  { id: "LAW_07", title: "No forward movement through blockers", statement: "A real blocker must stop progression." },
  { id: "LAW_08", title: "No important state without recovery", statement: "Meaningful state must have snapshot or resume support." },
  { id: "LAW_09", title: "Plans must be versioned", statement: "Plans are not loose text only. Plans are versioned objects." },
  { id: "LAW_10", title: "Execution must be observable", statement: "Important execution must leave reviewable traces." },
];

