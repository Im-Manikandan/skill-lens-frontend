import { useState, useRef, useCallback, useEffect } from 'react';
import ResumeProcessingController from '../../../../api/search/resume-processing-controller.jsx';

const POLL_INTERVAL_MS = 700;

/**
 * Drives the bulk resume upload → processing → complete lifecycle.
 * Search controls should stay locked only while the most recently started
 * upload (`status`/`isProcessing`) is still running.
 *
 * Every call to `start()` creates a new batch and appends it to `batches`
 * rather than replacing prior state — completed batches stay searchable
 * (via the Batch filter) for the lifetime of the session.
 */
export default function useResumeProcessing() {
  const [batches, setBatches] = useState([]); // { jobId, batchNumber, label, folderName, status, progress, profileCount }
  const [currentJobId, setCurrentJobId] = useState(null);
  const [status, setStatus] = useState(null); // 'processing' | 'completed' | 'failed' | 'cancelled'
  const [progress, setProgress] = useState({ total: 0, completed: 0, failed: 0, current_file: null, eta_seconds: 0 });
  const [folderName, setFolderName] = useState('');
  const [error, setError] = useState(null);
  const pollRef = useRef(null);
  const batchSeqRef = useRef(0);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const updateBatch = useCallback((jobId, patch) => {
    setBatches((prev) => prev.map((b) => (b.jobId === jobId ? { ...b, ...patch } : b)));
  }, []);

  const poll = useCallback((id) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const data = await ResumeProcessingController.getJobStatus(id);
        setStatus(data.status);
        setProgress({
          total: data.total, completed: data.completed, failed: data.failed,
          current_file: data.current_file, eta_seconds: data.eta_seconds,
        });
        // Profile count is only meaningful once parsing has finished — a batch
        // mid-flight isn't selectable in the Batch filter anyway.
        const profileCount = data.status === 'completed' ? Math.max(0, data.completed - data.failed) : 0;
        updateBatch(id, {
          status: data.status,
          progress: { total: data.total, completed: data.completed, failed: data.failed },
          profileCount,
        });
        if (data.status !== 'processing') stopPolling();
      } catch (err) {
        setError(err);
        updateBatch(id, { status: 'failed' });
        stopPolling();
      }
    }, POLL_INTERVAL_MS);
  }, [stopPolling, updateBatch]);

  const beginJob = useCallback(async (uploadPromise, folderLabel) => {
    setError(null);
    setFolderName(folderLabel || '');
    batchSeqRef.current += 1;
    const batchNumber = batchSeqRef.current;
    const label = `Batch ${batchNumber} - ${folderLabel || 'Untitled Folder'}`;
    try {
      const { job_id, total } = await uploadPromise;
      setCurrentJobId(job_id);
      setStatus('processing');
      setProgress({ total, completed: 0, failed: 0, current_file: null, eta_seconds: 0 });
      setBatches((prev) => [...prev, {
        jobId: job_id,
        batchNumber,
        label,
        folderName: folderLabel || '',
        status: 'processing',
        progress: { total, completed: 0, failed: 0 },
        profileCount: 0,
      }]);
      poll(job_id);
    } catch (err) {
      setError(err);
      setStatus('failed');
    }
  }, [poll]);

  const start = useCallback(({ files, clientId, industryId, frameworkContext, folderLabel }) => {
    return beginJob(
      ResumeProcessingController.uploadResumeFolder({ clientId, industryId, files, frameworkContext, folderLabel }),
      folderLabel
    );
  }, [beginJob]);

  const cancel = useCallback(async () => {
    if (!currentJobId) return;
    await ResumeProcessingController.cancelJob(currentJobId);
    setStatus('cancelled');
    updateBatch(currentJobId, { status: 'cancelled' });
    stopPolling();
  }, [currentJobId, stopPolling, updateBatch]);

  // Dismisses the processing modal for the most recent job only — completed
  // batches already recorded in `batches` are left untouched (never overwritten).
  const reset = useCallback(() => {
    stopPolling();
    setCurrentJobId(null);
    setStatus(null);
    setProgress({ total: 0, completed: 0, failed: 0, current_file: null, eta_seconds: 0 });
    setError(null);
  }, [stopPolling]);

  const isProcessing = status === 'processing';
  const isComplete = status === 'completed';
  // Search stays locked only while actively processing.
  const isLocked = isProcessing;

  return {
    jobId: currentJobId, status, progress, folderName, error,
    batches, start, cancel, reset, isProcessing, isComplete, isLocked,
  };
}
