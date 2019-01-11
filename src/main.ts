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
}

new Vue({
  data() {
    return new AppData()
  },
  methods: {
    msg(error: Error) {
      return error.message
    },
    dragenter(event: DragEvent) {
      if (event.target && event.currentTarget && event.target === event.currentTarget) {
        if (
          event.dataTransfer &&
          event.dataTransfer.types instanceof Array &&
          event.dataTransfer.types.includes("Files")
        ) {
          const droparea = event.target as HTMLElement
          droparea.classList.add("dragover")
        }
      }
    },
    dragleave(event: DragEvent) {
      if (event.target && event.currentTarget) {
        const droparea = event.currentTarget as HTMLElement
        const enterElem = event.relatedTarget as HTMLElement
        if (!droparea.contains(enterElem)) {
          droparea.classList.remove("dragover")
        }
      }
    },
    dropped(event: DragEvent) {
      if (event.target) {
        const droparea = event.currentTarget as HTMLElement
        droparea.classList.remove("dragover")
      }

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
    document.addEventListener("dragover", function(event) {
      event.preventDefault()
      event.stopPropagation()
    })
    document.addEventListener("dragleave", function(event) {
      event.preventDefault()
      event.stopPropagation()
    })
    document.addEventListener("drop", function(event) {
      event.preventDefault()
      event.stopPropagation()
    })
  },
}).$mount("#app")
