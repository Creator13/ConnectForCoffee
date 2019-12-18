<template>
<transition name="fade">
  <div class="modal-container" @click="close" v-show="show">
    <section class="modal" @click.stop>
         <h1>Found eachother?</h1>
      <div v-if="input">
           <p>Confirm that you have found the other player by typing in the number displayed on their phone:</p>
            <input
                ref="inputCode"
                type="text"
                pattern="[0-9]"
                maxlength="6"
                placeholder="000000"
                v-model="inputVal"
            >
        </div>
        <div v-else>
         <p>Confirm that you have found the other player by typing in this number on their phone:</p>
            <span class="number">
                {{code}}
            </span>
        </div>
        <a href="#" @click="close">I have not found the other yet</a>
    </section>
  </div>
  </transition>
</template>

<script>
export default {
  name: "FoundModal",
  props: ['show','code','input'],
  data(){
      return{
        inputVal:undefined,
      }
  },
  created() {
    document.addEventListener("keydown", (e) => {
      if (this.show && e.keyCode == 27) {
        this.close();
      }
    });
  },
  watch:{
      show(val){
          if(val === true && this.input === true){
            this.$nextTick(() =>  this.$refs.inputCode.focus())
          }
      },
      inputVal(val){
        if(val == this.code){
            this.foundMatch();
        }
      }
  },
  methods: {
        close() {
            this.$emit('close');
        },
        foundMatch(){
            this.$emit('found-match');
        }
    }
};
</script>

<style lang="scss" scoped>
.modal-container {
  position: absolute;
  z-index: 99;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(3px);
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal {
  background:#ecd6bf url('../assets/voucher.jpg') no-repeat bottom right; 
  background-size: cover;
  border-radius: 20px;
  padding: 20px 40px;
  position: absolute;
  text-align: center;
  margin: 0 20px;

}
input,.number {
  padding: 10px;
  background: #f2f2f2;
  border-radius: 20px;
  border: none;
  text-align: center;
  font-size: 2em;
  width: 100%;
  display: block;
  margin-top:20px;
  outline: none;
  appearance: none;
}

a{
    display: block;
    margin-top:20px;
    margin-bottom:10px;
    color:#313131;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity .2s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
</style>
