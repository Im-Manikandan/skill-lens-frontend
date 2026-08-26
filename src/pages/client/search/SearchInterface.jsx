'use client';

// Imports
import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, CheckCircle, AlertCircle, AlertTriangle, Sparkles, Layers, GitBranch, BookOpen, Zap, ChevronDown, ChevronUp, Download, Users, Building2, FolderOpen } from 'lucide-react';
import SearchInput from './components/SearchInput.jsx';
import { Row, Col, Spinner, Alert } from 'reactstrap';
import { Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { decompressFflate, compressFflate } from '@devopsthink/react-security-util';
import TimelineItem from '../../../components/TimelineItem.jsx';
import SearchFiltersPanel from '../../../components/SearchFiltersPanel.jsx';
import AdvancedOptions from '../../../components/AdvancedOptions.jsx';
import IndigoButton from '../../../components/buttons/IndigoButton.jsx';
import SearchResultsDashboard from '../../../components/visualizations/SearchResultsDashboard.jsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SearchController from "../../../api/search/search-controller.jsx";
import FrameworksController from "../../../api/admin/frameworks-controller.jsx";
import DimensionConfigController from "../../../api/admin/dimension-config-controller.jsx";
import ProfilesController from "../../../api/admin/profiles-controller.jsx";
import HCMUpdateBanner from '../../../components/HCMUpdateBanner.jsx';
import useMyClients from '../../../hooks/query/useMyClients.jsx';
import useDebouncedTrue from '../../../hooks/useDebouncedTrue.js';
import useResumeProcessing from './hooks/useResumeProcessing.js';
import ResumeProcessingModal from './components/ResumeProcessingModal.jsx';
import UploadFolderConfirmModal from './components/UploadFolderConfirmModal.jsx';
import UploadSelector from './components/UploadSelector.jsx';
import { setClientInfo, setAccessMap } from '../../../store/apps/client/ClientInfoSlice.js';

const darkSelectTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#8fb329' },
    background: { paper: '#1a1a2e' },
  },
  components: {
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: '10px' } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
  },
});

/* ── Animated helpers ── */

const FloatingOrb = ({ x, y, size, color, delay }) => (
  <motion.div
    style={{
      position: 'absolute', left: x, top: y, width: size, height: size,
      borderRadius: '50%',
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      filter: 'blur(1px)', pointerEvents: 'none',
    }}
    animate={{ y: [0, -20, 0], x: [0, 10, 0], scale: [1, 1.1, 1] }}
    transition={{ duration: 6 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
  />
);

const PulseRing = ({ delay = 0, size = 300, color = 'rgba(143,179,41,0.08)' }) => (
  <motion.div
    style={{
      position: 'absolute', width: size, height: size,
      borderRadius: '50%', border: `1px solid ${color}`,
    }}
    animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
    transition={{ duration: 4, repeat: Infinity, delay, ease: 'easeOut' }}
  />
);

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

// Skeleton placeholder for a result card — keeps the results area from going
// blank while a search is in flight, and fades into real results on completion.
const SkeletonResultCard = ({ index }) => (
  <motion.div
    className="tw:rounded-xl tw:p-4"
    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2, ease: 'easeInOut', delay: index * 0.05 }}
  >
    <div className="tw:flex tw:items-center tw:gap-3">
      <motion.div
        style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }}
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: index * 0.1 }}
      />
      <div className="tw:flex-1 tw:space-y-2">
        <motion.div
          style={{ height: 10, width: '35%', borderRadius: 6, background: 'rgba(255,255,255,0.08)' }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: index * 0.1 }}
        />
        <motion.div
          style={{ height: 8, width: '60%', borderRadius: 6, background: 'rgba(255,255,255,0.05)' }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut', delay: index * 0.1 + 0.15 }}
        />
      </div>
    </div>
  </motion.div>
);

