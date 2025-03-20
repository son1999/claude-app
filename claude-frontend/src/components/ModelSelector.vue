<template>
  <div class="p-4 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 w-64">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-medium">MODELS KHẢ DỤNG</h3>
      <button @click="isModelListVisible = !isModelListVisible" class="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
        {{ isModelListVisible ? '▲' : '▼' }}
      </button>
    </div>
    
    <div v-if="loading" class="flex justify-center py-4">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
    </div>
    
    <div v-else>
      <!-- Provider Selector -->
      <div class="mb-4" v-if="isModelListVisible">
        <label class="block text-sm font-medium mb-2">Chọn nhà cung cấp</label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="provider in providers"
            :key="provider"
            @click="selectProvider(provider)"
            class="px-3 py-1.5 rounded-md text-sm transition-colors flex items-center"
            :class="provider === selectedProvider 
              ? 'bg-primary text-white' 
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'"
          >
            <span v-if="provider === 'Claude'" class="mr-1 text-xs">🧠</span>
            <span v-else-if="provider === 'GPT'" class="mr-1 text-xs">🤖</span>
            <span v-else-if="provider === 'Gemini'" class="mr-1 text-xs">🌟</span>
            <span v-else-if="provider === 'DeepSeek'" class="mr-1 text-xs">🔍</span>
            <span v-else class="mr-1 text-xs">✨</span>
            {{ provider }}
          </button>
        </div>
      </div>
      
      <!-- Model Selector for current provider -->
      <div class="mb-4" v-if="isModelListVisible">
        <div class="flex items-center justify-between mb-2">
          <label class="block text-sm font-medium">{{ selectedProvider }} Models</label>
          <span class="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full">
            {{ currentProviderModels.length }}
          </span>
        </div>
        <div class="space-y-2">
          <template v-if="currentProviderModels.length">
            <label 
              v-for="model in currentProviderModels" 
              :key="model.id"
              class="flex items-center p-2 border rounded-md cursor-pointer transition-colors"
              :class="{ 
                'border-primary bg-primary/10': selectedModel && selectedModel.id === model.id,
                'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700': !selectedModel || selectedModel.id !== model.id
              }"
            >
              <input
                type="radio"
                :value="model.id"
                :checked="selectedModel && selectedModel.id === model.id"
                @change="selectModel(model)"
                class="mr-2"
              >
              <div>
                <div class="font-medium">{{ model.name }}</div>
                <div class="text-xs text-gray-500">{{ model.description }}</div>
              </div>
            </label>
          </template>
          <div v-else class="text-gray-500 italic">
            Không có model nào cho provider này
          </div>
        </div>
      </div>
      
      <!-- Selected Model Display (when list is hidden) -->
      <div v-if="!isModelListVisible && selectedModel" class="mb-4 p-2 border rounded-md border-primary bg-primary/10">
        <div class="font-medium flex items-center">
          <span v-if="selectedModel.provider === 'Claude'" class="mr-1 text-xs">🧠</span>
          <span v-else-if="selectedModel.provider === 'GPT'" class="mr-1 text-xs">🤖</span>
          <span v-else-if="selectedModel.provider === 'Gemini'" class="mr-1 text-xs">🌟</span>
          <span v-else-if="selectedModel.provider === 'DeepSeek'" class="mr-1 text-xs">🔍</span>
          {{ selectedModel.name }}
        </div>
        <div class="text-xs text-gray-500">{{ selectedModel.provider }}</div>
      </div>
      
      <div class="mb-4">
        <label class="block text-sm font-medium mb-2">Temperature</label>
        <div class="flex items-center">
          <input
            v-model.number="temperature"
            type="range"
            min="0"
            max="1"
            step="0.1"
            class="w-full accent-primary"
          >
          <span class="ml-2 text-sm">{{ temperature }}</span>
        </div>
        <div class="text-xs text-gray-500 mt-1">
          0 = chính xác, 1 = sáng tạo
        </div>
      </div>
      
      <div class="mb-4">
        <label class="block text-sm font-medium mb-2">Độ dài tối đa</label>
        <select 
          v-model="maxTokens" 
          class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
        >
          <option v-for="option in tokenOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useModelStore } from '../stores/modelStore';

const modelStore = useModelStore();

// State
const temperature = ref(0.7);
const maxTokens = ref(1000);

// Lấy trạng thái hiển thị từ localStorage hoặc mặc định là ẩn
const savedVisibilityState = localStorage.getItem('isModelListVisible');
const isModelListVisible = ref(savedVisibilityState === 'true');

// Theo dõi sự thay đổi và lưu vào localStorage
watch(isModelListVisible, (newValue) => {
  localStorage.setItem('isModelListVisible', newValue);
  console.log('Đã lưu trạng thái hiển thị:', newValue);
});

// Computed
const models = computed(() => modelStore.getModels);
const providers = computed(() => modelStore.getProviders);
const selectedProvider = computed(() => modelStore.getSelectedProvider);
const currentProviderModels = computed(() => modelStore.getCurrentProviderModels);
const selectedModel = computed(() => modelStore.getSelectedModel);
const loading = computed(() => modelStore.isLoading);

// Options
const tokenOptions = [
  { label: 'Ngắn (500 tokens)', value: 500 },
  { label: 'Vừa (1000 tokens)', value: 1000 },
  { label: 'Dài (2000 tokens)', value: 2000 },
  { label: 'Rất dài (4000 tokens)', value: 4000 },
];

// Methods
const selectModel = (model) => {
  console.log('Chọn model:', model.id);
  modelStore.setSelectedModel(model);
};

const selectProvider = (provider) => {
  console.log('Chọn provider:', provider);
  modelStore.setSelectedProvider(provider);
};

// Lifecycle hooks
onMounted(async () => {
  try {
    await modelStore.fetchModels();
    console.log('Đã tải models:', models.value);
    console.log('Provider hiện tại:', selectedProvider.value);
    console.log('Models của provider hiện tại:', currentProviderModels.value);
    console.log('Model hiện tại:', selectedModel.value);
    console.log('Trạng thái hiển thị danh sách:', isModelListVisible.value);
  } catch (error) {
    console.error('Lỗi khi tải models:', error);
  }
});
</script> 