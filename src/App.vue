<template lang="pug">
#app
  h3 HELLO
  p HELLO
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class App extends Vue {}
</script>

<style lang="sass">
#app
  h3
    color: green

</style>
