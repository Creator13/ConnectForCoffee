<template>
  <div id="phone">
    <header>
      <img
        class="profile"
        @click="devClickCount++"
        src="../assets/coffee.svg"
        alt="Profile Picture"
      >
      <span>Connect for Coffee</span>
    </header>
    <section id="scroll">
      <div
        id="messages-window"
        v-if="messages.length>0 || devClickCount > 1"
      >
        <span
          :class="'message ' + (message.user==1 ? 'ours' : message.user==2 ? 'theirs' : 'system' )"
          v-for="(message,index) in messages"
          :key="index"
        >{{message.content}}</span>

        <div
          class="won-game message system voucher"
          v-if="gameWon"
        >
        <h1>Congratulations!</h1>
        <p>Coffee for youuuu</p>
        <canvas ref="voucherCanvas">

        </canvas>
        </div>
        <div
          class="reply-selector"
          v-if="replyOpen"
        >
          <span
            class="message ours"
            v-for="option in replyOptions"
            :key="option"
            @click="answerQuestion(option)"
          >{{option}}</span>
        </div>

        <div
          class="reply-selector questions"
          v-if="questionOpen"
        >
          <span
            class="message ours"
            v-for="option in questionOptions"
            :key="option.text"
            @click="chooseQuestion(option)"
          >{{option.text }}</span>
        </div>

        <span
          class="message typing-indicator"
          v-if="otherIsTyping"
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
          Since you have to wait here anyways, why not play a game with a stranger near you?
        </p>
        <button @click="joinRoom">Find a friend</button>

        <p class="disclaimer">Your messages will be logged for safety purposes</p>
      </div>
    </section>
    <footer :class="matchCode !== 0? 'open' :''">
        <img
        @click="modalOpen = true"
        class="icon"
        src="../assets/handshake.svg"
        alt="Found Eachother Icon"

      >
      <input
        id="input"
        ref="textInput"
        :placeholder="placeholder"
        :disabled="this.inputDisabled && devClickCount < 2"
        type="text"
        v-model="newMessage"
        v-on:keyup.enter="addMessage"
      />

    </footer>

    <FoundModal
      :show="modalOpen"
      :code="matchCode"
      :input="modalInput"
      @close="modalOpen = false"
      @found-match="foundMatch"
    ></FoundModal>

  </div>
</template>

<script>
import FoundModal from "./Modal.vue";
import io from "socket.io-client";
import JsBarcode from "jsbarcode";

let serverURI =
  process.env.NODE_ENV === "development"
    ? window.location.hostname + ":8080"
    : window.location.host;
let socket = io.connect(serverURI);

console.log(process.env.NODE_ENV);
console.log(serverURI);

