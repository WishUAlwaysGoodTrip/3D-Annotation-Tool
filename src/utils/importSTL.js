// src/utils/exportSTL.js
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter';

export const exportSTL = (scene) => {
  const exporter = new STLExporter();
  const stlString = exporter.parse(scene);

  // 将 STL 字符串转换为 Blob 并创建下载链接
  const blob = new Blob([stlString], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'model.stl';
  link.click();

  // 清理 URL 对象
  URL.revokeObjectURL(url);
};
