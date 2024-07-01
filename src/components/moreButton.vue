<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    class="more-button"
  >
    <rect
      x="2"
      y="2"
      width="12"
      height="2"
    />
    <rect
      x="2"
      y="7"
      width="12"
      height="2"
    />
    <rect
      x="2"
      y="12"
      width="12"
      height="2"
    />
  </svg>
</template>

<style lang="less" scoped>
.more-button {
  cursor: pointer;

  rect {
    fill: @iconColorBase;
  }

  &:hover rect {
    fill: @primary;
  }
}
</style>
