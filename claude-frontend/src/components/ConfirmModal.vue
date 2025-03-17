<template>
  <Transition name="modal">
    <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto" @click="onCancel">
      <div class="flex min-h-screen items-center justify-center p-4">
        <!-- Overlay -->
        <div class="fixed inset-0 bg-black/50 transition-opacity"></div>
        
        <!-- Modal -->
        <div 
          class="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 p-6 text-left shadow-xl transition-all"
          @click.stop
        >
          <!-- Title -->
          <div class="mb-4">
            <h3 class="text-lg font-medium leading-6 text-gray-900 dark:text-gray-100">
              {{ title }}
            </h3>
          </div>

          <!-- Content -->
          <div class="mt-2">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ message }}
            </p>
          </div>

          <!-- Actions -->
          <div class="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              class="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              @click="onCancel"
            >
              {{ cancelText }}
            </button>
            <button
              type="button"
              class="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              @click="onConfirm"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  show: {
    type: Boolean,
    required: true
  },
  title: {
    type: String,
    default: 'Xác nhận'
  },
  message: {
    type: String,
    required: true
  },
  confirmText: {
    type: String,
    default: 'Xác nhận'
  },
  cancelText: {
    type: String,
    default: 'Hủy'
  }
});

const emit = defineEmits(['confirm', 'cancel']);

const onConfirm = () => emit('confirm');
const onCancel = () => emit('cancel');
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .fixed {
  transition: transform 0.3s ease-out;
}

.modal-enter-from .fixed,
.modal-leave-to .fixed {
  transform: scale(0.95);
}
</style> 