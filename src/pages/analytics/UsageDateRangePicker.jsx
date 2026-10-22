import {useEffect, useId, useRef, useState} from 'react';
import {CalendarDays, ChevronLeft, ChevronRight} from 'lucide-react';
import {istDate} from '../../utils/aiUsagePeriods.js';
import {calendarMonthRange, calendarMonthWeeks, calendarYearRange, calendarYearPageStart, calendarYearPage} from '../../utils/usageCalendarRanges.js';

const DAY = 86400000;
const dateOf = value => new Date(`${value}T00:00:00Z`);
const iso = date => date.toISOString().slice(0, 10);
const format = (value, options) => dateOf(value).toLocaleDateString('en-GB', {...options, timeZone: 'UTC'}).replace(/\bSept\b/g, 'Sep');
const rangeLabel = value => format(value, {day: '2-digit', month: 'short', year: 'numeric'});
const monthOf = value => value.slice(0, 7);

export default function UsageDateRangePicker({from, to, onChange}) {
  const id = useId();
  const root = useRef(null), trigger = useRef(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('Range');
  const [yearStart, setYearStart] = useState(() => calendarYearPageStart(Number(istDate().slice(0, 4))));
  const lastSelection = useRef(null);
  const [anchor, setAnchor] = useState(null);
  const [hovered, setHovered] = useState(null);
  const [active, setActive] = useState(istDate());
  const [month, setMonth] = useState(monthOf(istDate()));
  const close = (restoreFocus = true) => {
    setOpen(false); setAnchor(null); setHovered(null);
    if (restoreFocus) trigger.current?.focus();
  };
  useEffect(() => {
    if (!open) return;
    const outside = event => {
      if (!root.current?.contains(event.target)) {
        setOpen(false); setAnchor(null); setHovered(null);
      }
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  useEffect(() => {
    if (open && mode === 'Range') root.current?.querySelector(`[data-date="${active}"]`)?.focus();
  }, [open, active, month, mode]);
  const toggle = () => {
    if (open) {close(); return;}
    const initial = Number.isFinite(+dateOf(from)) ? from : istDate();
    const saved = lastSelection.current;
    const nextMonth = saved?.from === from && saved?.to === to ? saved.month : monthOf(initial);
    setActive(initial); setMonth(nextMonth); setYearStart(calendarYearPageStart(Number(nextMonth.slice(0, 4))));
    setAnchor(null); setHovered(null); setOpen(true);
  };
  const commit = (range, selectedMonth = month) => {
    setMonth(selectedMonth);
    lastSelection.current = {...range, month: selectedMonth};
    onChange(range); close();
  };
  const changeMode = value => {
    setMode(value); setAnchor(null); setHovered(null);
    if (value === 'Range' && monthOf(active) !== month) setActive(`${month}-01`);
    if (value === 'Year') setYearStart(calendarYearPageStart(Number(month.slice(0, 4))));
  };
  const tooLong = value => anchor && Math.abs(+dateOf(value) - +dateOf(anchor)) / DAY >= 731;
  const choose = value => {
    if (tooLong(value)) return;
    if (!anchor) {setAnchor(value); setHovered(null); setActive(value); return;}
    commit({from: value < anchor ? value : anchor, to: value < anchor ? anchor : value});
  };
  const moveMonth = amount => {
    const index = (Number(month.slice(0, 4)) - 1) * 12 + Number(month.slice(5, 7)) - 1 + amount;
    if (index < 0 || index >= 9999 * 12) return;
    const range = calendarMonthRange(Math.floor(index / 12) + 1, index % 12);
    setMonth(monthOf(range.from)); setActive(range.from); setHovered(null);
  };
  const keyboard = (event, value) => {
    const day = dateOf(value), weekday = (day.getUTCDay() + 6) % 7;
    const offsets = {ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, Home: -weekday, End: 6 - weekday};
    if (event.key === 'PageUp' || event.key === 'PageDown') {
      event.preventDefault(); moveMonth((event.key === 'PageUp' ? -1 : 1) * (event.shiftKey ? 12 : 1)); return;
    }
    if (!(event.key in offsets)) return;
    event.preventDefault();
    const next = iso(new Date(+day + offsets[event.key] * DAY));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(next) || next < '0001-01-01') return;
    setActive(next); setMonth(monthOf(next)); setHovered(next);
  };
  const first = dateOf(`${month}-01`);
  const offset = (first.getUTCDay() + 6) % 7;
  const days = Number(calendarMonthRange(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1).to.slice(8, 10));
  const preview = hovered && !tooLong(hovered) ? hovered : anchor;
  const start = anchor ? (preview < anchor ? preview : anchor) : from;
  const end = anchor ? (preview > anchor ? preview : anchor) : to;

  const year = Number(month.slice(0, 4));
  const navigationUnit = mode === 'Year' ? 'year range' : mode === 'Month' ? 'year' : 'month';
  const navigate = direction => {
    if (mode === 'Year') setYearStart(current => Math.max(1, Math.min(9988, current + direction * 12)));
    else moveMonth(direction * (mode === 'Month' ? 12 : 1));
  };
  const atFirst = mode === 'Year' ? yearStart === 1 : mode === 'Month' ? year === 1 : month === '0001-01';
  const atLast = mode === 'Year' ? yearStart === 9988 : mode === 'Month' ? year === 9999 : month === '9999-12';
  const heading = mode === 'Year' ? `${yearStart} – ${yearStart + 11}` : mode === 'Month' ? String(year) : format(`${month}-01`, {month: 'long', year: 'numeric'});
  const hint = mode === 'Range' ? (anchor ? 'Select end date · maximum 731 days' : 'Select start date, then end date') : mode === 'Week' ? 'Select a Monday–Sunday week' : mode === 'Month' ? 'Select a month' : 'Select a year';
  const weekOptions = mode === 'Week' ? calendarMonthWeeks(month) : [];
  const gridKeyboard = event => {
    if (mode === 'Range') return;
    if (event.key === 'PageUp' || event.key === 'PageDown') {
      event.preventDefault(); navigate(event.key === 'PageUp' ? -1 : 1); return;
    }
    const buttons = [...event.currentTarget.querySelectorAll('[data-calendar-option]:not(:disabled)')];
    const current = buttons.indexOf(event.target);
    if (current < 0) return;
    const columns = mode === 'Week' ? 1 : 3;
    const offsets = {ArrowLeft: -1, ArrowRight: 1, ArrowUp: -columns, ArrowDown: columns};
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : event.key in offsets ? current + offsets[event.key] : null;
    if (next == null) return;
    event.preventDefault(); buttons[Math.max(0, Math.min(buttons.length - 1, next))]?.focus();
  };

  return <div className="usage-range-picker" ref={root} onBlur={event => {
    if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) close(false);
  }} onKeyDown={event => {
    if (event.key === 'Escape' && open) {event.preventDefault(); event.stopPropagation(); close();}
  }}>
    <span className="usage-range-label tw:text-gray-300" id={`${id}-label`}>Chart date range</span>
    <button type="button" className="usage-range-trigger tw:text-gray-200" ref={trigger} aria-labelledby={`${id}-label ${id}-value`} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? `${id}-popup` : undefined} onClick={toggle}>
      <span id={`${id}-value`}>{rangeLabel(from)} – {rangeLabel(to)}</span><CalendarDays size={18} aria-hidden="true"/>
    </button>
    {open && <div className="usage-range-popup" id={`${id}-popup`} role="dialog" aria-label="Choose chart date range" aria-describedby={`${id}-hint`}>
      <div className="usage-range-modes" role="group" aria-label="Calendar selection mode">
        {['Range', 'Week', 'Month', 'Year'].map(value => <button type="button" key={value} aria-pressed={mode === value} onClick={() => changeMode(value)}>{value}</button>)}
      </div>
      <div className="usage-range-month">
        <button type="button" aria-label={`Previous ${navigationUnit}`} disabled={atFirst} onClick={() => navigate(-1)}><ChevronLeft size={18}/></button>
        <strong className="tw:text-gray-100" aria-live="polite">{heading}</strong>
        <button type="button" aria-label={`Next ${navigationUnit}`} disabled={atLast} onClick={() => navigate(1)}><ChevronRight size={18}/></button>
      </div>
      <p id={`${id}-hint`} className="usage-range-hint tw:text-gray-400" aria-live="polite">{hint}</p>
      <div className="usage-range-panel" onKeyDown={gridKeyboard}>
      {mode === 'Range' && <>
      <div className="usage-range-weekdays tw:text-gray-300" aria-hidden="true">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => <span key={day}>{day}</span>)}</div>
      <div className="usage-range-days" role="group" aria-label={format(`${month}-01`, {month: 'long', year: 'numeric'})} onMouseLeave={() => setHovered(null)}>
        {Array.from({length: offset}, (_, i) => <span key={`empty-${i}`}/>)}
        {Array.from({length: days}, (_, i) => {
          const value = `${month}-${String(i + 1).padStart(2, '0')}`;
          const selected = value >= start && value <= end;
          const endpoint = value === start || value === end;
          const disabled = Boolean(tooLong(value));
          return <button type="button" key={value} data-date={value} className={`usage-range-day tw:text-gray-200${selected ? ' is-in-range' : ''}${endpoint ? ' is-endpoint' : ''}${value === istDate() ? ' is-today' : ''}`} aria-label={format(value, {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})} aria-pressed={selected} aria-current={value === istDate() ? 'date' : undefined} aria-disabled={disabled} tabIndex={active === value ? 0 : -1} onFocus={() => setActive(value)} onKeyDown={event => keyboard(event, value)} onMouseEnter={() => setHovered(value)} onClick={() => choose(value)}>{i + 1}</button>;
        })}
      </div>
      </>}
      {mode === 'Week' && <div className="usage-range-week-options" role="group" aria-label={`Weeks in ${heading}`}>
        {weekOptions.map((range, index) => {
          const supported = /^\d{4}-\d{2}-\d{2}$/.test(range.from) && /^\d{4}-\d{2}-\d{2}$/.test(range.to);
          const label = value => format(value, {weekday: 'short', day: 'numeric', month: 'short'});
          return <button type="button" key={range.from} data-calendar-option="week" data-from={range.from} data-to={range.to} disabled={!supported} aria-pressed={from === range.from && to === range.to} onClick={() => commit(range)}><span>Week {index + 1}</span><span>{label(range.from)} – {label(range.to)}</span></button>;
        })}
      </div>}
      {mode === 'Month' && <div className="usage-range-option-grid" role="group" aria-label={`Months of ${year}`}>
        {Array.from({length: 12}, (_, index) => {
          const range = calendarMonthRange(year, index);
          return <button type="button" key={range.from} data-calendar-option="month" aria-pressed={from.slice(0, 7) === range.from.slice(0, 7)} onClick={() => commit(range, monthOf(range.from))}>{format(range.from, {month: 'long'})}</button>;
        })}
      </div>}
      {mode === 'Year' && <div className="usage-range-option-grid" role="group" aria-label="Years">
        {calendarYearPage(yearStart).map(value => <button type="button" key={value} data-calendar-option="year" aria-pressed={Number(from.slice(0, 4)) === value} aria-current={Number(istDate().slice(0, 4)) === value ? 'date' : undefined} onClick={() => {
          const range = calendarYearRange(value);
          commit(range, monthOf(range.from));
        }}>{value}</button>)}
      </div>}
      </div>
    </div>}
  </div>;
}
