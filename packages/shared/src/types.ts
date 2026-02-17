// --- Room types ---

export interface Room {
  id: string;
  projectId: string;
  createdAt: Date;
  expiresAt: Date;
  maxParticipants: number;
  status: "waiting" | "active" | "closed";
  metadata?: Record<string, unknown>;
}

export interface CreateRoomRequest {
  projectId: string;
  maxParticipants?: number;
  expiresInMinutes?: number;
  metadata?: Record<string, unknown>;
}

export interface CreateRoomResponse {
  roomId: string;
  token: string;
  expiresAt: string;
}

export interface PeerInfo {
  peerId: string;
  displayName?: string;
  producers: string[];
}

export interface JoinRoomPayload {
  roomId: string;
  token: string;
  displayName?: string;
}

// --- Project types ---

export interface ProjectSettings {
  maxParticipants: number;
  recordingEnabled: boolean;
  brandColor: string;
  position: string;
}

export interface Project {
  id: string;
  name: string;
  userId: string;
  apiKey: string;
  allowedOrigins: string[];
  createdAt: Date;
  settings: ProjectSettings;
}

// --- Widget types ---

export interface BuzzlineWidgetConfig {
  apiKey: string;
  serverUrl?: string;
  brandColor?: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  onReady?: () => void;
  onCallStart?: (roomId: string) => void;
  onCallEnd?: (roomId: string, duration: number) => void;
  onError?: (error: Error) => void;
}

// --- API types ---

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string | { code: string; message: string };
}

// --- Usage types ---

export interface UsageCurrentResponse {
  totalSeconds: number;
  totalMinutes: number;
}

export interface UsageByProjectItem {
  projectId: string;
  projectName: string;
  totalSeconds: number;
  totalMinutes: number;
  roomCount: number;
}

export interface UsageDailyItem {
  date: string;
  totalSeconds: number;
  totalMinutes: number;
  roomCount: number;
}
