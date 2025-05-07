# Jobraker Frontend Development Guidelines

**Version:** 2.0  
**Last Updated:** May 7, 2025  
**Status:** Adopted  
**Owner:** Engineering Lead (Frontend Focus)

## 0. Document History

| Version | Date       | Author          | Changes                                                                                              |
|---------|------------|-----------------|------------------------------------------------------------------------------------------------------|
| 1.0     | May 1, 2025 | [Previous Author] | Initial draft of basic coding conventions                                                              |
| 2.0     | May 7, 2025 | AI Assistant    | Comprehensive update: ESLint/Prettier, Naming, Components, State, API, Testing, Git, Accessibility |

## 1. Introduction

These guidelines are established to ensure consistency, maintainability, and quality in the Jobraker React Native (Expo) frontend codebase. All developers contributing to the frontend are expected to adhere to these standards. This document complements `tech_stack.md` and `blueprint.md`.

## 2. Core Principles

- **Readability:** Code should be easy to read and understand. Prioritize clarity over overly clever or concise solutions.
- **Maintainability:** Write code that is easy to modify, debug, and extend.
- **Consistency:** Follow established patterns and conventions throughout the codebase.
- **Performance:** Be mindful of performance implications. Optimize critical paths and avoid unnecessary computations or re-renders.
- **Testability:** Write code that is easy to test. Strive for high unit and integration test coverage.

## 3. Tools & Setup

### 3.1. Linting & Formatting

- **Linter:** ESLint (`eslint.config.js`)
  - Configuration: Based on `eslint-config-expo` with potential project-specific overrides.
  - **Rule:** All code must pass ESLint checks without errors or warnings (unless explicitly ignored with justification).
- **Formatter:** Prettier
  - Configuration: Integrated with ESLint (`eslint-plugin-prettier`, `eslint-config-prettier`). Uses standard Prettier rules (or project-defined `.prettierrc` if present).
  - **Rule:** All code should be formatted by Prettier before committing. Use editor integrations (Format on Save) or pre-commit hooks.

### 3.2. TypeScript

- **Strict Mode:** Enable strict type checking in `tsconfig.json` (`"strict": true`).
- **Type Safety:** Strive for strong typing. Avoid `any` where possible. Define clear interfaces and types for props, state, API responses, and complex objects.
- **Utility Types:** Utilize TypeScript utility types (e.g., `Partial`, `Readonly`, `ReturnType`) where appropriate.

## 4. Coding Conventions

### 4.1. Naming Conventions

- **Components (PascalCase):** `UserProfile.tsx`, `JobCard.tsx`
- **Files (kebab-case or PascalCase for components):** `user-service.ts`, `UserProfile.tsx`
- **Variables & Functions (camelCase):** `const userName = ...;`, `function getUserProfile() { ... }`
- **Constants (UPPER_SNAKE_CASE):** `const MAX_RETRIES = 3;`
- **Interfaces & Types (PascalCase, prefixed with `I` or suffixed with `Type` if preferred, but consistency is key):** `interface IUserProfile { ... }`, `type JobApplicationStatus = ...;`
- **Boolean Variables:** Prefix with `is`, `has`, `should` (e.g., `isLoading`, `hasSubmitted`).
- **Event Handlers:** Prefix with `handle` (e.g., `handleSubmit`, `onPressItem`).

### 4.2. File Structure

- Follow the directory structure outlined in `blueprint.md` (e.g., `app/`, `components/`, `hooks/`, `services/`, `constants/`, `utils/`).
- Group related files together (e.g., a component and its specific styles or tests).
- **Index Files:** Use `index.ts` (or `index.js`) to export modules from a directory for cleaner imports (e.g., `import { MyComponent } from './components';`).

### 4.3. Component Design

- **Functional Components:** Use functional components with React Hooks exclusively. Avoid class components.
- **Props:**
  - Define clear `interface` or `type` for component props.
  - Use destructuring for props: `const MyComponent = ({ userId, onSave }: MyProps) => { ... };`
  - Provide default props where sensible.
