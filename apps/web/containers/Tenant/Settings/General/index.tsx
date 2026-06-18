'use client';

import * as React from 'react';

export default function GeneralContainer() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-sm font-semibold tracking-tight">
          General Settings
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Manage general workspace preferences.
        </p>
      </div>
      <div className="text-sm text-muted-foreground">
        This is <span className="font-medium text-foreground">general</span>{' '}
        settings.
      </div>
    </div>
  );
}
