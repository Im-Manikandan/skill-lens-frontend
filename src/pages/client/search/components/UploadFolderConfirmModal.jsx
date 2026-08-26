import React from 'react';
import { motion } from 'framer-motion';
import { FolderOpen } from 'lucide-react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';
import BrandButton from '../../../../components/buttons/BrandButton.jsx';

/**
 * App-styled confirmation shown right after the browser's own folder picker
 * closes, before the resume-parsing job actually starts. The very first
 * "Upload a file to this site?" prompt is Chromium's own OS-level security
 * dialog for <input webkitdirectory> — no web app can skip or restyle that
 * one. This is the branded step that follows it.
 */
export default function UploadFolderConfirmModal({ isOpen, folderName, fileCount, onCancel, onConfirm }) {
  return (
    <Modal
      isOpen={isOpen}
      toggle={onCancel}
      centered
      contentClassName="tw:bg-gray-800 tw:border tw:border-gray-700 tw:text-white"
      style={{ maxWidth: 420 }}
    >
      <div style={{
        height: 3, width: '100%',
        background: 'linear-gradient(90deg, #9ACA3C, #B3D335, #818cf8)',
        borderRadius: '8px 8px 0 0',
      }} />
      <ModalHeader className="tw:border-gray-700" toggle={onCancel}>
        <div className="tw:flex tw:flex-col tw:items-center tw:gap-3 tw:w-full tw:pt-2">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.25 }}
            style={{
              width: 52, height: 52, borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(154,202,60,0.2), rgba(154,202,60,0.08))',
              border: '1px solid rgba(154,202,60,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <FolderOpen style={{ width: 24, height: 24, color: '#9ACA3C' }} />
          </motion.div>
          <div style={{ fontSize: 19, fontWeight: 700, color: '#f1f5f9' }}>Upload Folder</div>
        </div>
      </ModalHeader>

      <ModalBody className="tw:text-center" style={{ paddingTop: 4, paddingBottom: 8 }}>
        <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>
          You have selected the folder:
        </div>
        <div className="tw:flex tw:items-center tw:justify-center tw:gap-2" style={{ marginBottom: 14 }}>
          <FolderOpen style={{ width: 15, height: 15, color: '#B3D335', flexShrink: 0 }} />
          <span style={{ fontSize: 16, fontWeight: 600, color: '#B3D335', wordBreak: 'break-word' }}>
            {folderName || 'Untitled Folder'}
          </span>
        </div>
        <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.5 }}>
          This will upload{' '}
          <strong style={{ color: '#e2e8f0' }}>
            {fileCount ? `${fileCount} file${fileCount === 1 ? '' : 's'}` : 'all files'}
          </strong>{' '}
          from this folder (and its subfolders).
          <br />
          Do you want to continue?
        </div>
      </ModalBody>

      <ModalFooter className="tw:border-gray-700 tw:justify-center" style={{ paddingTop: 16, paddingBottom: 20, gap: 10 }}>
        <Button
          color="secondary"
          onClick={onCancel}
          style={{ borderRadius: 10, padding: '8px 22px', fontWeight: 500 }}
        >
          Cancel
        </Button>
        <BrandButton onClick={onConfirm} compact>
          <FolderOpen style={{ width: 15, height: 15 }} />
          Upload
        </BrandButton>
      </ModalFooter>
    </Modal>
  );
}