export default function SearchInterface() {
  // Redux State — Client info
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const compressedClientInfo = useSelector((state) => state.clientInfo.clientInfo);
  const clientInfo = compressedClientInfo
    ? JSON.parse(decompressFflate(compressedClientInfo))
    : null;
  const selectedClientId = clientInfo?.client_id ?? null;
  const clientName = clientInfo?.client_name ?? '';
  const clientCode = clientInfo?.client_code ?? '';
  const selectedIndustryId = clientInfo?.industry_id ?? null;

  // Resync stale clientInfo — persisted client data (industry_id, plan, etc.)
  // can drift out of date if it changed server-side since the user last picked
  // this workspace, since redux-persist never re-fetches it on its own.
  const { data: myClients, refetch: refetchMyClients } = useMyClients();
  useEffect(() => {
    if (!myClients || selectedClientId === null) return;
    const freshClient = myClients.find((c) => c.client_id === selectedClientId);
    if (!freshClient) return;
    if (JSON.stringify(freshClient) === JSON.stringify(clientInfo)) return;

    const accessMap = (freshClient.access_list ?? []).reduce((acc, item) => {
      if (item?.access_name) acc[item.access_name] = item;
      return acc;
    }, {});
    dispatch(setClientInfo(compressFflate(JSON.stringify(freshClient))));
    dispatch(setAccessMap(accessMap));
  }, [myClients, selectedClientId]);

  // Local State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('skill_framework');
  const [searchMode, setSearchMode] = useState('talent');
  // Tracks which mode the currently-displayed searchResults belong to, so a
  // response for a mode the user has since switched away from never renders.
  const [resultsMode, setResultsMode] = useState(null);
  const searchModeRef = useRef(searchMode);
  useEffect(() => { searchModeRef.current = searchMode; }, [searchMode]);
  const folderInputRef = useRef(null);
  const resumeProcessing = useResumeProcessing();
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [pendingUpload, setPendingUpload] = useState(null); // { files, folderLabel } staged before user confirms
  const [folderValidationError, setFolderValidationError] = useState(null);

  const uploadFolderName = resumeProcessing.folderName;
  const uploadFolderActive = resumeProcessing.status !== null;
  // Search may only run against resumes whose JSON has finished generating.
  const recruitmentLocked = searchMode === 'recruitment' && (uploadFolderActive
    ? !resumeProcessing.isComplete
    : false);

  // Upload selector — persisted batches loaded from the DB (every folder
  // upload creates a new batch row there and is never overwritten). "All
  // Profiles" (default) applies no batch filter; individual picks scope
  // search to just those batch_ids. batch_id is used for filtering only —
  // never rendered in the UI (display_name / folder name is shown instead).
  const [allProfilesSelected, setAllProfilesSelected] = useState(true);
  const [selectedBatchIds, setSelectedBatchIds] = useState([]);

  const { data: persistedBatches } = useQuery({
    queryKey: ['recruitment-batches', selectedClientId, selectedIndustryId],
    queryFn: () => ProfilesController.listBatches(selectedClientId, { source: 'recruitment', industryId: selectedIndustryId }),
    enabled: selectedClientId !== null && selectedIndustryId !== null,
    staleTime: 0,
  });

  // Merge DB-persisted batches with the in-flight (this-tab-only) job that
  // hasn't finished uploading yet, so its "processing…" row shows up
  // immediately without waiting on a refetch.
  const mergedBatches = (() => {
    const map = new Map();
    (persistedBatches || []).forEach((b) => {
      map.set(b.batch_id, {
        batchId: b.batch_id, label: b.display_name, profileCount: b.profile_count,
        status: 'completed', uploadedAt: b.uploaded_at,
      });
    });
    resumeProcessing.batches.forEach((b) => {
      if (map.has(b.jobId)) {
        if (b.status !== 'completed') map.set(b.jobId, { ...map.get(b.jobId), status: b.status });
        return;
      }
      map.set(b.jobId, { batchId: b.jobId, label: b.label, profileCount: b.profileCount, status: b.status });
    });
    return Array.from(map.values());
  })();

  const completedBatches = mergedBatches.filter((b) => b.status === 'completed');
  const totalProfileCount = completedBatches.reduce((sum, b) => sum + (b.profileCount || 0), 0);
  const hasAnySelection = allProfilesSelected
    ? completedBatches.length > 0
    : selectedBatchIds.some((id) => completedBatches.some((b) => b.batchId === id));
  // undefined (no filter) when "All Profiles" is selected — the backend
  // should never receive an explicit full batch_ids list for that case.
  const activeJobIds = allProfilesSelected
    ? []
    : selectedBatchIds.filter((id) => completedBatches.some((b) => b.batchId === id));
  const selectedBatchProfileCount = allProfilesSelected
    ? totalProfileCount
    : selectedBatchIds.reduce((sum, id) => sum + (completedBatches.find((b) => b.batchId === id)?.profileCount || 0), 0);

  const clearResultsState = () => {
    setSearchResults([]);
    setResultsMode(null);
    setHasSearched(false);
    setExpandedProfileId(null);
  };

  const handleSelectAllProfiles = () => {
    setAllProfilesSelected(true);
    setSelectedBatchIds([]);
    clearResultsState();
  };

  const handleToggleBatch = (batchId) => {
    setAllProfilesSelected(false);
    setSelectedBatchIds((prev) => (prev.includes(batchId) ? prev.filter((id) => id !== batchId) : [...prev, batchId]));
    clearResultsState();
  };

  const deleteBatchMutation = useMutation({
    mutationFn: (batchId) => ProfilesController.deleteBatch(selectedClientId, batchId),
    onSuccess: (_data, batchId) => {
      queryClient.invalidateQueries({ queryKey: ['recruitment-batches', selectedClientId, selectedIndustryId] });
      setSelectedBatchIds((prev) => prev.filter((id) => id !== batchId));
      clearResultsState();
    },
  });
  const handleDeleteBatch = (batchId) => deleteBatchMutation.mutate(batchId);

  // After a folder upload finishes, refresh the persisted batch list and
  // auto-select the newly created batch so only its profiles show.
  const autoSelectedJobRef = useRef(null);
  useEffect(() => {
    if (!resumeProcessing.isComplete || !resumeProcessing.jobId) return;
    if (autoSelectedJobRef.current === resumeProcessing.jobId) return;
    autoSelectedJobRef.current = resumeProcessing.jobId;
    queryClient.invalidateQueries({ queryKey: ['recruitment-batches', selectedClientId, selectedIndustryId] });
    setAllProfilesSelected(false);
    setSelectedBatchIds([resumeProcessing.jobId]);
    clearResultsState();
  }, [resumeProcessing.isComplete, resumeProcessing.jobId, selectedClientId, selectedIndustryId, queryClient]);

  const handleUploadFolderClick = () => {
    // Always open the real native picker — the demo dataset (when active)
    // still drives what gets "processed", but the user must see a real
    // folder selection dialog, not a silent auto-trigger.
    folderInputRef.current?.click();
  };

  const handleFolderSelect = (e) => {
    // e.target.files is a live FileList tied to the input element — clearing
    // e.target.value below (needed so re-picking the same folder still fires
    // onChange) empties that same FileList in place. Copy to a plain array
    // now, or pendingUpload.files silently becomes length 0 by confirm time.
    const allFiles = Array.from(e.target.files || []);
    // webkitdirectory selects every file in the folder tree (images, .DS_Store,
    // lockfiles, ...) — only PDF/DOCX (resumes) and JSON (pre-built profiles)
    // are actually processable. Mixed folders: keep the supported ones, drop
    // the rest silently — that part isn't an error.
    const files = allFiles.filter((f) => /\.(pdf|docx|json)$/i.test(f.name));
    if (files.length > 0) {
      setFolderValidationError(null);
      const path = files[0].webkitRelativePath || files[0].name;
      const folderLabel = path.split('/')[0];
      // Stage the pick behind our own branded confirmation instead of
      // starting the job immediately — the browser's native "Upload a file
      // to this site?" prompt (unavoidable, fires before this handler ever
      // runs) isn't ours to restyle, but everything downstream of it is.
      setPendingUpload({ files, folderLabel, fileCount: files.length });
    } else if (allFiles.length > 0) {
      // A folder was picked and it had files, just none of the supported
      // types — distinct from the user cancelling the native picker (which
      // also reports 0 files, but allFiles.length would be 0 there too, so
      // this branch never fires for a plain cancel).
      setFolderValidationError('No supported resume or JSON profile files were found in the selected folder.');
    }
    e.target.value = '';
  };

  const handleConfirmUpload = () => {
    if (!pendingUpload) return;
    const { files, folderLabel } = pendingUpload;
    // Process exactly what the user picked — count and file names must match
    // the real folder, not a fixed demo count. Each file is parsed via the
    // backend's OpenAI integration (uploadResumeFolder → parseResume per file).
    resumeProcessing.start({
      files,
      clientId: selectedClientId,
      industryId: selectedIndustryId,
      frameworkContext: skillFrameworkState,
      folderLabel,
    });
    setPendingUpload(null);
    setShowProcessingModal(true);
    setSearchResults([]);
    setResultsMode(null);
    setHasSearched(false);
  };

  const handleCancelUpload = () => setPendingUpload(null);
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [expandedProfileId, setExpandedProfileId] = useState(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [dashboardCollapsed, setDashboardCollapsed] = useState(true);
  const [activePreset, setActivePreset] = useState('balanced');
  // null → backend auto-loads from active dimension config for this client.
  // After user adjusts sliders: dim-key dict { [dim.key]: weight } (or legacy 4-key if no config).
  const [searchWeights, setSearchWeights] = useState(null);

  // Reset weights when client switches to prevent cross-mode contamination
  useEffect(() => {
    setSearchWeights(null);
  }, [selectedClientId]);
  const [filtersModified] = useState(false);
  const [skillFrameworkState, setSkillFrameworkState] = useState({
    selectedSkillFamily: '',
    selectedSkillGroup: '',
    selectedCompetency: '',
    skill_families: [],
    skill_groups: [],
    competencies: [],
    loading: false
  });

  // Data Fetching — Available filters
  const { data: availableFilters } = useQuery({
    queryKey: ['filters'],
    queryFn: () => SearchController.getAvailableFilters(),
    staleTime: 5 * 60 * 1000,
  });

  // Data Fetching — Dimension config (drives tab order)
  const { data: dimConfig } = useQuery({
    queryKey: ['dimConfig', selectedClientId],
    queryFn: () => DimensionConfigController.getConfig(Number(selectedClientId)),
    enabled: selectedClientId !== null,
    staleTime: 10 * 60 * 1000,
  });
  const dimensionOrder = dimConfig?.dimensions ?? null;

  // Data Fetching — Active framework for selected client
  const { data: activeFramework, error: activeFrameworkError, isLoading: activeFrameworkLoading } = useQuery({
    queryKey: ['active-framework', selectedClientId],
    queryFn: () => FrameworksController.getActiveFramework(selectedClientId),
    enabled: selectedClientId !== null,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });

  // Data Fetching — Skill framework data
  const { data: clientSkillFramework, isLoading: clientFrameworkLoading } = useQuery({
    queryKey: ['framework-data', selectedClientId, activeFramework?.id],
    queryFn: () => {
      if (!activeFramework || !activeFramework.id) {
        throw new Error('No active framework');
      }
      return FrameworksController.getFrameworkData(selectedClientId, activeFramework.id);
    },
    enabled: selectedClientId !== null && activeFramework !== null && activeFramework !== undefined && activeFramework.id !== undefined,
    staleTime: 10 * 60 * 1000,
    retry: 1
  });

  // Data Fetching — Skill data (disabled on initial load)
  const { data: competencyData, isLoading: competencyLoading } = useQuery({
    queryKey: ['competencies'],
    queryFn: () => SearchController.getCompetencies(),
    enabled: false,
    staleTime: 10 * 60 * 1000,
    retry: 1
  });

  // Side Effects — Initialize skill framework state
  useEffect(() => {
    if (selectedClientId && activeFramework && clientSkillFramework) {
      const skill_families = (clientSkillFramework.skill_families || []).map((sf) => ({
        skill_family: sf.skill_family, description: sf.description
      }));
      const skill_groups = (clientSkillFramework.skill_groups || []).map((sg) => ({
        skill_family: sg.skill_family, group_item: sg.group_item, description: sg.description
      }));
      const competencies = (clientSkillFramework.competencies || []).map((comp) => ({
        skill_family: comp.skill_family, group_item: comp.group_item,
        competency: comp.competency, description: comp.description
      }));
      setSkillFrameworkState(prev => ({
        ...prev, skill_families, skill_groups, competencies, loading: false,
        selectedSkillFamily: '', selectedSkillGroup: '', selectedCompetency: ''
      }));
    } else if (selectedClientId && !activeFramework) {
      setSkillFrameworkState(prev => ({
        ...prev, skill_families: [], skill_groups: [], competencies: [], loading: false,
        selectedSkillFamily: '', selectedSkillGroup: '', selectedCompetency: ''
      }));
    } else if (clientFrameworkLoading || (selectedClientId && !activeFramework && !activeFrameworkError)) {
      setSkillFrameworkState(prev => ({ ...prev, loading: true }));
    }
  }, [clientSkillFramework, clientFrameworkLoading, selectedClientId, activeFramework, activeFrameworkError]);

  // Derived Data

  // Data Fetching — Warm up backend search context
  const {
    data: warmupResult,
    isLoading: warmupLoading,
    isFetching: warmupFetching,
    isError: warmupError,
    refetch: refetchWarmup,
  } = useQuery({
    queryKey: ['search-warmup', selectedClientId, selectedIndustryId, activeFramework?.id],
    queryFn: () => SearchController.warmupSearch(selectedClientId ?? undefined, selectedIndustryId ?? undefined),
    enabled: selectedClientId !== null,
    // The backend's warmup is already a cheap no-op when its in-memory cache
    // for this client/industry/framework is still valid (see SearchService's
    // _ensure_data_loaded/_ensure_indices_built version comparison) — it only
    // does real work when something actually changed. staleTime: Infinity
    // means React Query trusts a successful result until something explicitly
    // calls invalidateQueries(['search-warmup']) (profile upload, batch
    // delete, framework change), instead of re-checking on every remount —
    // e.g. every login, since that's a full page reload and always starts
    // from an empty cache regardless of this setting. invalidateQueries
    // always forces a refetch of active/next-mounted queries regardless of
    // staleTime, so this can't serve stale data after a genuine invalidation.
    staleTime: Infinity,
    retry: 0,
  });

  const searchReady = !!warmupResult && warmupResult.indices_built && warmupResult.data_loaded && !warmupError;
  // Debounce the spinner, not the readiness: a cache-valid warmup resolves in
  // one cheap round trip and should never visibly flash "Preparing" — only a
  // genuine cold rebuild (which takes noticeably longer) should show it.
  const showWarmupPreparing = useDebouncedTrue(warmupLoading || warmupFetching, 300);

  // Recruitment reuses the exact same warmup/search backend as Talent — only
  // source='recruitment' (+ this scope's batch ids) differs. The FAISS
  // profile index that /search/semantic's fast path depends on is only
  // rebuilt by this warmup call; skipping it risks searching against a
  // stale (wrong-source) index cached from a prior Talent warmup.
  const {
    data: recruitmentWarmupResult,
    isFetching: recruitmentWarmupFetching,
    isError: recruitmentWarmupError,
    refetch: refetchRecruitmentWarmup,
  } = useQuery({
    queryKey: ['search-warmup', selectedClientId, selectedIndustryId, 'recruitment', allProfilesSelected ? 'all' : activeJobIds.slice().sort().join(',')],
    queryFn: () => SearchController.warmupSearch(
      selectedClientId ?? undefined, selectedIndustryId ?? undefined, 'recruitment',
      allProfilesSelected ? undefined : activeJobIds,
    ),
    enabled: selectedClientId !== null && searchMode === 'recruitment' && hasAnySelection,
    // See the Talent warmup query above for why Infinity is safe here too.
    staleTime: Infinity,
    retry: 0,
  });

  const recruitmentSearchReady = !!recruitmentWarmupResult
    && recruitmentWarmupResult.indices_built && recruitmentWarmupResult.data_loaded
    && !recruitmentWarmupError;
  const showRecruitmentWarmupPreparing = useDebouncedTrue(recruitmentWarmupFetching, 300);

  // A warmup failure can mean the persisted clientInfo (industry_id, etc.) has drifted
  // from the server's current state — the resync effect above only catches drift if
  // `myClients` itself happens to be fresh. Its 5-minute staleTime means it can compare a
  // stale cached client list against the stale persisted one and find false agreement.
  // Force a real refetch on failure so the resync gets a genuinely current answer to check.
  useEffect(() => {
    if (warmupError) refetchMyClients();
  }, [warmupError, refetchMyClients]);

  // Search Mutation
  // Captures the mode/type as of the click (via mutate() variables), not whatever
  // searchMode happens to be when the response lands — otherwise a Talent search
  // still in flight when the user flips to Recruitment (or vice versa) would land
  // its results in the wrong section.
  const searchMutation = useMutation({
    mutationFn: async ({ mode, type }) => {
      // Recruitment reuses the identical SearchController calls Talent uses —
      // the only difference is source='recruitment' (+ batch_ids scoping to
      // "All Uploads" or one batch). No separate recruitment search path.
      const isRecruitment = mode === 'recruitment';
      const sourceParams = isRecruitment
        ? { source: 'recruitment', batch_ids: allProfilesSelected ? undefined : (activeJobIds.length ? activeJobIds : undefined) }
        : { source: 'talent' };

      if (type === 'semantic') {
        return SearchController.semanticSearch({
          query: searchQuery, filters, weights: searchWeights,
          client_id: selectedClientId,
          industry_id: selectedIndustryId,
          ...sourceParams,
        });
      } else {
        return SearchController.skillFrameworkSearch({
          skill_family: skillFrameworkState.selectedSkillFamily,
          skill_group: skillFrameworkState.selectedSkillGroup,
          competency: skillFrameworkState.selectedCompetency,
          filters, weights: searchWeights,
          client_id: selectedClientId,
          industry_id: selectedIndustryId,
          ...sourceParams,
        });
      }
    },
    onSuccess: (data, variables) => {
      // Discard results for a mode the user has since navigated away from —
      // keeps Recruitment and Talent results strictly separated even under races.
      if (variables.mode !== searchModeRef.current) return;
      setSearchResults(data.results || []);
      setResultsMode(variables.mode);
      setHasSearched(true);
      setExpandedProfileId(null);
    },
    onError: (error) => {
      console.error('Search failed:', error);
    }
  });

  // Event Handlers
  const handleSearch = () => {
    // Guard duplicate requests — Enter-to-search bypasses the button's own
    // disabled state, so this is the one place that actually blocks a second
    // mutate() while the first is still in flight.
    if (searchMutation.isPending) return;
    if (searchMode === 'recruitment') {
      if (recruitmentLocked || !hasAnySelection || !recruitmentSearchReady) return;
      if (searchType === 'semantic') {
        if (!searchQuery.trim()) return;
      } else if (!skillFrameworkState.selectedSkillFamily || !skillFrameworkState.selectedSkillGroup || !skillFrameworkState.selectedCompetency) {
        return;
      }
      searchMutation.mutate({ mode: searchMode, type: searchType });
      return;
    }
    // Warmup gates only the Search action itself, not the rest of the UI —
    // the input/filters stay interactive while it's in flight (see the
    // SearchInput/dropdown disabled props below), so this guard is what
    // actually stops a premature request if Enter is pressed before it's done.
    if (!searchReady) return;
    if (searchType === 'semantic' && !searchQuery.trim()) return;
    if (searchType === 'skill_framework' && (!skillFrameworkState.selectedSkillFamily || !skillFrameworkState.selectedSkillGroup || !skillFrameworkState.selectedCompetency)) return;
    searchMutation.mutate({ mode: searchMode, type: searchType });
  };

  const handleProfileSelect = (profile) => {
    setExpandedProfileId(expandedProfileId === profile.name ? null : profile.name);
  };

  const handleSkillFamilyChange = (skillFamily) => {
    setSkillFrameworkState(prev => ({ ...prev, selectedSkillFamily: skillFamily, selectedSkillGroup: '', selectedCompetency: '' }));
  };

  const handleSkillGroupChange = (skillGroup) => {
    setSkillFrameworkState(prev => ({ ...prev, selectedSkillGroup: skillGroup, selectedCompetency: '' }));
  };

  const handleSkillCompetencyChange = (competency) => {
    setSkillFrameworkState(prev => ({ ...prev, selectedCompetency: competency }));
  };

  const handleSearchModeChange = (mode) => {
    setSearchMode(mode);
    setSearchResults([]);
    setResultsMode(null);
    setHasSearched(false);
  };

  const handleClearResults = () => {
    setSearchResults([]);
    setResultsMode(null);
    setHasSearched(false);
    setExpandedProfileId(null);
  };

  const handleLoadLatestScores = async () => {
    if (!searchResults.length || selectedClientId === null || selectedIndustryId === null) return;
    try {
      const profileNames = searchResults.map((p) => p.name).filter(Boolean);
      const fresh = await SearchController.refreshHCMScores(profileNames, selectedClientId, selectedIndustryId);
      // Merge updated HCM data into existing results without re-running the search
      setSearchResults((prev) =>
        prev.map((profile) => {
          const updated = fresh[profile.name];
          if (!updated) return profile;
          return {
            ...profile,
            hcm_scorecard: updated,
            hcm_composite_score: updated?.scorecard?.composite_hcm_score ?? profile.hcm_composite_score,
            inr_valuation: updated?.valuation ?? profile.inr_valuation,
          };
        })
      );
    } catch (err) {
      console.error('HCM refresh failed:', err);
    }
  };

  const hasActiveFilters = Object.values(filters).some(value => value && value.length > 0);
  // Hard guard, independent of the state-clearing above: render results only
  // when they were actually fetched for the mode currently on screen.
  const resultsAreCurrent = resultsMode === searchMode;
  const visibleResults = resultsAreCurrent ? searchResults : [];

  // Guard Clause — No client selected
  if (!selectedClientId) {
    return (
      <div className="tw:flex tw:items-center tw:justify-center tw:min-h-[60vh]">
        <p className="tw:text-gray-300 tw:text-lg">No client selected. Please go back and select a client.</p>
      </div>
    );
  }

  // Derived Data — Framework stats for hero badges
  const frameworkStats = clientSkillFramework ? [
    { icon: Layers, label: 'Families', value: clientSkillFramework.skill_families?.length || 0, color: '#818cf8' },
    { icon: GitBranch, label: 'Groups', value: clientSkillFramework.skill_groups?.length || 0, color: '#34d399' },
    { icon: BookOpen, label: 'Elements', value: clientSkillFramework.competencies?.length || 0, color: '#f472b6' },
  ] : [];

  return (
    <div className="tw:relative tw:min-h-[calc(100vh-70px)]">
      

      {/* Hero Section */}
      <div className="tw:relative tw:pt-3 tw:pb-2 tw:px-4 sm:tw:px-6 lg:tw:px-8">
        <div className="tw:max-w-7xl tw:mx-auto">
          {/* Pulse rings */}
          <div style={{ position: 'absolute', left: '25%', top: 20, transform: 'translateX(-50%)', zIndex: 0 }}>
            <PulseRing delay={0} />
            <PulseRing delay={1.3} size={300} color="rgba(129,140,248,0.05)" />
            <PulseRing delay={2.6} size={380} color="rgba(143,179,41,0.04)" />
          </div>

          <div className="tw:flex tw:items-center tw:justify-between tw:gap-6 tw:relative tw:z-10 tw:flex-wrap">
            {/* Left - Icon + Title */}
            <motion.div
              className="tw:flex tw:items-center tw:gap-4 tw:shrink-0"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                className="tw:flex tw:items-center tw:justify-center tw:shrink-0"
                style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: 'linear-gradient(135deg, rgba(143,179,41,0.2) 0%, rgba(143,179,41,0.1) 100%)',
                  border: '1px solid rgba(143,179,41,0.2)',
                  backdropFilter: 'blur(12px)',
                }}
                animate={{ boxShadow: ['0 0 20px rgba(143,179,41,0.15)', '0 0 35px rgba(143,179,41,0.25)', '0 0 20px rgba(143,179,41,0.15)'] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Search style={{ color: '#8fb329', width: 22, height: 22 }} />
              </motion.div>
              <div>
                <h3 className="tw:text-2xl sm:tw:text-3xl tw:font-bold tw:mb-0.5 tw:leading-tight" style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 50%, #8fb329 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.02em',
                }}>
                  Search {searchMode === 'recruitment' ? 'Recruitment' : 'Talent'}
                </h3>
                <p className="tw:text-xs tw:mb-0" style={{ color: '#94a3b8' }}>
                  Find the perfect skilled professional {/*for {clientName || 'your'} needs*/}
                </p>
              </div>
            </motion.div>

            {/* Right — Status Badges + Framework Stats */}
            <motion.div
              className="tw:flex tw:items-center tw:gap-3 tw:flex-wrap tw:justify-end"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.7 }}
            >
             {/*  {clientName && (
                <span style={{
                  fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
                  color: '#818cf8', background: 'rgba(129,140,248,0.12)',
                  padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(129,140,248,0.2)',
                  whiteSpace: 'nowrap',
                }}>
                  {clientName} ({clientCode})
                </span>
              )} */}
              {/*{activeFramework && (
                <span style={{
                  fontSize: 11, fontWeight: 600, letterSpacing: '0.05em',
                  color: '#34d399', background: 'rgba(52,211,153,0.12)',
                  padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(52,211,153,0.2)',
                  whiteSpace: 'nowrap',
                }}>
                  {activeFramework.framework_name} {activeFramework.version ? `v${activeFramework.version}` : ''}
                </span>
              )}*/}
              <div className="tw:flex tw:items-center tw:gap-2">
                {searchMode === 'recruitment' ? (
                  resumeProcessing.isProcessing ? (
                    <>
                      <Spinner size="sm" style={{ width: 10, height: 10, color: '#fbbf24' }} />
                      <span style={{ color: '#6b7280', fontSize: 11, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        Processing {resumeProcessing.progress.completed}/{resumeProcessing.progress.total}
                      </span>
                    </>
                  ) : completedBatches.length > 0 && showRecruitmentWarmupPreparing ? (
                    <>
                      <Spinner size="sm" style={{ width: 10, height: 10, color: '#fbbf24' }} />
                      <span style={{ color: '#6b7280', fontSize: 11, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                        Preparing
                      </span>
                    </>
                  ) : completedBatches.length > 0 ? (
                    <>
                      <span style={{
                        display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
                        backgroundColor: recruitmentSearchReady ? '#34d399' : '#f87171',
                        boxShadow: recruitmentSearchReady ? '0 0 8px rgba(52,211,153,0.6)' : '0 0 8px rgba(248,113,113,0.6)',
                      }} />
                      <span style={{ color: '#6b7280', fontSize: 11, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                        {selectedBatchProfileCount} Profiles Ready
                        {allProfilesSelected && completedBatches.length > 1 ? ` (${completedBatches.length} uploads)` : ''}
                      </span>
                    </>
                  ) : (
                    <span style={{ color: '#6b7280', fontSize: 11, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                      Upload resumes to begin
                    </span>
                  )
                ) : searchReady ? (
                  <>
                    <span style={{
                      display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
                      backgroundColor: '#34d399', boxShadow: '0 0 8px rgba(52,211,153,0.6)',
                    }} />
                    <span style={{ color: '#6b7280', fontSize: 11, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                      {warmupResult?.profiles_count ?? 0} Profiles Ready
                    </span>
                  </>
                ) : showWarmupPreparing ? (
                  <>
                    <Spinner size="sm" style={{ width: 10, height: 10, color: '#fbbf24' }} />
                    <span style={{ color: '#6b7280', fontSize: 11, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                      Preparing
                    </span>
                  </>
                ) : warmupError ? (
                  <>
                    <span style={{
                      display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
                      backgroundColor: '#f87171', boxShadow: '0 0 8px rgba(248,113,113,0.6)',
                    }} />
                    <span style={{ color: '#f87171', fontSize: 11, fontWeight: 500, cursor: 'pointer' }} onClick={() => refetchWarmup()}>
                      RETRY WARMUP
                    </span>
                  </>
                ) : null}
              </div>
              {frameworkStats.length > 0 && (
                <div style={{ width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.08)' }} />
              )}
              {frameworkStats.map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.div key={i} whileHover={{ y: -2, boxShadow: `0 4px 12px rgba(0,0,0,0.3), 0 0 10px ${s.color}15` }} transition={{ duration: 0.25 }}>
                    <div
                      className="tw:flex tw:items-center tw:gap-2 tw:px-3 tw:py-1.5 tw:rounded-lg"
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        backdropFilter: 'blur(12px)',
                      }}
                    >
                      <Icon style={{ width: 14, height: 14, color: s.color, strokeWidth: 1.5 }} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{s.value}</span>
                      <span style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>{s.label}</span>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Search Controls Card */}
      <div className="tw:relative tw:z-10 tw:px-4 sm:tw:px-6 lg:tw:px-8 tw:pb-4">
        <div className="tw:max-w-full tw:mx-auto">
          <motion.div variants={itemVariants} initial="hidden" animate="visible">
            <div className="tw:relative tw:rounded-2xl tw:overflow-hidden" style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(16px)',
            }}>
              {/* Animated top border gradient */}
              <motion.div
                style={{ height: 2, background: 'linear-gradient(90deg, transparent 0%, #8fb329 30%, #818cf8 70%, transparent 100%)' }}
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />

              {/* Subtle inner glow */}
              <div style={{
                position: 'absolute', top: 0, left: '20%', right: '20%', height: 80,
                background: 'radial-gradient(ellipse at center top, rgba(143,179,41,0.06) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />

              <div className="tw:p-6 tw:relative">
                {/* Search Type Toggle + Advanced Options Button */}
                <div className="tw:flex tw:items-center tw:justify-between tw:flex-wrap tw:gap-3 tw:mb-5">
                  <div style={{
                    display: 'flex', padding: 4, borderRadius: 9999,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    {[
                      { key: 'skill_framework', label: 'Skill Framework', icon: Filter, color: '#818cf8' },
                      { key: 'semantic', label: 'Semantic Search', icon: Search, color: '#8fb329' },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const isActive = searchType === tab.key;
                      return (
                        <div
                          key={tab.key}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setSearchType(tab.key);
                            setSearchResults([]); setResultsMode(null); setHasSearched(false); setExpandedProfileId(null);
                          }}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSearchType(tab.key); setSearchResults([]); setResultsMode(null); setHasSearched(false); setExpandedProfileId(null); } }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '8px 20px', borderRadius: 9999,
                            fontSize: 14, fontWeight: 600, cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            userSelect: 'none',
                            ...(isActive ? {
                              background: `linear-gradient(135deg, ${tab.color}, ${tab.color}cc)`,
                              color: '#fff',
                              boxShadow: `0 4px 20px ${tab.color}40, inset 0 1px 0 rgba(255,255,255,0.15)`,
                            } : {
                              background: 'transparent',
                              color: '#6b7280',
                            }),
                          }}
                        >
                          <Icon style={{ width: 16, height: 16 }} />
                          {tab.label}
                        </div>
                      );
                    })}
                  </div>

                  <div className="tw:flex tw:items-center tw:gap-3">
                    {/* Recruitment / Talent mode toggle */}
                    <div style={{
                      display: 'flex', padding: 4, borderRadius: 9999,
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                      {[
                        { key: 'talent', label: 'Talent', icon: Building2, color: '#818cf8' },
                        { key: 'recruitment', label: 'Recruitment', icon: Users, color: '#8fb329' },
                      ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = searchMode === tab.key;
                        return (
                          <div
                            key={tab.key}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleSearchModeChange(tab.key)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSearchModeChange(tab.key); } }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              padding: '8px 20px', borderRadius: 9999,
                              fontSize: 14, fontWeight: 600, cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              userSelect: 'none',
                              ...(isActive ? {
                                background: `linear-gradient(135deg, ${tab.color}, ${tab.color}cc)`,
                                color: '#fff',
                                boxShadow: `0 4px 20px ${tab.color}40, inset 0 1px 0 rgba(255,255,255,0.15)`,
                              } : {
                                background: 'transparent',
                                color: '#6b7280',
                              }),
                            }}
                          >
                            <Icon style={{ width: 16, height: 16 }} />
                            {tab.label}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Skill Framework Help Tip */}
                {searchType === 'skill_framework' && (
                  <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2 tw:px-0 tw:py-1">
                    <p className="tw:text-sm tw:mb-0" style={{ color: '#ffffff' }}>
                      Select a skill family, skill group, and skill element to find professionals with matching expertise.
                    </p>
                  </div>
                )}

                {/* No active framework warning */}
                {searchType === 'skill_framework' && !activeFrameworkLoading && activeFramework === null && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      padding: '12px 16px', borderRadius: 12, marginBottom: 16,
                      background: 'rgba(245,158,11,0.07)',
                      border: '1px solid rgba(245,158,11,0.25)',
                    }}
                  >
                    <AlertCircle style={{ width: 15, height: 15, color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
                    <div style={{ fontSize: 13, color: '#d97706' }}>
                      <strong style={{ color: '#fbbf24' }}>No active skill framework.</strong>
                      {' '}Upload a framework JSON in{' '}
                      <strong style={{ color: '#fbbf24' }}>Admin › Skills</strong>, then click{' '}
                      <strong style={{ color: '#fbbf24' }}>Activate</strong> to enable Skill Framework Search.
                      You can still use <span
                        role="button"
                        tabIndex={0}
                        onClick={() => setSearchType('semantic')}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSearchType('semantic'); }}
                        style={{ color: '#8fb329', textDecoration: 'underline', cursor: 'pointer' }}
                      >
                        Semantic Search
                      </span> in the meantime.
                    </div>
                  </motion.div>
                )}

                {/* Shared hidden folder input — triggered from either search-type branch */}
                <input
                  ref={folderInputRef}
                  type="file"
                  webkitdirectory=""
                  directory=""
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleFolderSelect}
                />

                {/* Search Inputs — Semantic or Skill Framework */}
                {searchType === 'semantic' ? (
                  <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    onSearch={handleSearch}
                    // `disabled` gates typing/mic — only real structural blockers
                    // (recruitment locked / nothing selected), never warmup, so the
                    // box stays usable while the backend is still preparing.
                    // `searchDisabled` gates the Search button/Enter action only —
                    // that's the one thing that actually needs to wait for readiness.
                    disabled={searchMode === 'recruitment' ? (recruitmentLocked || !hasAnySelection) : false}
                    searchDisabled={searchMode === 'recruitment' ? (recruitmentLocked || !hasAnySelection || !recruitmentSearchReady) : !searchReady}
                    loading={searchMutation.isPending}
                    onAdvancedClick={() => setShowAdvancedOptions(true)}
                    showUploadFolder={false}
                  />
                ) : (
                  <div>
                    <ThemeProvider theme={darkSelectTheme}>
                      <Row className="tw:mb-4">
                        {(() => {
                          // These dropdowns are populated from clientSkillFramework
                          // (a separate, independent query) — they don't need the
                          // search-warmup call to finish, only their own data.
                          // The final "Search" action below still waits on searchReady.
                          const controlsDisabled = searchMode === 'recruitment' ? recruitmentLocked : clientFrameworkLoading;
                          return [
                            { label: 'Skill Family', value: skillFrameworkState.selectedSkillFamily, onChange: handleSkillFamilyChange, disabled: controlsDisabled, options: skillFrameworkState.skill_families.map((f, i) => ({ value: f.skill_family || `family-${i}`, label: f.skill_family || `Skill Family ${i + 1}` })), color: '#8fb329', icon: Layers },
                            { label: 'Skill Group', value: skillFrameworkState.selectedSkillGroup, onChange: handleSkillGroupChange, disabled: controlsDisabled || !skillFrameworkState.selectedSkillFamily, options: skillFrameworkState.skill_groups.filter(g => g.skill_family === skillFrameworkState.selectedSkillFamily).map((g, i) => ({ value: g.group_item || `group-${i}`, label: g.group_item || `Skill Group ${i + 1}` })), color: '#818cf8', icon: GitBranch },
                            { label: 'Skill Element', value: skillFrameworkState.selectedCompetency, onChange: handleSkillCompetencyChange, disabled: controlsDisabled || !skillFrameworkState.selectedSkillGroup, options: skillFrameworkState.competencies.filter(c => c.skill_family === skillFrameworkState.selectedSkillFamily && c.group_item === skillFrameworkState.selectedSkillGroup).map((c, i) => ({ value: c.competency || `competency-${i}`, label: c.competency || `Skill ${i + 1}` })), color: '#f472b6', icon: BookOpen },
                          ];
                        })().map((field, fi) => {
                          const Icon = field.icon;
                          const labelId = `sf-select-label-${fi}`;
                          return (
                            <Col md="4" key={field.label} className="tw:mb-3 md:tw:mb-0">
                              <FormControl fullWidth size="small" disabled={field.disabled}>
                                <InputLabel
                                  id={labelId}
                                  sx={{
                                    color: '#6b7280',
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    '&.Mui-focused': { color: field.color },
                                    '&.MuiFormLabel-filled': { color: `${field.color}cc` },
                                  }}
                                >
                                  <Icon style={{ width: 12, height: 12, flexShrink: 0 }} />
                                  {field.label}
                                </InputLabel>
                                <Select
                                  labelId={labelId}
                                  value={field.value}
                                  label={field.label}
                                  onChange={(e) => field.onChange(e.target.value)}
                                  sx={{
                                    '& .MuiOutlinedInput-notchedOutline': {
                                      borderColor: field.value ? `${field.color}50` : undefined,
                                      transition: 'border-color 0.2s',
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                      borderColor: field.value ? `${field.color}80` : undefined,
                                    },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                      borderColor: `${field.color} !important`,
                                      borderWidth: '1px !important',
                                    },
                                    '& .MuiSelect-icon': { color: '#94a3b8' },
                                  }}
                                  MenuProps={{
                                    PaperProps: {
                                      sx: {
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '10px',
                                        mt: 0.5,
                                        maxHeight: 280,
                                        '& .MuiMenuItem-root': {
                                          fontSize: 13,
                                          '&:hover': { bgcolor: `${field.color}15` },
                                          '&.Mui-selected': { bgcolor: `${field.color}20`, color: field.color },
                                          '&.Mui-selected:hover': { bgcolor: `${field.color}25` },
                                        },
                                      },
                                    },
                                  }}
                                >
                                  {field.options.map((opt) => (
                                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Col>
                          );
                        })}
                      </Row>
                    </ThemeProvider>
                    <div className="tw:flex tw:items-center tw:justify-end tw:gap-3">
                      {searchMode === 'recruitment' && (
                        <>
                          <UploadSelector
                            batches={mergedBatches}
                            allProfilesSelected={allProfilesSelected}
                            selectedIds={selectedBatchIds}
                            totalProfileCount={totalProfileCount}
                            onSelectAll={handleSelectAllProfiles}
                            onToggleBatch={handleToggleBatch}
                            onDelete={handleDeleteBatch}
                            disabled={resumeProcessing.isProcessing}
                          />
                          {uploadFolderName && (
                            <span className="tw:text-xs" style={{ color: resumeProcessing.isComplete ? '#8fb329' : '#94a3b8' }}>
                              {uploadFolderName}
                              {resumeProcessing.isProcessing && ` (${resumeProcessing.progress.completed}/${resumeProcessing.progress.total})`}
                            </span>
                          )}
                          <IndigoButton
                            onClick={resumeProcessing.isProcessing ? () => setShowProcessingModal(true) : handleUploadFolderClick}
                            style={resumeProcessing.isComplete ? {
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
                            {resumeProcessing.isProcessing ? 'Processing...' : 'Upload Folder'}
                          </IndigoButton>
                        </>
                      )}

                      <IndigoButton
                        onClick={handleSearch}
                        disabled={searchMode === 'recruitment'
                          ? (recruitmentLocked || !hasAnySelection || !recruitmentSearchReady || !skillFrameworkState.selectedSkillFamily || !skillFrameworkState.selectedSkillGroup || !skillFrameworkState.selectedCompetency)
                          : (!searchReady || !skillFrameworkState.selectedSkillFamily || !skillFrameworkState.selectedSkillGroup || !skillFrameworkState.selectedCompetency)}
                        loading={searchMutation.isPending}
                        loadingText="Search"
                        style={{ borderRadius: 9999, letterSpacing: '0.03em' }}
                        className="tw:px-8"
                      >
                        <Search className="tw:w-4 tw:h-4" />
                        Search
                      </IndigoButton>

                      <IndigoButton
                        onClick={() => setShowAdvancedOptions(true)}
                        disabled={searchMode === 'recruitment' && recruitmentLocked}
                        style={{ borderRadius: 9999, letterSpacing: '0.03em' }}
                      >
                        <Zap className="tw:w-4 tw:h-4" />
                        Advanced
                      </IndigoButton>
                    </div>
                    {searchMode === 'recruitment' && folderValidationError && (
                      <div
                        className="tw:flex tw:items-center tw:justify-end tw:gap-2"
                        style={{ marginTop: 10 }}
                      >
                        <AlertTriangle style={{ width: 13, height: 13, color: '#ef4444', flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: '#ef4444' }}>{folderValidationError}</span>
                        <button
                          onClick={() => setFolderValidationError(null)}
                          style={{
                            background: 'none', border: 'none', color: '#6b7280',
                            cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: '0 2px',
                          }}
                          aria-label="Dismiss"
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Search Results */}
      <div className="tw:relative tw:z-10 tw:px-4 sm:tw:px-6 lg:tw:px-8 tw:pb-8">
        <div className="tw:max-w-full tw:mx-auto tw:w-full">

          {/* Search Criteria Summary */}
          {searchType === 'skill_framework' && visibleResults.length > 0 && skillFrameworkState.selectedSkillFamily && skillFrameworkState.selectedSkillGroup && skillFrameworkState.selectedCompetency && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="tw:p-3 tw:rounded-xl tw:mb-3 tw:shrink-0"
              style={{ backgroundColor: 'rgba(143,179,41,0.12)', border: '1px solid rgba(143,179,41,0.2)' }}
            >
              <div className="tw:text-xs" style={{ color: '#7a9a23' }}>
                <span className="tw:font-medium">Skill Family:</span> {skillFrameworkState.selectedSkillFamily} &rarr;
                <span className="tw:font-medium"> Skill Group:</span> {skillFrameworkState.selectedSkillGroup} &rarr;
                <span className="tw:font-medium"> Skill Element:</span> {skillFrameworkState.selectedCompetency}
              </div>
            </motion.div>
          )}

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="tw:mb-3 tw:shrink-0">
              <div className="tw:flex tw:items-center tw:gap-2 tw:mb-2">
                <span className="tw:text-sm" style={{ color: '#94a3b8' }}>Active filters:</span>
                <button
                  onClick={() => setShowFilters(true)}
                  className="tw:text-xs tw:font-medium tw:px-3 tw:py-1 tw:rounded-full tw:border-0 tw:cursor-pointer tw:transition-all tw:duration-200"
                  style={{
                    background: 'rgba(143,179,41,0.1)',
                    color: '#8fb329',
                    border: '1px solid rgba(143,179,41,0.2)',
                  }}
                >
                  Manage Filters
                </button>
              </div>
              <div className="tw:flex tw:flex-wrap tw:gap-2">
                {Object.entries(filters).map(([key, values]) => {
                  if (!values || values.length === 0) return null;
                  return values.map((value) => (
                    <span key={`${key}-${value}`} className="tw:text-xs tw:font-medium tw:px-3 tw:py-1 tw:rounded-full" style={{
                      background: 'rgba(129,140,248,0.1)',
                      color: '#a5b4fc',
                      border: '1px solid rgba(129,140,248,0.2)',
                    }}>
                      {key}: {value}
                    </span>
                  ));
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!searchMutation.isPending && !searchMutation.isError && visibleResults.length === 0 && !hasSearched && (
            <motion.div
              className="tw:text-center tw:py-20 tw:flex-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div
                className="tw:mb-6 tw:flex tw:justify-center"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div
                  className="tw:flex tw:items-center tw:justify-center tw:rounded-2xl"
                  style={{
                    width: 80, height: 80,
                    background: 'linear-gradient(135deg, rgba(143,179,41,0.1), rgba(129,140,248,0.05))',
                    border: '1px solid rgba(255,255,255,0.06)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <Search className="tw:w-8 tw:h-8" style={{ color: '#6b7280' }} />
                </div>
              </motion.div>
              <h3 className="tw:text-xl tw:font-semibold tw:text-white tw:mb-2">Start Your Search</h3>
              <p className="tw:text-gray-400 tw:text-sm tw:max-w-md tw:mx-auto">
                Enter search criteria above to discover professionals with the right expertise and experience
              </p>
            </motion.div>
          )}

          {/* Loading State — skeleton cards instead of a blank area */}
          {searchMutation.isPending && (
            <div className="tw:pb-4">
              <div className="tw:flex tw:items-center tw:gap-2 tw:mb-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="tw:w-4 tw:h-4" style={{ color: '#8fb329' }} />
                </motion.div>
                <p className="tw:text-gray-300 tw:text-sm tw:font-medium tw:mb-0">Analyzing profiles and matching expertise...</p>
              </div>
              <div className="tw:space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonResultCard key={i} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Error State */}
          {searchMutation.isError && (
            <Alert color="danger" className="tw:text-center tw:rounded-xl tw:shrink-0">
              <p className="tw:mb-2 tw:font-medium">Failed to search profiles</p>
              <small className="tw:text-gray-400">{searchMutation.error?.message}</small>
            </Alert>
          )}

          {/* HCM Update Notification Banner — Talent only. Recruitment profiles do
              get HCM scores now (auto-precomputed per batch after upload), but this
              banner tracks staleness from Talent DB edits, which doesn't apply here. */}
          {selectedClientId && searchMode === 'talent' && (
            <HCMUpdateBanner
              clientId={selectedClientId}
              onLoadLatestScores={handleLoadLatestScores}
            />
          )}

          {/* No Results State */}
          {!searchMutation.isPending && !searchMutation.isError && hasSearched && resultsAreCurrent && visibleResults.length === 0 && (
            <motion.div
              className="tw:text-center tw:py-20 tw:flex-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div
                className="tw:mb-6 tw:flex tw:justify-center"
              >
                <div
                  className="tw:flex tw:items-center tw:justify-center tw:rounded-2xl"
                  style={{
                    width: 80, height: 80,
                    background: 'linear-gradient(135deg, rgba(248,113,113,0.1), rgba(129,140,248,0.05))',
                    border: '1px solid rgba(255,255,255,0.06)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <Search className="tw:w-8 tw:h-8" style={{ color: '#6b7280' }} />
                </div>
              </div>
              <h3 className="tw:text-xl tw:font-semibold tw:text-white tw:mb-2">
                {searchMode === 'recruitment' ? 'No matching candidates found.' : 'No Matching Profiles'}
              </h3>
              <p className="tw:text-gray-400 tw:text-sm tw:max-w-md tw:mx-auto">
                {searchMode === 'recruitment'
                  ? 'None of the uploaded resumes match this Skill Family / Group / Element combination.'
                  : 'No professionals match this exact skill combination. Try a broader skill group or a different skill element.'}
              </p>
            </motion.div>
          )}

          {/* Search Results Dashboard + List */}
          {visibleResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="tw:pb-4"
            >
              {/* Sticky results header */}
              <div className="tw:sticky tw:top-0 tw:z-10 tw:pt-1 tw:pb-2" style={{ background: 'linear-gradient(to bottom, rgba(17,17,17,1) 70%, rgba(17,17,17,0))' }}>
                <div className="tw:flex tw:items-center tw:justify-between">
                  <h3 className="tw:text-lg tw:font-bold tw:text-white tw:mb-0">
                    Top {visibleResults.length} matching profiles
                  </h3>
                  <div className="tw:flex tw:items-center tw:gap-2">
                    {/*<button
                      onClick={() => setDashboardCollapsed(!dashboardCollapsed)}
                      className="tw:text-xs tw:font-medium tw:flex tw:items-center tw:gap-1.5 tw:px-3 tw:py-1.5 tw:rounded-full tw:border-0 tw:cursor-pointer tw:transition-all tw:duration-200"
                      style={{
                        background: 'rgba(129,140,248,0.08)',
                        color: '#a5b4fc',
                        border: '1px solid rgba(129,140,248,0.15)',
                      }}
                    >
                      {dashboardCollapsed ? <ChevronDown className="tw:w-3.5 tw:h-3.5" /> : <ChevronUp className="tw:w-3.5 tw:h-3.5" />}
                      {dashboardCollapsed ? 'Show Analytics' : 'Hide Analytics'}
                    </button>*/}

                    <a
                      href="#"
                      title="Skill Ranking Report - Coming Soon"
                      onClick={(e) => e.preventDefault()}
                      className="tw:text-xs tw:font-medium tw:px-3 tw:py-1.5 tw:rounded-full tw:no-underline tw:transition-all tw:duration-200 tw:flex tw:items-center tw:gap-1.5"
                      style={{
                        background: 'rgba(179,211,53,0.08)',
                        color: '#B3D335',
                        border: '1px solid rgba(179,211,53,0.15)',
                        opacity: 0.6,
                        cursor: 'not-allowed',
                        display: 'inline-flex',
                      }}
                    >
                      <Download style={{ width: 13, height: 13 }} />
                      Skill Ranking Report
                    </a>

                    <button
                      onClick={handleClearResults}
                      className="tw:text-xs tw:font-medium tw:px-3 tw:py-1.5 tw:rounded-full tw:border-0 tw:cursor-pointer tw:transition-all tw:duration-200"
                      style={{
                        background: 'rgba(248,113,113,0.08)',
                        color: '#fca5a5',
                        border: '1px solid rgba(248,113,113,0.15)',
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              {/* Collapsible analytics dashboard */}
              {/*<AnimatePresence>
                {!dashboardCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="tw:overflow-hidden"
                  >
                    <SearchResultsDashboard
                      results={searchResults}
                      query={searchType === 'semantic' ? searchQuery : `${skillFrameworkState.selectedSkillFamily} → ${skillFrameworkState.selectedSkillGroup} → ${skillFrameworkState.selectedCompetency}`}
                    />
                  </motion.div>
                )}
              </AnimatePresence>*/}

              {/* Results list */}
              <div className="tw:space-y-2 tw:mt-2">
                {visibleResults.map((profile, index) => (
                  <TimelineItem
                    key={profile.id || `profile-${index}`}
                    profile={profile}
                    isSelected={expandedProfileId === profile.name}
                    onClick={() => handleProfileSelect(profile)}
                    index={index}
                    dimensionOrder={dimensionOrder}
                    source={searchMode}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Filters Modal Overlay */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="tw:fixed tw:inset-0 tw:flex tw:items-center tw:justify-center tw:z-50"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          >
            <SearchFiltersPanel
              filters={filters}
              availableFilters={availableFilters || { levels: [], locations: [] }}
              onFiltersChange={setFilters}
              onCloseFilters={() => setShowFilters(false)}
              hasResults={visibleResults.length > 0}
              filtersModified={filtersModified}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Folder Confirmation */}
      <UploadFolderConfirmModal
        isOpen={!!pendingUpload}
        folderName={pendingUpload?.folderLabel}
        fileCount={pendingUpload?.fileCount}
        onCancel={handleCancelUpload}
        onConfirm={handleConfirmUpload}
      />

      {/* Resume Processing Modal */}
      <ResumeProcessingModal
        isOpen={showProcessingModal}
        status={resumeProcessing.status}
        progress={resumeProcessing.progress}
        folderName={resumeProcessing.folderName}
        jobId={resumeProcessing.jobId}
        onCancel={async () => { await resumeProcessing.cancel(); }}
        onContinue={() => setShowProcessingModal(false)}
        onClose={() => {
          setShowProcessingModal(false);
          if (resumeProcessing.status === 'failed' || resumeProcessing.status === 'cancelled') {
            resumeProcessing.reset();
          }
        }}
      />

      {/* Advanced Options Modal Overlay */}
      <AdvancedOptions
        isOpen={showAdvancedOptions}
        onClose={() => setShowAdvancedOptions(false)}
        weights={searchWeights}
        onWeightsChange={setSearchWeights}
        onActivePresetChange={setActivePreset}
        clientId={selectedClientId}
        onApplyAndSearch={() => {
          if (searchType === 'semantic' && searchQuery.trim()) {
            searchMutation.mutate({ mode: searchMode, type: searchType });
          } else if (searchType === 'skill_framework' &&
            skillFrameworkState.selectedSkillFamily &&
            skillFrameworkState.selectedSkillGroup &&
            skillFrameworkState.selectedCompetency) {
            searchMutation.mutate({ mode: searchMode, type: searchType });
          }
        }}
      />
    </div>
  );
}
