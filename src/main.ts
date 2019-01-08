import App from "./App.vue"
import Vue from "vue"

Vue.config.productionTip = false

new Vue({
  render: (h) => h(App),
  // mounted: () => {
  //   document.addEventListener("dragover", function(event) {
  //     event.preventDefault()
  //   })
  //   document.addEventListener("drop", function(event) {
  //     event.preventDefault()
  //   })
  // },
}).$mount("#app")