- **JSX:**
  - Keep JSX readable. Indent properly.
  - Use self-closing tags for components without children: `<MyIcon />`
  - Conditional rendering: Use ternary operators for simple conditions, or logical AND (`&&`) for optional rendering. For complex conditions, consider moving logic to a variable or function.
    ```tsx
    {isLoading ? <ActivityIndicator /> : <DataList data={items} />}
    {user && <UserProfile user={user} />}
    ```
- **Modularity & Reusability:** Break down complex components into smaller, reusable sub-components.
- **Single Responsibility Principle:** Components should ideally do one thing well.
- **Accessibility (`a11y`):** Always include `accessibilityLabel`, `accessibilityHint`, and other relevant accessibility props for interactive elements. (Refer to `app_flow.md` section on Accessibility).

### 4.4. Styling

- **NativeWind:** Utilize NativeWind for utility-first styling. (Refer to `tech_stack.md`).
- **`constants/Colors.ts`:** Use predefined theme colors for consistency and dark mode support.
- **Platform-Specific Styles:** Use `Platform.select()` or file extensions (`.ios.tsx`, `.android.tsx`) for styles that need to differ significantly between platforms. Strive for common styling where possible.
- **Avoid Inline Styles for Complex Logic:** For styles that depend heavily on component logic, define them using NativeWind's utilities or StyleSheet if absolutely necessary, rather than deeply nested inline style objects.

### 4.5. State Management

- **Local State (`useState`, `useReducer`):** Prefer `useState` for simple state. Use `useReducer` for more complex state logic within a component or when the next state depends on the previous one.
- **Global State (Context API / Zustand - if adopted):**
  - Use React Context for global state that doesn't change frequently or for passing data deep down the component tree (e.g., theme, authentication status).
  - For more complex or frequently updated global state, Zustand is a potential consideration (as noted in `tech_stack.md` and `blueprint.md`). If adopted, follow its best practices.
- **Immutability:** Treat state as immutable. When updating state objects or arrays, create new instances rather than modifying them directly.
  ```tsx
  // Bad
  // const [user, setUser] = useState({ name: 'Alex' });
  // user.name = 'Bob'; // Direct mutation
  // setUser(user);

  // Good
  // setUser(prevUser => ({ ...prevUser, name: 'Bob' }));
  ```

### 4.6. API Interactions

- **Service Layer:** Abstract API calls into a dedicated service layer (`services/`). Each service should correspond to a backend resource or third-party API (e.g., `userService.ts`, `applicationService.ts`, `adzunaService.ts`).
- **Async/Await:** Use `async/await` for handling promises from API calls.
- **Error Handling:** Implement robust error handling for all API requests. Catch errors, provide user-friendly feedback (e.g., toast messages, inline errors), and log errors to a monitoring service.
- **Loading States:** Clearly indicate loading states in the UI (e.g., spinners, disabled buttons, skeleton screens).
- **Supabase Client:** Use the official `@supabase/supabase-js` client for interactions with Supabase.
- **Axios:** Use Axios for other REST API calls, configured with base URLs and default headers if applicable.

### 4.7. Hooks

- **Custom Hooks (`useSomething`):** Encapsulate reusable logic (especially stateful logic or side effects) into custom hooks.
- **Rules of Hooks:** Adhere strictly to the Rules of Hooks (call hooks at the top level, only call from React functions).
- **Dependency Arrays:** Provide accurate dependency arrays for `useEffect`, `useMemo`, `useCallback` to prevent stale closures or infinite loops.

### 4.8. Comments & Documentation

- **Clarity:** Write comments to explain complex logic, non-obvious decisions, or workarounds.
- **JSDoc (for functions and types):** Use JSDoc blocks for functions, types, and interfaces, especially for shared services, hooks, and components.
  ```typescript
  /**
   * Fetches the user profile from the backend.
   * @param userId - The ID of the user to fetch.
   * @returns A promise that resolves to the user profile object or null if not found.
   */
  async function fetchUserProfile(userId: string): Promise<IUserProfile | null> {
    // ...
  }
  ```
