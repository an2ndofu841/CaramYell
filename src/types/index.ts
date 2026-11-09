import type { ProjectTheme } from "@/lib/theme/project-theme";

export type { ProjectTheme };

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

/**
 * 支援の決済手段。実決済では Stripe が返す payment_method_details の
 * 種別（ウォレット決済ならその種類）をそのまま入れるので、
 * ダッシュボードで新しい手段を有効にしたらここにも足す。
 */
export type PaymentMethod =
  | "card"
  | "apple_pay"
  | "google_pay"
  | "samsung_pay"
  | "paypal"
  | "link"
  | "paypay"
  | "konbini"
  /** 現地で現金を受け取り、掲載者がダッシュボードから記録した支援 */
  | "cash";

export type UserRole = "user" | "creator" | "admin";

export interface Profile {
  id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  website_url?: string;
  twitter_handle?: string;
  role: UserRole;
  /** 掲載者の事務所・レーベル名。掲載申請の承認時に運営が設定する */
  organization_name?: string | null;
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

/** 掲載者が書くよくある質問の1件。英語は任意で、空なら日本語を出す */
export interface ProjectFaq {
  q: string;
  a: string;
  q_en?: string;
  a_en?: string;
}

export interface Project {
  id: string;
  creator_id?: string;
  /** 管理する事務所。NULL のときは creator_id 本人だけが管理する */
  organization_id?: string | null;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  story?: string;
  title_en?: string;
  tagline_en?: string;
  description_en?: string;
  story_en?: string;
  category_id?: string;
  tags: string[];
  goal_amount: number;
  current_amount: number;
  backer_count: number;
  currency: string;
  status: ProjectStatus;
  featured: boolean;
  allow_free_amount?: boolean;
  allow_comments?: boolean;
  main_image_url?: string;
  images: string[];
  video_url?: string;
  start_date?: string;
  end_date?: string;
  submitted_at?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  preview_token?: string;
  /** ページの配色・フォント設定。未設定なら既定テーマ */
  theme?: ProjectTheme | null;
  /** 掲載者が書いたよくある質問。共通FAQの上に並ぶ */
  faqs?: ProjectFaq[] | null;
  share_count: number;
  created_at: string;
  updated_at: string;
  // Joined
  profiles?: Profile;
  organizations?: Pick<Organization, "id" | "name"> | null;
  categories?: Category;
  rewards?: Reward[];
  project_milestones?: ProjectMilestone[];
  project_updates?: ProjectUpdate[];
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  amount: number;
  title: string;
  description?: string;
  sort_order: number;
  /**
   * ネクストゴール。最終目標を達成したあとのプラスアルファで、
   * 達成率や達成バッジの分母には含めない。未設定（列追加前）は false 扱い
   */
  is_stretch?: boolean;
  created_at: string;
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
  /** 国コード（JP / US / ... / OTHER）。国ごとに必須項目が異なる */
  country: string;
  recipient_name?: string;
  postal_code?: string;
  /** 都道府県 / State / Province / County など */
  prefecture?: string;
  city?: string;
  address_line1?: string;
  address_line2?: string;
}

export type ShippingStatus = "pending" | "preparing" | "shipped" | "delivered";

export interface BackerItem {
  id: string;
  backer_id: string;
  reward_id?: string;
  reward_title: string;
  unit_amount: number;
  quantity: number;
  needs_address: boolean;
  created_at: string;
}

export interface Backer {
  id: string;
  project_id: string;
  reward_id?: string;
  user_id?: string;
  guest_nickname?: string;
  /** 現金支援では未入力のことがある */
  guest_email: string | null;
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
  // 発送管理
  shipping_status?: ShippingStatus;
  shipped_at?: string;
  tracking_number?: string;
  shipping_carrier?: string;
  fulfillment_note?: string;
  /** 現地支援を記録した掲載者 */
  recorded_by?: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  profiles?: Profile;
  rewards?: Reward;
  backer_items?: BackerItem[];
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

export interface MilestoneInput {
  amount: number;
  title: string;
  description?: string;
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
  milestones: MilestoneInput[];
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

export type OrganizationType =
  | "agency"
  | "label"
  | "management"
  | "venue"
  | "individual"
  | "other";

export type CreatorApplicationStatus = "pending" | "approved" | "rejected";

/** 事務所・レーベルからの掲載申請 */
export interface CreatorApplication {
  id: string;
  user_id: string;
  organization_name: string;
  organization_type: OrganizationType;
  contact_name: string;
  contact_email: string;
  phone: string | null;
  website_url: string | null;
  artists: string | null;
  plan: string;
  expected_start: string | null;
  status: CreatorApplicationStatus;
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
}

/** 掲載する事務所。name は公開ページの掲載者名になり、運営だけが変更できる */
export interface Organization {
  id: string;
  name: string;
  created_at: string;
}

/** owner はメンバーの招待・権限変更・削除もできる */
export type OrganizationRole = "owner" | "staff";

/** ログイン中のユーザーが所属する事務所 */
export interface OrganizationMembership {
  id: string;
  name: string;
  role: OrganizationRole;
}

export interface OrganizationMember {
  user_id: string;
  role: OrganizationRole;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
  joined_at: string;
}

export interface OrganizationInvitation {
  id: string;
  email: string;
  role: OrganizationRole;
  expires_at: string;
  created_at: string;
}

// ============================================
// 体験リターンの日程調整
// ============================================
export type RewardScheduleStatus = "open" | "closed";

export interface RewardScheduleSlot {
  id: string;
  schedule_id: string;
  starts_at: string;
  capacity: number;
  note: string;
}

/** 掲載者が支援者に書いてもらう自由記入の質問 */
export interface ScheduleQuestion {
  id: string;
  label: string;
  placeholder: string;
  required: boolean;
}

export interface RewardSchedule {
  id: string;
  project_id: string;
  reward_id: string;
  title: string;
  description: string;
  /** 集合場所・通話URLなど。支援者には日程の確定後にだけ見せる */
  location: string;
  duration_minutes: number | null;
  deadline: string | null;
  status: RewardScheduleStatus;
  /** 候補の枠のほかに「その他（自由記入）」を選べる */
  allow_other: boolean;
  questions: ScheduleQuestion[];
  created_at: string;
  updated_at: string;
  slots: RewardScheduleSlot[];
}

/** 掲載者向け: 日程調整の対象者1人分（1メールアドレス = 1人） */
export interface ScheduleRosterEntry {
  email: string;
  name: string;
  backerCount: number;
  participantId: string | null;
  invitedAt: string | null;
  /** 確定できる枠数（このリターンの支援口数） */
  tickets: number;
  /** 回答した日時。未回答なら null */
  submittedAt: string | null;
  /** 第1希望から順に */
  preferredSlotIds: string[];
  otherText: string;
  answers: Record<string, string>;
  /** 確定した枠 */
  slotIds: string[];
  /** 確定の内容が、最後に送ったお知らせから変わっている */
  needsNotice: boolean;
  message: string;
  /** 返金などで、いまは対象でなくなった人 */
  eligible: boolean;
}

export interface RewardScheduleWithRoster extends RewardSchedule {
  roster: ScheduleRosterEntry[];
  missingEmailCount: number;
}

/** 掲載者向け: リターンごとの日程調整の対象者（作成前の確認用） */
export interface ScheduleTargetPreview {
  name: string;
  email: string;
  tickets: number;
}

/** 支援者向け: 日程の希望を回答する画面に出す内容 */
export interface ScheduleBookingView {
  project: { title: string; path: string };
  rewardTitle: string;
  schedule: {
    title: string;
    description: string;
    /** 日程が確定しているときだけ入る */
    location: string | null;
    durationMinutes: number | null;
    deadline: string | null;
    status: RewardScheduleStatus;
    allowOther: boolean;
    questions: ScheduleQuestion[];
  };
  slots: {
    id: string;
    startsAt: string;
    note: string;
    remaining: number;
    isPast: boolean;
  }[];
  name: string;
  /** 確定する枠数（このリターンの支援口数） */
  tickets: number;
  submittedAt: string | null;
  /** 第1希望から順に */
  preferredSlotIds: string[];
  otherText: string;
  answers: Record<string, string>;
  /** 掲載者が確定した枠 */
  slotIds: string[];
  message: string;
  /** 締切・受付終了でなければ回答を変えられる */
  canChange: boolean;
  /** 確定の取り消しを知らせた後で、まだ選び直していない */
  cancelled: boolean;
}
