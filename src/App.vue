<template>
  <router-view />
</template>

<style lang="scss">
@import "uni.scss";
@import "uview-plus/index.scss";
@import "./styles/theme.scss";

html,
body,
#app {
  min-height: 100%;
  background: var(--app-bg);
}

body {
  margin: 0;
  color: var(--text-main);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  background-attachment: fixed;
}

body::before,
body::after {
  content: '';
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  filter: blur(18px);
}

body::before {
  top: -120px;
  right: -90px;
  width: 280px;
  height: 280px;
  background: radial-gradient(circle, rgba(255, 154, 181, 0.26) 0%, rgba(255, 154, 181, 0) 72%);
}

body::after {
  left: -120px;
  bottom: 8%;
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, rgba(95, 140, 255, 0.18) 0%, rgba(95, 140, 255, 0) 76%);
}

page {
  background: transparent;
}

#app {
  position: relative;
  isolation: isolate;
}
</style>
