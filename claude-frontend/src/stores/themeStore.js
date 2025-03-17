import { defineStore } from "pinia";

export const useThemeStore = defineStore("theme", {
  state: () => {
    // Khôi phục giá trị từ localStorage
    const isDark = localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    return {
      isDarkMode: isDark
    };
  },
  
  getters: {
    isDark: (state) => state.isDarkMode
  },
  
  actions: {
    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode;
      localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
      this.applyDarkMode();
    },
    
    applyDarkMode() {
      if (this.isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    
    initTheme() {
      this.applyDarkMode();
    }
  }
}); 