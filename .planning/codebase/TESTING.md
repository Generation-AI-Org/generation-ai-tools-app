# Testing Strategy — Generation AI Tools App

## Current Status: NO TESTS

**As of April 2026, this project has NO automated tests.**

- ✗ No test framework installed (Jest, Vitest, etc.)
- ✗ No test files (no `.test.ts`, `.spec.tsx`, or `__tests__/`)
- ✗ No testing dependencies in `package.json`
- ✗ No test script configured

---

## Rationale for Current State

This is an early-stage MVP project:
- Focus on feature delivery over test coverage
- Small surface area (core app + API + LLM integration)
- Main risk areas: API contracts, LLM response parsing, Supabase queries
- Team size and velocity prioritize shipping first iteration

---

## Recommended Testing Strategy for Future

When the project matures or before scaling, implement tests in this order:

### Phase 1: Critical Path Testing (High ROI)

#### 1. **API Route Tests** (LLM Integration)
**Why:** Core business logic, external dependency, potential for failures

**What to test:**
- `POST /api/chat` endpoint
- Input validation (missing message field)
- Session creation and persistence
- Claude API error handling (missing API key, invalid response)
- Message persistence in Supabase
- Slug validation against available items

**Framework:** Jest + supertest or Playwright (for integration tests)

```typescript
// Example test structure
describe('POST /api/chat', () => {
  it('should return 400 if message is empty', async () => {
    // test implementation
  })
  it('should create a session if sessionId is not provided', async () => {
    // test implementation
  })
  it('should validate returned slugs against item list', async () => {
    // test implementation
  })
  it('should handle Claude API errors gracefully', async () => {
    // test implementation
  })
})
```

#### 2. **LLM Response Parser Tests**
**Why:** High failure risk, complex regex parsing, data correctness

**What to test:**
- `parseResponse()` function in `/lib/llm.ts`
- Valid JSON responses
- Markdown-wrapped JSON responses
- Malformed responses (fallback behavior)
- Slug validation and filtering

```typescript
describe('parseResponse()', () => {
  it('should parse valid JSON responses', () => {
    const input = '{"text": "Hallo", "recommendedSlugs": ["slug1"]}'
    // verify correct output
  })
  it('should extract JSON from markdown blocks', () => {
    const input = 'Some text\n```json\n{"text": "..."}```\nMore text'
    // verify extraction
  })
  it('should return fallback on invalid JSON', () => {
    const input = 'not valid json'
    // verify safe fallback
  })
})
```

#### 3. **Supabase Query Tests**
**Why:** Data integrity, error handling for database failures

**What to test:**
- `getPublishedItems()` in `/lib/content.ts`
- `getItemBySlug()` in `/lib/content.ts`
- Error handling (null data, database errors)
- Return type assertions

**Framework:** Jest with Supabase mock or local Supabase instance

```typescript
describe('getPublishedItems()', () => {
  it('should return ContentItemMeta array', async () => {
    // test with mock Supabase
  })
  it('should filter only published items', async () => {
    // verify query includes .eq('status', 'published')
  })
  it('should handle database errors gracefully', async () => {
    // verify returns empty array on error
  })
})
```

### Phase 2: Component Tests (Medium ROI)

#### 4. **Component Unit Tests**
**Why:** Isolate UI logic, prevent regressions in interaction patterns

**Priority components:**
- `ChatPanel`: message sending, session management, highlighting
- `AppShell`: tab switching, search filtering, keyboard shortcuts
- `ContentCard`: link generation, highlight state styling
- `ThemeProvider`: theme toggle, localStorage persistence

**Framework:** Jest + React Testing Library

```typescript
describe('ChatPanel', () => {
  it('should send message on input submit', async () => {
    const { getByRole } = render(<ChatPanel onHighlight={jest.fn()} />)
    // type and send message, verify API call
  })
  it('should restore session from sessionStorage', async () => {
    sessionStorage.setItem('genai-chat-session', JSON.stringify({ messages: [...] }))
    const { getByText } = render(<ChatPanel onHighlight={jest.fn()} />)
    // verify messages displayed
  })
  it('should highlight cards when recommendations received', async () => {
    const onHighlight = jest.fn()
    render(<ChatPanel onHighlight={onHighlight} />)
    // simulate API response with slugs
    // verify onHighlight called with correct slugs
  })
})
```

