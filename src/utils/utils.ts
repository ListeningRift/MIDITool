export function fileToArrayBuffer(file: File) {
  return new Promise<ArrayBuffer | undefined | null>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = function (e) {
      resolve(e.target?.result as ArrayBuffer)
    }

    reader.onerror = function (e) {
      reject(e.target?.error)
    }

    reader.readAsArrayBuffer(file)
  })
}
