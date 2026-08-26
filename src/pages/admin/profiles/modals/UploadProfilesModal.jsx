import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileJson, X, AlertCircle, CheckCircle2, Factory, Download,
} from 'lucide-react';
import {
  Modal, ModalHeader, ModalBody, ModalFooter,
  Form, FormGroup, Label, Input, Button,
} from 'reactstrap';
import BrandButton from '../../../../components/buttons/BrandButton.jsx';
import DimensionConfigController from '../../../../api/admin/dimension-config-controller.jsx';

export default function UploadProfilesModal({ clientId, industryId, industryName, onClose, onUpload, isLoading, result }) {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    version: 'v1',
    replace: false,
    // Talent JSON uploads default to upsert so re-uploading the same file
    // updates existing profiles (matched by name/client/industry/source)
    // instead of inserting duplicates. Recruitment uploads are unaffected —
    // they go through a separate call path (resume-processing-controller.jsx)
    // that never sets this field, and the backend rejects upsert/replace
    // outright for source='recruitment'.
    upsert: true,
  });
  const [sampleDownloading, setSampleDownloading] = useState(false);
  const [sampleError, setSampleError] = useState(null);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f?.name.endsWith('.json')) setFile(f);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file) return;
    onUpload({ file, industryId, ...formData });
  };

  const handleDownloadSample = async () => {
    setSampleError(null);
    setSampleDownloading(true);
    try {
      const blob = await DimensionConfigController.downloadProfileTemplate(clientId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `profile-template-client-${clientId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setSampleError(err?.message || 'Download failed');
    } finally {
      setSampleDownloading(false);
    }
  };

  const modeLabel = formData.replace ? 'Replace' : formData.upsert ? 'Upsert' : 'Insert';
  const modeColor = formData.replace ? '#ef4444' : formData.upsert ? '#f59e0b' : '#B3D335';
  const modeDesc = formData.replace
    ? 'Deletes all existing profiles for this client/industry, then inserts the new ones.'
    : formData.upsert
    ? 'Updates existing profiles matched by name; inserts new ones.'
    : 'Inserts all profiles. Fails if a profile name already exists.';

  return (
    <Modal
      isOpen
      toggle={onClose}
      centered
      contentClassName="tw:bg-gray-800 tw:border tw:border-gray-700 tw:text-white"
      style={{ maxWidth: 500 }}
    >
      <div style={{
        height: 3, width: '100%',
        background: 'linear-gradient(90deg, #9ACA3C, #B3D335, #a78bfa)',
        borderRadius: '8px 8px 0 0',
      }} />
      <ModalHeader
        className="tw:border-gray-700"
        style={{ paddingBottom: 12 }}
      >
        <div className="tw:flex tw:items-center tw:gap-3">
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, rgba(179,211,53,0.2), rgba(154,202,60,0.08))',
            border: '1px solid rgba(179,211,53,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Upload style={{ width: 18, height: 18, color: '#B3D335' }} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#f1f5f9' }}>Upload Profiles</div>
            <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 400 }}>Import profiles from a JSON file</div>
          </div>
        </div>
      </ModalHeader>

      <ModalBody style={{ paddingTop: 16 }}>
        {/* Success result */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '12px 16px', borderRadius: 12, marginBottom: 16,
              background: 'rgba(179,211,53,0.08)',
              border: '1px solid rgba(179,211,53,0.25)',
            }}
          >
            <CheckCircle2 style={{ width: 18, height: 18, color: '#B3D335', flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 13, color: '#cbd5e1' }}>
              <strong style={{ color: '#B3D335' }}>Upload complete.</strong>{' '}
              {result.inserted} inserted, {result.updated} updated, {result.skipped} skipped
              {' '}(of {result.total_in_file} in file).
            </div>
          </motion.div>
        )}

        <Form onSubmit={handleSubmit} id="uploadForm">
          {/* File Drop Zone */}
          <FormGroup>
            <div className="tw:flex tw:items-center tw:justify-between tw:mb-2">
              <Label className="tw:text-gray-300 tw:mb-0" style={{ fontSize: 13, fontWeight: 500 }}>
                JSON File <span className="tw:text-red-400">*</span>
              </Label>
              {/* Download Sample JSON */}
              <button
                type="button"
                onClick={handleDownloadSample}
                disabled={sampleDownloading || !clientId}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: 'none', border: 'none', cursor: sampleDownloading ? 'default' : 'pointer',
                  color: sampleDownloading ? '#4b5563' : '#a78bfa',
                  fontSize: 12, fontWeight: 500, padding: 0,
                  opacity: sampleDownloading ? 0.6 : 1,
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={e => { if (!sampleDownloading) e.currentTarget.style.color = '#c4b5fd'; }}
                onMouseLeave={e => { if (!sampleDownloading) e.currentTarget.style.color = '#a78bfa'; }}
              >
                <Download style={{ width: 12, height: 12 }} />
                {sampleDownloading ? 'Downloading…' : 'Download Sample JSON'}
              </button>
            </div>

            {/* Sample download error */}
            <AnimatePresence>
              {sampleError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '8px 12px', borderRadius: 8, marginBottom: 8,
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    fontSize: 12, color: '#fca5a5',
                  }}
                >
                  <AlertCircle style={{ width: 13, height: 13, color: '#ef4444', flexShrink: 0 }} />
                  {sampleError}
                  <button
                    type="button"
                    onClick={() => setSampleError(null)}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0 }}
                  >
                    <X style={{ width: 12, height: 12 }} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              style={{
                padding: '24px 16px', borderRadius: 12, textAlign: 'center', cursor: 'pointer',
                background: file ? 'rgba(179,211,53,0.06)' : 'rgba(255,255,255,0.02)',
                border: `2px dashed ${file ? 'rgba(179,211,53,0.4)' : 'rgba(255,255,255,0.12)'}`,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                if (!file) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  e.currentTarget.style.borderColor = 'rgba(179,211,53,0.3)';
                }
              }}
              onMouseLeave={e => {
                if (!file) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                }
              }}
            >
              {file ? (
                <div className="tw:flex tw:items-center tw:justify-center tw:gap-3">
                  <FileJson style={{ width: 22, height: 22, color: '#B3D335' }} />
                  <div>
                    <div style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 500 }}>{file.name}</div>
                    <div style={{ color: '#6b7280', fontSize: 12 }}>
                      {(file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setFile(null); fileInputRef.current.value = ''; }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: 4 }}
                  >
                    <X style={{ width: 16, height: 16 }} />
                  </button>
                </div>
              ) : (
                <div>
                  <Upload style={{ width: 24, height: 24, color: '#4b5563', margin: '0 auto 8px' }} />
                  <div style={{ color: '#9ca3af', fontSize: 13 }}>
                    Drop a JSON file here, or <span style={{ color: '#B3D335' }}>browse</span>
                  </div>
                  <div style={{ color: '#4b5563', fontSize: 11, marginTop: 4 }}>
                    Array of profile objects
                  </div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </FormGroup>

          {/* Industry (read-only, from client) */}
          <FormGroup>
            <Label className="tw:text-gray-300 tw:mb-1" style={{ fontSize: 13, fontWeight: 500 }}>Industry</Label>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', borderRadius: 10,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <Factory style={{ width: 14, height: 14, color: '#6b7280', flexShrink: 0 }} />
              <span style={{ color: '#e2e8f0', fontSize: 14 }}>{industryName || `ID: ${industryId}`}</span>
            </div>
          </FormGroup>

          {/* Version */}
          <FormGroup>
            <Label className="tw:text-gray-300 tw:mb-1" style={{ fontSize: 13, fontWeight: 500 }}>
              Version
            </Label>
            <Input
              type="text"
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              placeholder="e.g. v1"
              className="tw:bg-gray-700! tw:border-gray-600! tw:text-white!"
              style={{ borderRadius: 10, padding: '10px 14px' }}
            />
          </FormGroup>

          {/* Mode checkboxes */}
          <FormGroup>
            <Label className="tw:text-gray-300 tw:mb-2" style={{ fontSize: 13, fontWeight: 500 }}>
              Import Mode
            </Label>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              {[
                { key: 'upsert', label: 'Upsert', color: '#f59e0b' },
                { key: 'replace', label: 'Replace all', color: '#ef4444' },
              ].map(({ key, label, color }) => (
                <label
                  key={key}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                    padding: '8px 14px', borderRadius: 10,
                    background: formData[key] ? `${color}12` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${formData[key] ? `${color}40` : 'rgba(255,255,255,0.08)'}`,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData[key]}
                    onChange={(e) => {
                      const other = key === 'upsert' ? 'replace' : 'upsert';
                      setFormData({ ...formData, [key]: e.target.checked, [other]: false });
                    }}
                    style={{ accentColor: color }}
                  />
                  <span style={{ fontSize: 13, color: formData[key] ? color : '#9ca3af', fontWeight: 500 }}>{label}</span>
                </label>
              ))}
            </div>
            {/* Mode description */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              padding: '10px 12px', borderRadius: 10,
              background: `${modeColor}08`,
              border: `1px solid ${modeColor}20`,
            }}>
              <AlertCircle style={{ width: 14, height: 14, color: modeColor, flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 12, color: '#9ca3af' }}>
                <strong style={{ color: modeColor }}>{modeLabel}:</strong> {modeDesc}
              </span>
            </div>
          </FormGroup>
        </Form>
      </ModalBody>

      <ModalFooter className="tw:border-gray-700" style={{ paddingTop: 16, paddingBottom: 16 }}>
        <Button
          color="secondary"
          onClick={onClose}
          style={{ borderRadius: 10, padding: '8px 20px', fontWeight: 500 }}
        >
          {result ? 'Close' : 'Cancel'}
        </Button>
        {!result && (
          <BrandButton
            type="submit"
            form="uploadForm"
            loading={isLoading}
            loadingText="Uploading..."
            compact
            disabled={!file}
          >
            <Upload style={{ width: 15, height: 15 }} />
            Upload Profiles
          </BrandButton>
        )}
      </ModalFooter>
    </Modal>
  );
}
