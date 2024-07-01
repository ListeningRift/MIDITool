<template>
  <span
    ref="dropdown"
    class="dropdown"
  >
    <span
      class="dropdown-trigger"
      @click="toggleMenu"
    >
      <slot></slot>
    </span>
    <transition name="fade">
      <ul
        v-if="isOpen"
        ref="menu"
        class="dropdown-menu"
        @click="toggleMenu"
      >
        <slot name="menu"></slot>
      </ul>
    </transition>
  </span>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onClickOutside } from '@vueuse/core'

const isOpen = ref(false)
const menu = ref<HTMLElement>()

// 方法
const toggleMenu = () => {
  isOpen.value = !isOpen.value
}

onClickOutside(menu, () => {
  toggleMenu()
})
</script>

<style scoped lang="less">
.dropdown {
  position: relative;
  display: inline-block;
  line-height: 1;
}

.dropdown-menu {
  position: absolute;
  list-style-type: none;
  padding: 4px 0;
  margin: 0;
  min-width: 160px;
  background-color: @bgBase;
  border-radius: 4px;
  box-shadow: 0 4px 12px 8px @shadowBase;
  z-index: 999;

  :slotted(.dropdown-menu-item) {
    display: flex;
    align-items: center;
    padding: 0 12px;
    height: 32px;
    cursor: pointer;

    &:hover {
      background-color: #f1f1f1;
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
