<template>
  <div :class="{ 'dark': themeStore.isDarkMode }" class="h-screen">
    <div class="bg-white dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useThemeStore } from './stores/themeStore';

const themeStore = useThemeStore();

// On mount
onMounted(() => {
  themeStore.initTheme();
});
</script>

<style>
:root {
  --color-primary: #7928CA;
  --color-primary-light: #9F7AEA;
  --color-primary-dark: #5521B5;
  --color-message-bg-light: #f3f3f3;
  --color-message-bg-dark: #111827;
  --color-text-primary: #1f2937;
  --color-text-secondary: #6b7280;
  --color-border: #e5e7eb;
  --color-bg-primary: #f3f3f3;
  --color-bg-secondary: #f9fafb;
  --color-chat-ai-bg: #f3f4f6;
  --color-code-bg: rgba(0, 0, 0, 0.05);
  --color-table-header: #f9fafb;
}

.bg-primary {
  background-color: var(--color-primary);
}

.text-primary {
  color: var(--color-primary);
}

.border-primary {
  border-color: var(--color-primary);
}

.accent-primary {
  accent-color: var(--color-primary);
}

.bg-primary\/10 {
  background-color: rgba(121, 40, 202, 0.1);
}

.dark {
  --color-text-primary: #f3f4f6;
  --color-text-secondary: #9ca3af;
  --color-border: #4b5563;
  --color-bg-primary: #111827;
  --color-bg-secondary: #1f2937;
  --color-chat-ai-bg: #1f2937;
  --color-code-bg: rgba(0, 0, 0, 0.3);
  --color-table-header: #374151;
}

.dark .bg-primary {
  background-color: var(--color-primary-light);
}

.dark .text-primary {
  color: var(--color-primary-light);
}

.dark .border-primary {
  border-color: var(--color-primary-light);
}

.dark .accent-primary {
  accent-color: var(--color-primary-light);
}

.dark .bg-primary\/10 {
  background-color: rgba(159, 122, 234, 0.1);
}

.dark .message-bubble {
  background-color: var(--color-message-bg-dark);
  color: #e5e7eb;
}

.message-bubble {
  background-color: var(--color-message-bg-light);
  color: #111827;
}
</style> 