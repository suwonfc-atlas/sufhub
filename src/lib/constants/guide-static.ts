export const staticSeatGuide = [
  {
    title: "N석",
    atmosphere: "응원 중심",
    description: "응원 분위기를 가장 가까이에서 느끼기 좋은 구역입니다.",
    price: "일반 예매 기준 구단 공지 확인",
    tips: "깃발과 응원 동작이 많아 분위기를 가장 강하게 느낄 수 있습니다.",
  },
  {
    title: "E석",
    atmosphere: "시야 중심",
    description: "경기 전체 흐름을 보기 위한 무난한 선택지입니다.",
    price: "일반 예매 기준 구단 공지 확인",
    tips: "가족, 친구와 함께 편하게 경기 보기 좋은 구역입니다.",
  },
  {
    title: "테이블석",
    atmosphere: "편의 중심",
    description: "음식과 함께 여유 있게 관람하기 좋은 좌석입니다.",
    price: "운영 회차별 상이",
    tips: "일반석보다 수량이 적어 조기 마감될 수 있습니다.",
  },
];

export const staticAwayBusGuide = {
  title: "원정버스 신청 안내",
  description: "원정버스 신청 링크와 신청 순서를 한 번에 확인할 수 있습니다.",
  body: [
    "1. 아래 링크로 들어가 회원가입",
    "2. 축구 > 수원FC > 프로그램 선택",
    "3. 구매 수량(탑승자 수) 선택 > 탑승자 정보 작성 > 구매",
    "4. 본인 포함 최대 2명까지 신청 가능",
    "※요금은 왕복/편도 1인 10,000원입니다.",
  ],
  linkLabel: "원정 버스 링크 열기",
  linkUrl: "https://spo-tour.co.kr/product/list.html?cate_no=104",
};

export const staticMerchGuide = {
  title: "굿즈 구매 링크",
  description: "공식 스토어와 경기장 MD 안내를 한 번에 확인할 수 있습니다.",
  store: {
    title: "공식 온라인 스토어",
    description: "유니폼, 머플러, 시즌 굿즈를 공식몰에서 바로 구매합니다.",
    url: "https://www.suwonfcmall.com/",
  },
  matchdayMd: {
    title: "경기장 MD 안내",
    description: "경기장 MD 안내 이미지를 크게 열어 확인할 수 있습니다.",
    imageSrc: "/images/guide/stadium-md-guide.jpg",
    fallbackLabel: "이미지 준비 중",
  },
};
