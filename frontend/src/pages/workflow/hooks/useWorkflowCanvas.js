import { useCallback } from 'react';

export const useWorkflowCanvas = () => {
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return {
    onDragOver
  };
};

export default useWorkflowCanvas;