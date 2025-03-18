<template>
  <div>
    <div v-for="(item, index) in items" :key="index">
      <div v-if="editingIndex === index">
        <input v-model="editText" />
        <button @click="saveEdit(index)">Lưu</button>
        <button @click="cancelEdit">Hủy</button>
      </div>
      <div v-else>
        {{ item.text }}
        <button @click="startEdit(index, item.text)">Sửa</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const items = ref([
  { text: 'Item 1' },
  { text: 'Item 2' },
  { text: 'Item 3' }
]);

const editingIndex = ref(null);
const editText = ref('');

const startEdit = (index, text) => {
  editingIndex.value = index;
  editText.value = text;
};

const saveEdit = (index) => {
  items.value[index].text = editText.value;
  editingIndex.value = null;
};

const cancelEdit = () => {
  editingIndex.value = null;
};
</script> 