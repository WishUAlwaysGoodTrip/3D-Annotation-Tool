// 将 base64 数据转换为二进制
function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// 将 fileObject 转换为 Blob 和 File 对象
export function convertFileObjectToBlob(fileObject) {
  const arrayBuffer = base64ToArrayBuffer(fileObject.data); // 将 Base64 转为二进制
  const blob = new Blob([arrayBuffer], { type: 'model/stl' }); // 创建 Blob
  const file = new File([blob], fileObject.name, { type: 'model/stl' }); // 创建 File 对象
  return file;
}
