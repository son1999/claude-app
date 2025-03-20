import { defineStore } from "pinia";
import api from "../utils/api";

export const useModelStore = defineStore("model", {
  state: () => {
    // Khôi phục model đã chọn từ localStorage nếu có
    let savedModel = null;
    let savedProvider = localStorage.getItem("selectedProvider") || "Claude";
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
      modelGroups: {},
      providers: ["Claude", "GPT", "Gemini", "DeepSeek"],
      selectedProvider: savedProvider,
      selectedModel: savedModel,
      loading: false,
      error: null,
    };
  },

  getters: {
    getModels: (state) => state.models,
    getModelGroups: (state) => state.modelGroups,
    getProviders: (state) => state.providers,
    getSelectedProvider: (state) => state.selectedProvider,
    getSelectedModel: (state) => state.selectedModel,
    isLoading: (state) => state.loading,
    getError: (state) => state.error,
    getModelsByProvider: (state) => (provider) => {
      return state.modelGroups[provider] || [];
    },
    getCurrentProviderModels: (state) => {
      return state.modelGroups[state.selectedProvider] || [];
    },
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
          if (response.data && Array.isArray(response.data.data)) {
            modelsData = response.data.data;
          } 
          else if (response && response.length > 0 && Array.isArray(response)) {
            modelsData = response;
          } 
          else if (Array.isArray(response.data)) {
            modelsData = response.data;
          }
        }
        
        console.log("Dữ liệu models từ API:", modelsData);
        
        this.models = modelsData;
        this.groupModels(modelsData);
        console.log("Models sau khi xử lý:", this.models);
        console.log("Model groups:", this.modelGroups);

        // Nếu chưa chọn model và có models, chọn model đầu tiên từ provider đã chọn
        if (!this.selectedModel && this.modelGroups[this.selectedProvider]?.length > 0) {
          this.setSelectedModel(this.modelGroups[this.selectedProvider][0]);
        }

        this.error = null;
      } catch (error) {
        console.error("Error fetching models:", error);
        this.error = error.message || "Lỗi khi tải danh sách models";
        
        // Thêm model mặc định nếu có lỗi
        const defaultModels = [
          {
            id: "claude-3-opus-20240229",
            name: "Claude 3 Opus",
            provider: "Claude",
            description: "Model mạnh nhất với khả năng suy luận và xử lý nhiệm vụ phức tạp"
          },
          {
            id: "claude-3-sonnet-20240229",
            name: "Claude 3.7 Sonnet",
            provider: "Claude",
            description: "Claude 3.7 Sonnet model"
          },
          {
            id: "claude-3.5-sonnet-20240307",
            name: "Claude 3.5 Sonnet (New)",
            provider: "Claude",
            description: "Claude 3.5 Sonnet (New) model"
          },
          {
            id: "claude-3.5-haiku-20240307",
            name: "Claude 3.5 Haiku",
            provider: "Claude",
            description: "Claude 3.5 Haiku model" 
          },
          {
            id: "claude-3.5-sonnet-old",
            name: "Claude 3.5 Sonnet (Old)",
            provider: "Claude",
            description: "Claude 3.5 Sonnet (Old) model"
          },
          {
            id: "claude-3-haiku-20240307",
            name: "Claude 3 Haiku",
            provider: "Claude",
            description: "Claude 3 Haiku model"
          },
          {
            id: "claude-3-opus",
            name: "Claude 3 Opus",
            provider: "Claude",
            description: "Claude 3 Opus model"
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            provider: "GPT",
            description: "Model mạnh nhất của OpenAI với khả năng multimodal"
          },
          {
            id: "gpt-4-turbo",
            name: "GPT-4 Turbo",
            provider: "GPT",
            description: "Phiên bản cải tiến của GPT-4 với hiệu suất cao"
          },
          {
            id: "gpt-4",
            name: "GPT-4",
            provider: "GPT",
            description: "Model mạnh mẽ với khả năng suy luận và xử lý nhiệm vụ phức tạp"
          },
          {
            id: "gpt-3.5-turbo",
            name: "GPT-3.5 Turbo",
            provider: "GPT",
            description: "Model cân bằng giữa hiệu suất và chi phí"
          },
          {
            id: "gpt-3.5-turbo-16k",
            name: "GPT-3.5 Turbo 16K",
            provider: "GPT",
            description: "Model GPT-3.5 với ngữ cảnh mở rộng 16k tokens"
          },
          {
            id: "gemini-1.5-pro",
            name: "Gemini 1.5 Pro",
            provider: "Gemini",
            description: "Model mạnh nhất từ Google với khả năng xử lý đa phương tiện"
          },
          {
            id: "gemini-1.0-pro",
            name: "Gemini 1.0 Pro",
            provider: "Gemini",
            description: "Model AI đa năng từ Google"
          },
          {
            id: "deepseek-chat",
            name: "DeepSeek Chat",
            provider: "DeepSeek",
            description: "Model chat mạnh mẽ từ DeepSeek"
          }
        ];
        
        this.models = defaultModels;
        this.groupModels(defaultModels);
        
        // Nếu chưa chọn model và có models, chọn model đầu tiên từ provider đã chọn
        if (!this.selectedModel && this.modelGroups[this.selectedProvider]?.length > 0) {
          this.setSelectedModel(this.modelGroups[this.selectedProvider][0]);
        }
      } finally {
        clearTimeout(loadingTimeout);
        this.loading = false;
      }
    },

    // Nhóm các model theo provider
    groupModels(models) {
      const groups = {};
      
      // Khởi tạo nhóm trống cho mỗi provider
      this.providers.forEach(provider => {
        groups[provider] = [];
      });
      
      // Phân loại models vào nhóm
      models.forEach(model => {
        const provider = model.provider || this.detectProvider(model.id);
        if (groups[provider]) {
          groups[provider].push({...model, provider});
        } else {
          // Nếu provider không tồn tại trong danh sách, thêm vào nhóm "Khác"
          if (!groups["Khác"]) groups["Khác"] = [];
          groups["Khác"].push({...model, provider: "Khác"});
        }
      });
      
      this.modelGroups = groups;
    },
    
    // Đoán provider dựa trên ID model nếu không có trường provider
    detectProvider(modelId) {
      modelId = modelId.toLowerCase();
      if (modelId.includes('claude')) return 'Claude';
      if (modelId.includes('gpt')) return 'GPT';
      if (modelId.includes('gemini')) return 'Gemini';
      if (modelId.includes('deepseek')) return 'DeepSeek';
      return 'Khác';
    },

    async fetchModelDetails(id) {
      this.loading = true;
      try {
        const response = await api.get(`/models/details/${id}`);
        let modelWithDetails = response.data;
        
        // Xử lý cấu trúc response khác nhau
        if (response.data.data) {
          modelWithDetails = response.data.data;
        }

        // Đảm bảo provider đúng định dạng
        if (!modelWithDetails.provider) {
          modelWithDetails.provider = this.detectProvider(modelWithDetails.id);
        }

        // Cập nhật model trong danh sách
        const index = this.models.findIndex((m) => m.id === id);
        if (index !== -1) {
          this.models[index] = modelWithDetails;
        }

        // Cập nhật trong modelGroups
        const provider = modelWithDetails.provider || this.detectProvider(modelWithDetails.id);
        if (this.modelGroups[provider]) {
          const groupIndex = this.modelGroups[provider].findIndex((m) => m.id === id);
          if (groupIndex !== -1) {
            this.modelGroups[provider][groupIndex] = {...modelWithDetails, provider};
          }
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
      // Đảm bảo model có provider
      if (!model.provider) {
        model.provider = this.detectProvider(model.id);
      }
      
      this.selectedModel = model;
      
      // Nếu model có provider, cập nhật provider đã chọn
      if (model.provider) {
        this.selectedProvider = model.provider;
        localStorage.setItem("selectedProvider", model.provider);
      }
      
      // Lưu model đã chọn vào localStorage
      try {
        localStorage.setItem("selectedModel", JSON.stringify(model));
      } catch (error) {
        console.error("Lỗi khi lưu model vào localStorage:", error);
      }
    },
    
    setSelectedProvider(provider) {
      this.selectedProvider = provider;
      localStorage.setItem("selectedProvider", provider);
      
      // Nếu có models trong nhóm này, chọn model đầu tiên
      if (this.modelGroups[provider] && this.modelGroups[provider].length > 0) {
        this.setSelectedModel(this.modelGroups[provider][0]);
      }
    },

    clearError() {
      this.error = null;
    },
  },
});
