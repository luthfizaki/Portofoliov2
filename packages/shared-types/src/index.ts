export type ContentStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "SCHEDULED"
  | "PUBLISHED"
  | "ARCHIVED";

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface ApiSuccess<T> {
  success: true;
  message?: string;
  data: T;
  meta?: ApiMeta;
}

export interface ApiFailure {
  success: false;
  message: string;
  code: string;
  errors?: Array<{ field?: string; message: string }>;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface ProjectListItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverUrl: string | null;
  featured: boolean;
  year: number | null;
  status: ContentStatus;
}

export interface ProjectBlockInput {
  id?: string;
  type: string;
  title?: string;
  content: Record<string, unknown>;
  sortOrder: number;
  isVisible?: boolean;
  desktop?: boolean;
  tablet?: boolean;
  mobile?: boolean;
  layoutVariant?: string;
  background?: string;
  animation?: string;
}
