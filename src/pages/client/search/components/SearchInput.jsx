import React, {
  useState, useRef, useEffect, useCallback, useLayoutEffect,
} from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Search, Sparkles, Mic, Zap, FolderOpen } from 'lucide-react';
import BrandButton from '../../../../components/buttons/BrandButton.jsx';
import IndigoButton from '../../../../components/buttons/IndigoButton.jsx';
import useSpeechRecognition from '../../../../hooks/useSpeechRecognition.js';
import { useSpellCheck } from '../../../../hooks/useSpellCheck.js';

// ── Inject spell-check CSS once ──────────────────────────────────────────────
let stylesInjected = false;
function injectStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  const style = document.createElement('style');
  style.textContent = `
    .sl-spell-error {
      text-decoration: underline wavy #ef4444;
      text-decoration-skip-ink: none;
      cursor: context-menu;
      border-radius: 2px;
    }
    .sl-search-ce:empty::before {
      content: attr(data-placeholder);
      color: #6b7280;
      pointer-events: none;
    }
    /* Thin, theme-matched scrollbar — only ever visible once content exceeds
       max-height (overflow-y: auto already withholds it below that point). */
    .sl-search-ce {
      scrollbar-width: thin;
      scrollbar-color: rgba(154,202,60,0.35) transparent;
    }
    .sl-search-ce::-webkit-scrollbar { width: 6px; }
    .sl-search-ce::-webkit-scrollbar-track { background: transparent; }
    .sl-search-ce::-webkit-scrollbar-thumb {
      background: rgba(154,202,60,0.35);
      border-radius: 999px;
    }
    .sl-search-ce::-webkit-scrollbar-thumb:hover { background: rgba(154,202,60,0.55); }
  `;
  document.head.appendChild(style);
}

// ── Caret utilities ───────────────────────────────────────────────────────────
function getCaretOffset(el) {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return 0;
  const range = sel.getRangeAt(0).cloneRange();
  const pre = document.createRange();
  pre.selectNodeContents(el);
  pre.setEnd(range.endContainer, range.endOffset);
  return pre.toString().length;
}

function setCaretOffset(el, offset) {
  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();
  let remaining = Math.max(0, offset);
  let found = false;

  function walk(node) {
    if (found) return;
    if (node.nodeType === Node.TEXT_NODE) {
      if (remaining <= node.length) {
        range.setStart(node, remaining);
        range.collapse(true);
        found = true;
      } else {
        remaining -= node.length;
      }
    } else {
      for (const child of Array.from(node.childNodes)) {
        walk(child);
        if (found) return;
      }
    }
  }

  walk(el);
  if (!found) {
    range.selectNodeContents(el);
    range.collapse(false);
  }
  sel.removeAllRanges();
  sel.addRange(range);
}

