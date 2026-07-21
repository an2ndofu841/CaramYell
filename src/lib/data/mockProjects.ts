import { Project } from "@/types";

/**
 * デモ用のモックプロジェクトデータ。
 * トップの注目セクション・一覧ページ・詳細ページで共通利用し、
 * slug の整合性を保つ。本番では Supabase のデータが優先される。
 */
export const mockProjects: Project[] = [
  {
    id: "1",
    creator_id: "u1",
    title: "上質な革小物を届けたい - ハンドメイドブランドの挑戦",
    slug: "handmade-leather-goods",
    tagline: "一つひとつ手作業で仕上げる、長く愛せる革小物",
    description: `使うほどに味わいが増す、上質なフルグレインレザーの小物を作っています。

職人歴20年の技術を活かし、財布・名刺入れ・キーケースなど、毎日使いたくなるアイテムを一点ずつ丁寧に仕上げます。

大量生産では実現できない、細部までこだわった縫製と革選び。あなたの日常に寄り添う、長く愛せる革小物をお届けします。`,
    story: `**このプロジェクトを始めたきっかけ**

祖父から受け継いだ革工房を、次の世代へ残したい。その想いからこのブランドを立ち上げました。

安価な量産品があふれる時代だからこそ、本物の革の魅力と、手仕事のあたたかみを伝えたいと考えています。

いただいた支援は、材料の仕入れと工房設備の拡充に使わせていただきます。`,
    category_id: "cat-fashion",
    tags: ["ハンドメイド", "革小物", "ファッション"],
    goal_amount: 1500000,
    current_amount: 1230000,
    backer_count: 1234,
    currency: "JPY",
    status: "active",
    featured: true,
    main_image_url: "https://images.unsplash.com/photo-1473188588951-666fce8e7c68?w=1200&q=80",
    images: [],
    start_date: "2026-05-01",
    end_date: "2026-07-18",
    share_count: 156,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-06-01T00:00:00Z",
    profiles: {
      id: "u1",
      display_name: "Aoi Tanaka",
      avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
      bio: "革職人。祖父の工房を受け継ぎ、ハンドメイドの革小物を制作しています。",
      role: "user",
      total_backed: 12,
      total_created: 3,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    },
    categories: {
      id: "cat-fashion",
      slug: "fashion",
      name_ja: "ファッション",
      name_en: "Fashion",
      icon: "👜",
      color: "#F2807B",
      sort_order: 7,
    },
    rewards: [
      {
        id: "r1-1",
        project_id: "1",
        title: "感謝のメッセージ＋制作レポート",
        description: "心を込めたお礼メッセージと、制作の様子をまとめたデジタルレポートをお届けします。",
        amount: 1000,
        quantity_claimed: 320,
        reward_type: "digital",
        needs_address: false,
        estimated_delivery_date: "2026-08-31",
        sort_order: 1,
        created_at: "2026-05-01T00:00:00Z",
      },
      {
        id: "r1-2",
        project_id: "1",
        title: "オリジナルレザーキーケース",
        description: "手縫いで仕上げたキーケース。お好みのカラー（キャメル / ダークブラウン）をお選びいただけます。",
        amount: 5000,
        quantity_total: 300,
        quantity_claimed: 210,
        reward_type: "physical",
        needs_address: true,
        estimated_delivery_date: "2026-10-31",
        sort_order: 2,
        created_at: "2026-05-01T00:00:00Z",
      },
      {
        id: "r1-3",
        project_id: "1",
        title: "二つ折り財布フルセット",
        description: "フルグレインレザーの二つ折り財布。名入れ刻印サービス付き。",
        amount: 18000,
        quantity_total: 100,
        quantity_claimed: 64,
        reward_type: "physical",
        needs_address: true,
        estimated_delivery_date: "2026-11-30",
        sort_order: 3,
        created_at: "2026-05-01T00:00:00Z",
      },
    ],
  },
  {
    id: "2",
    creator_id: "u2",
    title: "小さな焼き菓子屋さんをオープンしたい",
    slug: "small-bakery-open",
    tagline: "地元の素材で作る、心あたたまる焼き菓子のお店",
    description: `地元農家さんの素材にこだわった、焼き菓子専門店をオープンします。

季節のフルーツを使ったパウンドケーキ、素朴な味わいのクッキー、しっとり焼き上げたスコーン。
添加物に頼らず、素材そのものの美味しさを引き出したお菓子を作ります。

お店を拠点に、地域の人が集える温かい場所を作りたいと考えています。`,
    story: `**夢だったお店を、みんなと一緒に**

パティシエとして10年間働いてきましたが、いつか自分のお店を持つことが夢でした。

地元の素材を使い、作り手の顔が見えるお菓子屋さん。そんな場所を、応援してくださる皆さんと一緒に作り上げたいです。

支援金は、店舗の内装とオーブンなどの設備費用に充てさせていただきます。`,
    category_id: "cat-food",
    tags: ["フード", "開業", "焼き菓子"],
    goal_amount: 1500000,
    current_amount: 975000,
    backer_count: 856,
    currency: "JPY",
    status: "active",
    featured: false,
    main_image_url: "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=1200&q=80",
    images: [],
    start_date: "2026-06-20",
    end_date: "2026-07-04",
    share_count: 89,
    created_at: "2026-06-20T00:00:00Z",
    updated_at: "2026-07-01T00:00:00Z",
    profiles: {
      id: "u2",
      display_name: "Haruki Sato",
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
      bio: "パティシエ。地元の素材を活かした焼き菓子作りに情熱を注いでいます。",
      role: "user",
      total_backed: 5,
      total_created: 1,
      created_at: "2024-06-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    },
    categories: {
      id: "cat-food",
      slug: "food",
      name_ja: "フード",
      name_en: "Food",
      icon: "🍪",
      color: "#F5A34B",
      sort_order: 6,
    },
    rewards: [
      {
        id: "r2-1",
        project_id: "2",
        title: "オープン記念デジタルカード",
        description: "感謝のメッセージカードをデジタルでお届け。店頭で使えるドリンク割引券付き。",
        amount: 1500,
        quantity_claimed: 240,
        reward_type: "digital",
        needs_address: false,
        estimated_delivery_date: "2026-09-30",
        sort_order: 1,
        created_at: "2026-06-20T00:00:00Z",
      },
      {
        id: "r2-2",
        project_id: "2",
        title: "焼き菓子詰め合わせボックス",
        description: "看板メニューのクッキー・スコーン・パウンドケーキの詰め合わせをお届けします。",
        amount: 4000,
        quantity_total: 400,
        quantity_claimed: 312,
        reward_type: "physical",
        needs_address: true,
        estimated_delivery_date: "2026-10-31",
        sort_order: 2,
        created_at: "2026-06-20T00:00:00Z",
      },
      {
        id: "r2-3",
        project_id: "2",
        title: "1日パティシエ体験＋詰め合わせ",
        description: "オープン後のお店で、焼き菓子作りを体験できます。お土産の詰め合わせ付き。",
        amount: 12000,
        quantity_total: 30,
        quantity_claimed: 18,
        reward_type: "experience",
        needs_address: true,
        estimated_delivery_date: "2026-12-31",
        sort_order: 3,
        created_at: "2026-06-20T00:00:00Z",
      },
    ],
  },
  {
    id: "3",
    creator_id: "u3",
    title: "オリジナル文具ブランドを育てて世界に届けたい",
    slug: "original-stationery-brand",
    tagline: "書くことが楽しくなる、こだわりの文具シリーズ",
    description: `書き心地とデザインにとことんこだわった、オリジナル文具ブランドを立ち上げます。

なめらかに書けるボールペン、開きやすいノート、持ち歩きたくなるペンケース。
毎日の「書く」時間を、少し豊かにする道具をお届けします。

日本の職人技と現代的なデザインを融合させ、いずれは世界へ展開することを目指しています。`,
    story: `**「書く」を、もっと楽しく**

デジタルの時代だからこそ、手で書くことの価値を大切にしたい。

そんな想いから、こだわり抜いた文具シリーズを開発しました。試作を重ね、ようやく納得のいく品質にたどり着きました。

支援金は量産のための金型製作と、初回生産費用に使わせていただきます。`,
    category_id: "cat-art",
    tags: ["文具", "デザイン", "ものづくり"],
    goal_amount: 1500000,
    current_amount: 705600,
    backer_count: 612,
    currency: "JPY",
    status: "active",
    featured: false,
    main_image_url: "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=1200&q=80",
    images: [],
    start_date: "2026-06-01",
    end_date: "2026-08-04",
    share_count: 43,
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-07-01T00:00:00Z",
    profiles: {
      id: "u3",
      display_name: "Yuki Yamamoto",
      avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
      bio: "プロダクトデザイナー。文具を愛し、書く楽しさを広げる道具作りをしています。",
      role: "user",
      total_backed: 8,
      total_created: 2,
      created_at: "2024-03-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    },
    categories: {
      id: "cat-art",
      slug: "art",
      name_ja: "アート",
      name_en: "Art",
      icon: "✒️",
      color: "#C9A87C",
      sort_order: 2,
    },
    rewards: [
      {
        id: "r3-1",
        project_id: "3",
        title: "オリジナルボールペン",
        description: "なめらかな書き心地のオリジナルボールペン1本。限定カラー。",
        amount: 2500,
        quantity_total: 500,
        quantity_claimed: 280,
        reward_type: "physical",
        needs_address: true,
        estimated_delivery_date: "2026-10-31",
        sort_order: 1,
        created_at: "2026-06-01T00:00:00Z",
      },
      {
        id: "r3-2",
        project_id: "3",
        title: "文具フルセット（ノート＋ペン＋ケース）",
        description: "ブランドの世界観を詰め込んだフルセット。名入れ対応。",
        amount: 8000,
        quantity_total: 200,
        quantity_claimed: 95,
        reward_type: "physical",
        needs_address: true,
        estimated_delivery_date: "2026-11-30",
        sort_order: 2,
        created_at: "2026-06-01T00:00:00Z",
      },
    ],
  },
  {
    id: "4",
    creator_id: "u4",
    title: "こだわりのカメラバッグを開発・製品化したい",
    slug: "camera-bag-development",
    tagline: "撮影者目線で設計した、機能美あふれるカメラバッグ",
    description: `プロカメラマンと共同開発する、理想のカメラバッグを製品化します。

素早く機材を取り出せる設計、雨に強い素材、普段使いもできる洗練されたデザイン。
撮影現場での「あったらいいな」を全て詰め込みました。

日常にもなじむ、機能美あふれるカメラバッグをお届けします。`,
    story: `**現場の声から生まれたカメラバッグ**

10年以上撮影の現場に立ち続けてきた中で、既製品への不満が積み重なっていました。

「ならば自分たちで作ろう」とプロダクトチームを結成。試作とテストを繰り返し、ようやく理想の形にたどり着きました。

支援金は量産と品質検査の費用に充てさせていただきます。`,
    category_id: "cat-tech",
    tags: ["カメラ", "プロダクト", "ものづくり"],
    goal_amount: 1500000,
    current_amount: 567000,
    backer_count: 463,
    currency: "JPY",
    status: "active",
    featured: false,
    main_image_url: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=1200&q=80",
    images: [],
    start_date: "2026-05-15",
    end_date: "2026-08-12",
    share_count: 31,
    created_at: "2026-05-15T00:00:00Z",
    updated_at: "2026-07-01T00:00:00Z",
    profiles: {
      id: "u4",
      display_name: "Ren Kimura",
      avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80",
      bio: "プロカメラマン兼プロダクトデザイナー。現場で使える道具作りを追求しています。",
      role: "user",
      total_backed: 3,
      total_created: 1,
      created_at: "2024-08-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    },
    categories: {
      id: "cat-tech",
      slug: "tech",
      name_ja: "テクノロジー",
      name_en: "Technology",
      icon: "📷",
      color: "#8FD4C4",
      sort_order: 4,
    },
    rewards: [
      {
        id: "r4-1",
        project_id: "4",
        title: "早割カメラバッグ（本体）",
        description: "一般販売価格より20%OFFでカメラバッグ本体をお届け。",
        amount: 12000,
        quantity_total: 300,
        quantity_claimed: 210,
        reward_type: "physical",
        needs_address: true,
        estimated_delivery_date: "2026-12-31",
        sort_order: 1,
        created_at: "2026-05-15T00:00:00Z",
      },
      {
        id: "r4-2",
        project_id: "4",
        title: "カメラバッグ＋専用インナーセット",
        description: "本体に加えて、機材を保護する専用インナーケースをセットでお届け。",
        amount: 18000,
        quantity_total: 150,
        quantity_claimed: 78,
        reward_type: "physical",
        needs_address: true,
        estimated_delivery_date: "2027-01-31",
        sort_order: 2,
        created_at: "2026-05-15T00:00:00Z",
      },
    ],
  },
  {
    id: "5",
    creator_id: "u5",
    title: "世界で初めての「香りで楽しむ音楽アルバム」を作りたい！",
    slug: "scent-music-album",
    tagline: "音楽と香りを融合させた全く新しいリスニング体験を届けます",
    description: `音楽を耳だけで楽しむ時代は終わった。

私たちは、音楽と香りを同時に体験できる、世界初の「オルファクトリー・アルバム」を制作します。

アルバムを再生すると同時に専用のアロマデバイスが起動し、楽曲のムードに合わせた香りが部屋に広がります。
雨音のトラックには森と土の香り。情熱的なバラードには深紅のバラの香り。

音楽体験に革命を起こす、全く新しいアルバムプロジェクトです。`,
    story: `**このプロジェクトを始めたきっかけ**

私は幼い頃から音楽と香りへの強い関心を持っていました。音楽を聴くとき、特定の色や香りが頭に浮かぶ「共感覚」を持つ私にとって、音楽と嗅覚を結びつけることは自然なアイデアでした。

3年間の研究開発を経て、音楽に連動してリアルタイムで香りを生成できるデバイスのプロトタイプが完成しました。

このプロジェクトでは、10曲入りのアルバムと専用アロマデバイスをセットにして、世界中のリスナーにお届けします。`,
    category_id: "cat-music",
    tags: ["音楽", "アロマ", "アート", "テクノロジー"],
    goal_amount: 1500000,
    current_amount: 1823000,
    backer_count: 342,
    currency: "JPY",
    status: "funded",
    featured: true,
    main_image_url: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1200&q=80",
    images: [],
    video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    start_date: "2026-01-01",
    end_date: "2026-08-31",
    share_count: 156,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-06-01T00:00:00Z",
    profiles: {
      id: "u5",
      display_name: "Aoi Tanaka",
      avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
      bio: "音楽家・アロマセラピスト。感覚を超えた音楽体験を追求しています。",
      role: "user",
      total_backed: 12,
      total_created: 3,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    },
    categories: {
      id: "cat-music",
      slug: "music",
      name_ja: "音楽",
      name_en: "Music",
      icon: "🎵",
      color: "#F2807B",
      sort_order: 1,
    },
    rewards: [
      {
        id: "r5-1",
        project_id: "5",
        title: "感謝のメッセージ＋名前をライナーノーツに掲載",
        description: "心を込めたお礼メッセージをお届けします。また、アルバムのライナーノーツにあなたのお名前を掲載します。",
        amount: 1000,
        quantity_claimed: 89,
        reward_type: "digital",
        needs_address: false,
        estimated_delivery_date: "2026-09-30",
        sort_order: 1,
        created_at: "2026-01-01T00:00:00Z",
      },
      {
        id: "r5-2",
        project_id: "5",
        title: "限定お礼ボイス＋デジタルアルバム先行配信",
        description: "制作者Aoiによる、あなた宛ての限定音声メッセージをお届け。さらにデジタルアルバムを発売日より1週間早く受け取れます。",
        amount: 3000,
        quantity_total: 200,
        quantity_claimed: 167,
        reward_type: "digital",
        needs_address: false,
        estimated_delivery_date: "2026-09-23",
        sort_order: 2,
        created_at: "2026-01-01T00:00:00Z",
      },
      {
        id: "r5-3",
        project_id: "5",
        title: "アロマデバイス＋CD＋限定香水セット",
        description: "専用アロマデバイス、フィジカルCD、アルバムの世界観を表現した限定香水（3種）のフルセット。",
        amount: 15000,
        quantity_total: 100,
        quantity_claimed: 78,
        reward_type: "physical",
        needs_address: true,
        estimated_delivery_date: "2026-11-30",
        sort_order: 3,
        created_at: "2026-01-01T00:00:00Z",
      },
      {
        id: "r5-4",
        project_id: "5",
        title: "【VIP】レコーディングスタジオ見学＋サイン入りフルセット",
        description: "東京のスタジオでのレコーディング見学招待、直筆サイン入りフルセット、打ち上げパーティへのご招待。",
        amount: 50000,
        quantity_total: 10,
        quantity_claimed: 8,
        reward_type: "experience",
        needs_address: true,
        estimated_delivery_date: "2026-10-31",
        sort_order: 4,
        created_at: "2026-01-01T00:00:00Z",
      },
    ],
  },
  {
    id: "6",
    creator_id: "u6",
    title: "障がいのある子どもたちと作る、インタラクティブ絵本アプリ",
    slug: "interactive-picture-book",
    tagline: "すべての子どもが主人公になれる物語を届けたい",
    description: `AI生成イラストとARを組み合わせた、インクルーシブな絵本アプリを開発しています。

読み手の名前や好きなものを反映して物語が変化し、どんな子どもも「自分が主人公」になれる体験を提供します。

音声読み上げや手話アニメーションにも対応し、障がいの有無にかかわらず一緒に楽しめる絵本を目指します。`,
    story: `**すべての子どもに、物語の主人公になる体験を**

特別支援学校での活動を通じて、既存の絵本では十分に楽しめない子どもたちがいることを知りました。

テクノロジーの力で、その壁を越えられるのではないか。そう考えてこのアプリの開発を始めました。

支援金はアプリの開発費と、無償提供のための基盤づくりに使わせていただきます。`,
    category_id: "cat-tech",
    tags: ["教育", "インクルーシブ", "テクノロジー"],
    goal_amount: 800000,
    current_amount: 534000,
    backer_count: 218,
    currency: "JPY",
    status: "active",
    featured: true,
    main_image_url: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&q=80",
    images: [],
    start_date: "2026-05-01",
    end_date: "2026-09-30",
    share_count: 89,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-07-01T00:00:00Z",
    profiles: {
      id: "u6",
      display_name: "Haruki Sato",
      avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
      bio: "エンジニア・特別支援教育サポーター。テクノロジーで教育の壁をなくしたい。",
      role: "user",
      total_backed: 4,
      total_created: 1,
      created_at: "2024-06-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    },
    categories: {
      id: "cat-tech",
      slug: "tech",
      name_ja: "テクノロジー",
      name_en: "Technology",
      icon: "💻",
      color: "#8FD4C4",
      sort_order: 4,
    },
    rewards: [
      {
        id: "r6-1",
        project_id: "6",
        title: "アプリ1年間ライセンス",
        description: "完成したアプリを1年間ご利用いただけるライセンスをお届けします。",
        amount: 2000,
        quantity_claimed: 130,
        reward_type: "digital",
        needs_address: false,
        estimated_delivery_date: "2026-12-31",
        sort_order: 1,
        created_at: "2026-05-01T00:00:00Z",
      },
      {
        id: "r6-2",
        project_id: "6",
        title: "あなたの名前が絵本に登場",
        description: "アプリ内の特別な物語に、支援者としてお名前を掲載します。アプリ永年ライセンス付き。",
        amount: 6000,
        quantity_total: 150,
        quantity_claimed: 62,
        reward_type: "digital",
        needs_address: false,
        estimated_delivery_date: "2026-12-31",
        sort_order: 2,
        created_at: "2026-05-01T00:00:00Z",
      },
    ],
  },
  {
    id: "7",
    creator_id: "u7",
    title: "京都の職人技×デジタルアートで作る、動く着物コレクション",
    slug: "digital-kimono-collection",
    tagline: "300年の伝統をデジタルアートとして世界へ",
    description: `京都の老舗和装店と現代デジタルアーティストがコラボレーション。

伝統的な着物の意匠を、動くデジタルアート作品として蘇らせます。
職人が手掛けた本物の着物と、その世界観を表現したデジタル作品の両方をお届けします。

300年受け継がれてきた美を、新しい形で世界に発信するプロジェクトです。`,
    story: `**伝統を、未来へつなぐ**

後継者不足に悩む京都の和装文化。その美しさを絶やさないために、テクノロジーとの融合を試みました。

職人の技とデジタルアートが出会うことで生まれる、新しい表現。それを世界中の人に届けたいと考えています。

支援金は制作費と、職人の技術継承のための活動に使わせていただきます。`,
    category_id: "cat-art",
    tags: ["和服", "デジタルアート", "伝統"],
    goal_amount: 2000000,
    current_amount: 880000,
    backer_count: 95,
    currency: "JPY",
    status: "active",
    featured: false,
    main_image_url: "https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=1200&q=80",
    images: [],
    start_date: "2026-06-01",
    end_date: "2026-10-31",
    share_count: 43,
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-07-01T00:00:00Z",
    profiles: {
      id: "u7",
      display_name: "Yuki Yamamoto",
      avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
      bio: "デジタルアーティスト。日本の伝統工芸を現代に伝える活動をしています。",
      role: "user",
      total_backed: 6,
      total_created: 2,
      created_at: "2024-03-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    },
    categories: {
      id: "cat-art",
      slug: "art",
      name_ja: "アート",
      name_en: "Art",
      icon: "🎨",
      color: "#C9A87C",
      sort_order: 2,
    },
    rewards: [
      {
        id: "r7-1",
        project_id: "7",
        title: "デジタルアート作品（データ）",
        description: "動く着物コレクションのデジタルアート作品を高解像度データでお届け。",
        amount: 5000,
        quantity_claimed: 40,
        reward_type: "digital",
        needs_address: false,
        estimated_delivery_date: "2026-12-31",
        sort_order: 1,
        created_at: "2026-06-01T00:00:00Z",
      },
      {
        id: "r7-2",
        project_id: "7",
        title: "職人の手ぬぐい＋デジタル作品",
        description: "京都の職人が手掛けた本物の手ぬぐいと、デジタルアート作品のセット。",
        amount: 15000,
        quantity_total: 100,
        quantity_claimed: 38,
        reward_type: "physical",
        needs_address: true,
        estimated_delivery_date: "2027-01-31",
        sort_order: 2,
        created_at: "2026-06-01T00:00:00Z",
      },
    ],
  },
  {
    id: "8",
    creator_id: "u8",
    title: "全盲のピアニストが語る、「光のない世界の音楽」ドキュメンタリー",
    slug: "blind-pianist-documentary",
    tagline: "見えない世界から生まれる、奇跡のような音楽の記録",
    description: `生まれつき全盲のピアニストの半生を追った、長編ドキュメンタリー映画を制作します。

音だけを頼りに紡がれる旋律、その背後にある葛藤と希望。
彼の音楽がどのように生まれるのかを、丁寧に映像で記録します。

障がいや困難を超えて表現を続ける姿を通じて、多くの人に勇気を届けたいと考えています。`,
    story: `**音楽が照らす、光のない世界**

彼のコンサートで聴いた演奏に、私は言葉を失いました。目が見えないという事実を忘れさせるほどの、圧倒的な表現力。

この才能と生き様を、映像として残さなければならない。そう強く感じてこのプロジェクトを立ち上げました。

支援金は撮影・編集費、そして各地での上映会開催費用に使わせていただきます。`,
    category_id: "cat-video",
    tags: ["ドキュメンタリー", "音楽", "社会"],
    goal_amount: 3000000,
    current_amount: 2100000,
    backer_count: 412,
    currency: "JPY",
    status: "active",
    featured: true,
    main_image_url: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=1200&q=80",
    images: [],
    start_date: "2026-03-01",
    end_date: "2026-09-30",
    share_count: 234,
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-07-01T00:00:00Z",
    profiles: {
      id: "u8",
      display_name: "Sakura Films",
      avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80",
      bio: "ドキュメンタリー映像制作チーム。人の生き様を丁寧に記録しています。",
      role: "user",
      total_backed: 2,
      total_created: 2,
      created_at: "2024-02-01T00:00:00Z",
      updated_at: "2025-01-01T00:00:00Z",
    },
    categories: {
      id: "cat-video",
      slug: "video",
      name_ja: "動画・映像",
      name_en: "Video & Film",
      icon: "🎬",
      color: "#F5A34B",
      sort_order: 5,
    },
    rewards: [
      {
        id: "r8-1",
        project_id: "8",
        title: "オンライン先行視聴＋エンドロール掲載",
        description: "完成した映画をオンラインで先行視聴。エンドロールにお名前を掲載します。",
        amount: 3000,
        quantity_claimed: 220,
        reward_type: "digital",
        needs_address: false,
        estimated_delivery_date: "2027-03-31",
        sort_order: 1,
        created_at: "2026-03-01T00:00:00Z",
      },
      {
        id: "r8-2",
        project_id: "8",
        title: "上映会ご招待＋パンフレット",
        description: "各地で開催する上映会にご招待。限定パンフレットをお届けします。",
        amount: 8000,
        quantity_total: 200,
        quantity_claimed: 120,
        reward_type: "experience",
        needs_address: true,
        estimated_delivery_date: "2027-04-30",
        sort_order: 2,
        created_at: "2026-03-01T00:00:00Z",
      },
    ],
  },
];

export function getAllMockProjects(): Project[] {
  return mockProjects;
}

export function getMockProjectBySlug(slug: string): Project | null {
  return mockProjects.find((p) => p.slug === slug || p.id === slug) || null;
}
