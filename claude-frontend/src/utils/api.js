import axios from "axios";

// Hàm chuyển đổi snake_case sang camelCase
const toCamelCase = (str) =>
  str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());

// Hàm chuyển đổi object có key dạng snake_case sang camelCase
const convertKeysToCamelCase = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToCamelCase);
  } else if (obj !== null && typeof obj === "object") {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = toCamelCase(key);
      acc[camelKey] = convertKeysToCamelCase(obj[key]);
      return acc;
    }, {});
  }
  return obj;
};

// Tạo instance axios với cấu hình cơ bản
const api = axios.create({
  baseURL: "/api", // Sử dụng URL tương đối để Vite proxy có thể hoạt động
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Log request trước khi gửi để debug
api.interceptors.request.use(
  (config) => {
    console.log("API request:", {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data,
    });
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Thêm interceptor response để trả về dữ liệu
api.interceptors.response.use(
  (response) => {
    // Log phản hồi API để debug
    console.log("API response:", {
      url: response.config.url,
      method: response.config.method,
      status: response.status,
      data: response.data,
    });

    // Xử lý phản hồi từ backend - cấu trúc { success: true, data: {...} }
    let data;
    if (response.data && response.data.success === true && response.data.data) {
      data = response.data.data;
    } else {
      data = response.data;
    }

    // Chuyển đổi keys sang camelCase
    const convertedData = convertKeysToCamelCase(data);
    console.log("Converted data:", convertedData);
    return convertedData;
  },
  (error) => {
    console.error("API error:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      response: error.response?.data,
    });

    // Nếu có thông báo lỗi từ server
    const errorMessage =
      error.response?.data?.message || error.message || "Lỗi kết nối API";
    return Promise.reject(new Error(errorMessage));
  }
);

export default api;
