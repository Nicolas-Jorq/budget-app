# Production-Grade Refactoring Plan

## Current State Analysis

**Audit Score: 5.8/10** (Junior-to-Mid level code)

| Area | Score | Critical Issues |
|------|-------|-----------------|
| Testing | 2/10 | Zero client tests, minimal server tests |
| Form Handling | 5/10 | Zod installed but unused, repetitive state |
| Data Fetching | 6/10 | Manual useState/useEffect, no caching |
| Security | 6/10 | No server-side input validation |
| Performance | 6/10 | No memoization, 870KB bundle |

**Target: 8.5+/10** (Senior engineer standards)

---

## Version Control Strategy

```
main (always deployable)
├── refactor/phase-1-foundation  → merge → tag v1.8.0
├── refactor/phase-2-validation  → merge → tag v1.9.0
├── refactor/phase-3-consistency → merge → tag v1.10.0
├── refactor/phase-4-testing     → merge → tag v2.0.0
├── feature/phase-5-search       → merge → tag v2.1.0
└── docs/phase-6-documentation   → merge → tag v2.2.0
```

---

## Phase 1: Foundation (v1.8.0)

**Goal:** Establish infrastructure for scalable data management and error handling

### 1.1 Version Centralization
- [ ] Create `/client/src/config/version.ts` with app version
- [ ] Update Sidebar, API root to use centralized version
- [ ] Add build-time version injection

### 1.2 React Query Setup
**Why:** Replaces manual useState/useEffect with automatic caching, background refetching, optimistic updates

- [ ] Install `@tanstack/react-query` and `@tanstack/react-query-devtools`
- [ ] Create `QueryClientProvider` in App.tsx
- [ ] Create query key factory: `/client/src/lib/queryKeys.ts`
- [ ] Create hooks directory: `/client/src/hooks/queries/`
  - [ ] `useGoals.ts` - Life goals queries
  - [ ] `useMilestones.ts` - Milestone queries
  - [ ] `useBudgets.ts` - Budget queries
  - [ ] `useTransactions.ts` - Transaction queries
- [ ] Migrate Life Goals module first (newest, cleanest)
- [ ] Migrate remaining modules

**Example Pattern:**
```typescript
// hooks/queries/useGoals.ts
export const goalKeys = {
  all: ['goals'] as const,
  lists: () => [...goalKeys.all, 'list'] as const,
  list: (filters: GoalFilters) => [...goalKeys.lists(), filters] as const,
  details: () => [...goalKeys.all, 'detail'] as const,
  detail: (id: string) => [...goalKeys.details(), id] as const,
}

export function useGoals(filters?: GoalFilters) {
  return useQuery({
    queryKey: goalKeys.list(filters),
    queryFn: () => api.get('/life-goals', { params: filters }).then(r => r.data),
  })
}

export function useCreateGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateGoalInput) => api.post('/life-goals', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: goalKeys.lists() })
    },
  })
}
```

### 1.3 Error Boundaries
- [ ] Create `/client/src/components/ErrorBoundary.tsx`
- [ ] Create `/client/src/components/ErrorFallback.tsx`
- [ ] Wrap route groups in Layout.tsx
- [ ] Add module-level error boundaries

### 1.4 Code Splitting
- [ ] Convert page imports to `React.lazy()`
- [ ] Add `Suspense` boundaries with loading fallbacks
- [ ] Verify bundle size reduction (target: <500KB main chunk)

### 1.5 Cleanup
- [ ] Remove 78 `console.log/error` calls, replace with proper error handling
- [ ] Fix TypeScript strict issues if any

**Estimated: 8-12 hours**

---

## Phase 2: Validation & Forms (v1.9.0)

**Goal:** Type-safe validation on both server and client

### 2.1 Server Validation with Zod
- [ ] Create `/server/src/lib/validators/` directory
- [ ] Create validation schemas:
  - [ ] `auth.schema.ts` - Login, register validation
  - [ ] `budget.schema.ts` - Budget CRUD validation
  - [ ] `transaction.schema.ts` - Transaction validation
  - [ ] `goal.schema.ts` - Life goals validation
  - [ ] `milestone.schema.ts` - Milestone validation
- [ ] Create validation middleware: `/server/src/middleware/validate.ts`
- [ ] Apply to all routes

**Example Pattern:**
```typescript
// lib/validators/transaction.schema.ts
import { z } from 'zod'

export const createTransactionSchema = z.object({
  description: z.string().min(1, 'Description is required').max(200),
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Category is required'),
  date: z.string().datetime(),
  budgetId: z.string().optional(),
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>

// middleware/validate.ts
export const validate = (schema: z.ZodSchema) => (req, res, next) => {
  const result = schema.safeParse(req.body)
  if (!result.success) {
    throw AppError.validation('Validation failed', result.error.flatten())
  }
  req.body = result.data
  next()
}

// Usage in routes
router.post('/', validate(createTransactionSchema), controller.create)
```

### 2.2 Client Forms with React Hook Form + Zod
- [ ] Install `react-hook-form` and `@hookform/resolvers`
- [ ] Create `/client/src/lib/validators/` (share schemas if possible)
- [ ] Create reusable form components:
  - [ ] `FormField.tsx` - Input with label and error
  - [ ] `FormSelect.tsx` - Select with label and error
  - [ ] `FormTextarea.tsx` - Textarea with label and error
  - [ ] `FormDatePicker.tsx` - Date input with validation
- [ ] Migrate forms one by one:
  - [ ] GoalForm (Life Goals)
  - [ ] MilestoneForm
  - [ ] TransactionForm
  - [ ] BudgetForm
  - [ ] LoginForm
  - [ ] RegisterForm

