# claude-dash

[Claude Code](https://claude.ai/claude-code) 세션을 위한 인터랙티브 TUI 대시보드.

모든 프로젝트의 Claude Code 세션을 하나의 터미널에서 검색, 미리보기, 재개할 수 있습니다.

[English](README.md) | [한국어](README.ko.md)

## 왜 만들었나?

Claude Code는 프로젝트 디렉토리별로 세션을 보여줍니다. 여러 프로젝트를 넘나들며 작업하는 사람에겐 전체 세션을 볼 수 없다란 문제점이 있습니다.

**claude-dash**는:
- 모든 프로젝트의 세션을 한 화면에
- 대화 내용 미리보기 (word wrap 지원)
- 세션 재개 (현재는 iTerm2+tmux 환경만 지원하고 있습니다)
- Vim 스타일 네비게이션 (`j/k`, `/` 검색, `g/G`)

## 설치

```bash
npx @yoyoyoyoo/claude-dash
```

또는 글로벌 설치:

```bash
npm install -g @yoyoyoyoo/claude-dash
claude-dash
```

## 사용법

### 세션 목록

```
claudash — Claude Code Session Dashboard  (42 sessions, 5 projects)

[Sessions]  [Projects]

▶ my-app         로그인 버그 수정하고 테스트 추가해줘...        2m ago
  api-server     /api/v2 엔드포인트에 rate limiting 추가...   3h ago
  docs           v2 설치 가이드 업데이트...                     1d ago
  my-app         auth 미들웨어 리팩토링...                      2d ago
  infra          GitHub Actions으로 CI/CD 파이프라인 구축...    5d ago

42 sessions | 1/42
[Enter] resume  [p] preview  [/] search  [Tab] switch view  [j/k] navigate  [q] quit
```

### 미리보기 모드

```
Preview  my-app  a1b2c3d4...  12 messages

You:  로그인 버그 수정하고 auth 플로우 테스트 추가해줘
──────────────────────────────────────────────────────
AI:   auth 모듈을 먼저 살펴보고 현재 플로우를 이해한 다음,
      버그를 재현하는 실패 테스트를 작성하고 수정하겠습니다.

You:  좋아. 세션 토큰 만료 시간도 확인해봐
──────────────────────────────────────────────────────
AI:   문제를 찾았습니다. 토큰 만료가 24시간으로 설정되어
      있는데 갱신 로직에서 타임존을 고려하지 않고 있었습니다...

100% [j/k] line [u/d] page [g/G] top/bottom [p/Esc] back
```

### 키바인딩

| 키 | 동작 |
|----|------|
| `j` / `k` / `↑` / `↓` | 세션 탐색 |
| `Enter` | 선택한 세션 재개 |
| `p` | 대화 미리보기 |
| `/` | 검색 / 필터 |
| `Tab` | 세션 / 프로젝트 뷰 전환 |
| `q` / `Esc` | 종료 |

#### 미리보기 모드

| 키 | 동작 |
|----|------|
| `j` / `k` | 한 줄씩 스크롤 |
| `u` / `d` | 페이지 위/아래 |
| `g` / `G` | 맨 위/아래로 이동 |
| `p` / `Esc` | 목록으로 돌아가기 |

## 세션 재개

`Enter`를 누르면 터미널 환경을 자동 감지합니다:

| 환경 | 동작 | 상태 |
|------|------|------|
| tmux 안 | tmux 새 윈도우로 열기 | 지원 |
| macOS + iTerm2 (tmux 없이) | iTerm2 새 탭으로 열기 | 지원 |
| 기타 터미널 | 재개 명령어 출력 | 폴백 |

> **참고:** Terminal.app, Ghostty, Kitty, Alacritty, WezTerm 등은 아직 네이티브 지원 안 됩니다.

설정 파일 위치: `~/.config/claudash/config.json`

```json
{
  "launchMode": "tmux"
}
```

## 작동 방식

`~/.claude/projects/`의 로컬 세션 데이터를 읽습니다. **어디에도 데이터를 전송하지 않습니다.**

## 요구 사항

- Node.js >= 18
- [Claude Code](https://claude.ai/claude-code) 설치

## 라이선스

MIT
