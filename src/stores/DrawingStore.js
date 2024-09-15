// DrawingStore.js
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';


export const useDrawingStore = create(
  persist(
    devtools((set) => ({
      operations: [],  // 所有操作记录的数组
      undoStack: [],   // 撤销栈，用于存储需要撤销的操作
      redoStack: [],   // 重做栈，用于存储需要重做的操作

      // 添加新操作的函数
      addOperation: (operation) =>
        set((state) => {
          console.log('Adding operation:', operation); // 调试信息，打印要添加的操作
          return {
            operations: [...state.operations, operation],
            undoStack: [...state.undoStack, operation], // 将新操作推入撤销栈
            redoStack: [], // 添加新操作后清空重做栈
          };
        }),

      // 撤销操作的函数
      undoOperation: () =>
        set((state) => {
          if (state.undoStack.length === 0) {
            console.log('No operations to undo.'); // 撤销栈为空时的提示信息
            return state; // 如果撤销栈为空，则返回当前状态
          }

          const undoStack = [...state.undoStack];
          const lastOperation = undoStack.pop(); // 从撤销栈中弹出最后一个操作
          const redoStack = [lastOperation, ...state.redoStack]; // 将这个操作推入重做栈
          console.log('Undoing operation:', lastOperation); // 调试信息，打印撤销操作的信息
          return {
            operations: undoStack, // 更新当前的操作数组
            undoStack,
            redoStack,
          };
        }),

      // 重做操作的函数
      redoOperation: () =>
        set((state) => {
          if (state.redoStack.length === 0) {
            console.log('No operations to redo.'); // 重做栈为空时的提示信息
            return state; // 如果重做栈为空，则返回当前状态
          }

          const redoStack = [...state.redoStack];
          const nextOperation = redoStack.shift(); // 从重做栈中弹出最早的操作
          const undoStack = [...state.undoStack, nextOperation]; // 将这个操作推入撤销栈
          console.log('Redoing operation:', nextOperation); // 调试信息，打印重做操作的信息
          return {
            operations: undoStack,
            undoStack,
            redoStack,
          };
        }),
    })),
    {
      name: 'drawing-operations-storage', // localStorage 中的键名
    }
  )
);
