<template>
  <div id="phone">
    <header>
      <div class="profile">
        <img
          @click="devClickCount++"
          src="../assets/logo_notext.svg"
          alt="Connect For Coffee"
        >
      </div>

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
          <p>Here's a voucher for free coffee for the two of you!</p>
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

        <img
          src="../assets/logo_text.svg"
          alt="Connect For Coffee"
        >

        <p>
          You will be connected to a fellow traveller.
Play together and find each other to get Coffee for 2!<br>
Make sure you have 10 minutes to play.
        </p>
          <img
       
          class="icon explain"
          src="../assets/handshake.svg"
          alt="Found Eachother Icon"
        >

<p>When you've found eachother, click on the handshake icon to get your free coffee.</p>
     <!--   <b>Ask questions like these!</b>
        <div class="question-selector">
          <span class="message ours">Are you near platform 12?</span>
          <span class="message ours">Do you have a beard?</span>
        </div>
        <br>
        <b>And answer them!</b>
        <div class="reply-selector">
          <span
            class="message ours"
            v-for="option in replyOptions"
            :key="option"
          >{{option}}</span>
        </div>-->
        

        <button @click="joinRoom">Start</button>

        <p class="disclaimer">Your messages will be logged for safety purposes</p>
      </div>
    </section>
    <footer :class="matchCode !== 0? 'open' :''">
      <div class="input">
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
      </div>
      <!-- <select v-model="chosenQuestionBlank" v-show="questionBlanks.length  > 0" ref="questionBlankSelect">
        <option v-for="questionBlank in questionBlanks" :key="questionBlank" :value="questionBlank" >{{questionBlank}}</option>
      </select> -->
      <div
        class="scroll-container"
        :class="questionBlanks.length > 0 ? 'open' :'closed'"
      >
        <div class="question-blank reply-selector">
          <span
            class="message ours"
            v-for="option in questionBlanks"
            :key="option"
            @click="chooseQuestionBlank(option)"
          >{{option }}</span>
        </div>
      </div>

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
      placeholder: "Waiting for the other player...",
      replyOptions: ["Yes", "No", "Unsure"],
      questionOptions: [],
      questionBlanks: [],
      chosenQuestionBlank: "",
      devClickCount: 0,
      drawerOpen: false,
      replyOpen: false,
      questionOpen: false,
      modalOpen: false,
      modalInput: false,
      matchCode: 0,
      matchFound: false,
      gameWon: false
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
        content =
          "Other player found! It's now their turn, please be patient while they pick a question.";
        this.placeholder = "Waiting for the other player...";
        this.modalInput = true; // Set one of the players as input for the other;
        this.otherIsTyping = true;
      } else {
        content = "Another player has been found! Ask them a question:";
        this.placeholder = "Pick a question";
        this.otherIsTyping = false;
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
      console.log("game won", data);
      this.modalOpen = false;
      this.inputDisabled = true;
      this.questionOpen = false;
      this.replyOpen = false;
      this.otherIsTyping = false;
      this.gameWon = true;
      this.$nextTick(() =>
        JsBarcode(this.$refs.voucherCanvas, data.barcode, {
          background: null,
          displayValue: false
        })
      );

      this.placeholder = "Game is over!";
    });

    // When other person sends a message
    socket.on("chat-message", message => {
      if (!this.replyOptions.includes(message)) {
        // If not not a reply, it's a question, so show reply
        this.replyOpen = true;
        this.otherIsTyping = false;

        this.placeholder = "Pick a reply";
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
      this.placeholder = "Pick a question";
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
          "The other person has left the game :(((. Refresh page for a new chance.",
        user: 3
      });
      window.onbeforeunload = undefined;
      this.inputDisabled = true;
      this.questionOptions = [];
      this.questionBlanks = [];
      this.questionOpen = false;
      this.replyOpen = false;
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
      this.questionOptions = [];
      this.questionBlanks = [];
      this.questionOpen = false;
      this.replyOpen = false;
      this.otherIsTyping = false;
    });

    // socket.on("typing", () => {
    //   this.otherIsTyping = true;
    // });
    // socket.on("stopTyping", () => {
    //   this.otherIsTyping = false;
    // });
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
    chooseQuestionBlank(option) {
      let emptyQuestion = this.newMessage;
      let filledQuestion = emptyQuestion.replace(/\[+([^\][]+)]+/g, option.toLowerCase());

      this.newMessage = filledQuestion;
      this.addMessage();

      this.questionBlanks = [];
      this.otherIsTyping = true;
    },
    foundMatch() {
      socket.emit("match-found", true);
    },
    chooseQuestion(question) {
      this.newMessage = question.text;
      this.questionOpen = false;

      console.log(question);
      this.placeholder = "Waiting for the other player...";

      if (question.hasOptions === "none") {
        this.otherIsTyping = true;
        this.addMessage();
      } else if (question.hasOptions === "freefill") {
        this.inputDisabled = false;
        this.$refs.textInput.focus();
      } else if (question.hasOptions === "optionList") {
        this.questionBlanks = question.options;
        this.drawerOpen = true;
      }

      socket.emit("use-question", question);
    }
  },
  watch: {
    // Watch input field to emit typing events
    // newMessage(value) {
    // //  value ? socket.emit("typing", this.username) : socket.emit("stopTyping");
    // }
  },
  updated() {
    // Everytime a new message is added, scroll to the bottom so it is in view
    // And refocus the input so a mouse isn't needed
    var scrollElement = document.getElementById("scroll");
    scrollElement.scrollTop = scrollElement.scrollHeight;
    this.$refs.textInput.focus();
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
  background: #fcc8b2;
  backdrop-filter: blur(10px);
}
header {
  position: absolute;
  height: 75px;
  width: 100%;
  border-bottom: 1px solid #fef1eb;
  text-align: center;
  box-sizing: border-box;
  border-radius: 15px 15px 0 0;
  font-size: 0.9em;
  display: flex;
  align-items: center;
  justify-content: center;
}
header .profile {
  width: 50px;
  height: 50px;
  border-radius: 25px;
  overflow: hidden;
  border: 2px solid #fef1eb;
}
header .profile img {
}
.explain{
  max-width: 60px;
}

