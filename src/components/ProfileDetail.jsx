'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Building, Star, Mail, Linkedin, ExternalLink, Award, GraduationCap, Briefcase, FileText, Globe, Clock, CheckCircle } from 'lucide-react';
import Avatar from './Avatar';

const READINESS_BADGE_COLORS = {
  'Ready Now':    { bg: 'rgba(52,211,153,0.18)', text: '#6ee7b7' },
  'Nearly Ready': { bg: 'rgba(96,165,250,0.18)', text: '#93c5fd' },
  'Developing':   { bg: 'rgba(245,158,11,0.18)', text: '#fbbf24' },
  'Not Ready':    { bg: 'rgba(239,68,68,0.18)',  text: '#fca5a5' },
};

function formatEducationEntry(edu) {
  if (typeof edu === 'string') return edu;
  if (edu && typeof edu === 'object') {
    const { year, degree, ...rest } = edu;
    const institution = Object.values(rest).find((v) => typeof v === 'string') || '';
    return [degree, institution, year].filter(Boolean).join(', ');
  }
  return String(edu ?? '');
}

export default function ProfileDetail({ profile, onClose }) {
  // State
  const [activeTab, setActiveTab] = useState('overview');

  // Debug logging
  console.log('ProfileDetail rendered with profile:', {
    name: profile.name,
    web_enhanced: profile.web_enhanced,
    web_structured_summary: profile.web_structured_summary,
    web_source_urls: profile.web_source_urls
  });

  // Tab Configuration
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Briefcase },
    { id: 'matters', label: 'Matters', icon: FileText },
    { id: 'publications', label: 'Publications', icon: FileText },
    { id: 'competencies', label: 'Skills', icon: Award },
    { id: 'webdata', label: 'Web Data', icon: Globe, show: profile.web_enhanced },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full flex flex-col text-white"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <Avatar
              src={profile.image_url}
              name={profile.name}
              size={80}
              className="border-2 border-gray-600"
            />
            <div>
              <h2 className="text-2xl font-bold text-white">{profile.name}</h2>
              {profile.title && <p className="text-lg text-gray-300">{profile.title}</p>}
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                {profile.location && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.composite_score && (
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4" />
                    <span>{profile.composite_score}% Match</span>
                  </div>
                )}
                {profile.skill_readiness && (
                  <div
                    className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{
                      background: READINESS_BADGE_COLORS[profile.skill_readiness.classification]?.bg ?? 'rgba(245,158,11,0.15)',
                      color: READINESS_BADGE_COLORS[profile.skill_readiness.classification]?.text ?? '#fbbf24',
                    }}
                  >
                    <Award className="w-3 h-3" />
                    <span>
                      {profile.skill_readiness.classification}
                      {typeof profile.skill_readiness.skill_readiness_score === 'number'
                        ? ` · ${Math.round(profile.skill_readiness.skill_readiness_score)}%`
                        : ''}
                    </span>
                  </div>
                )}
                {profile.web_enhanced && (
                  <div className="flex items-center space-x-1 text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span>Web Enhanced</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          // Skip web data tab if profile is not web enhanced
          if (tab.id === 'webdata' && !profile.web_enhanced) {
            console.log('Skipping web data tab because profile.web_enhanced is:', profile.web_enhanced);
            return null;
          }
          console.log('Rendering tab:', tab.id, 'for profile:', profile.name, 'web_enhanced:', profile.web_enhanced);
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-gray-400 border-b-2 border-gray-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Practice Areas */}
            {profile.practice_areas && profile.practice_areas.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                  <Building className="w-5 h-5" />
                  <span>Practice Areas</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile.practice_areas.map((area, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-white text-sm rounded-full" style={{ backgroundColor: '#4b5563' }}
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Bio */}
            {(profile.bio || profile.profile_text) && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Biography</h3>
                <p className="text-gray-300 leading-relaxed">
                  {profile.bio || profile.profile_text}
                </p>
              </div>
            )}

            {/* Education */}
            {profile.education && (Array.isArray(profile.education) ? profile.education.length > 0 : true) && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                  <GraduationCap className="w-5 h-5" />
                  <span>Education</span>
                </h3>
                <ul className="space-y-2">
                  {(Array.isArray(profile.education) ? profile.education : [profile.education]).map((edu, index) => (
                    <li key={index} className="text-gray-300">{formatEducationEntry(edu)}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recognitions */}
            {profile.recognitions && profile.recognitions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                  <Award className="w-5 h-5" />
                  <span>Recognitions</span>
                </h3>
                <ul className="space-y-2">
                  {profile.recognitions.map((recognition, index) => (
                    <li key={index} className="text-gray-300">{recognition}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
              <div className="space-y-2">
                {profile.contact?.email && (
                  <div className="flex items-center space-x-2 text-gray-300">
                    <Mail className="w-4 h-4" />
                    <a href={`mailto:${profile.contact.email}`} className="hover:text-gray-400">
                      {profile.contact.email}
                    </a>
                  </div>
                )}
                {profile.linkedin && (
                  <div className="flex items-center space-x-2 text-gray-300">
                    <Linkedin className="w-4 h-4" />
                    <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-gray-400">
                      LinkedIn Profile
                    </a>
                  </div>
                )}
                {profile.source_url && (
                  <div className="flex items-center space-x-2 text-gray-300">
                    <ExternalLink className="w-4 h-4" />
                    <a href={profile.source_url} target="_blank" rel="noopener noreferrer" className="hover:text-gray-400">
                      View Full Profile
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Matters Tab */}
        {activeTab === 'matters' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Representative Matters</h3>
            {profile.representative_matters && profile.representative_matters.length > 0 ? (
              <div className="space-y-4">
                {profile.representative_matters.map((matter, index) => (
                  <div key={index} className="p-4 bg-gray-800 rounded-lg">
                    {typeof matter === 'string' ? (
                      <p className="text-gray-300">{matter}</p>
                    ) : (
                      <div>
                        {matter.client && (
                          <p className="font-medium text-white mb-1">Client: {matter.client}</p>
                        )}
                        {matter.description && (
                          <p className="text-gray-300">{matter.description}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No representative matters available.</p>
            )}
          </div>
        )}

        {/* Publications Tab */}
        {activeTab === 'publications' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Publications</h3>
            {profile.publications && profile.publications.length > 0 ? (
              <div className="space-y-4">
                {profile.publications.map((pub, index) => (
                  <div key={index} className="p-4 bg-gray-800 rounded-lg">
                    {typeof pub === 'string' ? (
                      <p className="text-gray-300">{pub}</p>
                    ) : (
                      <div>
                        <p className="font-medium text-white mb-1">
                          {pub.title || 'Untitled Publication'}
                        </p>
                        {pub.url && (
                          <a
                            href={pub.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-blue-300 text-sm"
                          >
                            Read Publication →
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No publications available.</p>
            )}
          </div>
        )}

        {/* Skills Tab */}
        {activeTab === 'competencies' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Top Skill Matches</h3>
            {profile.top_competency_matches && profile.top_competency_matches.length > 0 ? (
              <div className="space-y-3">
                {profile.top_competency_matches.map((comp, index) => (
                  <div key={index} className="p-4 bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 font-medium">{comp.match_percent}%</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="text-sm text-gray-400">{comp.skill_family}</span>
                      <span className="text-gray-400">→</span>
                      <p className="font-medium text-white mb-1">{comp.group_item}</p>
                      <span className="text-gray-400">→</span>
                      <p className="font-medium text-white mb-1">{comp.competency}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No skill matches available.</p>
            )}
          </div>
        )}

        {/* Web Data Tab */}
        {activeTab === 'webdata' && profile.web_enhanced && (
          <div className="space-y-6">
            {/* Web Enhancement Status */}
            <div className="flex items-center space-x-2 text-green-400 mb-4">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Web Enhanced Profile</span>
              {profile.web_timestamp && (
                <div className="flex items-center space-x-1 text-gray-400 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>Updated: {new Date(profile.web_timestamp).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Enhanced Bio */}
            {profile.enhanced_bio && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Enhanced Biography</h3>
                <p className="text-gray-300 leading-relaxed">{profile.enhanced_bio}</p>
              </div>
            )}

            {/* Current Role */}
            {profile.web_current_role && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Current Role</h3>
                <p className="text-gray-300">{profile.web_current_role}</p>
              </div>
            )}

            {/* Web Expertise Areas */}
            {profile.web_expertise_areas && profile.web_expertise_areas.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Web-Discovered Expertise Areas</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.web_expertise_areas.map((area, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded-full"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Career Highlights */}
            {profile.web_career_highlights && profile.web_career_highlights.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Career Highlights</h3>
                <ul className="space-y-2">
                  {profile.web_career_highlights.map((highlight, index) => (
                    <li key={index} className="text-gray-300 flex items-start space-x-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Achievements */}
            {profile.web_achievements && profile.web_achievements.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                  <Award className="w-5 h-5" />
                  <span>Web-Discovered Achievements</span>
                </h3>
                <ul className="space-y-2">
                  {profile.web_achievements.map((achievement, index) => (
                    <li key={index} className="text-gray-300 flex items-start space-x-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span>{achievement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Web Education */}
            {profile.web_education && profile.web_education.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                  <GraduationCap className="w-5 h-5" />
                  <span>Web-Discovered Education</span>
                </h3>
                <ul className="space-y-2">
                  {profile.web_education.map((edu, index) => (
                    <li key={index} className="text-gray-300">{formatEducationEntry(edu)}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Professional Affiliations */}
            {profile.web_professional_affiliations && profile.web_professional_affiliations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Professional Affiliations</h3>
                <ul className="space-y-2">
                  {profile.web_professional_affiliations.map((affiliation, index) => (
                    <li key={index} className="text-gray-300 flex items-start space-x-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span>{affiliation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Other Notes */}
            {profile.web_other_notes && profile.web_other_notes.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Additional Information</h3>
                <ul className="space-y-2">
                  {profile.web_other_notes.map((note, index) => (
                    <li key={index} className="text-gray-300 flex items-start space-x-2">
                      <span className="text-green-400 mt-1">•</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Source URLs */}
            {profile.web_source_urls && profile.web_source_urls.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                  <Globe className="w-5 h-5" />
                  <span>Web Sources</span>
                </h3>
                <div className="space-y-2">
                  {profile.web_source_urls.map((url, index) => (
                    <div key={index} className="flex items-center space-x-2 text-gray-300">
                      <ExternalLink className="w-4 h-4" />
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-gray-400 text-sm truncate"
                      >
                        {url}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Structured Summary */}
            {profile.web_structured_summary && (
              <div>
                <h3 className="text-lg font-semibold mb-3">AI-Generated Summary</h3>
                <div className="p-4 bg-gray-800 rounded-lg">
                  {typeof profile.web_structured_summary === 'string' ? (
                    <p className="text-gray-300 leading-relaxed">{profile.web_structured_summary}</p>
                  ) : (
                    <div className="space-y-4">
                      {/* Current Role */}
                      {profile.web_structured_summary.current_role && (
                        <div>
                          <h5 className="font-medium text-white mb-2">Current Role</h5>
                          <p className="text-gray-300">{profile.web_structured_summary.current_role}</p>
                        </div>
                      )}

                      {/* Expertise */}
                      {profile.web_structured_summary.expertise && profile.web_structured_summary.expertise.length > 0 && (
                        <div>
                          <h5 className="font-medium text-white mb-2">Expertise Areas</h5>
                          <div className="flex flex-wrap gap-2">
                            {profile.web_structured_summary.expertise.map((area, index) => (
                              <span key={index} className="px-2 py-1 text-white text-xs rounded-full" style={{ backgroundColor: '#4b5563' }}>
                                {area}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Transactional Experience */}
                      {profile.web_structured_summary.transactional_experience && (
                        <div>
                          <h5 className="font-medium text-white mb-2">Transactional Experience</h5>
                          {profile.web_structured_summary.transactional_experience.deal_types && (
                            <div className="mb-2">
                              <span className="text-gray-400 text-sm">Deal Types: </span>
                              <span className="text-gray-300">{profile.web_structured_summary.transactional_experience.deal_types.join(', ')}</span>
                            </div>
                          )}
                          {profile.web_structured_summary.transactional_experience.notable_deals && (
                            <div>
                              <span className="text-gray-400 text-sm">Notable Deals: </span>
                              <div className="mt-1">
                                {profile.web_structured_summary.transactional_experience.notable_deals.slice(0, 3).map((deal, index) => (
                                  <div key={index} className="text-gray-300 text-sm">• {deal}</div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Professional Recognition */}
                      {profile.web_structured_summary.professional_recognition && (
                        <div>
                          <h5 className="font-medium text-white mb-2">Professional Recognition</h5>
                          {profile.web_structured_summary.professional_recognition.legal500_ranking && (
                            <div className="mb-1">
                              <span className="text-gray-400 text-sm">Legal 500: </span>
                              <span className="text-gray-300">{profile.web_structured_summary.professional_recognition.legal500_ranking}</span>
                            </div>
                          )}
                          {profile.web_structured_summary.professional_recognition.chambers_ranking && (
                            <div className="mb-1">
                              <span className="text-gray-400 text-sm">Chambers: </span>
                              <span className="text-gray-300">{profile.web_structured_summary.professional_recognition.chambers_ranking}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Education */}
                      {profile.web_structured_summary.education && profile.web_structured_summary.education.length > 0 && (
                        <div>
                          <h5 className="font-medium text-white mb-2">Education</h5>
                          <ul className="space-y-1">
                            {profile.web_structured_summary.education.map((edu, index) => (
                              <li key={index} className="text-gray-300 text-sm">• {formatEducationEntry(edu)}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Career Highlights */}
                      {profile.web_structured_summary.career_highlights && profile.web_structured_summary.career_highlights.length > 0 && (
                        <div>
                          <h5 className="font-medium text-white mb-2">Career Highlights</h5>
                          <ul className="space-y-1">
                            {profile.web_structured_summary.career_highlights.map((highlight, index) => (
                              <li key={index} className="text-gray-300 text-sm">• {highlight}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}