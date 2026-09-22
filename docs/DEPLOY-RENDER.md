# Render 배포 (Web + PostgreSQL)

이 프로젝트는 **하나의 Web Service**가 정적 HTML/CSS/JS와 **공지 API**를 함께 제공하고, **PostgreSQL**에 공지 데이터를 저장합니다.

## 구조

| Render 리소스 | 역할 |
|---------------|------|
| **Web Service** (`server/`) | Express — `/api/*`, `/admin/`, 사이트 정적 파일 |
| **PostgreSQL** | `notices` 테이블 |

- 공지 목록: `/community/notice.html`
- 공지 상세: `/community/notice-detail.html?id=1`
- 관리자: `/admin/` (비밀번호 로그인)

---

## 1. PostgreSQL (DB) — 유료 플랜 안내

Render **무료 PostgreSQL** 인스턴스는 계정당 개수·기간 제한이 있어, 이미 다 썼다면 **유료 DB**가 필요합니다.

1. [Render Dashboard](https://dashboard.render.com) → **New +** → **PostgreSQL**
2. **Name**: 예) `on-festa-db`
3. **Plan** (2026년 기준 참고):
   - **Free**: 신규/슬롯 가능할 때만 (90일 등 제한 있음)
   - **Basic** (예: 256MB~): 월 약 **$7 전후** — 소규모 공지 게시판에 충분
4. 생성 후 **Connections → Internal Database URL** 또는 **External Database URL** 확인  
   - Web Service와 **같은 Render 리전**에 두면 Internal URL 권장

`render.yaml`에는 `basic-256mb` 예시가 들어 있습니다. Dashboard에서 플랜 이름이 다를 수 있으니 생성 화면에서 선택 가능한 최소 유료 플랜을 고르면 됩니다.

---

## 2. Web Service

### Blueprint (권장)

1. GitHub에 `on-festa` 저장소 푸시
2. Render → **New +** → **Blueprint**
3. 저장소 선택 → `render.yaml` 적용
4. **Environment**에서 수동 입력:
   - `ADMIN_PASSWORD_HASH` — 아래 해시 생성 스크립트로 생성 (필수 권장)

### 수동 생성

1. **New +** → **Web Service** → 같은 저장소
2. **Root Directory**: `server`
3. **Build**: `npm install`
4. **Start**: `npm start`
5. **Environment Variables**:
   | Key | Value |
   |-----|--------|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | Postgres의 **Connection String** |
   | `SESSION_SECRET` | 32자 이상 랜덤 문자열 |
   | `ADMIN_PASSWORD_HASH` | bcrypt 해시 (아래) |

`DATABASE_URL`은 Web Service 화면에서 Postgres를 **Link Database**로 연결하면 자동 주입할 수 있습니다.

---

## 3. 관리자 비밀번호 해시

로컬에서:

```bash
cd server
npm install
node scripts/hash-password.js 'YOUR_STRONG_PASSWORD'
```

출력된 `ADMIN_PASSWORD_HASH=...` 를 Render Web Service 환경 변수에 넣습니다.  
**운영에서는 `ADMIN_PASSWORD` 평문은 사용하지 마세요.**

---

## 4. 로컬 개발

```bash
# Postgres 로컬 실행 후
cd server
cp ../.env.example .env
# .env 에 DATABASE_URL, SESSION_SECRET, ADMIN_PASSWORD 설정

npm install
npm run dev
```

- 사이트: http://localhost:3000  
- 관리자: http://localhost:3000/admin/  
- API: http://localhost:3000/api/notices  

---

## 5. 배포 후 확인

1. `https://YOUR-SERVICE.onrender.com/api/health` → `{"ok":true}`
2. `/community/notice.html` — 목록 (비어 있어도 OK)
3. `/admin/` — 로그인 후 공지 작성
4. 목록·상세에 글이 보이는지 확인

---

## 6. 비용 요약 (대략)

- **Web Service Starter**: 약 $7/월 (Sleep 없이 운영 시; Free Web은 슬립 있음)
- **PostgreSQL Basic**: 약 $7/월 (무료 DB 불가 시)

정적 사이트만 Render Static Site에 두고 API만 Web Service로 분리할 수도 있지만, 그 경우 **CORS·쿠키(관리자)** 설정이 필요합니다. 현재 구성은 **한 Web Service에 통합**하는 방식이 가장 단순합니다.

---

## 7. 보안 참고

- `/admin/` URL은 검색 노출을 막기 위해 `noindex` 처리되어 있습니다.
- 관리자 URL을 더 obscure하게 하려면 Reverse proxy 또는 추가 인증(IP allowlist 등)을 Render/Cloudflare에서 검토하세요.
- HTTPS는 Render가 기본 제공합니다 (`SESSION_SECRET` + `secure` 쿠키).
