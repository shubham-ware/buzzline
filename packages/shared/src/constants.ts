export enum SignalingEvent {
  JOIN_ROOM = "join-room",
  LEAVE_ROOM = "leave-room",
  PEER_JOINED = "peer-joined",
  PEER_LEFT = "peer-left",
  ERROR = "error",
}

// --- Plan definitions ---

export type PlanName = "free" | "starter" | "growth" | "enterprise";

export interface PlanLimit {
  minutesPerMonth: number;
  maxProjects: number;
  maxParticipants: number;
}

export const PLAN_LIMITS: Record<PlanName, PlanLimit> = {
  free: { minutesPerMonth: 100, maxProjects: 1, maxParticipants: 2 },
  starter: { minutesPerMonth: 1_000, maxProjects: 3, maxParticipants: 4 },
  growth: { minutesPerMonth: 5_000, maxProjects: Infinity, maxParticipants: 10 },
  enterprise: { minutesPerMonth: Infinity, maxProjects: Infinity, maxParticipants: 50 },
};

export const PLAN_PRICES: Record<PlanName, string> = {
  free: "Free",
  starter: "$29/mo",
  growth: "$79/mo",
  enterprise: "Custom",
};
