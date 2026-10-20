/**
 * @dahamiz/shared-types
 *
 * Shared TypeScript types and interfaces for the DahaMiz platform.
 * These types are shared between the mobile app, API, and web dashboards.
 *
 * Design rules:
 * - Keep types pure — no runtime logic.
 * - No circular references.
 * - All public-facing API shapes live here.
 * - Types prefixed with "Api" represent REST API request/response shapes.
 * - Types without prefix are domain model shapes.
 */

// ─── Domain Enumerations ───────────────────────────────────────────────────

/**
 * Incident category taxonomy.
 * These are the categories a reporter can classify an environmental violation as.
 */
export enum IncidentCategory {
  LITTERING = 'LITTERING',
  CIGARETTE_BUTTS = 'CIGARETTE_BUTTS',
  ILLEGAL_DUMPING = 'ILLEGAL_DUMPING',
  CONSTRUCTION_DEBRIS = 'CONSTRUCTION_DEBRIS',
  VEHICLE_DISCHARGE = 'VEHICLE_DISCHARGE',
  OVERFLOWING_WASTE = 'OVERFLOWING_WASTE',
  WATER_POLLUTION = 'WATER_POLLUTION',
  AIR_POLLUTION = 'AIR_POLLUTION',
  OTHER = 'OTHER',
}

/**
 * Report lifecycle status.
 * These are the states a report can be in from submission to resolution.
 *
 * Transitions:
 *   SUBMITTED → UNDER_REVIEW → FORWARDED_TO_AUTHORITY | REJECTED
 *   FORWARDED_TO_AUTHORITY → UNDER_INVESTIGATION → RESOLVED | CLOSED
 *   Any state → WITHDRAWN (by reporter request)
 */
export enum ReportStatus {
  /** Report submitted by user, awaiting internal moderation */
  SUBMITTED = 'SUBMITTED',
  /** Report is being reviewed by moderation team */
  UNDER_REVIEW = 'UNDER_REVIEW',
  /** Report has been forwarded to the relevant authorized authority */
  FORWARDED_TO_AUTHORITY = 'FORWARDED_TO_AUTHORITY',
  /** The authority has opened an investigation */
  UNDER_INVESTIGATION = 'UNDER_INVESTIGATION',
  /** Issue has been addressed / resolved */
  RESOLVED = 'RESOLVED',
  /** Report closed without authority action (insufficient evidence, out of scope, etc.) */
  CLOSED = 'CLOSED',
  /** Report rejected during moderation (spam, false report, etc.) */
  REJECTED = 'REJECTED',
  /** Reporter has withdrawn the report */
  WITHDRAWN = 'WITHDRAWN',
}

/**
 * User roles within the platform.
 */
export enum UserRole {
  /** Standard citizen user */
  CITIZEN = 'CITIZEN',
  /** Internal content moderator */
  MODERATOR = 'MODERATOR',
  /** Public authority official (scoped to their organization) */
  AUTHORITY_OFFICIAL = 'AUTHORITY_OFFICIAL',
  /** Internal platform administrator */
  ADMIN = 'ADMIN',
}

/**
 * Media attachment types.
 */
export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

export enum PublicContentReportReason {
  INACCURATE = 'INACCURATE',
  PERSONAL_DATA = 'PERSONAL_DATA',
  DANGEROUS_CONTENT = 'DANGEROUS_CONTENT',
  OTHER = 'OTHER',
}

export enum PublicContentReportStatus {
  OPEN = 'OPEN',
  DISMISSED = 'DISMISSED',
  ACTIONED = 'ACTIONED',
}

// ─── Domain Models ─────────────────────────────────────────────────────────

export interface GeoCoordinates {
  readonly latitude: number;
  readonly longitude: number;
}

/**
 * Approximate public-facing location for a report.
 * Original precise location is private and stored separately.
 */
export interface ApproximateLocation {
  readonly district?: string;
  readonly city: string;
  readonly country: string;
  /** Fuzzy coordinates (randomized within ~500m radius for privacy) */
  readonly approximateCoordinates?: GeoCoordinates;
}

export interface UserProfile {
  readonly id: string;
  readonly displayName: string;
  readonly avatarUrl?: string;
  readonly xpPoints: number;
  readonly level: number;
  readonly joinedAt: string; // ISO 8601
}

/**
 * Public summary of a report — safe to show in community feed.
 * Contains NO original evidence media or precise location.
 */
export interface PublicReportSummary {
  readonly id: string;
  readonly category: IncidentCategory;
  readonly status: ReportStatus;
  readonly location: ApproximateLocation;
  /** Public thumbnail image URL — only present if moderation approved it */
  readonly publicThumbnailUrl?: string;
  readonly createdAt: string; // ISO 8601
  readonly updatedAt: string; // ISO 8601
}

