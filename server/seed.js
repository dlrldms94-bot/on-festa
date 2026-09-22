import { getPool } from './db.js';

const SAMPLE_NOTICES = [
  {
    title: '[필독] 2026 서울관광 ON 페스타 개최 안내',
    body: `2026 서울관광 ON 페스타가 남산 팔각정 일원에서 개최됩니다.

■ 일시: 2026. 10. 2.(금) ~ 10. 3.(토) 13:00 ~ 20:00
■ 장소: 남산 팔각정 일원
■ 입장: 무료 (별도 예약 없음)

K-POP·전통공연, 체험·전시 프로그램, 스탬프 투어 등 다양한 프로그램을 준비했습니다.
현장 상황에 따라 일부 프로그램 운영 시간이 조정될 수 있습니다.`,
    is_pinned: true,
  },
  {
    title: '스탬프 투어 및 기념품 수령 안내',
    body: `행사장 입구에서 스탬프 투어 리플릿을 수령한 뒤, 체험 부스 5곳의 스탬프를 모아 주세요.

스탬프 투어를 완료하시면 특별 기념품을 드립니다.
※ 기념품은 준비 수량 소진 시 조기 종료될 수 있습니다.
※ 자세한 위치는 [축제장소] 메뉴의 배치도를 참고해 주세요.`,
    is_pinned: false,
  },
  {
    title: '우천 시 운영 및 안전 안내',
    body: `가벼운 우천 시에는 대부분의 프로그램이 정상 진행됩니다.

강풍·호우·낙뢰 등 기상 특보 발령 시 공연·체험 일부가 변경 또는 취소될 수 있으며, 변경 사항은 본 공지사항과 현장 안내를 통해 알려 드립니다.

우산·우비 등 개인 준비물을 지참해 주시고, 현장 스태프 안내에 협조 부탁드립니다.`,
    is_pinned: false,
  },
];

export async function seedNoticesIfEmpty() {
  const pool = getPool();
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM notices');
  if (rows[0].count > 0) return;

  for (const notice of SAMPLE_NOTICES) {
    await pool.query(
      `INSERT INTO notices (title, body, is_pinned) VALUES ($1, $2, $3)`,
      [notice.title, notice.body, notice.is_pinned]
    );
  }
  console.log(`Seeded ${SAMPLE_NOTICES.length} sample notices.`);
}