export default {
  name: "ChatWindow",
  components: {
    FoundModal
  },
  data() {
    return {
      otherIsTyping: false,
      newMessage: "",
      messages: [],
      inputDisabled: true,
      placeholder: "Type something and press ENTER to send",
      replyOptions: ["Yes", "No", "Unsure"],
      questionOptions: [],
      devClickCount: 0,
      drawerOpen: false,
      replyOpen: false,
      questionOpen: false,
      modalOpen: false,
      modalInput:false,
      matchCode:0,
      matchFound:false,
      gameWon:false,
    };
  },
  created() {
    // Set up socket.io event handlers

    // When a match is found
    socket.on("match-made", data => {
      console.log(socket.id, data.waiterId);
      let content;

      this.matchCode = data.code;

      if (data.waiterId === socket.id) {
        content = "Other player found! It's now their turn, please be patient while they pick a question.";
        this.modalInput = true; // Set one of the players as input for the other;
      } else {
        content = "Another player has been found! Ask them a question:";
      }
      this.messages.push({
        content,
        user: 3
      });

      // Set up exit modal
      if (process.env.NODE_ENV !== "development") {
        window.onbeforeunload = function() {
          return "Do you really want to leave? You are still in a conversation with a stranger!";
        };
      }
    });

     socket.on("game-won", data => {
        console.log('game won', data)
        this.modalOpen = false;
        this.inputDisabled = true;
        this.questionOpen = false;
        this.replyOpen = false;
        this.otherIsTyping = false;
        this.gameWon = true;
        this.$nextTick(() => JsBarcode(this.$refs.voucherCanvas, data.barcode, {
  background: null,
  displayValue:false
}));
     });

    // When other person sends a message
    socket.on("chat-message", message => {
      if (!this.replyOptions.includes(message)) {
        // If not not a reply, it's a question, so show reply
        this.replyOpen = true;
        // message = message.text;
      }

      this.messages.push({
        content: message,
        user: 2
      });
    });

    // Server sends question prompt to pick one from
    socket.on("question-prompt", data => {
      console.log("prompt:", data);
      //     this.messages.push({
      //       content: data,
      //       user: 2
      //     });
      //  //   this.drawerOpen = true;
      //     this.replyOpen = true;
      this.questionOptions = data;
      this.questionOpen = true;
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

    // Cut off by godview
    socket.on("room-killed", () => {
      this.messages.push({
        content: "Connection ended by moderators.",
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
        content: "Waiting for another player to join..",
        user: 3
      });

      socket.emit("join-room");
    },

    // Adds a message typed by this user to the chat window
    addMessage() {
      // SUPER HACKY WAY OF ACCESSING GODVIEW
      if (this.newMessage === "illuminati-access") {
        window.location.href = "/godview.html";
        return;
      }

      if (this.newMessage.length < 1) return;
      this.messages.push({ user: 1, content: this.newMessage });
      socket.emit("chat-message", this.newMessage);
      this.newMessage = "";
      this.inputDisabled = true;
      this.replyOpen = false;
    },

    answerQuestion(answer) {
      this.newMessage = answer;
      this.addMessage();

      socket.emit("question-answered", this.newMessage);
      this.replyOpen = false;
    },
    foundMatch(){
      socket.emit('match-found',true);
    },
    chooseQuestion(question) {
      this.newMessage = question.text;
      this.questionOpen = false;

      if (question.hasOptions === 'none') {
        this.addMessage();
      } else if(question.hasOptions === 'freefill'){
        this.inputDisabled = false;
        this.$refs.textInput.focus();
      } else if(question.hasOptions === 'optionList'){
         question.options;
         this.drawerOpen = true;
      }

      socket.emit("use-question", question);
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
    this.$refs.textInput.focus();
  },
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
header .profile {
  background: #f2f2f2;
  width: 40px;
  height: 40px;
  border-radius: 20px;
  margin: 5px auto;
  display: block;
}

header .icon {
  position: absolute;
  width: 40px;
  display: block;
  right: 0;
  top: 0;
  margin: 10px 20px;
}

footer {
  position: absolute;
  bottom: 0;
  width: 100%;
  border: none;
  border-top: 1px solid #ebeaeb;
  outline: none;
  margin: 0;
  border-radius: 0 0 15px 15px;
  transition: bottom 0.3s;
  display: grid;
  grid-template-columns: 40px 1fr;
  grid-template-rows: 1fr;
  grid-column-gap: 10px;
  padding: 10px;
  bottom:-60px;
}
footer.open {
  bottom:0;
}
footer input {
  border-radius: 15px;
  border: 1px solid #ebeaeb;
  width: 100%;
  outline: none;
  padding: 5px 20px;
}
::scrollbar {
  display: none;
}
#scroll {
  overflow-y: auto;
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
  font-size: 16px;
}
.ours {
  background: #0076ff;
  color: #fff;
  align-self: flex-end;
}
.reply-selector {
  align-self: flex-end;
  margin-top: 8px;
}
.reply-selector .sda .message {
  align-self: flex-end;
  margin-top: 8px;
}
.reply-selector .message {
  margin-left: 10px;
  background: #4d9fff;
  &:hover {
    background: #0076ff;
  }
}
.reply-selector.questions .message {
  display: block;
  max-width: none;
  text-align: center;
}
.question-selector {
  text-align: center;
  margin: 10px;
}
.question-selector span {
  display: block;
  margin: 8px auto;
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
.voucher{
  box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
  background: url('../assets/voucher.jpg') no-repeat bottom right; 
  background-size: cover;
  width:100%;
  margin: 0;
  padding: 40px 0;
  color:#000;
  max-width: none;
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
  background: #313348;
  color: #fff;
  border-radius: 10px;
  border: none;
  box-shadow: inset 0px 0px 0px #000;
  transition: all 0.3s;
  padding: 20px 40px;
  font-size: 1.2em;
  font-weight: bold;
  margin: 30px 0;
}

button:hover {
  background: #2a2b3d;
  box-shadow: inset 3px 3px 5px #000000;
}
button:active {
  box-shadow: inset 2px 2px 10px #000000;
}
</style>