export interface PublicPostSummary {
  readonly id: string;
  readonly category: IncidentCategory;
  readonly title: string;
  readonly body?: string;
  readonly mediaUrl?: string;
  readonly location: ApproximateLocation;
  readonly publishedAt: string;
}

export interface PublicMapMarker {
  readonly id: string;
  readonly category: IncidentCategory;
  readonly title: string;
  readonly location: ApproximateLocation;
  readonly coordinates: GeoCoordinates;
  readonly publishedAt: string;
}

/**
 * Reporter's own view of their submitted report.
 * Includes status timeline but NOT original private evidence URLs.
 * Private evidence is accessed only by authorized backend processes.
 */
export interface ReporterReportView {
  readonly id: string;
  readonly category: IncidentCategory;
  readonly status: ReportStatus;
  readonly location: ApproximateLocation;
  readonly description?: string;
  readonly statusHistory: ReportStatusEvent[];
  readonly createdAt: string;
  readonly updatedAt: string;
  /** Whether reporter can still withdraw this report */
  readonly canWithdraw: boolean;
}

export interface ReportStatusEvent {
  readonly status: ReportStatus;
  readonly timestamp: string; // ISO 8601
  /**
   * Public-facing, legally appropriate message.
   * Must not disclose personal data, investigation methods or authority decisions.
   */
  readonly publicMessage?: string;
}

// ─── API Request/Response Shapes ───────────────────────────────────────────

export interface ApiHealthResponse {
  readonly status: 'ok';
  readonly version: string;
  readonly environment: string;
  readonly timestamp: string;
}

export interface ApiErrorResponse {
  readonly statusCode: number;
  readonly message: string;
  readonly code?: string;
  /** Validation field errors, if applicable */
  readonly errors?: Record<string, string[]>;
  readonly requestId?: string;
  readonly timestamp: string;
}

export interface ApiPaginatedResponse<T> {
  readonly data: T[];
  readonly pagination: {
    readonly total: number;
    readonly page: number;
    readonly limit: number;
    readonly hasNextPage: boolean;
  };
}

export interface ApiCreateReportRequest {
  readonly category: IncidentCategory;
  readonly description?: string;
  /** Precise coordinates provided by device — stored privately */
  readonly latitude: number;
  readonly longitude: number;
  readonly district?: string;
  readonly city?: string;
  /** Client-generated IDs of media files already uploaded via signed URL */
  readonly mediaUploadIds: string[];
  /**
   * User's explicit consent to this specific submission.
   * Must be actively confirmed on the privacy review screen.
   */
  readonly privacyConsentGiven: true;
}

export interface ApiUploadTokenRequest {
  readonly mediaType: MediaType;
  readonly fileSizeBytes: number;
  readonly mimeType: string;
}

export interface ApiUploadTokenResponse {
  /** Opaque upload ID used to reference the file after upload completes */
  readonly uploadId: string;
  /** Short-lived signed URL to PUT the file directly to Cloud Storage */
  readonly signedUrl: string;
  /** When the signed URL expires (ISO 8601) */
  readonly expiresAt: string;
}

// ─── Gamification Types ────────────────────────────────────────────────────

export interface XpEvent {
  readonly reason: XpReason;
  readonly points: number;
  readonly timestamp: string;
}

export enum XpReason {
  /** Awarded only after a moderator verifies community-event attendance. */
  VERIFIED_COMMUNITY_ATTENDANCE = 'VERIFIED_COMMUNITY_ATTENDANCE',
}

export interface Achievement {
  readonly id: string;
  readonly key: string;
  readonly titleTr: string;
  readonly descriptionTr: string;
  /** ISO 8601 date when the user earned this */
  readonly earnedAt?: string;
}

export interface CommunityEventSummary {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly city: string;
  readonly district?: string;
  readonly startsAt: string;
  readonly participantCount: number;
  readonly joined: boolean;
}

export interface EngagementSummary {
  readonly totalXp: number;
  readonly level: number;
  readonly verifiedEventCount: number;
  readonly achievements: readonly Achievement[];
  readonly recentXpEvents: readonly XpEvent[];
}

export type InAppNotificationType = 'COMMUNITY_ATTENDANCE_VERIFIED';

export interface InAppNotification {
  readonly id: string;
  readonly type: InAppNotificationType;
  readonly eventTitle: string;
  readonly createdAt: string;
  readonly readAt?: string;
}

export interface EngagementPreferences {
  readonly inAppNotificationsEnabled: boolean;
  readonly pushNotificationsEnabled: boolean;
  readonly leaderboardOptIn: boolean;
}

export interface LeaderboardEntry {
  readonly rank: number;
  readonly displayName: string;
  readonly totalXp: number;
}

export interface CommunityTeamSummary {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly city: string;
  readonly district?: string;
  readonly memberCount: number;
  readonly joined: boolean;
}

export interface TeamLeaderboardEntry {
  readonly rank: number;
  readonly teamName: string;
  readonly memberCount: number;
  readonly totalXp: number;
}