**Example Pattern:**
```typescript
// components/forms/FormField.tsx
interface FormFieldProps {
  label: string
  name: string
  register: UseFormRegister<any>
  error?: FieldError
  type?: string
  placeholder?: string
}

export function FormField({ label, name, register, error, ...props }: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-content-secondary mb-1">
        {label}
      </label>
      <input
        {...register(name)}
        {...props}
        className={`w-full px-3 py-2 bg-theme-elevated border rounded-lg ${
          error ? 'border-red-500' : 'border-border-subtle'
        }`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error.message}</p>}
    </div>
  )
}
```

### 2.3 Confirmation Modal Component
- [ ] Create `/client/src/components/ConfirmModal.tsx`
- [ ] Create `useConfirm()` hook for easy usage
- [ ] Replace all `confirm()` calls

**Estimated: 10-14 hours**

---

## Phase 3: Cross-Module Consistency (v1.10.0)

**Goal:** Same UX quality across all modules

### 3.1 Tasks Module Updates
- [ ] Add toast notifications to all operations
- [ ] Add skeleton loading states
- [ ] Create TaskDetail page (like GoalDetail)
- [ ] Add inline subtask management

### 3.2 Health Module Updates
- [ ] Add toast notifications
- [ ] Add skeleton loading
- [ ] Ensure consistent card patterns

### 3.3 Finance Module Updates
- [ ] Add toast notifications to Budgets, Transactions
- [ ] Add skeleton loading to all pages
- [ ] Ensure Dashboard uses consistent patterns

### 3.4 Component Standardization
- [ ] Create `/client/src/components/ui/` directory
- [ ] Extract common components:
  - [ ] `Card.tsx`
  - [ ] `Button.tsx`
  - [ ] `Badge.tsx`
  - [ ] `Skeleton.tsx`
  - [ ] `EmptyState.tsx`
  - [ ] `PageHeader.tsx`

**Estimated: 8-10 hours**

---

## Phase 4: Testing (v2.0.0)

**Goal:** Minimum 60% coverage, E2E for critical flows

### 4.1 Testing Setup
- [ ] Install Vitest, @testing-library/react, @testing-library/user-event
- [ ] Configure `/client/vitest.config.ts`
- [ ] Create test utilities: `/client/src/test/utils.tsx`
- [ ] Setup MSW for API mocking

### 4.2 Component Tests
- [ ] Test all form components
- [ ] Test auth flow (login, register, logout)
- [ ] Test toast notifications
- [ ] Test error boundaries

### 4.3 Hook Tests
- [ ] Test React Query hooks
- [ ] Test useCategories
- [ ] Test useToast
- [ ] Test useModules

### 4.4 Server Tests
- [ ] Expand existing service tests
- [ ] Add controller tests
- [ ] Add middleware tests (validate, authenticate)
- [ ] Add integration tests

### 4.5 E2E Tests
- [ ] Install Playwright
- [ ] Critical flow tests:
  - [ ] User registration → login → create budget → add transaction
  - [ ] Create goal → add milestones → complete goal
  - [ ] Full auth flow with token refresh

**Estimated: 16-20 hours**

---

## Phase 5: Features (v2.1.0+)

### 5.1 Global Search
- [ ] Backend: Add search endpoints for each module
- [ ] Frontend: Create SearchCommand component (cmd+k)
- [ ] Index relevant fields for fast search

### 5.2 Data Export
- [ ] Export transactions to CSV
- [ ] Export goals to JSON
- [ ] Full backup download

### 5.3 Budget Alerts
- [ ] Backend: Alert checking on transaction create
- [ ] Frontend: Alert banner component
- [ ] Optional: Email notifications

**Estimated: 12-16 hours**

---

## Phase 6: Documentation & Polish (v2.2.0)

### 6.1 API Documentation
- [ ] Install swagger-jsdoc and swagger-ui-express
- [ ] Document all endpoints with OpenAPI specs
- [ ] Add `/api/docs` route

### 6.2 Project Documentation
- [ ] Create `ARCHITECTURE.md` with system diagrams
- [ ] Create `DEPLOYMENT.md` with deployment guide
- [ ] Create `CONTRIBUTING.md`
- [ ] Update `README.md` with full setup instructions

### 6.3 CI/CD Pipeline
- [ ] GitHub Actions for:
  - [ ] Lint on PR
  - [ ] Test on PR
  - [ ] Build verification
  - [ ] Deploy to staging on merge to main

**Estimated: 6-8 hours**

---

## Total Estimated Time

| Phase | Hours | Priority |
|-------|-------|----------|
| Phase 1: Foundation | 8-12 | Critical |
| Phase 2: Validation | 10-14 | Critical |
| Phase 3: Consistency | 8-10 | High |
| Phase 4: Testing | 16-20 | High |
| Phase 5: Features | 12-16 | Medium |
| Phase 6: Documentation | 6-8 | Medium |
| **Total** | **60-80 hours** | |

---

## Success Metrics

After refactoring, the codebase should achieve:

- [ ] **Testing:** 60%+ coverage (up from ~5%)
- [ ] **Bundle Size:** <500KB main chunk (down from 870KB)
- [ ] **Type Safety:** 100% validated API inputs
- [ ] **Performance:** <100ms average API response
- [ ] **Lighthouse Score:** 90+ on all metrics
- [ ] **Developer Experience:** <5 min to understand any module

---

## Getting Started

```bash
# Create the first feature branch
git checkout -b refactor/phase-1-foundation

# After completing phase 1
git add -A
git commit -m "feat: add React Query, error boundaries, code splitting"
git checkout main
git merge --squash refactor/phase-1-foundation
git commit -m "Phase 1: Foundation infrastructure (v1.8.0)"
git tag v1.8.0
git push origin main --tags
```
