export const DEMO_USER_ID = "08cccfe3-766f-43bd-b06c-8d909e0f9fe8";

export const DEMO_USER = {
  id: DEMO_USER_ID,
  email: "issue4test@test.com",
  displayName: "김도윤",
  avatarUrl: null,
};

export const DEMO_GROUPS = [
  {
    key: "home302",
    name: "자취방 302호",
    inviteCode: "HOME-302",
    role: "owner",
  },
  {
    key: "lab",
    name: "캡스톤 실험실",
    inviteCode: "LAB-2026",
    role: "member",
  },
];

export const DEMO_CATEGORIES = [
  {
    key: "personal-bath",
    scope: "personal",
    name: "욕실",
    icon: "shower-head",
    color: "#2563eb",
    sortOrder: 10,
  },
  {
    key: "personal-laundry",
    scope: "personal",
    name: "세탁",
    icon: "shirt",
    color: "#0f766e",
    sortOrder: 20,
  },
  {
    key: "personal-kitchen",
    scope: "personal",
    name: "주방",
    icon: "utensils",
    color: "#b45309",
    sortOrder: 30,
  },
  {
    key: "personal-health",
    scope: "personal",
    name: "건강",
    icon: "heart-pulse",
    color: "#be123c",
    sortOrder: 40,
  },
  {
    key: "home-kitchen",
    scope: "home302",
    name: "공용 주방",
    icon: "cooking-pot",
    color: "#ca8a04",
    sortOrder: 10,
  },
  {
    key: "home-living",
    scope: "home302",
    name: "생활 소모품",
    icon: "package",
    color: "#475569",
    sortOrder: 20,
  },
  {
    key: "home-cleaning",
    scope: "home302",
    name: "청소",
    icon: "spray-can",
    color: "#16a34a",
    sortOrder: 30,
  },
  {
    key: "lab-office",
    scope: "lab",
    name: "문구/출력",
    icon: "printer",
    color: "#4f46e5",
    sortOrder: 10,
  },
  {
    key: "lab-pantry",
    scope: "lab",
    name: "회의 준비",
    icon: "coffee",
    color: "#92400e",
    sortOrder: 20,
  },
  {
    key: "lab-safety",
    scope: "lab",
    name: "위생/안전",
    icon: "shield-check",
    color: "#0891b2",
    sortOrder: 30,
  },
];

