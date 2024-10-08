// import React from 'react';
// import PropTypes from 'prop-types';

// const RecentFilesList = ({ recentFiles, onFileSelect, listWidth, toggleRecentFiles }) => {
//   return (
//     <div className="recent-file-list" style={{ width: `${listWidth}px` }}>
//       <div className="folder-path">Recent Files</div>
//       {recentFiles.length === 0 ? (
//         <div className="empty-message">No recent files</div>
//       ) : (
//         recentFiles.map((file, index) => (
//           <div key={index} onClick={() => onFileSelect(file)} className="file-item">
//             {file.name}
//           </div>
//         ))
//       )}
//       {/* 在这里加入关闭按钮 */}
//       <button onClick={toggleRecentFiles} className="toggle-button">
//         Close Recent Files
//       </button>
//     </div>
//   );
// };

// RecentFilesList.propTypes = {
//   recentFiles: PropTypes.array.isRequired,
//   onFileSelect: PropTypes.func.isRequired,
//   listWidth: PropTypes.number.isRequired,
//   toggleRecentFiles: PropTypes.func.isRequired,
// };

// export default RecentFilesList;
