<template>
  <div id="app">
    <header class="title">
      <b>birdseye</b> |  total connections: {{totalConnections}}
    </header>
    <div class="chats">
       <section class="card" v-for="(room,key,index) in rooms" :key="key">
      <header>
        <h1>Room #{{index}} ({{room.players.length}}/2)</h1>
        <button class="emoji-button" @click="killRoom(key)">🚫</button>
        </header>

      <div class="messages-container">

        <div class="messages">
          <span v-for="(logItem,key) in room.log" :key="key"
           :class="(logItem.user == room.players[0] ? 'ours' : logItem.user=='system' ? 'system' : 'theirs' )"
          >{{logItem.message}}</span>
        </div>
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
  methods:{
    killRoom(id){
      socket.emit('kill-room',id);
      this.rooms[id].log.push({user:'system',message:'Room killed'})
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

     this.totalConnections++;
    });
  
    
    socket.on('log', (data) => {
     if(data.room in this.rooms){
       this.rooms[data.room].log.push(data);
     }else{
       console.error('client out of sync')
       console.log(data);
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
  margin: 0;
  padding: 0;
  top:0;
  left:0;
}

#app{
  background:#2a2b3d;
  color:#fff;
  padding: 30px;
  padding-top:80px;
}
header.title{
  background:#252636;
  padding: 20px;
  top:0;
  left:0;
  position: absolute;
  width:100%;
}
.chats{
  display:grid;
    grid-template-columns:1fr 1fr 1fr;
    grid-gap: 30px;
}
.card{
  box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
  background:#313348;
}
.card header{
  background:#252636;
  padding:10px;
  font-size:0.7em;
  width:100%;
}
.card header h1{
  display: inline-block;
}
button{
  font-size:2.2em;
  background: #313348;
  border:none;
  border-radius: 5px;
  box-shadow: 1px 1px 2px #000;
  transition:all 0.3s;
}
button:hover{
  background:#2a2b3d;
  box-shadow: inset 1px 1px 2px #000000;
}
button:active{
  box-shadow: inset 2px 2px 10px #000000;
}
.card header button{
  float: right;
}


.messages-container{
  height:300px;
  overflow: scroll;
  padding: 20px;   
}
.messages{
  flex: 1 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-start;
  overflow-wrap: break-word;
}
.messages span {
  background: #ebeaeb;
  color: #000;
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 16px;
  max-width: 60%;
}
.ours {
  align-self: flex-end;
}
.system,
.disclaimer {
  align-self: center;
  text-align: center;
  font-size: 0.8em;
  font-weight: bold;
}
</style>
