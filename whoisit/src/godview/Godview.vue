<template>
  <div id="app">
    <header class="title">
      <b>godview</b> |  total connections: {{totalConnections}}
    </header>
    <div class="chats">
       <section class="chat" v-for="(room,key) in rooms" :key="key">
      <header>
        <h1>Room {{key}}</h1>
        </header>
      <p>users: <span v-for="player in room.players" :key="player">{{player}} </span></p>
      <div class="log">
        <p v-for="(logItem,key) in room.log" :key="key"><b>{{ logItem.user }}:</b> {{logItem.msg}}</p>
      </div>
    </section> 
    </div>
  
  </div>
</template>

<script>
import io from 'socket.io-client';
import Vue from 'vue'; 

let serverURI =  process.env.NODE_ENV === 'development'
    ? window.location.hostname + ':8080'
    : window.location.host

let socket = io.connect(serverURI+'/godview');

export default {
  name: 'godview',
  data() {
    return {
     totalConnections:0,
     rooms:{
     }
    }
  },
  mounted(){
    socket.on('joined-room', (data) => {

      // If the room is already known, add player, otherwise create new room view
     if(data.room in this.rooms){
       this.rooms[data.room].players.push(data.id)
     }else{
       Vue.set(this.rooms, data.room, {
         players:[data.id],
         log:[]
       })
     }
    });
    
    socket.on('log', (data) => {
     if(data.room in this.rooms){
       this.rooms[data.room].log.push(data)
     }else{
       console.error('client out of sync')
     }
    });
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
  background:#2e4052;
  color:#fff;
  padding: 30px;
  padding-top:80px;
}
header.title{
  background:#000f08;
  padding: 20px;
  top:0;
  left:0;
  position: absolute;
  width:100%;
}
.chats{
  display:grid;
    grid-template-columns:1fr 1fr 1fr 1fr;
    grid-gap: 30px;
}
.chat{
  box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
  background:#141414;
}
.chat header{
  background:#25283d;
  padding:10px;
  font-size:0.7em;
}
.chat .log{
  padding:10px;
max-height: 300px;
overflow: scroll;
}
</style>
