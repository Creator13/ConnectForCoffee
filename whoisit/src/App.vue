<template>
  <div id="app">
    <ChatWindow></ChatWindow>
  </div>
</template>

<script>
import ChatWindow from './components/ChatWindow.vue'

export default {
  name: 'app',
  components: {
    ChatWindow
  }
}
</script>

<style lang="scss">
*,*::after,*::before{
  box-sizing: border-box;
}
html, body, #app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  background: #f9f9f9;
  top:0;
  left:0;
}

#app{

    @media screen and (min-width:380px), screen and (max-height: 675px){
      display: flex;
      align-items: center;
      justify-content: center;
  }
}
</style>
