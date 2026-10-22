import {useEffect, useState} from 'react';
import {useSearchParams} from 'react-router';
import {useQuery} from '@tanstack/react-query';
import {UserRound, UsersRound, ChartNoAxesColumnIncreasing, DollarSign, IndianRupee} from 'lucide-react';
import {ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend} from 'recharts';
import {getJSON} from '../../api/fetch-helpers';
import {completeTokenTotal} from '../../utils/aiUsageTotals';
import {USAGE_PRESETS, usagePeriodRange} from '../../utils/aiUsagePeriods.js';
import './AdminAIUsageDashboard.css';
import UsageDateRangePicker from './UsageDateRangePicker.jsx';
import {usageViewSelection, fetchUsageView, aggregateUsageChart, sumUsageAmounts, usageChartRange, todayUsageSummary} from '../../utils/aiUsageChart.js';

export const weekRange = (now = new Date()) => usagePeriodRange('Weekly', now);
export const completeSum = (a, b) => a == null || b == null || a === '' || b === '' || !Number.isFinite(Number(a)) || !Number.isFinite(Number(b)) ? null : Number(a) + Number(b);
const number = value => value == null ? 'Unknown' : Number(value).toLocaleString('en-IN');
const money = (value, currency) => value == null ? 'Unknown' : new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {style: 'currency', currency, maximumFractionDigits: 4}).format(value);

