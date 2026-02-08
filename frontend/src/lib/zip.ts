import { unzipSync } from 'fflate'

export const extractFirstGlbFromZip = async (zipBlob: Blob) => {
  const arrayBuffer = await zipBlob.arrayBuffer()
  const files = unzipSync(new Uint8Array(arrayBuffer))
  const entries = Object.entries(files)

  const glbEntry = entries.find(([name]) => name.toLowerCase().endsWith('.glb'))
  if (!glbEntry) {
    throw new Error('No .glb file found in KIRI model zip')
  }

  const [fileName, fileData] = glbEntry
  const buffer = Uint8Array.from(fileData).buffer
  return {
    fileName,
    blob: new Blob([buffer], { type: 'model/gltf-binary' }),
  }
}
