# NexoB2B — Frontend Governance (Client)

Guidelines for any AI agent working on the NexoB2B Client project.

## Tech Stack
- **Framework**: @vue/cli (Vue 3, Composition API).
- **Styling**: Tailwind CSS + Custom CSS (for premium aesthetics).
- **Store**: Component-scoped state and local API clients.

## UI Standards
- **Premium Design**: Use gradients, hover effects, and micro-animations.
- **Modals**: For mapping and details, always use `AdminModal` or similar generic wrappers for consistency.
- **Feedback**: Every action must have immediate UI feedback (loader, success/error toast).

## 🟢 POST-CHANGE PROTOCOL (Frontend)
1. **Visual Test**: Verify the new UI looks "premium" and matches the existing theme.
2. **Error Handling**: Use `v-if` to handle loading states and API errors.
3. **Consistency**: Use existing components from `@/components/common` (Buttons, Cards, Modals).
4. **No Placeholders**: Use `generate_image` or actual assets.
5. **Mandatory Restart**: After any significant change or at the end of each instruction, **restart the projects** (`npm run dev`) to ensure a clean state and proper compilation.

## API Integration
- Use the base API client at `@/lib/api`.
- Always handle 401 (Unauthorized) and 500 (Internal Server Error) gracefully with the user notifications.
- Pass `companyId` if needed, although it's usually handled by the auth token on the server side.
