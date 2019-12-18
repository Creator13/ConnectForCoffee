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

// @import url('./assets/fonts/Yeet.ttf');
// @import url('https://fonts.googleapis.com/css?family=Yanone+Kaffeesatz:200,300,400,500,600,700&display=swap&subset=cyrillic,latin-ext,vietnamese');

// @font-face {
//   font-family: "Yeet";
//   src: url("./assets/fonts/Yeet.eot"); /* IE9 Compat Modes */
//   src: url("./assets/fonts/Yeet.eot?#iefix") format("embedded-opentype"), /* IE6-IE8 */
//     url("./assets/fonts/Yeet.otf") format("opentype"), /* Open Type Font */
//     url("./assets/fonts/Yeet.svg") format("svg"), /* Legacy iOS */
//     url("./assets/fonts/Yeet.ttf") format("truetype"), /* Safari, Android, iOS */
//     url("./assets/fonts/Yeet.woff") format("woff"), /* Modern Browsers */
//     url("./assets/fonts/Yeet.woff2") format("woff2"); /* Modern Browsers */
//   font-weight: normal;
//   font-style: normal;
// }
*,*::after,*::before{
  box-sizing: border-box;
}
html, body, #app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
 // font-family:"Yeet", serif;
  //font-weight: 400;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  background: #fcedda;
  color:#000;
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
