'use client';

import { useHideSidePane } from '@/hooks/use-sidepane';
import { useAppSelector } from '@/lib/store';
import { SidePaneType } from '@/lib/store/types/sidepane';

import { DummySidepane } from './DummySidepane';

const SIDEPANE_COMPONENTS = {
  [SidePaneType.DummySidepane]: DummySidepane,
};

export function SidepaneProvider() {
  const { isOpen, type, payload } = useAppSelector(
    (state) => state.ui.sidepane,
  );
  const close = useHideSidePane();

  if (!isOpen || !type) return null;

  const SidepaneComponent =
    SIDEPANE_COMPONENTS[type as keyof typeof SIDEPANE_COMPONENTS];
  if (!SidepaneComponent) return null;

  return <SidepaneComponent isOpen={isOpen} onClose={close} {...payload} />;
}