#### 5. **Integration Tests** (E2E User Flows)
**Why:** Verify full workflows (chat → API → database → UI update)

**High-value flows:**
1. User sends chat message → Claude recommends tools → cards highlight → click card → navigate to detail page
2. User performs search → filtered results → navigate to detail → reload → detail still shown
3. Dark/light theme toggle → preference persists → reload → theme restored

**Framework:** Playwright or Cypress

```typescript
describe('Chat to Tool Recommendation Flow', () => {
  it('should recommend tools and highlight cards', async () => {
    // Start chat
    // Type message and send
    // Verify API response
    // Verify cards highlighted in library
    // Click recommended card
    // Verify navigation
  })
})
```

### Phase 3: Snapshot & Performance Tests (Low ROI for now)

- **Snapshot tests:** Component rendering output (useful for design regressions)
- **Performance tests:** LLM response time, page load metrics
- **Accessibility tests:** ARIA attributes, keyboard navigation

---

## Testing Infrastructure Recommendations

### Testing Setup (When Ready)

**Framework Selection:**
- **Unit/Integration:** Jest + React Testing Library (standard Next.js stack)
- **E2E:** Playwright (already in Vercel ecosystem)
- **API Mocking:** MSW (Mock Service Worker) for Claude API

**Installation:**
```bash
npm install --save-dev \
  jest @types/jest \
  @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event \
  jest-environment-jsdom \
  ts-jest \
  msw
```

**Configuration:**
- `jest.config.js`: Configure TypeScript, React, environment
- `.mswrc.js`: MSW handler setup for API mocking
- `jest.setup.js`: Global test utilities, cleanup

**Example jest.config.js:**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/*.stories.tsx',
  ],
}
```

**npm scripts:**
```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage"
}
```

---

## Mocking Strategy

### Supabase Mocking
```typescript
jest.mock('@/lib/supabase', () => ({
  createServerClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockItem,
        error: null,
      }),
    })),
  })),
}))
```

### Claude API Mocking (MSW)
```typescript
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

export const server = setupServer(
  http.post('https://api.anthropic.com/v1/messages', () => {
    return HttpResponse.json({
      content: [
        {
          type: 'text',
          text: '{"text": "Recommended ChatGPT", "recommendedSlugs": ["chatgpt"]}',
        },
      ],
    })
  })
)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

### React Component Mocking
```typescript
jest.mock('@/components/KiwiMascot', () => {
  return function MockKiwiMascot() {
    return <div data-testid="kiwi-mascot">Kiwi</div>
  }
})
```

---

## Coverage Targets (Aspirational)

When tests are implemented, aim for:
- **Critical paths:** 100% (API routes, LLM parsing, Supabase queries)
- **Components:** 80%+ (UI logic, event handlers, state management)
- **Utils:** 90%+ (pure functions, type safety verification)
- **Overall:** 70%+ (avoid premature optimization)

---

## Testing Best Practices for This Project

1. **Test behavior, not implementation**
   - ✓ "Message is sent when user presses Enter"
   - ✗ "setState is called with correct value"

2. **Use semantic queries**
   - ✓ `getByRole('button', { name: /send/i })`
   - ✗ `querySelector('.send-btn')`

3. **Mock external dependencies**
   - ✓ Mock Anthropic API, Supabase, localStorage
   - ✗ Make real network requests in tests

4. **Test edge cases**
   - Empty input, invalid responses, missing data
   - Network errors, timeout scenarios

5. **Keep tests maintainable**
   - One assertion per test (where reasonable)
   - Clear test names: `should_action_when_condition`
   - Shared setup in `beforeEach` blocks

---

## Next Steps

1. **Immediate:** Document test-related decisions in git commits
2. **Short-term (v1.1):** Add tests for Phase 1 (API routes, LLM parsing)
3. **Medium-term (v2.0):** Add Phase 2 component tests before major refactors
4. **Ongoing:** Use tests as documentation for expected behavior

---

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library Docs](https://testing-library.com/react)
- [Playwright Testing](https://playwright.dev/)
- [MSW for API Mocking](https://mswjs.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
