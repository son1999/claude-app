import { defineStore } from "pinia";
import api from "../utils/api";

export const useModelStore = defineStore("model", {
  state: () => {
    // Khôi phục model đã chọn từ localStorage nếu có
    let savedModel = null;
    try {
      const savedModelString = localStorage.getItem("selectedModel");
      if (savedModelString) {
        savedModel = JSON.parse(savedModelString);
      }
    } catch (error) {
      console.error("Lỗi khi đọc model từ localStorage:", error);
    }

    return {
      models: [],
      selectedModel: savedModel,
      loading: false,
      error: null,
    };
  },

  getters: {
    getModels: (state) => state.models,
    getSelectedModel: (state) => state.selectedModel,
    isLoading: (state) => state.loading,
    getError: (state) => state.error,
  },

  actions: {
    async fetchModels() {
      this.loading = true;
      
      // Đảm bảo reset loading state sau tối đa 3 giây
      const loadingTimeout = setTimeout(() => {
        console.log('Loading timeout reached, forcing loading state to false');
        this.loading = false;
      }, 3000);
      
      try {
        const response = await api.get(`/models`);
        
        let modelsData = [];
        if (response) {
          if (response && response.length > 0 && Array.isArray(response)) {
            modelsData = response;
          } 
          else if (Array.isArray(response.data)) {
            modelsData = response.data;
          }
        }
        
        this.models = modelsData;
        console.log("Models sau khi xử lý:", this.models);

        // Nếu chưa chọn model và có models, chọn model đầu tiên
        if (!this.selectedModel && this.models.length > 0) {
          this.setSelectedModel(this.models[0]);
        }

        this.error = null;
      } catch (error) {
        console.error("Error fetching models:", error);
        this.error = error.message || "Lỗi khi tải danh sách models";
        
        // Thêm model mặc định nếu có lỗi
        this.models = [
          {
            id: "claude-3-opus-20240229",
            name: "Claude 3 Opus",
            description: "Model mạnh nhất với khả năng suy luận và xử lý nhiệm vụ phức tạp"
          },
          {
            id: "claude-3-sonnet-20240229",
            name: "Claude 3 Sonnet",
            description: "Cân bằng giữa hiệu suất và tốc độ, phù hợp với hầu hết các tác vụ"
          },
          {
            id: "claude-3-haiku-20240307",
            name: "Claude 3 Haiku",
            description: "Model nhỏ nhẹ, tối ưu tốc độ và chi phí"
          },
          {
            id: "claude-2.1",
            name: "Claude 2.1",
            description: "Phiên bản cải tiến của Claude 2, được đào tạo với nhiều dữ liệu hơn"
          }
        ];
        
        // Nếu chưa chọn model và có models, chọn model đầu tiên
        if (!this.selectedModel && this.models.length > 0) {
          this.setSelectedModel(this.models[0]);
        }
      } finally {
        clearTimeout(loadingTimeout);
        this.loading = false;
      }
    },

    async fetchModelDetails(id) {
      this.loading = true;
      try {
        const response = await api.get(`/models/details/${id}`);
        const modelWithDetails = response.data;

        // Cập nhật model trong danh sách
        const index = this.models.findIndex((m) => m.id === id);
        if (index !== -1) {
          this.models[index] = modelWithDetails;
        }

        // Nếu đang chọn model này, cập nhật selectedModel
        if (this.selectedModel && this.selectedModel.id === id) {
          this.setSelectedModel(modelWithDetails);
        }

        this.error = null;
        return modelWithDetails;
      } catch (error) {
        this.error = error.message || "Lỗi khi tải thông tin chi tiết model";
        console.error("Error fetching model details:", error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    setSelectedModel(model) {
      this.selectedModel = model;
      
      // Lưu model đã chọn vào localStorage
      try {
        localStorage.setItem("selectedModel", JSON.stringify(model));
      } catch (error) {
        console.error("Lỗi khi lưu model vào localStorage:", error);
      }
    },

    clearError() {
      this.error = null;
    },
  },
});
