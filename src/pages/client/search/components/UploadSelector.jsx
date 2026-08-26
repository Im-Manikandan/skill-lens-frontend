import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Layers, ChevronDown, Check, Trash2, X } from 'lucide-react';

/**
 * Multi-select recruitment upload filter. Replaces the old single-value
 * "All Uploads" dropdown.
 *
 * - "All Profiles" is pinned first and is mutually exclusive with individual
 *   batch selection — picking it clears any individual picks and vice versa.
 * - Every uploaded batch (never overwritten — see resume-processing-controller.jsx)
 *   is a separate checkable row with its own Delete action.
 * - batch_id is passed through as `batchId` for filtering only — never
 *   rendered; the visible label is always `display_name` / folder name.
 */
export default function UploadSelector({
  batches, // [{ batchId, label, profileCount, status, uploadedAt }]
  allProfilesSelected,
  selectedIds,
  totalProfileCount,
  onSelectAll,
  onToggleBatch,
  onDelete,
  disabled,
}) {
  const [open, setOpen] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);
  const [panelPos, setPanelPos] = useState(null);
  const buttonRef = useRef(null);
  const panelRef = useRef(null);

  // Panel is portaled to <body> (position: fixed) so it floats above the
  // search card instead of being clipped by that card's overflow:hidden
  // (needed there for its rounded corners / gradient border).
  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPanelPos({ top: rect.bottom + 6, left: rect.left, minWidth: rect.width });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (buttonRef.current && buttonRef.current.contains(e.target)) return;
      if (panelRef.current && panelRef.current.contains(e.target)) return;
      setOpen(false);
      setConfirmingId(null);
    };
    document.addEventListener('mousedown', close, true);
    const onScrollOrResize = () => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      setPanelPos({ top: rect.bottom + 6, left: rect.left, minWidth: rect.width });
    };
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', close, true);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open]);

  const summaryLabel = allProfilesSelected
    ? `All Profiles (${totalProfileCount})`
    : selectedIds.length === 0
    ? 'Select uploads'
    : selectedIds.length === 1
    ? (batches.find((b) => b.batchId === selectedIds[0])?.label || '1 upload')
    : `${selectedIds.length} uploads selected`;

  return (
    <div className="tw:relative" style={{ flexShrink: 0 }}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-label="Filter by recruitment upload"
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 9999,
          color: '#e2e8f0',
          fontSize: 13,
          fontWeight: 500,
          padding: '9px 14px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          minWidth: 168,
          maxWidth: 240,
          outline: 'none',
        }}
      >
        <Layers style={{ width: 13, height: 13, color: '#6b7280', flexShrink: 0 }} />
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {summaryLabel}
        </span>
        <ChevronDown style={{ width: 13, height: 13, color: '#6b7280', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {open && panelPos && createPortal(
        <div
          ref={panelRef}
          style={{
            position: 'fixed', top: panelPos.top, left: panelPos.left, zIndex: 9999,
            minWidth: Math.max(260, panelPos.minWidth), maxWidth: 340, maxHeight: 340, overflowY: 'auto',
            background: '#1a1a2e',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
            padding: 6,
          }}
        >
          {/* All Profiles */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => onSelectAll()}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 10px', borderRadius: 8, cursor: 'pointer',
              background: allProfilesSelected ? 'rgba(179,211,53,0.12)' : 'transparent',
            }}
          >
            <span style={{
              width: 16, height: 16, borderRadius: 4, flexShrink: 0,
              border: `1px solid ${allProfilesSelected ? '#B3D335' : 'rgba(255,255,255,0.25)'}`,
              background: allProfilesSelected ? '#B3D335' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {allProfilesSelected && <Check style={{ width: 11, height: 11, color: '#0f0f14' }} />}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
              👥 All Profiles ({totalProfileCount})
            </span>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '6px 4px' }} />

          {batches.length === 0 && (
            <div style={{ padding: '10px 10px', fontSize: 12, color: '#6b7280', fontStyle: 'italic' }}>
              No uploads yet.
            </div>
          )}

          {batches.map((b) => {
            const checked = !allProfilesSelected && selectedIds.includes(b.batchId);
            const isConfirming = confirmingId === b.batchId;
            const statusSuffix = b.status === 'processing' ? ' (processing…)'
              : b.status === 'failed' ? ' (failed)'
              : b.status === 'cancelled' ? ' (cancelled)' : '';
            const selectable = !b.status || b.status === 'completed';

            return (
              <div
                key={b.batchId}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px', borderRadius: 8,
                  background: checked ? 'rgba(179,211,53,0.08)' : 'transparent',
                }}
              >
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => selectable && onToggleBatch(b.batchId)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0,
                    cursor: selectable ? 'pointer' : 'default', opacity: selectable ? 1 : 0.5,
                  }}
                >
                  <span style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    border: `1px solid ${checked ? '#B3D335' : 'rgba(255,255,255,0.25)'}`,
                    background: checked ? '#B3D335' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {checked && <Check style={{ width: 11, height: 11, color: '#0f0f14' }} />}
                  </span>
                  <span style={{
                    fontSize: 13, color: '#e2e8f0',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {b.label} ({b.profileCount ?? 0}){statusSuffix}
                  </span>
                </span>

                {isConfirming ? (
                  <div className="tw:flex tw:items-center tw:gap-1" style={{ flexShrink: 0 }}>
                    <button
                      type="button"
                      title="Confirm delete"
                      onClick={() => { onDelete(b.batchId); setConfirmingId(null); }}
                      style={{
                        background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)',
                        borderRadius: 6, color: '#f87171', fontSize: 11, fontWeight: 600,
                        padding: '3px 8px', cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      title="Cancel"
                      onClick={() => setConfirmingId(null)}
                      style={{
                        background: 'transparent', border: 'none', color: '#6b7280',
                        cursor: 'pointer', padding: 4, display: 'flex',
                      }}
                    >
                      <X style={{ width: 13, height: 13 }} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    title="Delete this upload"
                    onClick={() => setConfirmingId(b.batchId)}
                    style={{
                      background: 'transparent', border: 'none', color: '#6b7280',
                      cursor: 'pointer', padding: 4, display: 'flex', flexShrink: 0,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#6b7280'; }}
                  >
                    <Trash2 style={{ width: 13, height: 13 }} />
                  </button>
                )}
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}
