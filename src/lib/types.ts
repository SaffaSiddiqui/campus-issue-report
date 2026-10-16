import type { Category, Priority, Status } from "./constants";

export type Profile = {
  id: string;
  full_name: string | null;
  role: "student" | "admin";
};

export type Issue = {
  id: string;
  user_id: string;
  category: Category;
  title: string;
  description: string;
  location: string;
  priority: Priority;
  status: Status;
  image_urls: string[];
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  profiles?: { full_name: string | null } | null;
};

export type IssueUpdate = {
  id: string;
  issue_id: string;
  status: Status;
  note: string | null;
  changed_by: string | null;
  created_at: string;
};