export const DEMO_ITEMS = [
  {
    slug: "toothpaste",
    scope: "personal",
    categoryKey: "personal-bath",
    name: "덴티스테 플러스화이트 치약",
    brand: "덴티스테",
    cycleDays: 52,
    basePrice: 8900,
    quantity: 1,
    stores: ["올리브영 서울대입구", "쿠팡 로켓배송"],
    dayOfMonth: 5,
    history: [-5, -3, -1, 0],
    stock: 1,
  },
  {
    slug: "shampoo",
    scope: "personal",
    categoryKey: "personal-bath",
    name: "케라시스 데미지 클리닉 샴푸",
    brand: "케라시스",
    cycleDays: 64,
    basePrice: 11900,
    quantity: 1,
    stores: ["이마트 신림점", "마켓컬리"],
    dayOfMonth: 8,
    history: [-5, -3, -1],
    stock: 1,
  },
  {
    slug: "lens-solution",
    scope: "personal",
    categoryKey: "personal-health",
    name: "리뉴 후레쉬 렌즈세정액",
    brand: "바슈롬",
    cycleDays: 38,
    basePrice: 7600,
    quantity: 1,
    stores: ["올리브영 서울대입구", "네이버 스마트스토어"],
    dayOfMonth: 12,
    history: [-5, -4, -2, -1, 0],
    stock: 0,
  },
  {
    slug: "laundry-detergent",
    scope: "personal",
    categoryKey: "personal-laundry",
    name: "퍼실 딥클린 라벤더 2.7L",
    brand: "퍼실",
    cycleDays: 45,
    basePrice: 17800,
    quantity: 1,
    stores: ["쿠팡 로켓배송", "이마트 신림점"],
    dayOfMonth: 16,
    history: [-5, -3, -2, 0],
    stock: 1,
  },
  {
    slug: "fabric-softener",
    scope: "personal",
    categoryKey: "personal-laundry",
    name: "다우니 실내건조 섬유유연제",
    brand: "다우니",
    cycleDays: 50,
    basePrice: 12900,
    quantity: 1,
    stores: ["홈플러스 남현점", "쿠팡 로켓배송"],
    dayOfMonth: 19,
    history: [-4, -2, 0],
    stock: 1,
  },
  {
    slug: "dish-soap-personal",
    scope: "personal",
    categoryKey: "personal-kitchen",
    name: "프릴 베이킹소다 주방세제",
    brand: "프릴",
    cycleDays: 35,
    basePrice: 6900,
    quantity: 1,
    stores: ["다이소 서울대입구역점", "쿠팡 로켓배송"],
    dayOfMonth: 22,
    history: [-5, -4, -3, -2, -1, 0],
    stock: 1,
  },
  {
    slug: "water-filter",
    scope: "personal",
    categoryKey: "personal-kitchen",
    name: "브리타 막스트라 플러스 필터",
    brand: "브리타",
    cycleDays: 56,
    basePrice: 23900,
    quantity: 3,
    stores: ["쿠팡 로켓배송", "이마트몰"],
    dayOfMonth: 24,
    history: [-5, -3, -1],
    stock: 1,
  },
  {
    slug: "vitamin",
    scope: "personal",
    categoryKey: "personal-health",
    name: "고려은단 비타민C 1000",
    brand: "고려은단",
    cycleDays: 72,
    basePrice: 19900,
    quantity: 1,
    stores: ["약국", "쿠팡 로켓배송"],
    dayOfMonth: 27,
    history: [-5, -2, 0],
    stock: 1,
  },
  {
    slug: "rice",
    scope: "home302",
    categoryKey: "home-kitchen",
    name: "대왕님표 여주쌀 10kg",
    brand: "대왕님표",
    cycleDays: 31,
    basePrice: 34900,
    quantity: 1,
    stores: ["이마트 신림점", "쿠팡 로켓프레시"],
    dayOfMonth: 3,
    history: [-5, -4, -3, -2, -1, 0],
    stock: 1,
  },
  {
    slug: "kitchen-towel",
    scope: "home302",
    categoryKey: "home-living",
    name: "크리넥스 안심 키친타월 6롤",
    brand: "크리넥스",
    cycleDays: 28,
    basePrice: 9800,
    quantity: 1,
    stores: ["홈플러스 남현점", "쿠팡 로켓배송"],
    dayOfMonth: 7,
    history: [-5, -4, -3, -2, -1, 0],
    stock: 0,
  },
  {
    slug: "trash-bag",
    scope: "home302",
    categoryKey: "home-living",
    name: "관악구 종량제봉투 20L",
    brand: "관악구",
    cycleDays: 42,
    basePrice: 5000,
    quantity: 2,
    stores: ["GS25 관악청룡점", "CU 서울대입구점"],
    dayOfMonth: 10,
    history: [-5, -3, -1, 0],
    stock: 1,
  },
  {
    slug: "dish-soap-group",
    scope: "home302",
    categoryKey: "home-cleaning",
    name: "자연퐁 솔잎 주방세제 리필",
    brand: "자연퐁",
    cycleDays: 33,
    basePrice: 7900,
    quantity: 1,
    stores: ["이마트 신림점", "쿠팡 로켓배송"],
    dayOfMonth: 13,
    history: [-5, -4, -3, -2, -1, 0],
    stock: 1,
  },
  {
    slug: "toilet-paper",
    scope: "home302",
    categoryKey: "home-living",
    name: "코디 순수 3겹 화장지 30롤",
    brand: "코디",
    cycleDays: 47,
    basePrice: 18900,
    quantity: 1,
    stores: ["쿠팡 로켓배송", "홈플러스 남현점"],
    dayOfMonth: 17,
    history: [-5, -3, -2, 0],
    stock: 1,
  },
  {
    slug: "cleaning-wipes",
    scope: "home302",
    categoryKey: "home-cleaning",
    name: "스카트 물걸레 청소포",
    brand: "스카트",
    cycleDays: 39,
    basePrice: 10900,
    quantity: 1,
    stores: ["다이소 서울대입구역점", "이마트 신림점"],
    dayOfMonth: 20,
    history: [-5, -4, -2, -1, 0],
    stock: 0,
  },
  {
    slug: "coffee-beans-home",
    scope: "home302",
    categoryKey: "home-kitchen",
    name: "스타벅스 하우스 블렌드 원두",
    brand: "스타벅스",
    cycleDays: 25,
    basePrice: 15900,
    quantity: 1,
    stores: ["마켓컬리", "쿠팡 로켓배송"],
    dayOfMonth: 25,
    history: [-5, -4, -3, -2, -1, 0],
    stock: 1,
  },
  {
    slug: "hand-soap-home",
    scope: "home302",
    categoryKey: "home-cleaning",
    name: "아이깨끗해 핸드워시 리필",
    brand: "아이깨끗해",
    cycleDays: 44,
    basePrice: 8400,
    quantity: 1,
    stores: ["올리브영 서울대입구", "쿠팡 로켓배송"],
    dayOfMonth: 28,
    history: [-5, -3, -1],
    stock: 1,
  },
  {
    slug: "a4-paper",
    scope: "lab",
    categoryKey: "lab-office",
    name: "더블에이 A4 복사용지 80g",
    brand: "더블에이",
    cycleDays: 36,
    basePrice: 26500,
    quantity: 1,
    stores: ["문구대통령", "쿠팡 비즈"],
    dayOfMonth: 4,
    history: [-5, -4, -3, -1, 0],
    stock: 1,
  },
  {
    slug: "printer-toner",
    scope: "lab",
    categoryKey: "lab-office",
    name: "브라더 TN-2480 토너",
    brand: "브라더",
    cycleDays: 88,
    basePrice: 76500,
    quantity: 1,
    stores: ["네이버 스마트스토어", "쿠팡 비즈"],
    dayOfMonth: 9,
    history: [-5, -2, 0],
    stock: 1,
  },
  {
    slug: "coffee-capsule",
    scope: "lab",
    categoryKey: "lab-pantry",
    name: "네스프레소 볼루토 캡슐",
    brand: "네스프레소",
    cycleDays: 24,
    basePrice: 18900,
    quantity: 2,
    stores: ["네스프레소 공식몰", "쿠팡 비즈"],
    dayOfMonth: 11,
    history: [-5, -4, -3, -2, -1, 0],
    stock: 0,
  },
  {
    slug: "paper-cup",
    scope: "lab",
    categoryKey: "lab-pantry",
    name: "무형광 종이컵 1000개",
    brand: "탐사",
    cycleDays: 41,
    basePrice: 15800,
    quantity: 1,
    stores: ["쿠팡 비즈", "문구대통령"],
    dayOfMonth: 15,
    history: [-5, -3, -1, 0],
    stock: 1,
  },
  {
    slug: "hand-sanitizer",
    scope: "lab",
    categoryKey: "lab-safety",
    name: "랩신 손소독제 500ml",
    brand: "랩신",
    cycleDays: 57,
    basePrice: 6200,
    quantity: 3,
    stores: ["올리브영 서울대입구", "쿠팡 비즈"],
    dayOfMonth: 18,
    history: [-5, -3, -1],
    stock: 1,
  },
  {
    slug: "aa-battery",
    scope: "lab",
    categoryKey: "lab-office",
    name: "듀라셀 AA 건전지 20입",
    brand: "듀라셀",
    cycleDays: 62,
    basePrice: 17900,
    quantity: 1,
    stores: ["이마트 신림점", "쿠팡 비즈"],
    dayOfMonth: 21,
    history: [-5, -3, 0],
    stock: 1,
  },
  {
    slug: "cable-tie",
    scope: "lab",
    categoryKey: "lab-office",
    name: "흰색 케이블타이 200mm",
    brand: "3M",
    cycleDays: 76,
    basePrice: 7900,
    quantity: 1,
    stores: ["문구대통령", "네이버 스마트스토어"],
    dayOfMonth: 23,
    history: [-5, -2, 0],
    stock: 1,
  },
  {
    slug: "wet-tissue-lab",
    scope: "lab",
    categoryKey: "lab-safety",
    name: "크리넥스 안심 물티슈 캡형",
    brand: "크리넥스",
    cycleDays: 30,
    basePrice: 11900,
    quantity: 1,
    stores: ["쿠팡 비즈", "홈플러스 남현점"],
    dayOfMonth: 26,
    history: [-5, -4, -3, -2, -1, 0],
    stock: 0,
  },
];

