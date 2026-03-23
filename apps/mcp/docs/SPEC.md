# document-agent-mcp SPEC

## Purpose

- `document-agent-mcp`는 Document AI 기능을 Claude Code, Gemini CLI, Codex 같은 Agent가 사용할 수 있게 연결하는 저장소다.
- 이 저장소는 API를 Agent 친화적인 도구 인터페이스로 노출하는 역할을 맡는다.

## Responsibilities

- MCP 또는 Skill tool definition 작성
- Agent 요청을 API 호출로 변환
- Agent가 이해하기 쉬운 성공/실패 응답 제공
- 문서 처리 기능을 후속 workflow에 연결

## Expected Tools

- `parse_document`
- `get_result`
- `download_result`

## Rules

- parser 로직이나 DB 로직을 이 저장소에 중복 구현하지 않는다.
- API의 canonical schema를 그대로 활용하거나 얇은 adapter만 둔다.
- tool input/output shape는 명확하고 예측 가능해야 한다.
- Agent가 재시도와 복구를 하기 쉬운 에러 형태를 제공한다.

## MVP Approach

- Agent가 가장 단순하게 쓸 수 있는 parse/result/download 흐름을 먼저 고정한다.
- 비동기 parse job 이 기본 계약이 된 경우, Agent가 복구 가능한 최소 상태 조회 도구를 함께 제공한다.

## Deferred Scope

- 아래 항목은 초기 MVP 범위에서 제외하고 별도로 관리한다.
  - queue 기반 비동기 실행 관리 도구
  - 재시도 전용 orchestration 도구

## Non-Goals

- 웹 UI 구현
- parser 엔진 직접 호출 로직의 확산
- API와 다른 별도 데이터 계약 유지

## Current Status

- 현재 저장소는 초기 상태에 가깝다.
- 구현 시작 시 tool surface와 API 매핑부터 먼저 정의한다.
