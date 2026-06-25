import React from 'react';
import { useUIStore } from '../../store/ui-store';

interface MainLayoutProps {
  navigator: React.ReactNode;
  editor: React.ReactNode;
  metadata: React.ReactNode;
}

export function MainLayout({ navigator, editor, metadata }: MainLayoutProps) {
  const navigatorWidth = useUIStore((s) => s.navigatorWidth);
  const metadataWidth = useUIStore((s) => s.metadataWidth);
  const navigatorVisible = useUIStore((s) => s.navigatorVisible);
  const metadataVisible = useUIStore((s) => s.metadataVisible);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `${navigatorVisible ? navigatorWidth : 0}px 4px 1fr 4px ${metadataVisible ? metadataWidth : 0}px`,
        height: '100vh',
        width: '100vw',
      }}
    >
      {navigatorVisible && <div style={{ overflow: 'auto' }}>{navigator}</div>}
      {navigatorVisible && <div style={{ background: '#ddd' }} />}
      <div style={{ overflow: 'auto' }}>{editor}</div>
      {metadataVisible && <div style={{ background: '#ddd' }} />}
      {metadataVisible && <div style={{ overflow: 'auto' }}>{metadata}</div>}
    </div>
  );
}