footer {
  position: absolute;
  bottom: 0;
  width: 100%;
  border: none;
  border-top: 1px solid #fef1eb;
  outline: none;
  margin: 0;
  border-radius: 0 0 15px 15px;
  transition: bottom 0.3s;
  padding: 10px;
  bottom: -60px;
}
footer .input {
  display: grid;
  grid-template-columns: 40px 1fr;
  grid-template-rows: 1fr;
  grid-column-gap: 10px;
}
footer.open {
  bottom: 0;
}
footer input {
  border-radius: 15px;
  border: none;
  width: 100%;
  outline: none;
  padding: 5px 20px;
  color: #652b29;
  font-weight: bold;
  &::placeholder {
    color: #652b29;
  }
  &:disabled {
    background: #fef1eb;
  }
}
.scroll-container {
  scroll-behavior: smooth;
  overflow-x: scroll;
  overflow-y: hidden;
  height: 50px;
  padding-top: 12px;
  transition: height 0.2s;
  &.closed {
    height: 0px;
    padding-top:0;
  }
}
.scroll-container .question-blank {
  width: max-content;
}
.scroll-container .question-blank .message {
  display: inline-block;
  margin-bottom: 0;
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
  margin-bottom: 30px;
}
.message {
  background: #fef1eb;
  color: #000;
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 16px;
  max-width: 70%;
  font-size: 16px;
  display: inline-block;
}
.ours {
  background: #6f262a;
  color: #fff;
  align-self: flex-end;
}
.reply-selector {
  align-self: flex-end;
}
.reply-selector .message {
  margin-left: 10px;
  background: #8c5155;
  &:hover {
    background: #6f262a;
  }
}
.reply-selector.questions .message {
  display: block;
  max-width: none;
  text-align: center;
}

.question-selector span {
  display: block;
}
.system,
.disclaimer {
  align-self: center;
  background: none;
  color: #652b29;
  text-align: center;
  font-size: 0.8em;
  font-weight: bold;
}
.system {
  max-width: 90%;
}
.voucher {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
  background: url("../assets/voucher.jpg") no-repeat bottom right;
  background-size: cover;
  width: 100%;
  margin: 0;
  padding: 40px 0;
  color: #000;
  max-width: none;
}
.voucher canvas {
  max-width: 70%;
}
.emptyState {
  text-align: center;
  padding: 40px;
  padding-bottom: 0;
  padding-top: 100px;
}
.emptyState .message {
    max-width: 90%;
    margin: 10px;
    background:#fcedda;
    color:#000;
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
  background-color: #652b29;
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
  background: none;
  border:3px solid #6f262a;
  color: #6f262a;
  border-radius: 10px;
  transition: all 0.3s;
  padding: 10px 30px;
  font-size: 1.2em;
  font-weight: bold;
  margin: 30px 0;
  font-family: inherit;
}

button:hover {
  background:#6f262a;
  color:#fff;
}

</style>