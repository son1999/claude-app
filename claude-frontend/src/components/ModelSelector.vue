<template>
  <div class="p-4 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 w-64">
    <h3 class="text-lg font-medium mb-4">Cài đặt mô hình</h3>
    
    <div v-if="loading" class="flex justify-center py-4">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
    </div>
    
    <div v-else>
      <div class="mb-6">
        <label class="block text-sm font-medium mb-2">Chọn model</label>
        <div class="space-y-2">
          <label 
            v-for="model in models" 
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
        </div>
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

// Computed
const models = computed(() => modelStore.getModels);
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

// Lifecycle hooks
onMounted(async () => {
  try {
    await modelStore.fetchModels();
    console.log('Đã tải models:', models.value);
    console.log('Model hiện tại:', selectedModel.value);
    
    // Đảm bảo luôn có model được chọn
    if (!selectedModel.value && models.value && models.value.length > 0) {
      console.log('Auto chọn model đầu tiên:', models.value[0].id);
      selectModel(models.value[0]);
    }
  } catch (error) {
    console.error('Lỗi khi tải models:', error);
  }
});
</script> 