<template>
  <router-view />
</template>

<style lang="scss">
@import "uni.scss";
@import "uview-plus/index.scss";
@import "./styles/theme.scss";

/* 全局基础样式补充 */
html,
body,
#app {
  min-height: 100%;
  background:
    radial-gradient(circle at top right, rgba(255, 188, 204, 0.58), transparent 24%),
    radial-gradient(circle at left 18%, rgba(193, 219, 255, 0.48), transparent 26%),
    linear-gradient(180deg, #fffafc 0%, #f8fbff 56%, #f1f6ff 100%);
}

body {
  margin: 0;
  color: var(--text-main);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

page {
  background: transparent;
}
</style>
