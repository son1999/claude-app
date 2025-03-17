import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import "./assets/main.css";
import "highlight.js/styles/github-dark.css";

// Tạo app Vue
const app = createApp(App);

// Thiết lập tiêu đề từ biến môi trường
document.title = import.meta.env.VITE_APP_TITLE || "Claude AI Clone";

// Tạo meta description nếu chưa có
let metaDescription = document.querySelector('meta[name="description"]');
if (!metaDescription) {
  metaDescription = document.createElement("meta");
  metaDescription.name = "description";
  document.head.appendChild(metaDescription);
}
metaDescription.content =
  import.meta.env.VITE_APP_DESCRIPTION || "Ứng dụng chat AI sử dụng Claude API";

// Khởi tạo Pinia
const pinia = createPinia();

app.use(pinia);
app.use(router);

// Cung cấp biến môi trường cho toàn bộ ứng dụng
app.config.globalProperties.$env = import.meta.env;

// Mount app
app.mount("#app");

// Thiết lập dark mode dựa trên cài đặt hệ thống
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

// Lắng nghe sự thay đổi theme của hệ thống
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
  if (event.matches) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
});

// Thiết lập dark mode dựa trên localStorage nếu có
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// Thêm hàm copy code block vào window để sử dụng từ các component
window.copyCodeToClipboard = function (button) {
  try {
    // Tìm phần tử code
    const codeElement = button.closest('.code-container').querySelector('code');
    
    // Lấy text gốc từ data attribute để tránh copy HTML
    const originalCode = decodeURIComponent(codeElement.getAttribute('data-code'));
    
    // Copy vào clipboard
    navigator.clipboard.writeText(originalCode).then(() => {
      // Cập nhật trạng thái nút
      const originalText = button.querySelector('span').textContent;
      button.querySelector('span').textContent = 'Đã sao chép!';
      button.classList.add('copied');
      
      // Reset sau 2 giây
      setTimeout(() => {
        button.querySelector('span').textContent = originalText;
        button.classList.remove('copied');
      }, 2000);
    });
  } catch (error) {
    console.error('Lỗi khi sao chép code:', error);
  }
};
