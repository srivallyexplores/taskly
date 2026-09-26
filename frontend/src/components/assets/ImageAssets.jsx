import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// SVG Illustrations Component
export const EmptyStateIllustration = ({ type = 'tasks', className = '' }) => {
  const illustrations = {
    tasks: (
      <svg viewBox="0 0 400 300" className={`w-full h-full ${className}`}>
        <defs>
          <linearGradient id="taskGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>
        
        {/* Background */}
        <rect width="400" height="300" fill="url(#taskGradient)" opacity="0.1" rx="20" />
        
        {/* Checklist */}
        <g transform="translate(100, 80)">
          <rect x="0" y="0" width="200" height="140" fill="white" rx="12" stroke="#e5e7eb" strokeWidth="2" />
          
          {/* Checkboxes */}
          <circle cx="25" cy="30" r="8" fill="#10b981" />
          <path d="M20 30 L24 34 L30 26" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          
          <circle cx="25" cy="60" r="8" fill="#10b981" />
          <path d="M20 60 L24 64 L30 56" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          
          <circle cx="25" cy="90" r="8" fill="#e5e7eb" />
          <circle cx="25" cy="120" r="8" fill="#e5e7eb" />
          
          {/* Lines */}
          <line x1="45" y1="30" x2="170" y2="30" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" />
          <line x1="45" y1="60" x2="150" y2="60" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" />
          <line x1="45" y1="90" x2="160" y2="90" stroke="#e5e7eb" strokeWidth="2" strokeLinecap="round" />
          <line x1="45" y1="120" x2="140" y2="120" stroke="#e5e7eb" strokeWidth="2" strokeLinecap="round" />
        </g>
        
        {/* Floating elements */}
        <motion.circle
          cx="320"
          cy="100"
          r="6"
          fill="#3b82f6"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.circle
          cx="80"
          cy="200"
          r="4"
          fill="#10b981"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
      </svg>
    ),
    
    projects: (
      <svg viewBox="0 0 400 300" className={`w-full h-full ${className}`}>
        <defs>
          <linearGradient id="projectGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        
        {/* Background */}
        <rect width="400" height="300" fill="url(#projectGradient)" opacity="0.1" rx="20" />
        
        {/* Folder */}
        <g transform="translate(150, 100)">
          <path d="M0 20 L20 0 L80 0 L100 20 L100 80 L0 80 Z" fill="#fbbf24" />
          <rect x="0" y="20" width="100" height="60" fill="#f59e0b" />
          
          {/* Documents */}
          <rect x="15" y="35" width="70" height="8" fill="white" opacity="0.8" rx="2" />
          <rect x="15" y="48" width="50" height="8" fill="white" opacity="0.8" rx="2" />
          <rect x="15" y="61" width="60" height="8" fill="white" opacity="0.8" rx="2" />
        </g>
        
        {/* Floating icons */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <circle cx="300" cy="120" r="20" fill="#3b82f6" opacity="0.2" />
          <path d="M295 120 L300 115 L305 120 L300 125 Z" fill="#3b82f6" />
        </motion.g>
      </svg>
    ),
    
    analytics: (
      <svg viewBox="0 0 400 300" className={`w-full h-full ${className}`}>
        <defs>
          <linearGradient id="analyticsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#0891b2" />
          </linearGradient>
        </defs>
        
        {/* Background */}
        <rect width="400" height="300" fill="url(#analyticsGradient)" opacity="0.1" rx="20" />
        
        {/* Chart */}
        <g transform="translate(100, 80)">
          <rect x="0" y="0" width="200" height="140" fill="white" rx="8" stroke="#e5e7eb" strokeWidth="2" />
          
          {/* Bars */}
          <rect x="30" y="100" width="20" height="20" fill="#3b82f6" />
          <rect x="60" y="80" width="20" height="40" fill="#10b981" />
          <rect x="90" y="60" width="20" height="60" fill="#f59e0b" />
          <rect x="120" y="90" width="20" height="30" fill="#ef4444" />
          <rect x="150" y="70" width="20" height="50" fill="#8b5cf6" />
          
          {/* Grid lines */}
          <line x1="20" y1="120" x2="180" y2="120" stroke="#f3f4f6" strokeWidth="1" />
          <line x1="20" y1="100" x2="180" y2="100" stroke="#f3f4f6" strokeWidth="1" />
          <line x1="20" y1="80" x2="180" y2="80" stroke="#f3f4f6" strokeWidth="1" />
          <line x1="20" y1="60" x2="180" y2="60" stroke="#f3f4f6" strokeWidth="1" />
        </g>
        
        {/* Trend line */}
        <motion.path
          d="M320 180 Q340 160 360 140"
          stroke="#10b981"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    ),
    
    team: (
      <svg viewBox="0 0 400 300" className={`w-full h-full ${className}`}>
        <defs>
          <linearGradient id="teamGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>
        
        {/* Background */}
        <rect width="400" height="300" fill="url(#teamGradient)" opacity="0.1" rx="20" />
        
        {/* People */}
        <g transform="translate(150, 100)">
          {/* Person 1 */}
          <circle cx="30" cy="30" r="15" fill="#3b82f6" />
          <rect x="20" y="45" width="20" height="25" fill="#3b82f6" rx="10" />
          
          {/* Person 2 */}
          <circle cx="70" cy="30" r="15" fill="#10b981" />
          <rect x="60" y="45" width="20" height="25" fill="#10b981" rx="10" />
          
          {/* Person 3 */}
          <circle cx="50" cy="60" r="15" fill="#f59e0b" />
          <rect x="40" y="75" width="20" height="25" fill="#f59e0b" rx="10" />
        </g>
        
        {/* Connection lines */}
        <motion.line
          x1="180"
          y1="130"
          x2="220"
          y2="130"
          stroke="#d1d5db"
          strokeWidth="2"
          strokeDasharray="5,5"
          animate={{ strokeDashoffset: [0, 10] }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <motion.line
          x1="200"
          y1="130"
          x2="200"
          y2="160"
          stroke="#d1d5db"
          strokeWidth="2"
          strokeDasharray="5,5"
          animate={{ strokeDashoffset: [0, 10] }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear", delay: 0.5 }}
        />
      </svg>
    ),
    
    achievements: (
      <svg viewBox="0 0 400 300" className={`w-full h-full ${className}`}>
        <defs>
          <linearGradient id="achievementGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
        
        {/* Background */}
        <rect width="400" height="300" fill="url(#achievementGradient)" opacity="0.1" rx="20" />
        
        {/* Trophy */}
        <g transform="translate(170, 80)">
          {/* Cup */}
          <path d="M20 40 L20 80 Q20 90 30 90 L50 90 Q60 90 60 80 L60 40 Z" fill="#fbbf24" />
          
          {/* Handles */}
          <path d="M15 50 Q10 50 10 60 Q10 70 15 70" stroke="#f59e0b" strokeWidth="3" fill="none" />
          <path d="M65 50 Q70 50 70 60 Q70 70 65 70" stroke="#f59e0b" strokeWidth="3" fill="none" />
          
          {/* Base */}
          <rect x="25" y="90" width="30" height="8" fill="#d97706" rx="4" />
          <rect x="30" y="98" width="20" height="12" fill="#92400e" rx="2" />
          
          {/* Star */}
          <motion.path
            d="M40 25 L42 31 L48 31 L43 35 L45 41 L40 37 L35 41 L37 35 L32 31 L38 31 Z"
            fill="#fbbf24"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </g>
        
        {/* Sparkles */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          <circle cx="120" cy="120" r="3" fill="#fbbf24" />
          <circle cx="280" cy="160" r="2" fill="#f59e0b" />
          <circle cx="320" cy="100" r="2" fill="#fbbf24" />
        </motion.g>
      </svg>
    )
  };
  
  return illustrations[type] || illustrations.tasks;
};

// Hero Section Illustration
export const HeroIllustration = ({ className = '' }) => {
  return (
    <svg viewBox="0 0 600 400" className={`w-full h-full ${className}`}>
      <defs>
        <linearGradient id="heroGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Background */}
      <rect width="600" height="400" fill="url(#heroGradient)" opacity="0.1" />
      
      {/* Main dashboard mockup */}
      <g transform="translate(100, 50)">
        <rect x="0" y="0" width="400" height="300" fill="white" rx="16" stroke="#e5e7eb" strokeWidth="2" filter="url(#glow)" />
        
        {/* Header */}
        <rect x="0" y="0" width="400" height="60" fill="#f8fafc" rx="16" />
        <circle cx="30" cy="30" r="8" fill="#ef4444" />
        <circle cx="50" cy="30" r="8" fill="#f59e0b" />
        <circle cx="70" cy="30" r="8" fill="#10b981" />
        
        {/* Sidebar */}
        <rect x="20" y="80" width="100" height="200" fill="#f1f5f9" rx="8" />
        
        {/* Content area */}
        <rect x="140" y="80" width="240" height="200" fill="white" rx="8" />
        
        {/* Cards */}
        <motion.rect
          x="160" y="100" width="200" height="40" fill="#3b82f6" rx="6"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.rect
          x="160" y="150" width="200" height="40" fill="#10b981" rx="6"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
        <motion.rect
          x="160" y="200" width="200" height="40" fill="#f59e0b" rx="6"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
      </g>
      
      {/* Floating elements */}
      <motion.circle
        cx="50" cy="100" r="8" fill="#3b82f6" opacity="0.6"
        animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.circle
        cx="550" cy="150" r="6" fill="#8b5cf6" opacity="0.6"
        animate={{ y: [0, -15, 0], x: [0, -8, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.circle
        cx="80" cy="300" r="4" fill="#06b6d4" opacity="0.6"
        animate={{ y: [0, -10, 0], x: [0, 5, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
    </svg>
  );
};

// Feature Showcase Illustration
export const FeatureIllustration = ({ feature, className = '' }) => {
  const features = {
    productivity: (
      <svg viewBox="0 0 300 200" className={`w-full h-full ${className}`}>
        <defs>
          <linearGradient id="productivityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
        
        {/* Speedometer */}
        <g transform="translate(150, 100)">
          <circle cx="0" cy="0" r="60" fill="none" stroke="#e5e7eb" strokeWidth="8" />
          <motion.circle
            cx="0" cy="0" r="60" fill="none" stroke="url(#productivityGradient)" strokeWidth="8"
            strokeDasharray="377" strokeDashoffset="94"
            strokeLinecap="round"
            animate={{ strokeDashoffset: [377, 94] }}
            transition={{ duration: 2, ease: "easeOut" }}
          />
          
          {/* Needle */}
          <motion.line
            x1="0" y1="0" x2="0" y2="-40"
            stroke="#374151" strokeWidth="3" strokeLinecap="round"
            animate={{ rotate: [0, 180] }}
            transition={{ duration: 2, ease: "easeOut" }}
          />
          
          {/* Center dot */}
          <circle cx="0" cy="0" r="4" fill="#374151" />
        </g>
        
        {/* Progress indicators */}
        <motion.rect
          x="50" y="160" width="60" height="8" fill="#10b981" rx="4"
          initial={{ width: 0 }}
          animate={{ width: 60 }}
          transition={{ duration: 1.5, delay: 0.5 }}
        />
        <motion.rect
          x="190" y="160" width="40" height="8" fill="#3b82f6" rx="4"
          initial={{ width: 0 }}
          animate={{ width: 40 }}
          transition={{ duration: 1.5, delay: 1 }}
        />
      </svg>
    ),
    
    collaboration: (
      <svg viewBox="0 0 300 200" className={`w-full h-full ${className}`}>
        <defs>
          <linearGradient id="collabGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        
        {/* Network nodes */}
        <g>
          <motion.circle
            cx="100" cy="80" r="20" fill="url(#collabGradient)"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.circle
            cx="200" cy="80" r="20" fill="url(#collabGradient)"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />
          <motion.circle
            cx="150" cy="140" r="20" fill="url(#collabGradient)"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          />
          
          {/* Connection lines */}
          <motion.line
            x1="100" y1="80" x2="200" y2="80"
            stroke="#8b5cf6" strokeWidth="3" strokeDasharray="5,5"
            animate={{ strokeDashoffset: [0, 10] }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <motion.line
            x1="100" y1="80" x2="150" y2="140"
            stroke="#8b5cf6" strokeWidth="3" strokeDasharray="5,5"
            animate={{ strokeDashoffset: [0, 10] }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear", delay: 0.3 }}
          />
          <motion.line
            x1="200" y1="80" x2="150" y2="140"
            stroke="#8b5cf6" strokeWidth="3" strokeDasharray="5,5"
            animate={{ strokeDashoffset: [0, 10] }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear", delay: 0.6 }}
          />
        </g>
      </svg>
    ),
    
    analytics: (
      <svg viewBox="0 0 300 200" className={`w-full h-full ${className}`}>
        <defs>
          <linearGradient id="analyticsFeatureGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#0891b2" />
          </linearGradient>
        </defs>
        
        {/* Chart bars */}
        <g transform="translate(50, 50)">
          <motion.rect
            x="20" y="80" width="30" height="40" fill="url(#analyticsFeatureGradient)" rx="4"
            initial={{ height: 0, y: 120 }}
            animate={{ height: 40, y: 80 }}
            transition={{ duration: 1, delay: 0.2 }}
          />
          <motion.rect
            x="60" y="60" width="30" height="60" fill="url(#analyticsFeatureGradient)" rx="4"
            initial={{ height: 0, y: 120 }}
            animate={{ height: 60, y: 60 }}
            transition={{ duration: 1, delay: 0.4 }}
          />
          <motion.rect
            x="100" y="40" width="30" height="80" fill="url(#analyticsFeatureGradient)" rx="4"
            initial={{ height: 0, y: 120 }}
            animate={{ height: 80, y: 40 }}
            transition={{ duration: 1, delay: 0.6 }}
          />
          <motion.rect
            x="140" y="70" width="30" height="50" fill="url(#analyticsFeatureGradient)" rx="4"
            initial={{ height: 0, y: 120 }}
            animate={{ height: 50, y: 70 }}
            transition={{ duration: 1, delay: 0.8 }}
          />
          <motion.rect
            x="180" y="50" width="30" height="70" fill="url(#analyticsFeatureGradient)" rx="4"
            initial={{ height: 0, y: 120 }}
            animate={{ height: 70, y: 50 }}
            transition={{ duration: 1, delay: 1 }}
          />
        </g>
        
        {/* Trend arrow */}
        <motion.path
          d="M220 140 L260 100 L250 110 M260 100 L250 90"
          stroke="#10b981" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, delay: 1.2 }}
        />
      </svg>
    )
  };
  
  return features[feature] || features.productivity;
};

// Loading Animation
export const LoadingIllustration = ({ className = '' }) => {
  return (
    <svg viewBox="0 0 200 200" className={`w-full h-full ${className}`}>
      <defs>
        <linearGradient id="loadingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      
      <motion.circle
        cx="100" cy="100" r="40"
        fill="none" stroke="url(#loadingGradient)" strokeWidth="8"
        strokeDasharray="251" strokeDashoffset="251"
        strokeLinecap="round"
        animate={{ strokeDashoffset: [251, 0, 251] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      
      <motion.circle
        cx="100" cy="100" r="20"
        fill="url(#loadingGradient)"
        animate={{ scale: [0.8, 1.2, 0.8] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
};

// Success Animation
export const SuccessIllustration = ({ className = '' }) => {
  return (
    <svg viewBox="0 0 200 200" className={`w-full h-full ${className}`}>
      <defs>
        <linearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      
      <motion.circle
        cx="100" cy="100" r="60"
        fill="url(#successGradient)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 10 }}
      />
      
      <motion.path
        d="M70 100 L90 120 L130 80"
        stroke="white" strokeWidth="8" fill="none"
        strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
      />
    </svg>
  );
};

// Error Animation
export const ErrorIllustration = ({ className = '' }) => {
  return (
    <svg viewBox="0 0 200 200" className={`w-full h-full ${className}`}>
      <defs>
        <linearGradient id="errorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
      </defs>
      
      <motion.circle
        cx="100" cy="100" r="60"
        fill="url(#errorGradient)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 10 }}
      />
      
      <motion.g
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <line x1="80" y1="80" x2="120" y2="120" stroke="white" strokeWidth="8" strokeLinecap="round" />
        <line x1="120" y1="80" x2="80" y2="120" stroke="white" strokeWidth="8" strokeLinecap="round" />
      </motion.g>
    </svg>
  );
};

// Onboarding Illustrations
export const OnboardingIllustration = ({ step, className = '' }) => {
  const steps = {
    welcome: (
      <svg viewBox="0 0 400 300" className={`w-full h-full ${className}`}>
        <defs>
          <linearGradient id="welcomeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        
        {/* Welcome gesture */}
        <g transform="translate(200, 150)">
          <motion.circle
            cx="0" cy="0" r="80"
            fill="url(#welcomeGradient)" opacity="0.2"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Hand wave */}
          <motion.g
            animate={{ rotate: [0, 20, -20, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            <path d="M-20 -10 Q-10 -20 0 -10 Q10 -20 20 -10 Q10 0 0 10 Q-10 0 -20 -10" fill="#fbbf24" />
          </motion.g>
          
          {/* Sparkles */}
          <motion.circle
            cx="-60" cy="-40" r="3" fill="#fbbf24"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
          />
          <motion.circle
            cx="60" cy="-30" r="2" fill="#3b82f6"
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: 0.8 }}
          />
        </g>
      </svg>
    ),
    
    setup: (
      <svg viewBox="0 0 400 300" className={`w-full h-full ${className}`}>
        <defs>
          <linearGradient id="setupGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
        
        {/* Gear animation */}
        <g transform="translate(200, 150)">
          <motion.path
            d="M-30 -10 L-20 -30 L20 -30 L30 -10 L30 10 L20 30 L-20 30 L-30 10 Z"
            fill="url(#setupGradient)"
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
          
          <circle cx="0" cy="0" r="15" fill="white" />
          
          {/* Smaller gears */}
          <motion.g transform="translate(-60, -40)">
            <path
              d="M-15 -5 L-10 -15 L10 -15 L15 -5 L15 5 L10 15 L-10 15 L-15 5 Z"
              fill="#3b82f6"
              animate={{ rotate: -360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            <circle cx="0" cy="0" r="8" fill="white" />
          </motion.g>
        </g>
      </svg>
    ),
    
    complete: (
      <svg viewBox="0 0 400 300" className={`w-full h-full ${className}`}>
        <defs>
          <linearGradient id="completeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
        
        {/* Trophy */}
        <g transform="translate(200, 150)">
          <motion.path
            d="M-30 -20 L-30 20 Q-30 30 -20 30 L20 30 Q30 30 30 20 L30 -20 Z"
            fill="url(#completeGradient)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 10 }}
          />
          
          {/* Base */}
          <rect x="-20" y="30" width="40" height="10" fill="#d97706" rx="5" />
          
          {/* Star */}
          <motion.path
            d="M0 -35 L3 -25 L13 -25 L5 -17 L8 -7 L0 -15 L-8 -7 L-5 -17 L-13 -25 L-3 -25 Z"
            fill="#fbbf24"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        </g>
        
        {/* Confetti */}
        {[...Array(8)].map((_, i) => (
          <motion.rect
            key={i}
            x={100 + i * 30}
            y={50}
            width="4"
            height="4"
            fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][i % 4]}
            animate={{
              y: [50, 250],
              rotate: [0, 360],
              opacity: [1, 0]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeOut"
            }}
          />
        ))}
      </svg>
    )
  };
  
  return steps[step] || steps.welcome;
};

export default {
  EmptyStateIllustration,
  HeroIllustration,
  FeatureIllustration,
  LoadingIllustration,
  SuccessIllustration,
  ErrorIllustration,
  OnboardingIllustration
};