function Metric({title, value, icon: Icon, tone, tokens}) {
  return <section className={`usage-metric usage-${tone}`}><div className="usage-icon"><Icon size={34} strokeWidth={2.5}/></div><div className="usage-metric-content"><h2>{title}</h2><strong>{value}</strong>{tokens && <span className="tw:text-gray-300">Tokens</span>}</div></section>;
}
function useUsageReport(companyId, selection, allowed) {
  const {from, to, period} = selection;
  const validRange = Number.isFinite(Date.parse(from)) && Number.isFinite(Date.parse(to)) && from <= to && (Date.parse(to) - Date.parse(from)) / 86400000 < (period === 'Yearly' ? 2558 : 731);
  const grouping = period === 'Yearly' ? 'monthly' : 'daily';
  return useQuery({
    queryKey: ['ai-dashboard', 'admin', 'combined-external-ist', companyId, from, to, grouping],
    enabled: allowed && validRange, refetchOnMount: 'always', staleTime: 0, refetchInterval: 30000, retry: 1,
    queryFn: ({signal}) => fetchUsageView(getJSON, selection, companyId, AbortSignal.any([signal, AbortSignal.timeout(15000)])),
  });
}
function UsageAxisTick({x, y, payload, buckets, compact, fontSize, vertical}) {
  const bucket = buckets.find(item => item.key === payload.value);
  if (!bucket) return null;
  const lines = compact ? bucket.compact : bucket.lines;
  return <text x={vertical ? 0 : x} y={vertical ? 0 : y} transform={vertical ? `translate(${x},${y + 8}) rotate(-90)` : undefined} fill="#9ca3af" textAnchor={vertical ? 'end' : 'middle'} fontSize={fontSize}>
    {lines.map((line, index) => <tspan key={index} x={vertical ? 0 : x} dy={index === 0 ? (vertical ? 0 : 14) : fontSize + 3}>{line}</tspan>)}
  </text>;
}
export default function AdminAIUsageDashboard() {
  const [params, setParams] = useSearchParams();
  const [selection, setSelection] = useState(() => usageViewSelection(params));
  const [chartWidth, setChartWidth] = useState(1000);
  const {from, to, period: preset, source} = selection;
  // One authoritative selection drives calendar, summary, query, and chart.
  useEffect(() => {
    if (params.get('from') === from && params.get('to') === to && params.get('chart_range') === source && params.get('period') === preset) return;
    const updated = new URLSearchParams(params);
    updated.set('from', from); updated.set('to', to); updated.set('chart_range', source); updated.set('period', preset);
    setParams(updated, {replace: true});
  }, [from, to, source, preset, params, setParams]);
  useEffect(() => {
    const update = () => {
      setSelection(current => {
        if (current.source === 'custom') return current;
        const range = usageChartRange(current.period);
        return current.from === range.from && current.to === range.to ? current : {...current, ...range};
      });
    };
    const timer = window.setInterval(update, 30000);
    const restore = () => setSelection(usageViewSelection(new URLSearchParams(window.location.search)));
    window.addEventListener('focus', update);
    window.addEventListener('popstate', restore);
    return () => {window.clearInterval(timer); window.removeEventListener('focus', update); window.removeEventListener('popstate', restore);};
  }, []);
  const changeRange = next => {
    setSelection({...next, source: 'custom', period: 'Custom Range'});
    const updated = new URLSearchParams(params);
    updated.set('from', next.from); updated.set('to', next.to); updated.set('chart_range', 'custom'); updated.set('period', 'Custom Range'); setParams(updated);
  };
  const changePreset = value => {
    if (!USAGE_PRESETS.includes(value)) return;
    const range = usageChartRange(value);
    setSelection({...range, source: 'period', period: value});
    const updated = new URLSearchParams(params);
    updated.set('from', range.from); updated.set('to', range.to); updated.set('chart_range', 'period'); updated.set('period', value); setParams(updated);
  };
  const companies = useQuery({queryKey: ['ai-companies', 'admin'], queryFn: () => getJSON('/ai-usage/companies')});
  const companyId = params.get('company_id');
  const company = companies.data?.find(item => String(item.id) === companyId);
  const allowed = companies.isSuccess && (!companyId || Boolean(company));
  const validRange = Number.isFinite(Date.parse(from)) && Number.isFinite(Date.parse(to)) && from <= to && (Date.parse(to) - Date.parse(from)) / 86400000 < (preset === 'Yearly' ? 2558 : 731);
  const report = useUsageReport(companyId, selection, allowed);
  const data = allowed && validRange && !report.isError ? report.data : undefined;
  const loading = companies.isLoading || (allowed && validRange && report.isPending);
  const summaryData = data && preset === 'Today' ? todayUsageSummary(data) : data;
  const adminTokens = completeTokenTotal(summaryData?.admin.totals), clientTokens = completeTokenTotal(summaryData?.client.totals);
  const tokenSum = completeSum(adminTokens, clientTokens);
  const tokens = Number.isSafeInteger(tokenSum) ? tokenSum : null;
  const usd = sumUsageAmounts([summaryData?.admin.totals.total_cost_usd, summaryData?.client.totals.total_cost_usd]);
  const inr = sumUsageAmounts([summaryData?.admin.totals.total_cost_inr, summaryData?.client.totals.total_cost_inr]);
  const name = company?.name || (companyId ? 'Company unavailable' : 'All Companies');
  const employees = companyId ? company?.total_employees : companies.data?.every(item => item.total_employees != null) ? companies.data.reduce((sum, item) => sum + Number(item.total_employees), 0) : null;
  const chart = data ? aggregateUsageChart(selection, data) : [];
  const compact = chartWidth < 600;
  const monthlyBuckets = preset === 'Monthly';
  const vertical = compact && monthlyBuckets;
  const weeklyBuckets = preset === 'Weekly';
  const fontSize = compact ? (weeklyBuckets ? 8 : 10) : 12;
  const axisHeight = vertical ? 44 : weeklyBuckets ? (compact ? 66 : 46) : compact ? 54 : 30;
  const shown = value => loading ? 'Loading…' : number(value);
  return <main className="admin-ai-usage tw:text-gray-200">
    <header className="usage-toolbar"><h1 className="tw:text-white">AI Usage &amp; Cost Dashboard</h1><div className="usage-filters">
      <label className="tw:text-gray-300">Client<select aria-label="Client" value={companyId || ''} onChange={event => {const next = new URLSearchParams(params); event.target.value ? next.set('company_id', event.target.value) : next.delete('company_id'); setParams(next);}}><option value="">All Clients</option>{companies.data?.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <UsageDateRangePicker from={from} to={to} onChange={changeRange}/>
      <select aria-label="Time period" value={preset} onChange={event => changePreset(event.target.value)}>
        {preset === 'Custom Range' && <option value="Custom Range" disabled>Custom Range</option>}
        {USAGE_PRESETS.map(option => <option key={option} value={option}>{option}</option>)}
      </select>
    </div></header>
    {(companies.error || report.error) && <p role="alert" className="alert alert-danger">{(companies.error || report.error).message || 'Usage unavailable.'}</p>}
    {!validRange && <p role="alert">Choose valid dates, maximum 731 days.</p>}
    {companies.isSuccess && !allowed && <p role="alert">Selected company is unavailable or unauthorized.</p>}
    <div className="usage-summary" aria-busy={loading}>
      <section className="usage-company"><div><h2>Client Name</h2><strong title={name}>{name}</strong><h3>Total Employees</h3><strong>{companies.isLoading ? 'Loading…' : number(employees)}</strong></div></section>
      <div className="usage-tokens">
        <Metric title="Admin Token Usage" value={shown(adminTokens)} icon={UserRound} tone="blue" tokens/>
        <Metric title="Client Token Usage" value={shown(clientTokens)} icon={UsersRound} tone="green" tokens/>
        <Metric title="Total Token Usage" value={shown(tokens)} icon={ChartNoAxesColumnIncreasing} tone="pink" tokens/>
      </div>
      <div className="usage-costs">
        <Metric title="AI Cost (USD $)" value={loading ? 'Loading…' : money(usd, 'USD')} icon={DollarSign} tone="yellow"/>
        <Metric title="AI Cost (INR ₹)" value={loading ? 'Loading…' : money(inr, 'INR')} icon={IndianRupee} tone="purple"/>
      </div>
    </div>
    <section className="usage-chart" aria-busy={loading}><h2>AI USAGE COST</h2>
      <div className="usage-chart-scroll" role="region" aria-label="AI usage costs" tabIndex={0}><div className="usage-chart-stage" style={{height: 300, minWidth: 0}}><ResponsiveContainer width="100%" height="100%" onResize={width => setChartWidth(width)}><LineChart data={chart} margin={{top: 16, right: 12, bottom: 8, left: 8}}>
        <CartesianGrid stroke="#26364a" strokeDasharray="4 4"/>
        <XAxis dataKey="key" interval={preset === 'Custom Range' ? 'preserveStartEnd' : 0} minTickGap={12} height={axisHeight} padding={{left: compact ? (monthlyBuckets ? 0 : weeklyBuckets ? 4 : 12) : 50, right: compact ? (monthlyBuckets ? 0 : weeklyBuckets ? 4 : 12) : 50}} tick={<UsageAxisTick buckets={chart} compact={compact} fontSize={fontSize} vertical={vertical}/>}/>
        <YAxis yAxisId="usd" tick={{fill: '#9ca3af'}} tickFormatter={value => `$${value}`}/>
        <YAxis yAxisId="inr" orientation="right" tick={{fill: '#9ca3af'}} tickFormatter={value => `₹${value}`}/>
        <Tooltip filterNull={false} labelFormatter={value => chart.find(bucket => bucket.key === value)?.tooltip || value} formatter={(value, label, item) => [money(item?.payload?.[label === 'USD ($)' ? 'usdExact' : 'inrExact'] ?? value, label === 'USD ($)' ? 'USD' : 'INR'), label]} contentStyle={{background: '#0d1b2b', borderColor:'#334155',color:'#f3f4f6'}}/>
        <Legend/><Line yAxisId="usd" dataKey="usd" name="USD ($)" stroke="#7c7cf8" strokeWidth={2} dot={chart.length === 1} connectNulls={false}/><Line yAxisId="inr" dataKey="inr" name="INR (₹)" stroke="#B3D335" strokeWidth={2} dot={chart.length === 1} connectNulls={false}/>
      </LineChart></ResponsiveContainer>
      {loading ? <p role="status" className="usage-chart-status tw:text-gray-300">Loading company usage...</p> : data && report.isFetching && <p role="status" className="usage-chart-status tw:text-gray-400">Updating usage...</p>}
      </div></div>
      <p className="usage-note tw:text-gray-400">{name}</p>
    </section>
  </main>;
}
