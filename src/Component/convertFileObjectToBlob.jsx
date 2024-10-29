// Convert base64 data to binary
function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Convert fileObject to Blob and File objects
export function convertFileObjectToBlob(fileObject) {
  const arrayBuffer = base64ToArrayBuffer(fileObject.data); 
  const blob = new Blob([arrayBuffer], { type: 'model/stl' }); 
  const file = new File([blob], fileObject.name, { type: 'model/stl' }); 
  return file;
}
