import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export interface PrintPortalProps {
  active: boolean;
  children: React.ReactNode;
}

export function PrintPortal({ active, children }: PrintPortalProps) {
  const [mountNode, setMountNode] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!active || typeof document === 'undefined') {
      document.body?.classList.remove('has-print-document');
      setMountNode(null);
      return;
    }

    const container = document.createElement('div');
    container.className = 'print-document-root';
    container.setAttribute('data-testid', 'print-document-root');
    document.body.appendChild(container);
    document.body.classList.add('has-print-document');
    setMountNode(container);

    return () => {
      document.body.classList.remove('has-print-document');
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
      setMountNode(null);
    };
  }, [active]);

  if (!active || !mountNode) return null;
  return createPortal(children, mountNode);
}
