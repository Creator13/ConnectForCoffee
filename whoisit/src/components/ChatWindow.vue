<template>
  <div id="phone">
    <header>
      <img
        src="../assets/girl.svg"
        alt="Profile Picture"
      >
      <span>Make A Friend</span>
    </header>
    <section id="scroll">
      <div
        id="messages-window"
        v-if="messages.length>0"
      >
        <span
          :class="'message ' + (message.user==1 ? 'ours' : message.user==2 ? 'theirs' : 'system' )"
          v-for="(message,index) in messages"
          :key="index"
        >{{message.content}}</span>
        <span
          class="message typing-indicator"
          v-if="this.otherIsTyping"
        >
          <span></span>
          <span></span>
          <span></span>
        </span>
      </div>
      <div
        class="emptyState"
        v-else
      >
        <h1>hello bored person!</h1>
        <p>
          Since you have to wait here anyways, why not have a little talk with a stranger near you?
        </p>
        <button @click="joinRoom">Find a friend</button>

        <p class="disclaimer">Your messaged will be logged for safety</p>
      </div>
    </section>
    <footer>
      <input
        id="input"
        :placeholder="placeholder"
        :disabled="this.inputDisabled"
        type="text"
        v-model="newMessage"
        v-on:keyup.enter="addMessage"
      />
      <div class="reply-options">
        <span
          v-for="option in replyOptions"
          :key="option"
        >{{option}}</span>
      </div>
    </footer>

  </div>
</template>

<script>
import io from "socket.io-client";

let serverURI =
  process.env.NODE_ENV === "development"
    ? window.location.hostname + ":8080"
    : window.location.host;
let socket = io.connect(serverURI);

export default {
  name: "ChatWindow",
   data() {
    return {
      otherIsTyping: false,
      newMessage: "",
      messages: [],
      inputDisabled: true,
      placeholder: "Type something and press ENTER to send",
      replyOptions: ["🥵", "😱", "😥", "😨"]
    };
  },
  created() {
    // Set up socket.io event handlers

    // When a match is found
    socket.on("match-made", data => {
      console.log(data);
      this.messages.push({
        content:
          "You are now in a chatroom with a stranger, and hopefully a new friend. Have a fun conversation!",
        user: 3
      });
      this.inputDisabled = false;
      // window.onbeforeunload = function() {
      //   return "Do you really want to leave? You are still in a conversation with a stranger!";
      // };
    });

    // When other person sends a message
    socket.on("chat-message", data => {
      this.messages.push({
        content: data,
        user: 2
      });
    });

    // Match lost conection :(
    socket.on("match-terminated", data => {
      console.log(data);
      this.messages.push({
        content:
          "YOUR FRIEND HAS CLOSED THE CONNECTION :((((((((((((. Refresh page for a new chance.",
        user: 3
      });
      window.onbeforeunload = undefined;
      this.inputDisabled = true;
      this.otherIsTyping = false;
    });

    socket.on("typing", () => {
      this.otherIsTyping = true;
    });
    socket.on("stopTyping", () => {
      this.otherIsTyping = false;
    });
  },
  methods: {
    // Request to join a room from server
    joinRoom() {

      this.messages.push({
        content: "Finding another bored soul..",
        user: 3
      });

      socket.emit("join-room");
    },

    // Adds a message typed by this user to the chat window
    addMessage() {
      // SUPER HACKY WAY OF ACCESSING GODVIEW
      if(this.newMessage === 'illuminati-access'){
        window.location.href = "/godview.html";
        return;
      }

      if (this.newMessage.length < 1) return;
      this.messages.push({ user: 1, content: this.newMessage });
      socket.emit("chat-message", this.newMessage);
      this.newMessage = "";
    }
  },
  watch: {
    // Watch input field to emit typing events
    newMessage(value) {
      value ? socket.emit("typing", this.username) : socket.emit("stopTyping");
    }
  },
  updated() {
    // Everytime a new message is added, scroll to the bottom so it is in view
    // And refocus the input so a mouse isn't needed
    var scrollElement = document.getElementById("scroll");
    scrollElement.scrollTop = scrollElement.scrollHeight;
    document.getElementById("input").focus();
  }
};
</script>

