export type ProjectStatus =
  | "draft"
  | "reviewing"
  | "active"
  | "funded"
  | "failed"
  | "completed"
  | "cancelled";

export type RewardType = "physical" | "digital" | "experience" | "no_reward";

export type BackerStatus = "pending" | "paid" | "refunded" | "cancelled";

export type PaymentMethod =
  | "card"
  | "apple_pay"
  | "google_pay"
  | "paypal"
  | "link";

export interface Profile {
  id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  website_url?: string;
  twitter_handle?: string;
  total_backed: number;
  total_created: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name_ja: string;
  name_en: string;
  icon: string;
  color: string;
  sort_order: number;
}

export interface Project {
  id: string;
  creator_id?: string;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  story?: string;
  title_en?: string;
  tagline_en?: string;
  description_en?: string;
  category_id?: string;
  tags: string[];
  goal_amount: number;
  current_amount: number;
  backer_count: number;
  currency: string;
  status: ProjectStatus;
  featured: boolean;
  main_image_url?: string;
  images: string[];
  video_url?: string;
  start_date?: string;
  end_date?: string;
  submitted_at?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  share_count: number;
  created_at: string;
  updated_at: string;
  // Joined
  profiles?: Profile;
  categories?: Category;
  rewards?: Reward[];
}

export interface Reward {
  id: string;
  project_id: string;
  title: string;
  description: string;
  title_en?: string;
  description_en?: string;
  amount: number;
  quantity_total?: number;
  quantity_claimed: number;
  reward_type: RewardType;
  needs_address: boolean;
  digital_delivery_info?: string;
  estimated_delivery_date?: string;
  sort_order: number;
  created_at: string;
}

export interface GuestAddress {
  postal_code: string;
  prefecture: string;
  city: string;
  address_line1: string;
  address_line2?: string;
  country: string;
}

export interface Backer {
  id: string;
  project_id: string;
  reward_id?: string;
  user_id?: string;
  guest_nickname?: string;
  guest_email: string;
  guest_address?: GuestAddress;
  amount: number;
  fee_amount: number;
  total_amount: number;
  currency: string;
  message?: string;
  is_anonymous: boolean;
  stripe_payment_intent_id?: string;
  stripe_session_id?: string;
  payment_method?: PaymentMethod;
  status: BackerStatus;
  digital_delivered_at?: string;
  created_at: string;
  updated_at: string;
  // Joined
  profiles?: Profile;
  rewards?: Reward;
}

export interface ProjectUpdate {
  id: string;
  project_id: string;
  creator_id?: string;
  title: string;
  content: string;
  title_en?: string;
  content_en?: string;
  is_backers_only: boolean;
  created_at: string;
  profiles?: Profile;
}

export interface Comment {
  id: string;
  project_id: string;
  user_id?: string;
  parent_id?: string;
  content: string;
  is_anonymous: boolean;
  guest_nickname?: string;
  likes_count: number;
  created_at: string;
  profiles?: Profile;
  replies?: Comment[];
}

export interface BackingFormData {
  rewardId?: string;
  amount: number;
  guestNickname?: string;
  guestEmail: string;
  guestAddress?: GuestAddress;
  message?: string;
  isAnonymous: boolean;
  paymentMethod: PaymentMethod;
}

export interface CreateProjectFormData {
  title: string;
  tagline: string;
  description: string;
  story: string;
  categoryId: string;
  tags: string[];
  goalAmount: number;
  endDate: string;
  rewards: Omit<Reward, "id" | "project_id" | "quantity_claimed" | "created_at">[];
}

export interface AIGenerateRequest {
  type: "description" | "tagline" | "story" | "reward_description" | "translate";
  input: string;
  context?: string;
  targetLanguage?: string;
}

export interface AIGenerateResponse {
  result: string;
  tokens_used?: number;
}

export interface StripeCheckoutSession {
  sessionId: string;
  url: string;
}

export interface ProjectStats {
  progress_percentage: number;
  days_left: number;
  is_funded: boolean;
  average_backing: number;
}