// ── HTML builder with spell-error spans ──────────────────────────────────────
function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildHTML(text, check) {
  if (!text) return '';
  return text.split(/(\s+)/).map((token) => {
    if (!token) return '';
    if (/^\s+$/.test(token)) return escHtml(token);
    const m = token.match(/^([^a-zA-Z]*)([a-zA-Z'-]+)([^a-zA-Z]*)$/);
    if (!m) return escHtml(token);
    const [, pre, word, post] = m;
    if (!word) return escHtml(token);
    if (!check(word)) {
      return `${escHtml(pre)}<span class="sl-spell-error" data-word="${escHtml(word)}">${escHtml(word)}</span>${escHtml(post)}`;
    }
    return escHtml(token);
  }).join('');
}

// No artificial floor — natural single-line height (~48-52px, matching the
// original compact pill) is whatever a real line of text actually measures
// out to. Grows past that only once wrapped content needs more room, caps
// around 120-140px, then scrolls.
const BOX_MAX_H = 136;
// Fallback guess used only until the real single-line height is calibrated
// off the live DOM below — a hardcoded "2 lines ≈ 60px" assumption doesn't
// hold once real line-height/font metrics (Bootstrap/Tailwind resets, zoom,
// etc.) diverge from that guess, which is what produced an oversized box for
// barely-wrapped text.
const BOX_COMPACT_FALLBACK = 52;

// ── Component ─────────────────────────────────────────────────────────────────
export default function SearchInput({
  value, onChange, onSearch, disabled, searchDisabled, loading, onAdvancedClick,
  showUploadFolder, uploadFolderName, uploadFolderActive, uploadFolderProcessing, onUploadFolderClick,
}) {
  const [inputFocused, setInputFocused] = useState(false);
  const [ctxMenu, setCtxMenu] = useState(null);
  const [boxHeight, setBoxHeight] = useState(BOX_COMPACT_FALLBACK);
  const divRef = useRef(null);
  const spellTimerRef = useRef(null);
  const isComposingRef = useRef(false);
  const checkRef = useRef(null);
  const ctxMenuRef = useRef(null);
  // Calibrated once from the real empty-state single-line height (see
  // measureHeight) — everything downstream ("is this still ~2 lines?")
  // derives from this instead of an assumed pixel constant.
  const oneLineHRef = useRef(BOX_COMPACT_FALLBACK);
  const calibratedRef = useRef(false);
  // Off-DOM mirror used only to measure natural content height. Reading
  // scrollHeight off the *visible* box is a dead end for shrinking: once the
  // box has an explicit height and overflow:auto/hidden applied, the spec
  // floors scrollHeight at that set height (it can never report less than
  // the element's own clientHeight) — so after clearing a long query the
  // measurement would still read back the old expanded height forever. The
  // mirror never has overflow constraints or an explicit height, so it always
  // reports the query's true natural size and can shrink freely.
  const mirrorRef = useRef(null);
  useEffect(() => {
    const mirror = document.createElement('div');
    mirror.style.cssText = 'position:fixed; visibility:hidden; pointer-events:none; top:-9999px; left:-9999px; height:auto; white-space:pre-wrap; overflow-wrap:anywhere; box-sizing:border-box;';
    document.body.appendChild(mirror);
    mirrorRef.current = mirror;
    return () => { document.body.removeChild(mirror); };
  }, []);

  const measureHeight = useCallback(() => {
    const div = divRef.current;
    const mirror = mirrorRef.current;
    if (!div || !mirror) return;
    const text = div.textContent || '';
    const cs = getComputedStyle(div);
    mirror.style.width = `${div.clientWidth}px`;
    mirror.style.padding = cs.padding;
    mirror.style.fontSize = cs.fontSize;
    mirror.style.fontFamily = cs.fontFamily;
    mirror.style.lineHeight = cs.lineHeight;
    // Zero-width space keeps an empty query at one real line's height
    // (matching the real box, which always has at least a caret line) rather
    // than collapsing to bare padding.
    mirror.textContent = text || '​';
    const natural = mirror.scrollHeight;
    // Calibrate against the real DOM the very first time we see the empty
    // (single-line, placeholder-only) state, instead of assuming a fixed px value.
    if (!calibratedRef.current && text === '') {
      oneLineHRef.current = natural;
      calibratedRef.current = true;
    }
    // No lower clamp — an empty/short box should settle at its real natural
    // (single-line) height, not get padded out to a fixed minimum.
    setBoxHeight(Math.min(natural, BOX_MAX_H));
    // Deleting content should never leave the scroll position stranded past
    // the new (shorter) content.
    if (div.scrollTop > 0) div.scrollTop = 0;
  }, []);

  const { check, suggest, ready } = useSpellCheck();

  // Always give buildHTML access to the latest check fn without re-triggering effects
  useEffect(() => { checkRef.current = check; }, [check]);

  useEffect(() => { injectStyles(); }, []);

  const { isListening, status, error, startListening, stopListening, clearError, isSupported } =
    useSpeechRecognition({
      lang: 'en-US',
      onResult: (transcript) => onChange(transcript),
    });

  // ── Sync external value → contenteditable (e.g., from speech / clear) ──
  useLayoutEffect(() => {
    const div = divRef.current;
    if (!div) return;
    if (div.textContent === value) {
      measureHeight();
      return;
    }
    const caret = value.length;
    div.innerHTML = buildHTML(value, checkRef.current ?? (() => true));
    setCaretOffset(div, caret);
    measureHeight();
  }, [value, measureHeight]);

  // ── Re-highlight when dictionary loads ──
  useEffect(() => {
    const div = divRef.current;
    if (!div || !ready) return;
    const text = div.textContent || '';
    if (!text) return;
    const caret = getCaretOffset(div);
    div.innerHTML = buildHTML(text, check);
    setCaretOffset(div, caret);
  }, [ready, check]);

  const applySpellHighlight = useCallback((text) => {
    const div = divRef.current;
    if (!div) return;
    // Guard: user may have typed more during the debounce — don't corrupt their input
    if (div.textContent !== text) return;
    // Read caret NOW (current position), not the position saved 600ms ago
    const caret = getCaretOffset(div);
    const html = buildHTML(text, checkRef.current ?? (() => true));
    if (div.innerHTML !== html) {
      div.innerHTML = html;
      setCaretOffset(div, caret);
    }
  }, []);

  // ── Input handler ──
  const handleInput = useCallback((e) => {
    if (isComposingRef.current) return;
    const text = e.currentTarget.textContent || '';
    if (status === 'error') clearError();
    onChange(text);
    if (spellTimerRef.current) clearTimeout(spellTimerRef.current);
    // No caret saved here — applySpellHighlight reads it live when it fires
    spellTimerRef.current = setTimeout(() => applySpellHighlight(text), 600);
  }, [onChange, status, clearError, applySpellHighlight]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Enter bypasses the Search button's own disabled state, so re-check
      // here too — otherwise pressing Enter mid-search fires a duplicate request.
      if (loading) return;
      if (isListening) stopListening();
      onSearch();
    }
  }, [isListening, stopListening, onSearch, loading]);

  // Prevent rich-paste; keep plain text only
  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    sel.deleteFromDocument();
    const node = document.createTextNode(text);
    sel.getRangeAt(0).insertNode(node);
    sel.collapseToEnd();
    const div = divRef.current;
    const newText = div ? div.textContent : '';
    onChange(newText);
  }, [onChange]);

  // ── Right-click → custom suggestion menu (viewport-clamped) ──
  const handleContextMenu = useCallback((e) => {
    const target = e.target;
    if (target?.classList?.contains('sl-spell-error')) {
      e.preventDefault();
      const word = target.dataset.word || target.textContent;
      // Clamp menu to viewport — assume max height ~240px, width ~180px
      const x = Math.min(e.clientX, window.innerWidth - 188);
      const y = Math.min(e.clientY, window.innerHeight - 248);
      setCtxMenu({ x, y, word, suggestions: suggest(word), spanEl: target });
    }
  }, [suggest]);

  const applyCorrection = useCallback((correction) => {
    if (!ctxMenu?.spanEl) return;
    const div = divRef.current;
    if (!div) return;
    const node = document.createTextNode(correction);
    ctxMenu.spanEl.replaceWith(node);
    const newText = div.textContent || '';
    onChange(newText);

    // Compute caret offset right after the corrected word (walk text nodes)
    let caretPos = 0;
    const walker = document.createTreeWalker(div, NodeFilter.SHOW_TEXT);
    let curr = walker.nextNode();
    while (curr) {
      caretPos += curr.length;
      if (curr === node) break;
      curr = walker.nextNode();
    }

    setCtxMenu(null);
    // Rebuild highlights then restore caret after corrected word
    setTimeout(() => {
      const html = buildHTML(newText, checkRef.current ?? (() => true));
      if (div.innerHTML !== html) div.innerHTML = html;
      setCaretOffset(div, caretPos);
    }, 0);
  }, [ctxMenu, onChange]);

  // Close context menu on outside click or Escape.
  // Checks containment (rather than relying on a descendant's stopPropagation)
  // because the popup is portaled to <body> and this listener runs in the
  // capture phase — it would otherwise close the menu, and unmount its
  // buttons, before a click on a suggestion ever reaches that button's own
  // onClick handler.
  useEffect(() => {
    if (!ctxMenu) return;
    const close = (e) => {
      if (ctxMenuRef.current && ctxMenuRef.current.contains(e.target)) return;
      setCtxMenu(null);
    };
    const onKey = (e) => { if (e.key === 'Escape') setCtxMenu(null); };
    document.addEventListener('click', close, true);
    document.addEventListener('contextmenu', close, true);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('click', close, true);
      document.removeEventListener('contextmenu', close, true);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [ctxMenu]);

  useEffect(() => () => {
    if (spellTimerRef.current) clearTimeout(spellTimerRef.current);
  }, []);

  const handleMicClick = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const handleSearchClick = () => {
    if (loading) return; // duplicate-request guard — button is also natively disabled while loading
    if (isListening) stopListening();
    onSearch();
  };

  const micColor = isListening ? '#8fb329' : status === 'error' ? '#f87171' : '#6b7280';
  const inputActive = inputFocused || isListening;
  const isSearching = !!loading;
  // ~2 real lines' worth, measured off the actual calibrated single-line
  // height rather than an assumed constant — see oneLineHRef above.
  const isCompact = boxHeight <= oneLineHRef.current * 2.15;

  return (
    <>
      <div onContextMenu={handleContextMenu}>
        <div className="tw:flex tw:gap-3 tw:items-center">
          {/* Input with glow */}
          <div className="tw:flex-1 tw:relative">
            {/* Idle: no glow (clean border only). Focus/listening: soft static
                glow. Active search: slow pulse instead of a static glow,
                stops the instant the mutation settles (isSearching flips). */}
            <motion.div
              className="tw:absolute tw:-inset-[3px] tw:pointer-events-none"
              style={{
                background: 'rgba(154,202,60,0.14)',
                filter: 'blur(8px)',
                borderRadius: isCompact ? 9999 : 26,
                transition: 'border-radius 0.18s ease-in-out',
              }}
              animate={
                isSearching
                  ? { opacity: [0.35, 0.85, 0.35] }
                  : { opacity: inputActive ? 0.75 : 0 }
              }
              transition={
                isSearching
                  ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
                  : { duration: 0.2, ease: 'easeInOut' }
              }
            />
            <motion.div
              className="tw:relative tw:flex"
              style={{
                // Compact (≤2 lines): centered, full pill — matches the resting
                // search-bar look. Expanded (3+ lines): top-aligned rounded-rect
                // so icon/mic don't float mid-box as it grows.
                alignItems: isCompact ? 'center' : 'flex-start', // not itself animatable; height/radius tween covers the transition visually
                borderRadius: isCompact ? 9999 : 22,
                transition: 'border-radius 0.18s ease-in-out',
                background: 'rgba(255,255,255,0.04)',
                border: isSearching
                  ? '1px solid rgba(154,202,60,0.4)'
                  : isListening
                  ? '1px solid rgba(154,202,60,0.6)'
                  : inputFocused
                  ? '1px solid rgba(154,202,60,0.45)'
                  : '1px solid rgba(255,255,255,0.08)', // clean, minimal idle border
              }}
              animate={{
                boxShadow: isSearching
                  ? [
                      '0 0 0 2px rgba(154,202,60,0.06), 0 0 10px rgba(154,202,60,0.12)',
                      '0 0 0 2px rgba(154,202,60,0.12), 0 0 20px rgba(154,202,60,0.3)',
                      '0 0 0 2px rgba(154,202,60,0.06), 0 0 10px rgba(154,202,60,0.12)',
                    ]
                  : isListening
                  ? '0 0 0 2px rgba(154,202,60,0.08), 0 0 14px rgba(154,202,60,0.18)'
                  : inputFocused
                  ? '0 0 0 2px rgba(154,202,60,0.05), 0 0 10px rgba(154,202,60,0.1)'
                  : '0 0 0 0px rgba(154,202,60,0)',
              }}
              transition={
                isSearching
                  ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
                  : { duration: 0.2, ease: 'easeInOut' }
              }
            >
              {/* Sparkle icon — centered when compact; pinned to the first text
                  line's padding once the box has expanded past 2 lines */}
              <div
                className="tw:pl-5 tw:flex tw:items-center tw:pointer-events-none"
                style={{ paddingTop: isCompact ? 0 : 17, transition: 'padding-top 0.18s ease-in-out' }}
              >
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Sparkles className="tw:w-4.5 tw:h-4.5" style={{ color: '#8fb329' }} />
                </motion.div>
              </div>

              {/* Contenteditable search field — height is measured off scrollHeight
                  and animated explicitly (rather than left to CSS auto-sizing) so
                  growing/shrinking as the user types is a smooth tween, not a snap. */}
              <motion.div
                ref={divRef}
                className="sl-search-ce"
                contentEditable={!disabled}
                suppressContentEditableWarning
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                onCompositionStart={() => { isComposingRef.current = true; }}
                onCompositionEnd={(e) => { isComposingRef.current = false; handleInput(e); }}
                data-placeholder="Search for professional experience..."
                aria-label="semantic search"
                aria-multiline={true}
                role="textbox"
                initial={{ height: BOX_COMPACT_FALLBACK }}
                animate={{ height: boxHeight }}
                transition={{ duration: 0.18, ease: 'easeInOut' }}
                style={{
                  flex: 1,
                  minWidth: 0,
                  boxSizing: 'border-box',
                  padding: '14px 12px',
                  fontSize: '0.875rem',
                  color: '#e2e8f0',
                  caretColor: '#9ACA3C',
                  outline: 'none',
                  resize: 'none', // no manual resize handle
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'anywhere',
                  // Scrollbar only once content has actually hit the cap.
                  overflowY: boxHeight >= BOX_MAX_H ? 'auto' : 'hidden',
                  cursor: disabled ? 'not-allowed' : 'text',
                  userSelect: disabled ? 'none' : undefined,
                }}
              />

              {/* Enter hint + mic */}
              <div
                className="tw:pr-3 tw:flex tw:items-center tw:gap-2"
                style={{ paddingTop: isCompact ? 0 : 11, transition: 'padding-top 0.18s ease-in-out' }}
              >
                {isSupported && (
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isListening && (
                      <motion.div
                        style={{
                          position: 'absolute', width: 32, height: 32,
                          borderRadius: '50%', border: '1.5px solid rgba(143,179,41,0.55)',
                          pointerEvents: 'none',
                        }}
                        animate={{ scale: [1, 1.9], opacity: [0.7, 0] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
                      />
                    )}
                    <motion.button
                      type="button"
                      title={isListening ? 'Stop recording' : 'Click to speak'}
                      aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
                      onClick={handleMicClick}
                      onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                      disabled={disabled}
                      whileHover={disabled ? {} : { scale: 1.12 }}
                      whileTap={disabled ? {} : { scale: 0.88 }}
                      style={{
                        background: isListening ? 'rgba(143,179,41,0.12)' : 'transparent',
                        border: 'none', borderRadius: '50%',
                        width: 30, height: 30,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        color: micColor,
                        transition: 'color 0.2s ease, background 0.2s ease',
                        padding: 0, outline: 'none',
                      }}
                    >
                      <Mic style={{ width: 15, height: 15 }} />
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {showUploadFolder && (
            <>
              {uploadFolderName && (
                <span className="tw:text-xs tw:whitespace-nowrap" style={{ color: uploadFolderActive ? '#8fb329' : '#94a3b8' }}>
                  {uploadFolderName}
                </span>
              )}
              <IndigoButton
                onClick={onUploadFolderClick}
                style={uploadFolderActive ? {
                  borderRadius: 9999,
                  letterSpacing: '0.03em',
                  background: 'linear-gradient(135deg, #9ACA3C, #B3D335)',
                  boxShadow: '0 4px 24px rgba(154,202,60,0.3)',
                  border: 'none',
                } : {
                  borderRadius: 9999,
                  letterSpacing: '0.03em',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  boxShadow: 'none',
                }}
              >
                <FolderOpen className="tw:w-4 tw:h-4" />
                {uploadFolderProcessing ? 'Processing...' : 'Upload Folder'}
              </IndigoButton>
            </>
          )}

          <BrandButton
            onClick={handleSearchClick}
            disabled={(searchDisabled ?? disabled) || !value.trim()}
            loading={loading}
            loadingText="Searching..."
            style={{ borderRadius: 9999, letterSpacing: '0.03em' }}
            className="tw:px-8"
          >
            <Search className="tw:w-4 tw:h-4" />
            Search
          </BrandButton>

          {onAdvancedClick && (
            <IndigoButton
              onClick={onAdvancedClick}
              style={{ borderRadius: 9999, letterSpacing: '0.03em' }}
            >
              <Zap className="tw:w-4 tw:h-4" />
              Advanced
            </IndigoButton>
          )}
        </div>

        {/* Status row */}
        {(isListening || (status === 'error' && error)) && (
          <div className="tw:pl-6 tw:pt-1.5 tw:flex tw:items-center tw:gap-3">
            {isListening && (
              <>
                <motion.span
                  animate={{ opacity: [1, 0.45, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ fontSize: 12, color: '#8fb329' }}
                >
                  Listening...
                </motion.span>
                <span style={{ fontSize: 11, color: '#4b5563' }}>
                  Press Enter or click Search when done
                </span>
              </>
            )}
            {status === 'error' && error && (
              <span style={{ fontSize: 12, color: '#f87171' }}>{error}</span>
            )}
          </div>
        )}
      </div>

      {/* Spell-check context menu — portaled to <body> so it isn't clipped/mispositioned
          by an ancestor's transform (e.g. a Framer Motion wrapper) or overflow:hidden */}
      {ctxMenu && createPortal(
        <div
          ref={ctxMenuRef}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: ctxMenu.y,
            left: ctxMenu.x,
            zIndex: 9999,
            background: 'rgba(15,15,20,0.97)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            padding: '6px 0',
            minWidth: 170,
            boxShadow: '0 8px 32px rgba(0,0,0,0.65)',
            backdropFilter: 'blur(14px)',
          }}
        >
          <div style={{
            padding: '4px 14px 7px',
            fontSize: 10,
            color: '#4b5563',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 600,
          }}>
            "{ctxMenu.word}"
          </div>

          {ctxMenu.suggestions.length === 0 ? (
            <div style={{ padding: '6px 14px', fontSize: 13, color: '#6b7280', fontStyle: 'italic' }}>
              No suggestions
            </div>
          ) : (
            ctxMenu.suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => applyCorrection(s)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '8px 16px', fontSize: 13, color: '#e2e8f0',
                  background: 'transparent', border: 'none',
                  cursor: 'pointer', transition: 'background 0.12s',
                  fontWeight: i === 0 ? 600 : 400,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(143,179,41,0.13)'; e.currentTarget.style.color = '#B3D335'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#e2e8f0'; }}
              >
                {s}
              </button>
            ))
          )}

          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '5px 0' }} />
          <button
            onClick={() => setCtxMenu(null)}
            style={{
              display: 'block', width: '100%', textAlign: 'left',
              padding: '6px 16px', fontSize: 11, color: '#6b7280',
              background: 'transparent', border: 'none', cursor: 'pointer',
              letterSpacing: '0.04em',
            }}
          >
            Dismiss
          </button>
        </div>,
        document.body
      )}
    </>
  );
}
