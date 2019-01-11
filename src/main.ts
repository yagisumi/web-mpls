type FileInfo =
  | {
      name: string
      error: Error
      mpls: null
    }
  | {
      name: string
      error: null
      mpls: mpls.MPLS
    }

class AppData {
  mpls_ary: Array<FileInfo> = []
  // empty_mpls_ary = () => {
  //   this.mpls_ary.splice(0, this.mpls_ary.length)
  // }
  isDragOver = false
  counter = 0
}

new Vue({
  data() {
    return new AppData()
  },
  methods: {
    msg(error: Error) {
      return error.message
    },
    isDropped() {
      return !this.isDragOver && this.mpls_ary.length !== 0
    },
    dragenter(event: DragEvent) {
      this.counter += 1
      console.log(this.counter)
      if (
        event.dataTransfer &&
        event.dataTransfer.types instanceof Array &&
        event.dataTransfer.types.includes("Files")
      ) {
        this.isDragOver = true
      }
    },
    dragleave(event: DragEvent) {
      this.counter -= 1
      console.log(this.counter)
      if (event.target && event.currentTarget) {
        const droparea = event.currentTarget as HTMLElement
        const enterElem = event.relatedTarget as HTMLElement
        if (!droparea.contains(enterElem)) {
          this.isDragOver = false
        }
      }
    },
    dropped(event: DragEvent) {
      this.isDragOver = false

      if (
        event.dataTransfer &&
        event.dataTransfer.types instanceof Array &&
        event.dataTransfer.types.includes("Files")
      ) {
        this.load(Array.from(event.dataTransfer.files))
      }
    },
    selected(event: Event) {
      if (event.target) {
        const input = event.target as HTMLInputElement
        if (input.files) {
          this.load(Array.from(input.files))
        }
      }
    },
    load(files: File[]) {
      // this.empty_mpls_ary()
      this.mpls_ary.splice(0, this.mpls_ary.length)
      for (let file of files) {
        if (!file.name.match(/\.mpls$/)) {
          console.error("File extension is not mpls.")
          this.mpls_ary.push({
            name: file.name,
            error: new Error("File extension is not mpls."),
            mpls: null,
          })
          continue
        }

        if (file.size > 1024 * 1024) {
          console.error("The file size is too large.")
          this.mpls_ary.push({
            name: file.name,
            error: new Error("The file size is too large."),
            mpls: null,
          })
          continue
        }

        const r = new FileReader()
        r.onerror = (event: Event) => {
          this.mpls_ary.push({
            name: file.name,
            error: new Error("File Read Error"),
            mpls: null,
          })
        }
        r.onload = (event: Event) => {
          try {
            const dump = mpls(r.result as ArrayBuffer)
            console.log(dump)
            this.mpls_ary.push({
              name: file.name,
              error: null,
              mpls: dump,
            })
          } catch (error) {
            this.mpls_ary.push({
              name: file.name,
              error: error,
              mpls: null,
            })
          }
        }
        r.readAsArrayBuffer(file)
      }
    },
  },
  computed: {
    msg() {
      return (error: Error) => {
        return error.message
      }
    },
  },
  mounted() {
    document.addEventListener("dragenter", this.dragenter)
    document.addEventListener("dragleave", this.dragleave)
    document.addEventListener("dragover", (event) => {
      event.preventDefault()
      event.stopPropagation()
    })
    document.addEventListener("drop", (event) => {
      event.preventDefault()
      event.stopPropagation()
      this.dropped(event)
    })
  },
}).$mount("#app")
