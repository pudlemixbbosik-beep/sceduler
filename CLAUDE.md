# 프로젝트 개요

Next.js 기반 웹 앱으로 두 개의 독립적인 기능을 포함합니다.

## 기능 1: 골든래빗 12월 일정 대시보드 (`/`)

`data/golden-rabbit-2025-12.xlsx` 파일을 파싱해서 일정을 월간 캘린더·타임라인·테이블 뷰로 시각화하는 대시보드.

**주요 파일**
- `app/page.tsx` — 진입점, 서버에서 xlsx 파싱 후 클라이언트 컴포넌트에 전달
- `lib/schedule/parse-xlsx.ts` — xlsx → `ScheduleEventJson[]` 변환
- `lib/schedule/load-schedule.ts` — 데이터 디렉터리에서 파일 로드
- `lib/schedule/types.ts` — 공유 타입 및 헤더 상수
- `components/schedule/schedule-dashboard.tsx` — 최상위 대시보드 컴포넌트
- `components/schedule/month-grid.tsx` — 월간 캘린더 뷰
- `components/schedule/day-agenda.tsx` — 일별 타임라인 뷰
- `components/schedule/schedule-table-view.tsx` — 테이블 뷰
- `components/schedule/schedule-filters.tsx` — 부서·상태 필터
- `components/schedule/kpi-summary.tsx` — 요약 KPI 카드

## 기능 2: 강아지 감정 탐지 & 대화 앱 (`/dog-chat`)

카메라 또는 갤러리 사진으로 강아지 감정을 분석하고, Claude와 멀티턴 채팅을 지원하는 모바일 최적화 앱.

**주요 파일**
- `app/dog-chat/page.tsx` — 클라이언트 컴포넌트, 전체 UI 및 상태 관리
- `app/api/dog-emotion/route.ts` — HuggingFace `Dewa/dog_emotion_v2` 모델로 감정 분류
- `app/api/dog-chat/route.ts` — Claude Haiku 스트리밍으로 강아지 대화 생성

**사용자 플로우**
1. 카메라 라이브 뷰 또는 🖼️ 갤러리 버튼으로 사진 선택
2. HuggingFace API로 감정 분류 → Happy / Sad / Angry / Relaxed
3. Claude Haiku가 감정 기반으로 초기 인사 스트리밍 생성
4. 채팅 UI로 전환 → 사용자가 메시지를 보내면 강아지가 대화 히스토리 유지하며 응답

**Phase 상태 흐름**
`idle` → `detecting` → `streaming` → `chat` (멀티턴) / `error`

## 기술 스택

| 항목 | 내용 |
|---|---|
| 프레임워크 | Next.js 16 (App Router, Turbopack) |
| UI | shadcn/ui + Tailwind CSS v4 |
| AI | Anthropic Claude Haiku (`claude-haiku-4-5-20251001`) |
| 감정 탐지 | HuggingFace Inference API (`Dewa/dog_emotion_v2`) |
| 언어 | TypeScript |
| 배포 | Vercel (`sceduler-seven.vercel.app`) |

## 환경 변수

```
ANTHROPIC_API_KEY=    # Claude API 키
HUGGINGFACE_API_KEY=  # HuggingFace Inference API 키 (Read 권한 토큰)
```

## 개발 명령어

```bash
npm install       # 의존성 설치
npm run dev       # 개발 서버 (localhost:3000)
npm run typecheck # 타입 체크
npm run format    # Prettier 포맷
```

## 레포지터리 구조

```
app/
  page.tsx                  # 일정 대시보드 진입점
  layout.tsx                # 루트 레이아웃
  dog-chat/page.tsx         # 강아지 앱 UI
  api/
    dog-emotion/route.ts    # 감정 탐지 API
    dog-chat/route.ts       # 대화 생성 API (스트리밍)
components/
  schedule/                 # 일정 대시보드 컴포넌트
  ui/                       # shadcn 기본 컴포넌트
data/
  golden-rabbit-2025-12.xlsx
lib/
  schedule/                 # xlsx 파싱 유틸
  utils.ts                  # cn() 등 공용 유틸
```

## 향후 개선 아이디어

- HuggingFace 대신 Claude Vision으로 감정 탐지 통합 (API 키 하나로 단순화)
- Nyckel 또는 Roboflow API로 감정 분류 정확도 향상
- 짖는 소리(오디오) 업로드 → 감정 분석 기능
- 감정별 UI 테마 색상 변경
- 대화 히스토리 로컬 저장 (localStorage)