<style lang="scss" scoped>
#phone {
  border-radius: 15px;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
  position: relative;
  overflow: hidden;
  background: #fff;
  display: flex;
  flex-flow: column;
  height: 652px;
  width: 375px;
  @media screen and (max-width: 380px), screen and (max-height: 675px) {
    border-radius: 0;
    box-shadow: none;
    top: 0;
    width: 100%;
    height: 100%;
  }
}
header,
footer {
  background: rgba(250, 250, 250, 1);
  backdrop-filter: blur(10px);
}
header {
  position: absolute;
  height: 75px;
  width: 100%;
  border-bottom: 1px solid #ebeaeb;
  text-align: center;
  box-sizing: border-box;
  border-radius: 15px 15px 0 0;
  font-size: 0.9em;
}
header img {
  background: #f2f2f2;
  width: 40px;
  height: 40px;
  border-radius: 20px;
  margin: 5px auto;
  display: block;
}

footer {
  position: absolute;
  bottom: 0;
  width: 100%;
  box-sizing: border-box;
  border: none;
  border-top: 1px solid #ebeaeb;
  outline: none;
  margin: 0;
  border-radius: 0 0 15px 15px;
  box-sizing: border-box;
  padding: 7px;
  transition: height 0.3s;
  height: 60px;
}
footer:hover {
  // height: 300px;
}
.reply-options {
  font-size: 60px;
  margin-top: 30px;
}
input {
  border-radius: 15px;
  height: 30px;
  border: 1px solid #ebeaeb;
  width: 100%;
  box-sizing: border-box;
  outline: none;
  padding: 20px;
}
::scrollbar {
  display: none;
}
#scroll {
  overflow: scroll;
  scroll-behavior: smooth;
}

#messages-window {
  flex: 1 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-start;
  padding: 80px 20px;
}
.message {
  background: #ebeaeb;
  color: #000;
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 16px;
  max-width: 70%;
}
.ours {
  background: #0076ff;
  color: #fff;
  align-self: flex-end;
}
.system,
.disclaimer {
  align-self: center;
  background: none;
  color: #727272;
  text-align: center;
  font-size: 0.8em;
  font-weight: bold;
}
.emptyState {
  text-align: center;
  padding: 40px;
  padding-top: 140px;
}
/* TYPING ANIMATION
   Inspired by Joseph Fusco
   https://codepen.io/fusco/pen/XbpaYv
*/
.typing-indicator {
  padding: 12px;
  -webkit-animation: 2s bulge infinite ease-out;
  animation: 2s bulge infinite ease-out;
}
.typing-indicator span {
  height: 10px;
  width: 10px;
  float: left;
  margin: 0 1px;
  background-color: #9e9ea1;
  display: block;
  border-radius: 50%;
  opacity: 0.4;
}
.typing-indicator span:nth-of-type(1) {
  -webkit-animation: 1s blink infinite 0.3333s;
  animation: 1s blink infinite 0.3333s;
}
.typing-indicator span:nth-of-type(2) {
  -webkit-animation: 1s blink infinite 0.6666s;
  animation: 1s blink infinite 0.6666s;
}
.typing-indicator span:nth-of-type(3) {
  -webkit-animation: 1s blink infinite 0.9999s;
  animation: 1s blink infinite 0.9999s;
}
@-webkit-keyframes blink {
  50% {
    opacity: 1;
  }
}
@keyframes blink {
  50% {
    opacity: 1;
  }
}
@-webkit-keyframes bulge {
  50% {
    -webkit-transform: scale(1.05);
    transform: scale(1.05);
  }
}
@keyframes bulge {
  50% {
    -webkit-transform: scale(1.05);
    transform: scale(1.05);
  }
}

button {
  background: #27ae60;
  color:#fff;
  border-radius: 10px;
  border: none;
  box-shadow: #000 3px 3px;
  padding: 20px 40px;
  font-size:1.2em;
  font-weight: bold;
  margin: 30px 0;
}
</style>