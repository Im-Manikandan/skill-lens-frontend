
import { useEffect, useRef, useState } from 'react';
import { postJSON } from '../../api/fetch-helpers';
import conf_prop from '../../properties/properties';
import './SkillLensChatbotPremium.css';
import ExportFormatIcon from './ExportFormatIcon';

const FORMAT_NAMES = {
  pdf: 'PDF',
  pptx: 'PowerPoint',
  ppt: 'PowerPoint',
  xlsx: 'Excel',
  csv: 'CSV',
};

const TEMPLATE_DETAILS = {
  executive_presentation: {
    label: 'Executive Talent Brief',
    description: 'Leadership summary, key findings and decisions.',
  },
  team_recommendation: {
    label: 'Team Recommendation',
    description: 'Assigned roles, team composition and capability coverage.',
  },
  candidate_comparison: {
    label: 'Candidate Comparison',
    description: 'Side-by-side skills and evidence-based differences.',
  },
  client_presentation: {
    label: 'Client Talent Proposal',
    description: 'Client-facing talent solution and next steps.',
  },
  skill_gap_report: {
    label: 'Skills & Gap Analysis',
    description: 'Skill coverage and verified gaps when assessment data exists.',
  },
  candidate_shortlist: {
    label: 'Candidate Shortlist',
    description: 'Candidate roster, roles and recorded evidence.',
  },
  skill_matrix: {
    label: 'Skill Matrix',
    description: 'Compare recorded skills across candidates.',
  },
  hiring_manager_report: {
    label: 'Hiring Manager Report',
    description: 'A structured hiring decision and candidate evidence.',
  },
  individual_candidate_profile: {
    label: 'Individual Candidate Profile',
    description: 'Detailed individual candidate capabilities.',
  },
  team_comparison: {
    label: 'Team Comparison',
    description: 'Compare team options and capability coverage.',
  },
  leadership_briefing: {
    label: 'Leadership Briefing',
    description: 'Concise insights for senior leadership.',
  },
  project_staffing_plan: {
    label: 'Project Staffing Plan',
    description: 'Project roles, staffing recommendations and skills.',
  },
};

const SkillLensChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [exportSelections, setExportSelections] = useState({});
  const [expandedExports, setExpandedExports] = useState({});
  const [previewSelection, setPreviewSelection] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const launcherRef = useRef(null);
  const previewRef = useRef(null);
  const requestPendingRef = useRef(false);
  const activeRequestRef = useRef(null);
  const wasOpenRef = useRef(false);

  useEffect(() => () => {
    activeRequestRef.current?.abort();
    activeRequestRef.current = null;
  }, []);

  const stopResponse = () => {
    if (!activeRequestRef.current) return;
    activeRequestRef.current.abort();
    activeRequestRef.current = null;
    requestPendingRef.current = false;
    setIsThinking(false);
    setMessages((previous) => [
      ...previous,
      { role: 'assistant', content: 'Request stopped.' },
    ]);
    inputRef.current?.focus();
  };

  // Start a fresh frontend conversation and cancel any active request.
  const refreshChat = () => {
    if (activeRequestRef.current) {
      activeRequestRef.current.abort();
      activeRequestRef.current = null;
    }
    requestPendingRef.current = false;
    setMessages([]);
    setMessage('');
    setIsThinking(false);
    setExportSelections({});
    setExpandedExports({});
    setPreviewSelection(null);
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
    else if (wasOpenRef.current) launcherRef.current?.focus();
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    if (!previewSelection) return;


    const previousFocus = document.activeElement;
    const dialog = previewRef.current;
    dialog?.querySelector('button')?.focus();

    const handlePreviewKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setPreviewSelection(null);
      }
      if (event.key !== 'Tab') return;

      const buttons = [...dialog.querySelectorAll('button:not(:disabled)')];
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener('keydown', handlePreviewKey);
    return () => {
      document.removeEventListener('keydown', handlePreviewKey);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [previewSelection]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [messages, isThinking, expandedExports]);

  const getFormatLabel = (format) => {
    const key = String(format || 'pdf').toLowerCase();
    return FORMAT_NAMES[key] || key.toUpperCase();
  };

  const getArtifactUrl = (artifactPath) => {
    try {
      const serviceUrl = conf_prop.get('serviceUrl');
      return new URL(artifactPath, new URL(serviceUrl).origin).href;
    } catch {
      return artifactPath;
    }
  };

  const getExportContext = (index) => {
    const exportOnlyPattern =
      /^(?:(?:please|can you)\s+)?(?:(?:give|send|make|create|generate|export|download)\s+(?:(?:me|a|an|the|as|in|to)\s+)*|(?:i want|i need)\s+(?:a|an|the)?\s*)(?:pdf|ppt|pptx|powerpoint|presentation|excel|xlsx|csv|report)(?:\s+(?:file|report|presentation|document))?[.!?]*$/i;

    const exportSuffixPattern =
      /\s+(?:and|also|plus)\s+(?:(?:please|can you)\s+)?(?:give|create|generate|make|prepare|export|download)\b[\s\S]*$/i;

    for (let i = index - 1; i >= 0; i -= 1) {
      const item = messages[i];

      if (item.role !== 'user') continue;

      const question = String(item.content || '').trim();

      if (!question || exportOnlyPattern.test(question)) {
        continue;
      }

      const latestQuestion = question
        .replace(exportSuffixPattern, '')
        .trim();

      if (
        /build.*team|recommend.*team|staff.*team/i.test(latestQuestion)
      ) {
        return 'your latest team recommendation';
      }

      if (/compare|comparison/i.test(latestQuestion)) {
        return 'your latest candidate comparison';
      }

      if (/skill.*gap|missing skills/i.test(latestQuestion)) {
        return 'your latest skill gap analysis';
      }

      if (/find|search|show|list/i.test(latestQuestion)) {
        return 'your latest candidate search';
      }

      return 'your most recent analysis';
    }

    return 'your most recent analysis';
  };

  const cleanExportInstruction = (content) => {
    return String(content || '')
      .replace(
        /Choose a template and presentation settings to prepare your export\.\s*The report will use your most recent result\./gi,
        ''
      )
      .replace(
        /Your (?:PDF|PowerPoint|Excel|CSV) export is available\.\s*Choose a template and presentation settings to continue\./gi,
        ''
      )
      .trim();
  };

  const renderAssistantMessage = (content) => {
    if (!content) return null;

    const text = String(content);

    const artifactRegex =
      /\[([^\]]+)\]\((\/routes\/v1\/chat\/artifacts\/[^)]+)\)/g;

    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = artifactRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        const precedingText = text
          .slice(lastIndex, match.index)
          .replace(
            /Your (?:PDF|PowerPoint|Excel|CSV)(?: presentation| workbook| report)? is ready:\s*[^\n]+/i,
            ''
          )
          .trim();

        if (precedingText) {
          parts.push(
            <span key={`text-${lastIndex}`}>
              {precedingText}
            </span>
          );
        }
      }

      parts.push(
        <div
          key={`artifact-${match.index}`}
          className="skill-lens-file-card"
        >
          <div className="skill-lens-file-card-top">
            <div className="skill-lens-file-icon">
              ↓
            </div>

            <div className="skill-lens-file-details">
              <strong>Your report is ready</strong>
              <span>Generated successfully</span>
            </div>
          </div>

          <a
            href={getArtifactUrl(match[2])}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="skill-lens-file-download"
          >
            ↓ {match[1]}
          </a>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {text.slice(lastIndex)}
        </span>
      );
    }

    return parts;
  };

  const sendMessage = async () => {
    if (!message.trim() || requestPendingRef.current) return;

    requestPendingRef.current = true;
    const controller = new AbortController();
    activeRequestRef.current = controller;

    const userMessage = message.trim();

    setMessage('');

    setMessages((previous) => [
      ...previous,
      { role: 'user', content: userMessage },
    ]);

    setIsThinking(true);

    try {
      const data = await postJSON('/chat', {
        question: userMessage,
      }, { signal: controller.signal });

      if (controller.signal.aborted || activeRequestRef.current !== controller) return;

      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content:
            data.answer ||
            'I could not find an answer for your question.',
          export_options: data.export_options,
          artifact: data.artifact,
        },
      ]);
    } catch (error) {
      if (controller.signal.aborted || activeRequestRef.current !== controller) return;
      console.error('Chatbot error:', error);

      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content: 'Sorry, I could not process your request.',
        },
      ]);
    } finally {
      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null;
        requestPendingRef.current = false;
        setIsThinking(false);
      }
    }
  };

  const confirmExport = async (index, options, templateId) => {
    if (requestPendingRef.current) return;

    requestPendingRef.current = true;
    const controller = new AbortController();
    activeRequestRef.current = controller;

    const selected = exportSelections[index] || {};

    const payload = {
      artifact_type: options.artifact_type,
      template:
        templateId ||
        selected.template ||
        options.recommended_template,
      theme: selected.theme || options.theme || 'corporate',
      detail_level:
        selected.detail_level ||
        options.detail_level ||
        'standard',
    };

    setIsThinking(true);

    try {
      const data = await postJSON('/chat', {
        question: `__artifact_export__:${JSON.stringify(payload)}`,
      }, { signal: controller.signal });

      if (controller.signal.aborted || activeRequestRef.current !== controller) return;

      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content:
            data.answer ||
            'Unable to generate the requested file.',
          artifact: data.artifact,
        },
      ]);

      setExpandedExports((previous) => ({
        ...previous,
        [index]: false,
      }));
    } catch (error) {
      if (controller.signal.aborted || activeRequestRef.current !== controller) return;
      console.error('Export error:', error);

      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content: 'Unable to generate the file. Please try again.',
        },
      ]);
    } finally {
      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null;
        requestPendingRef.current = false;
        setIsThinking(false);
      }
    }
  };

  const toggleExportTemplates = (index) => {
    setExpandedExports((previous) => ({
      ...previous,
      [index]: !previous[index],
    }));
  };

  const renderExportOptions = (options, index) => {
    const format = String(
      options.artifact_type || 'pdf'
    ).toLowerCase();

    const formatLabel = getFormatLabel(format);

    const templates = Array.isArray(options.templates)
      ? [...options.templates]
      : [];

    templates.sort((a, b) => {
      const aRecommended =
        a.id === options.recommended_template ? 1 : 0;
      const bRecommended =
        b.id === options.recommended_template ? 1 : 0;

      return bRecommended - aRecommended;
    });

    const previewSrc = (id) =>
      `/template-previews/${format}__${id}.png`;

    return (
      <div className="skill-lens-export-panel">
        <div className="skill-lens-export-heading">
          <strong>
            {format === 'xlsx'
              ? 'Choose your Excel workbook'
              : `Choose your ${formatLabel} template`}
          </strong>

          <p>
            Preview a design and select Generate {formatLabel}
            to export your latest analysis.
          </p>
        </div>

        <div className="skill-lens-template-grid">
          {templates.map((template) => {
            const details =
              TEMPLATE_DETAILS[template.id] || {};

            const label =
              details.label ||
              template.label ||
              template.name ||
              template.id;

            const description =
              details.description ||
              template.description ||
              '';

            const recommended =
              template.id === options.recommended_template;

            return (
              <div
                key={template.id}
                className={`skill-lens-template-card ${
                  recommended ? 'recommended' : ''
                }`}
              >
                <button
                  type="button"
                  className="skill-lens-template-preview"
                  disabled={isThinking}
                  onClick={() =>
                    setPreviewSelection({
                      index,
                      format,
                      formatLabel,
                      template: {
                        ...template,
                        label,
                      },
                      options,
                    })
                  }
                >
                  <img
                    src={previewSrc(template.id)}
                    alt={`${label} preview`}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />

                  <span className="skill-lens-enlarge">
                    Enlarge ↗
                  </span>
                </button>

                <strong>{label}</strong>

                <p>{description}</p>

                {recommended && (
                  <span className="skill-lens-recommended">
                    ★ Suggested for this result
                  </span>
                )}

                <button
                  type="button"
                  className="skill-lens-generate-button"
                  disabled={isThinking}
                  onClick={() =>
                    confirmExport(index, options, template.id)
                  }
                >
                  <ExportFormatIcon format={format} />
                  Generate {formatLabel}
                </button>
              </div>
            );
          })}
        </div>

        {templates.length === 0 && (
          <p>No supported templates available for this format.</p>
        )}
      </div>
    );
  };

  const renderExportPrompt = (options, index) => {
    if (!options) return null;

    const formatLabel = getFormatLabel(options.artifact_type);
    const isExpanded = Boolean(expandedExports[index]);
    const context = getExportContext(index);

    return (
      <div className="skill-lens-export-prompt">
        <div className="skill-lens-export-card-header">
          <div className="skill-lens-export-card-icon">
            <ExportFormatIcon format={options.artifact_type} />
          </div>

          <div>
            <strong>{formatLabel} export</strong>

            <div className="skill-lens-export-card-subtitle">
              Ready to prepare
            </div>
          </div>
        </div>

        <p className="skill-lens-export-description">
          I'll prepare a {formatLabel} using {context}.
          Choose a template to continue.
        </p>

        <div className="skill-lens-export-actions">
          <button
            type="button"
            className="skill-lens-view-templates-button"
            aria-expanded={isExpanded}
            onClick={() => toggleExportTemplates(index)}
          >
            <ExportFormatIcon format={options.artifact_type} />
            {isExpanded
              ? 'Hide templates'
              : `Choose ${formatLabel} template`}

            <span aria-hidden="true">
              {isExpanded ? '⌃' : '›'}
            </span>
          </button>

          <span className="skill-lens-format-badge">
            <ExportFormatIcon format={options.artifact_type} />
            {formatLabel}
          </span>
        </div>

        {isExpanded && renderExportOptions(options, index)}
      </div>
    );
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.keyCode !== 229) {
      event.preventDefault();
      sendMessage();
    }
  };

  const chatWindowStyle = isMaximized
    ? {
        position: 'fixed',
        inset: '20px',
        width: 'auto',
        height: 'auto',
      }
    : {
        position: 'fixed',
        right: '28px',
        bottom: '28px',
        width: 'min(450px, calc(100vw - 56px))',
        height: 'min(650px, calc(100dvh - 56px))',
      };

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          className="skill-lens-floating-button"
          ref={launcherRef}
          onClick={() => setIsOpen(true)}
          title="Open Skill Lens AI"
          aria-label="Open Skill Lens AI"
        >
          <div className="skill-lens-floating-glow" />

          <svg
            viewBox="0 0 80 80"
            width="55"
            height="55"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <line
              x1="40"
              y1="17"
              x2="40"
              y2="9"
              stroke="#111"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle cx="40" cy="7" r="4" fill="#111" />

            <rect
              x="10"
              y="34"
              width="10"
              height="18"
              rx="5"
              fill="#111"
            />
            <rect
              x="60"
              y="34"
              width="10"
              height="18"
              rx="5"
              fill="#111"
            />

            <rect
              x="17"
              y="23"
              width="46"
              height="38"
              rx="12"
              fill="#111"
            />
            <rect
              x="21"
              y="27"
              width="38"
              height="30"
              rx="9"
              fill="#fff"
            />

            <circle cx="31" cy="40" r="5" fill="#111" />
            <circle cx="49" cy="40" r="5" fill="#111" />

            <circle cx="31" cy="40" r="2" fill="#D7F000" />
            <circle cx="49" cy="40" r="2" fill="#D7F000" />

            <path
              d="M33 48C36 51 44 51 47 48"
              stroke="#111"
              strokeWidth="3"
              strokeLinecap="round"
            />

            <path
              d="M51 13H69C73 13 76 16 76 20V29C76 33 73 36 69 36H63L58 41V36H51C47 36 44 33 44 29V20C44 16 47 13 51 13Z"
              fill="#111"
            />

            <rect
              x="51"
              y="19"
              width="18"
              height="3"
              rx="1.5"
              fill="#D7F000"
            />
            <rect
              x="51"
              y="25"
              width="12"
              height="3"
              rx="1.5"
              fill="#fff"
            />
          </svg>

          <span className="skill-lens-floating-label">
            AI
          </span>
        </button>
      )}

      {isOpen && (
        <div
          className={`skill-lens-chat-window skill-lens-premium ${
            isMaximized ? 'skill-lens-chat-maximized' : ''
          }`}
          style={chatWindowStyle}
          role="region"
          aria-label="Skill Lens AI chat"
        >
          <div className="skill-lens-header">
            <div className="skill-lens-header-left">
              <div className="skill-lens-header-logo">
                S
                <span className="skill-lens-logo-dot" />
              </div>

              <div>
                <div className="skill-lens-header-title">
                  Skill Lens <span>AI</span>
                </div>

                <div className="skill-lens-header-status">
                  <span className="skill-lens-online-dot" />
                  AI-powered talent assistant
                </div>
              </div>
            </div>
            <div className="skill-lens-header-actions">
              <button
                type="button"
                className="skill-lens-header-button"
                onClick={refreshChat}
                title="Start new chat"
                aria-label="Start new chat"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 11a8 8 0 1 0-2.4 6" />
                  <path d="M20 4v7h-7" />
                </svg>
              </button>

              <button
                type="button"
                className="skill-lens-header-button"
                onClick={() =>
                  setIsMaximized((previous) => !previous)
                }
                title={isMaximized ? 'Restore' : 'Maximize'}
                aria-label={isMaximized ? 'Restore chat' : 'Maximize chat'}
              >
                {isMaximized ? '⛶' : '□'}
              </button>

              <button
                type="button"
                className="skill-lens-header-button"
                onClick={() => {
                  setIsOpen(false);
                  setIsMaximized(false);
                }}
                title="Close"
                aria-label="Close chat"
              >
                ×
              </button>
            </div>
          </div>

          <div className="skill-lens-messages">
            {messages.length === 0 ? (
              <div className="skill-lens-welcome">
                <div className="skill-lens-welcome-robot">
                  <div className="skill-lens-robot-glow" />

                  <svg
                    viewBox="0 0 240 240"
                    width="155"
                    height="155"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Antenna */}
                    <line
                      x1="120"
                      y1="70"
                      x2="120"
                      y2="48"
                      stroke="#111111"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="120"
                      cy="39"
                      r="12"
                      fill="#111111"
                    />
                    <circle
                      cx="120"
                      cy="39"
                      r="4"
                      fill="#D7F000"
                    />

                    {/* Ears */}
                    <rect
                      x="31"
                      y="108"
                      width="28"
                      height="48"
                      rx="14"
                      fill="#111111"
                    />
                    <rect
                      x="181"
                      y="108"
                      width="28"
                      height="48"
                      rx="14"
                      fill="#111111"
                    />

                    {/* Robot head */}
                    <rect
                      x="50"
                      y="82"
                      width="140"
                      height="105"
                      rx="30"
                      fill="#111111"
                    />
                    <rect
                      x="59"
                      y="91"
                      width="122"
                      height="87"
                      rx="23"
                      fill="#FFFFFF"
                    />

                    {/* Eyes */}
                    <circle
                      cx="95"
                      cy="125"
                      r="15"
                      fill="#111111"
                    />
                    <circle
                      cx="95"
                      cy="125"
                      r="5"
                      fill="#D7F000"
                    />

                    <circle
                      cx="145"
                      cy="125"
                      r="15"
                      fill="#111111"
                    />
                    <circle
                      cx="145"
                      cy="125"
                      r="5"
                      fill="#D7F000"
                    />

                    {/* Smile */}
                    <path
                      d="M102 151C112 160 128 160 138 151"
                      stroke="#111111"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />

                    {/* Speech bubble */}
                    <rect
                      x="145"
                      y="28"
                      width="75"
                      height="48"
                      rx="15"
                      fill="#111111"
                    />
                    <path
                      d="M170 76L164 88L181 76"
                      fill="#111111"
                    />

                    <rect
                      x="158"
                      y="42"
                      width="48"
                      height="6"
                      rx="3"
                      fill="#D7F000"
                    />
                    <rect
                      x="158"
                      y="55"
                      width="34"
                      height="6"
                      rx="3"
                      fill="#FFFFFF"
                    />
                  </svg>
                </div>

                <h2>
                  Welcome to Skill Lens <span>AI</span>
                </h2>

                <p>
                  Your AI-powered talent assistant.
                  <br />
                  Discover and understand the right talent faster.
                </p>

                <div className="skill-lens-suggestions">
                  <button
                    type="button"
                    onClick={() =>
                      setMessage('Find Python developers')
                    }
                  >
                    ⌕ Find Python developers
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setMessage(
                        'Build a 5-member team for an AI project'
                      )
                    }
                  >
                    ◈ Build an AI project team
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setMessage(
                        'Compare Sagar Rudagi and Abhijeet Dhulekar for an AI Engineer role'
                      )
                    }
                  >
                    ⇄ Compare candidates
                  </button>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`skill-lens-message-row ${msg.role}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="skill-lens-mini-avatar">
                        S
                      </div>
                    )}

                    <div className="skill-lens-message-content">
                      <div
                        className={`skill-lens-message-bubble ${msg.role}`}
                      >
                        {msg.role === 'assistant'
                          ? renderAssistantMessage(
                              msg.export_options
                                ? cleanExportInstruction(msg.content)
                                : msg.content
                            )
                          : msg.content}

                        {msg.role === 'assistant' &&
                          renderExportPrompt(
                            msg.export_options,
                            index
                          )}
                      </div>
                    </div>
                  </div>
                ))}

                {isThinking && (
                  <div className="skill-lens-message-row assistant">
                    <div className="skill-lens-mini-avatar">
                      S
                    </div>

                    <div className="skill-lens-thinking" role="status">
                      <div className="skill-lens-thinking-dots">
                        <span />
                        <span />
                        <span />
                      </div>

                      <span>Searching talent...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <div className="skill-lens-input-area">
            <div className="skill-lens-input-wrapper">
              <input
                ref={inputRef}
                aria-label="Message Skill Lens AI"
                type="text"
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder={
                  isThinking
                    ? 'Searching talent...'
                    : 'Ask about your talent pool...'
                }
                className="skill-lens-input"
              />

              <button
                type="button"
                className={`skill-lens-send-button${isThinking ? ' skill-lens-stop-button' : ''}`}
                onClick={isThinking ? stopResponse : sendMessage}
                disabled={!isThinking && !message.trim()}
                title={isThinking ? 'Stop response' : 'Send message'}
                aria-label={isThinking ? 'Stop response' : 'Send message'}
              >
                {isThinking ? <span className="skill-lens-stop-square" aria-hidden="true" /> : '↑'}
              </button>
            </div>

            <div className="skill-lens-input-hint">
              Press Enter to send
              <span>•</span>
              Powered by Skill Lens AI
            </div>
          </div>
        </div>
      )}

      {previewSelection && (
        <div
          className="skill-lens-preview-overlay"
          role="presentation"
          onClick={() => setPreviewSelection(null)}
        >
          <div
            className="skill-lens-preview-dialog"
            ref={previewRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${previewSelection.template.label} preview`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="skill-lens-preview-header">
              <strong>
                {previewSelection.template.label}
              </strong>

              <button
                type="button"
                onClick={() => setPreviewSelection(null)}
                aria-label="Close preview"
              >
                ✕
              </button>
            </div>

            <p>
              Sample of the actual export layout. Your report
              will contain your own result data.
            </p>

            <img
              src={`/template-previews/${previewSelection.format}__${previewSelection.template.id}.png`}
              alt={`${previewSelection.template.label} full preview`}
            />

            <button
              type="button"
              className="skill-lens-generate-button"
              disabled={isThinking}
              onClick={() => {
                const {
                  index,
                  options,
                  template,
                } = previewSelection;

                setPreviewSelection(null);
                confirmExport(index, options, template.id);
              }}
            >
              <ExportFormatIcon format={previewSelection.format} />
              Generate {previewSelection.formatLabel}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .skill-lens-floating-button {
          position: fixed;
          right: 28px;
          bottom: 28px;
          width: 76px;
          height: 76px;
          border: 0;
          border-radius: 24px;
          background: #d7f000;
          color: #111;
          cursor: pointer;
          z-index: 9999;
          box-shadow: 0 10px 30px rgba(215,240,0,.35);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform .2s ease, box-shadow .2s ease;
        }

        .skill-lens-floating-button svg {
          position: relative;
          z-index: 1;
        }

        .skill-lens-floating-glow {
          position: absolute;
          inset: -5px;
          border-radius: 28px;
          border: 2px solid rgba(215,240,0,.45);
          animation: skillLensFloatPulse 2.5s infinite;
          pointer-events: none;
        }

        .skill-lens-floating-button:hover {
          transform: translateY(-3px) scale(1.03);
          box-shadow: 0 15px 38px rgba(215,240,0,.45);
        }

        .skill-lens-floating-label {
          position: absolute;
          right: -5px;
          bottom: -5px;
          background: #111;
          color: #d7f000;
          border: 2px solid white;
          border-radius: 20px;
          padding: 5px 7px;
          font-size: 10px;
          font-weight: 800;
          z-index: 2;
        }

        @keyframes skillLensFloatPulse {
          0%, 100% {
            opacity: .25;
            transform: scale(1);
          }
          50% {
            opacity: .7;
            transform: scale(1.04);
          }
        }

        .skill-lens-chat-window {
          background: white;
          border-radius: 22px;
          box-shadow: 0 20px 60px rgba(0,0,0,.24);
          z-index: 9999;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid rgba(0,0,0,.08);
        }

        .skill-lens-header {
          min-height: 76px;
          background: #111;
          color: white;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 3px solid #d7f000;
          flex-shrink: 0;
          box-sizing: border-box;
        }

        .skill-lens-header-left,
        .skill-lens-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .skill-lens-header-logo {
          width: 44px;
          height: 44px;
          border-radius: 13px;
          background: #d7f000;
          color: #111;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 21px;
          font-weight: 900;
          position: relative;
        }

        .skill-lens-logo-dot {
          position: absolute;
          width: 7px;
          height: 7px;
          right: 5px;
          bottom: 5px;
          border-radius: 50%;
          background: #111;
        }

        .skill-lens-header-title {
          font-size: 17px;
          font-weight: 750;
        }

        .skill-lens-header-title span {
          color: #d7f000;
        }

        .skill-lens-header-status {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 4px;
          font-size: 11px;
          color: #aaa;
        }

        .skill-lens-online-dot {
          width: 6px;
          height: 6px;
          background: #d7f000;
          border-radius: 50%;
        }

        .skill-lens-header-button {
          width: 36px;
          height: 36px;
          background: transparent;
          color: white;
          border: none;
          border-radius: 9px;
          cursor: pointer;
          font-size: 22px;
        }

        .skill-lens-header-button:hover {
          background: rgba(255,255,255,.1);
        }

        .skill-lens-messages {
          flex: 1;
          min-height: 0;
          padding: 20px;
          background: #f7f7f5;
          overflow-y: auto;
          scroll-behavior: smooth;
        }

        .skill-lens-welcome {
          min-height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .skill-lens-welcome-robot {
          position: relative;
          width: 165px;
          height: 165px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 5px;
          text-shadow: none;
        }

        .skill-lens-welcome-robot svg {
          position: relative;
          z-index: 1;
        }

        .skill-lens-robot-glow {
          position: absolute;
          width: 110px;
          height: 110px;
          border-radius: 50%;
          background: rgba(215,240,0,.25);
          filter: blur(25px);
          pointer-events: none;
        }

        .skill-lens-welcome h2 {
          font-size: 21px;
          color: #111;
          margin: 8px 0;
        }

        .skill-lens-welcome h2 span {
          color: #8c9f00;
        }

        .skill-lens-welcome p {
          font-size: 13px;
          color: #707070;
          line-height: 1.6;
        }

        .skill-lens-suggestions {
          width: 100%;
          max-width: 340px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 20px;
        }

        .skill-lens-suggestions button {
          padding: 11px 12px;
          border: 1px solid #e2e2e2;
          border-radius: 11px;
          background: white;
          color: #333;
          text-align: left;
          cursor: pointer;
          font-size: 12px;
        }

        .skill-lens-suggestions button:hover {
          background: #fbfdea;
          border-color: #cbdc00;
        }

        .skill-lens-message-row {
          display: flex;
          width: 100%;
          margin-bottom: 14px;
        }

        .skill-lens-message-row.user {
          justify-content: flex-end;
        }

        .skill-lens-message-row.assistant {
          justify-content: flex-start;
          align-items: flex-start;
          gap: 8px;
        }

        .skill-lens-mini-avatar {
          width: 28px;
          height: 28px;
          flex-shrink: 0;
          border-radius: 9px;
          background: #111;
          color: #d7f000;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 900;
        }

        .skill-lens-message-content {
          max-width: 88%;
          min-width: 0;
        }

        .skill-lens-message-bubble {
          padding: 11px 14px;
          border-radius: 13px;
          font-size: 13px;
          line-height: 1.6;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
        }

        .skill-lens-message-bubble.user {
          background: #d7f000;
          color: #111;
          border-bottom-right-radius: 4px;
        }

        .skill-lens-message-bubble.assistant {
          background: white;
          color: #222;
          border: 1px solid #e7e7e7;
          border-bottom-left-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,.04);
        }

        .skill-lens-export-prompt {
          margin-top: 16px;
          padding: 15px;
          border: 1px solid #e3e9d1;
          border-radius: 13px;
          background: #fcfdf7;
          white-space: normal;
        }

        .skill-lens-export-card-header {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-bottom: 12px;
        }

        .skill-lens-export-card-icon {
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          border-radius: 11px;
          background: #eaf3bb;
          color: #263200;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 23px;
        }

        .skill-lens-export-card-header strong {
          color: #172033;
          font-size: 14px;
        }

        .skill-lens-export-card-subtitle {
          color: #64748b;
          font-size: 11px;
          margin-top: 3px;
        }

        .skill-lens-export-description {
          color: #475569;
          font-size: 12px;
          line-height: 1.6;
          margin: 0 0 14px;
        }

        .skill-lens-export-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 9px;
        }

        .skill-lens-view-templates-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 11px 14px;
          border: none;
          border-radius: 9px;
          background: #111;
          color: #d7f000;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .skill-lens-view-templates-button:hover {
          background: #303030;
        }

        .skill-lens-format-badge {
          background: #eef2f7;
          color: #475569;
          border-radius: 20px;
          padding: 6px 10px;
          font-size: 10px;
          font-weight: 650;
        }

        .skill-lens-export-panel {
          margin-top: 15px;
          padding: 12px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          background: #f8fafc;
          white-space: normal;
        }

        .skill-lens-export-heading strong {
          display: block;
          font-size: 14px;
          color: #19324d;
        }

        .skill-lens-export-heading p {
          margin: 5px 0 14px;
          color: #52647c;
          font-size: 11px;
          line-height: 1.5;
        }

        .skill-lens-template-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0,1fr));
          gap: 12px;
        }

        .skill-lens-template-card {
          min-width: 0;
          padding: 9px;
          background: white;
          border: 1px solid #d6e0eb;
          border-radius: 11px;
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .skill-lens-template-card.recommended {
          border: 2px solid #a9c400;
          box-shadow: 0 3px 12px rgba(169,196,0,.12);
        }

        .skill-lens-template-preview {
          width: 100%;
          height: 145px;
          padding: 0;
          background: #f4f7fb;
          border: 1px solid #dce4ef;
          border-radius: 7px;
          overflow: hidden;
          position: relative;
          cursor: zoom-in;
        }

        .skill-lens-template-preview img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: top center;
        }

        .skill-lens-enlarge {
          position: absolute;
          right: 5px;
          bottom: 5px;
          padding: 4px 6px;
          border-radius: 5px;
          background: #1a3557;
          color: white;
          font-size: 9px;
        }

        .skill-lens-template-card strong {
          font-size: 12px;
          color: #19324d;
        }

        .skill-lens-template-card p {
          margin: 0;
          font-size: 11px;
          color: #51647b;
          line-height: 1.5;
          flex: 1;
        }

        .skill-lens-recommended {
          color: #577000;
          font-size: 10px;
          font-weight: 700;
        }

        .skill-lens-generate-button {
          width: 100%;
          padding: 10px;
          border: none;
          border-radius: 7px;
          background: #111;
          color: #d7f000;
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
          transition: background .2s ease;
        }

        .skill-lens-generate-button:hover:not(:disabled) {
          background: #303030;
        }

        .skill-lens-generate-button:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .skill-lens-file-card {
          margin-top: 12px;
          padding: 13px;
          border: 1px solid #dbe4ef;
          border-radius: 12px;
          background: #f8fafc;
          white-space: normal;
        }

        .skill-lens-file-card-top {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-bottom: 12px;
        }

        .skill-lens-file-icon {
          width: 42px;
          height: 42px;
          flex-shrink: 0;
          border-radius: 11px;
          background: #d7f000;
          color: #111;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 23px;
          font-weight: 800;
        }

        .skill-lens-file-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .skill-lens-file-details strong {
          font-size: 13px;
          color: #172033;
        }

        .skill-lens-file-details span {
          font-size: 11px;
          color: #16803c;
        }

        .skill-lens-file-download {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 11px 13px;
          border-radius: 9px;
          background: #111;
          color: #d7f000;
          text-decoration: none;
          font-size: 12px;
          font-weight: 700;
          text-align: center;
        }

        .skill-lens-file-download:hover {
          background: #303030;
        }

        .skill-lens-preview-overlay {
          position: fixed;
          inset: 0;
          z-index: 100000;
          background: rgba(13,27,47,.78);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .skill-lens-preview-dialog {
          background: white;
          border-radius: 12px;
          width: min(920px,96vw);
          max-height: 92vh;
          overflow-y: auto;
          padding: 16px;
          box-sizing: border-box;
        }

        .skill-lens-preview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .skill-lens-preview-header button {
          cursor: pointer;
          padding: 7px 11px;
        }

        .skill-lens-preview-dialog p {
          font-size: 12px;
          color: #607086;
        }

        .skill-lens-preview-dialog img {
          display: block;
          width: 100%;
          max-height: 65vh;
          object-fit: contain;
          background: #f4f7fb;
          margin: 12px 0;
        }

        .skill-lens-thinking {
          display: flex;
          align-items: center;
          gap: 9px;
          background: white;
          border: 1px solid #e7e7e7;
          border-radius: 13px;
          padding: 11px 13px;
          font-size: 12px;
          color: #777;
        }

        .skill-lens-thinking-dots {
          display: flex;
          gap: 3px;
        }

        .skill-lens-thinking-dots span {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #9aaa00;
          animation: skillLensThinking 1.2s infinite;
        }

        .skill-lens-thinking-dots span:nth-child(2) {
          animation-delay: .15s;
        }

        .skill-lens-thinking-dots span:nth-child(3) {
          animation-delay: .3s;
        }

        @keyframes skillLensThinking {
          0%, 60%, 100% {
            opacity: .25;
            transform: translateY(0);
          }
          30% {
            opacity: 1;
            transform: translateY(-2px);
          }
        }

        .skill-lens-input-area {
          padding: 11px 14px 10px;
          background: white;
          border-top: 1px solid #e7e7e7;
          flex-shrink: 0;
        }

        .skill-lens-input-wrapper {
          display: flex;
          align-items: center;
          gap: 7px;
          border: 1px solid #d8d8d8;
          border-radius: 12px;
          padding: 4px 4px 4px 13px;
        }

        .skill-lens-input-wrapper:focus-within {
          border-color: #b8ca00;
          box-shadow: 0 0 0 3px rgba(215,240,0,.13);
        }

        .skill-lens-input {
          flex: 1;
          min-width: 0;
          border: none;
          outline: none;
          padding: 9px 2px;
          font-size: 13px;
          background: transparent;
          color: #222;
        }

        .skill-lens-send-button {
          width: 34px;
          height: 34px;
          border: none;
          border-radius: 9px;
          background: #d7f000;
          color: #111;
          font-size: 19px;
          font-weight: 900;
          cursor: pointer;
        }

        .skill-lens-send-button:disabled {
          background: #eee;
          color: #aaa;
          cursor: not-allowed;
        }

        .skill-lens-input-hint {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 6px;
          margin-top: 6px;
          font-size: 9px;
          color: #a0a0a0;
        }

        @media (max-width: 600px) {
          .skill-lens-chat-window {
            left: 10px !important;
            right: 10px !important;
            bottom: 10px !important;
            width: auto !important;
            top: 10px !important;
            height: calc(100dvh - 20px) !important;
            border-radius: 18px;
          }

          .skill-lens-message-content {
            max-width: 92%;
          }

          .skill-lens-messages {
            padding: 15px;
          }

          .skill-lens-template-grid {
            grid-template-columns: 1fr;
          }

          .skill-lens-floating-button {
            right: 18px;
            bottom: 18px;
          }
        }
      `}</style>
    </>
  );
};

export default SkillLensChatbot;
