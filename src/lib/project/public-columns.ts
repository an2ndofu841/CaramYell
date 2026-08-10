/**
 * 誰でも見られる場所（一覧API・詳細ページ・支援ページ）で projects から取る列。
 *
 * select("*") にしていると preview_token まで返ってしまう。これは掲載前の
 * ページを関係者に見せるための鍵で、持っていれば下書きの中身も支援者限定の
 * 活動報告も読めてしまうため、公開レスポンスに混ぜてはいけない。
 * 審査の内部事情（submitted_at / reviewed_at / rejection_reason）も同様に外す。
 *
 * 列を足したときはここにも足す。忘れても画面が壊れて気づけるよう、
 * 公開側は明示列だけを使う。
 */
export const PUBLIC_PROJECT_COLUMNS = [
  "id",
  "creator_id",
  "title",
  "slug",
  "tagline",
  "description",
  "story",
  "title_en",
  "tagline_en",
  "description_en",
  "story_en",
  "category_id",
  "tags",
  "goal_amount",
  "current_amount",
  "backer_count",
  "currency",
  "status",
  "featured",
  "main_image_url",
  "images",
  "video_url",
  "start_date",
  "end_date",
  "share_count",
  "created_at",
  "updated_at",
  "allow_free_amount",
  "allow_comments",
  "theme",
  "faqs",
].join(", ");