export function kstDate(anchor = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(anchor);
}

export function monthDate(anchorDate, monthOffset, dayOfMonth) {
  const [year, month] = kstDate(anchorDate).split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + monthOffset, 1));
  const lastDay = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const day = Math.min(dayOfMonth, lastDay);

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function priceFor(basePrice, sequenceIndex, slug) {
  const slugNoise =
    [...slug].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 700;
  const wave = [-500, 0, 300, -200, 600, 100][sequenceIndex % 6];

  return Math.max(1000, Math.round((basePrice + slugNoise + wave) / 100) * 100);
}

function escapeSvgText(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function productSvg(item, category) {
  const bg = category.color;
  const escapedName = escapeSvgText(item.name);
  const escapedBrand = escapeSvgText(item.brand);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="700" viewBox="0 0 900 700">
  <rect width="900" height="700" fill="#f8fafc"/>
  <rect x="70" y="70" width="760" height="560" rx="44" fill="${bg}"/>
  <rect x="112" y="112" width="676" height="476" rx="32" fill="#ffffff" opacity="0.92"/>
  <text x="150" y="210" font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="#111827">${escapedBrand}</text>
  <text x="150" y="300" font-family="Arial, sans-serif" font-size="58" font-weight="800" fill="#0f172a">${escapedName}</text>
  <text x="150" y="388" font-family="Arial, sans-serif" font-size="32" fill="#475569">BuyLog demo registered product</text>
  <rect x="150" y="455" width="250" height="72" rx="18" fill="${bg}" opacity="0.14"/>
  <text x="174" y="502" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="${bg}">${item.cycleDays} day cycle</text>
  <circle cx="700" cy="470" r="72" fill="${bg}" opacity="0.18"/>
  <circle cx="700" cy="470" r="36" fill="${bg}"/>
</svg>`;
}

export function buildDemoCatalog(anchorDate = new Date()) {
  const groupByKey = new Map(DEMO_GROUPS.map((group) => [group.key, group]));
  const categoryByKey = new Map(
    DEMO_CATEGORIES.map((category) => [category.key, category]),
  );

  const items = DEMO_ITEMS.map((item) => {
    const category = categoryByKey.get(item.categoryKey);
    if (!category) throw new Error(`Missing category for ${item.slug}`);

    const group = item.scope === "personal" ? null : groupByKey.get(item.scope);
    if (item.scope !== "personal" && !group) {
      throw new Error(`Missing group for ${item.slug}`);
    }

    return {
      ...item,
      groupKey: group?.key ?? null,
      imagePath: `items/demo-products/${item.slug}.svg`,
      imageSvg: productSvg(item, category),
      purchases: item.history.map((monthOffset, index) => ({
        purchaseDate: monthDate(anchorDate, monthOffset, item.dayOfMonth),
        price: priceFor(item.basePrice, index, item.slug),
        quantity: item.quantity,
        storeName: item.stores[index % item.stores.length],
        memo: `${item.name} ${item.scope === "personal" ? "개인" : group.name} 정기 구매`,
      })),
    };
  });

  return {
    user: DEMO_USER,
    groups: DEMO_GROUPS,
    categories: DEMO_CATEGORIES,
    items,
  };
}