- **TODOs:** Use `// TODO:` for tasks that need to be addressed later. Include context or a ticket number if possible.
- **Avoid Obvious Comments:** Don't comment on code that is self-explanatory.

## 5. Testing

- **Frameworks:** Jest, React Native Testing Library.
- **Unit Tests:**
  - Test individual components (rendering, basic interactions), utility functions, and custom hooks.
  - Mock dependencies (API calls, native modules) where appropriate.
- **Integration Tests:**
  - Test interactions between multiple components, navigation flows, and state changes.
  - Can involve light mocking of API services to verify data flow.
- **Test Coverage:** Aim for a meaningful level of test coverage (e.g., >70% as per PRD). Focus on critical paths and complex logic.
- **Test File Location:** Place test files (`*.test.tsx` or `*.spec.tsx`) alongside the files they are testing, or in a `__tests__` subdirectory.
- **Descriptive Test Names:** Write clear and descriptive names for your tests (`it('should render correctly when isLoading is true')`).

## 6. Version Control (Git)

- **Branching Strategy:**
  - `main` (or `master`): Production-ready code. Protected branch.
  - `develop`: Integration branch for features. Base for feature branches.
  - `feature/<feature-name>`: For new feature development (e.g., `feature/user-profile`).
  - `bugfix/<issue-id>`: For fixing bugs.
  - `hotfix/<issue-id>`: For urgent production fixes.
- **Commit Messages:**
  - Follow Conventional Commits format (e.g., `feat: add user login functionality`, `fix: resolve issue with form submission`, `docs: update README`).
  - Write clear, concise, and descriptive commit messages.
  - Reference issue/ticket numbers if applicable (e.g., `feat: implement user dashboard (#123)`).
- **Pull Requests (PRs):**
  - All code changes must go through a PR.
  - PRs should be reviewed by at least one other developer.
  - Ensure CI checks (linting, tests, build) pass before merging.
  - Provide a clear description of the changes in the PR.
- **Rebase vs. Merge:** Prefer rebasing feature branches onto `develop` to maintain a clean commit history, but follow team consensus.

## 7. Performance Considerations

- **Minimize Re-renders:** Use `React.memo`, `useMemo`, and `useCallback` judiciously to prevent unnecessary re-renders of components.
- **Optimize Lists:** For `FlatList` or `SectionList`:
  - Use `keyExtractor`.
  - Implement `getItemLayout` if item heights are fixed.
  - Consider `removeClippedSubviews` (test thoroughly as it can have side effects).
  - Virtualize long lists.
- **Image Optimization:** Use appropriate image sizes. Consider `expo-image` for caching and performance benefits.
- **Bundle Size:** Be mindful of adding large dependencies. Analyze bundle size periodically.
- **Avoid Heavy Computations on Main Thread:** Offload complex tasks to web workers if possible (though less common in typical Expo apps unless dealing with heavy data processing).
- **Debounce/Throttle:** Use debouncing or throttling for frequent events (e.g., search input, window resize if applicable).

## 8. Accessibility (A11y)

- Adhere to guidelines in `app_flow.md` (Section 7 - Accessibility).
- **Test Regularly:** Use accessibility tools and manual testing (VoiceOver, TalkBack).
- **Semantic Elements:** Use appropriate React Native components for their semantic meaning.
- **Focus Management:** Ensure logical focus order for keyboard navigation (if applicable).

## 9. Code Reviews

- **Constructive Feedback:** Provide respectful and constructive feedback.
- **Focus:** Review for adherence to guidelines, correctness, readability, performance, and potential bugs.
- **Timeliness:** Aim to review PRs in a timely manner to avoid blocking other developers.
- **Author Responsiveness:** Address review comments promptly and clearly.

## 10. Document Updates

- These guidelines are a living document. Propose updates or additions via a PR if you identify areas for improvement or new best practices.

By following these guidelines, we aim to build a high-quality, robust, and maintainable frontend for the Jobraker application.
