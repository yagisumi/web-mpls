type OutputFormat = "ogg" | "simple" | "dump"
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
  drag_counter = 0
  selectedTab = "ogg"
}

new Vue({
  data() {
    return new AppData()
  },
  methods: {
    error_message(error: Error) {
      return error.stack || error.message
    },
    isDropped() {
      return !this.isDragOver && this.mpls_ary.length !== 0
    },
    stream_info(data: mpls.MPLS) {
      const info: Array<string> = []

      data.playlist.playitems.forEach((item, idx) => {
        info.push(`PLAYITEM ${idx + 1}: "${item.clip_file}" ${item.codec_id} ${item._play_time_hhmmss}`)
        if (item.stn) {
          const streams: Array<string> = []
          for (let stream of item.stn.streams) {
            switch (stream.attributes._type) {
              case "video":
              case "audio":
                const label: Array<string> = []

                if (stream.attributes._coding_type) {
                  label.push(stream.attributes._coding_type)
                }

                if (stream.attributes._format) {
                  label.push(stream.attributes._format)
                }

                if (stream.attributes._rate) {
                  if (stream.attributes._type === "video") {
                    label.push(stream.attributes._rate + "fps")
                  } else {
                    label.push(stream.attributes._rate)
                  }
                }

                if (stream.attributes.lang_code) {
                  info.push(`  [${stream.attributes._type}] ${label.join("/")} (${stream.attributes.lang_code})`)
                } else {
                  info.push(`  [${stream.attributes._type}] ${label.join("/")}`)
                }
                break
              case "graphics":
                info.push(
                  `  [${stream.attributes._type}] ${stream.attributes._coding_type} (${stream.attributes.lang_code})`
                )
                break
              default:
                info.push("  [unknown]")
                break
            }
          }
        }
      })

      return info.join("\n")
    },
    chapters_info(data: mpls.MPLS) {
      const info: Array<string> = ["Chapters"]

      data.playlist_mark.entries.forEach((entry, idx) => {
        info.push(`${("  " + (idx + 1)).slice(-3)}: ${entry._abs_start_hhmmss}`)
      })

      return info.join("\n")
    },
    output_ogg(data: mpls.MPLS) {
      const info: Array<string> = []

      data.playlist_mark.entries.forEach((entry, idx) => {
        const nn = ("0" + (idx + 1)).slice(-2)
        info.push(`CHAPTER${nn}=${entry._abs_start_hhmmss}`)
        info.push(`CHAPTER${nn}NAME=Chapter ${idx + 1}`)
      })

      return info.join("\n")
    },
    output_simple(data: mpls.MPLS) {
      const info: Array<string> = []

      data.playlist_mark.entries.forEach((entry, idx) => {
        const nn = ("0" + (idx + 1)).slice(-2)
        info.push(`${entry._abs_start_hhmmss} Chapter ${idx + 1}`)
      })

      return info.join("\n")
    },
    output_dump(data: mpls.MPLS) {
      return JSON.stringify(data, null, 2)
    },
    download(event: MouseEvent) {
      const elem = event.target as HTMLAnchorElement
      const mime = elem.getAttribute("data-mime") || "text/plain"
      const text = elem.getAttribute("data-text")
      if (text) {
        const blob = new Blob([text], { type: mime })
        elem.href = URL.createObjectURL(blob)
      }
    },
    content_url(text: string, mime: string) {
      const blob = new Blob([text], { type: mime })
      return URL.createObjectURL(blob)
    },
    dragenter(event: DragEvent) {
      this.drag_counter += 1

      if (
        !this.isDragOver &&
        event.dataTransfer &&
        event.dataTransfer.types instanceof Array &&
        event.dataTransfer.types.includes("Files")
      ) {
        this.isDragOver = true
        window.scrollTo(0, 0)
      }
    },
    dragleave(event: DragEvent) {
      this.drag_counter -= 1

      if (this.drag_counter <= 0) {
        this.isDragOver = false
      }
    },
    dropped(event: DragEvent) {
      this.isDragOver = false
      this.drag_counter = 0

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
          this.mpls_ary.push({
            name: file.name,
            error: new Error("File extension is not `mpls`."),
            mpls: null,
          })
          continue
        }

        if (file.size > 1024 * 1024) {
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
            this.mpls_ary.push({
              name: file.name,
              error: null,
              mpls: dump,
            })
          } catch (error) {
            console.error(error)
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
