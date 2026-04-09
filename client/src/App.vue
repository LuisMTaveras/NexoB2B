<script setup lang="ts">
import { RouterView } from 'vue-router'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
</script>

<template>
  <RouterView />
  <!-- Global UI Components -->
  <ConfirmDialog />
</template>
