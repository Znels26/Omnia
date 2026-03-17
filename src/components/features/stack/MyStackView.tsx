'use client';
import { useState, useMemo } from 'react';
import { Layers, Share2, Check, ArrowRight, Sparkles, Globe, TrendingDown, TrendingUp, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

interface ToolData {
  feature: string;
  description: string;
  icon: string;
  monthlyUSD?: number; // approximate monthly cost in USD (0 = free tier exists)
  plan?: 'free' | 'plus' | 'pro'; // minimum Omnia plan required
}

// Map of popular tools → Omnia equivalent
const STACK_MAP: Record<string, ToolData> = {
  // Notes & docs
  'notion':         { feature: 'Notes + Doc Builder', description: 'Rich notes, folders, AI writing', icon: '📝', monthlyUSD: 10, plan: 'free' },
  'notionai':       { feature: 'Notes + Doc Builder', description: 'AI-powered notes and writing', icon: '📝', monthlyUSD: 18, plan: 'free' },
  'obsidian':       { feature: 'Notes', description: 'Organised notes with folders', icon: '📝', monthlyUSD: 10, plan: 'free' },
  'evernote':       { feature: 'Notes', description: 'Smart notes with search', icon: '📝', monthlyUSD: 10, plan: 'free' },
  'bear':           { feature: 'Notes', description: 'Markdown notes', icon: '📝', monthlyUSD: 3, plan: 'free' },
  'onenote':        { feature: 'Notes', description: 'Organised note-taking', icon: '📝', monthlyUSD: 0, plan: 'free' },
  'roamresearch':   { feature: 'Notes', description: 'Linked notes', icon: '📝', monthlyUSD: 15, plan: 'free' },
  'logseq':         { feature: 'Notes', description: 'Knowledge base notes', icon: '📝', monthlyUSD: 0, plan: 'free' },
  'mem':            { feature: 'Notes', description: 'AI-powered note taking', icon: '📝', monthlyUSD: 14, plan: 'free' },
  'craft':          { feature: 'Notes + Doc Builder', description: 'Beautiful documents and notes', icon: '📝', monthlyUSD: 5, plan: 'free' },
  // Tasks & project management
  'todoist':        { feature: 'Planner', description: 'Tasks, goals, and habits', icon: '✅', monthlyUSD: 4, plan: 'free' },
  'asana':          { feature: 'Planner', description: 'Task and project management', icon: '✅', monthlyUSD: 13, plan: 'free' },
  'trello':         { feature: 'Planner', description: 'Task boards and planning', icon: '✅', monthlyUSD: 5, plan: 'free' },
  'linear':         { feature: 'Planner', description: 'Issue and task tracking', icon: '✅', monthlyUSD: 8, plan: 'free' },
  'monday':         { feature: 'Planner', description: 'Work and project planning', icon: '✅', monthlyUSD: 12, plan: 'free' },
  'clickup':        { feature: 'Planner', description: 'Tasks and project management', icon: '✅', monthlyUSD: 7, plan: 'free' },
  'things':         { feature: 'Planner', description: 'Task management', icon: '✅', monthlyUSD: 0, plan: 'free' },
  'any.do':         { feature: 'Planner', description: 'To-do lists and planning', icon: '✅', monthlyUSD: 6, plan: 'free' },
  'anydo':          { feature: 'Planner', description: 'To-do lists and planning', icon: '✅', monthlyUSD: 6, plan: 'free' },
  'basecamp':       { feature: 'Planner', description: 'Project and task management', icon: '✅', monthlyUSD: 15, plan: 'free' },
  'height':         { feature: 'Planner', description: 'Task and project tracking', icon: '✅', monthlyUSD: 8, plan: 'free' },
  'notion calendar':{ feature: 'Planner + Reminders', description: 'Calendar and task management', icon: '✅', monthlyUSD: 8, plan: 'free' },
  // Habit tracking
  'habitica':       { feature: 'Planner — Habits', description: 'Habit tracking with streaks', icon: '✅', monthlyUSD: 9, plan: 'free' },
  'streaks':        { feature: 'Planner — Habits', description: 'Daily habit streaks', icon: '✅', monthlyUSD: 3, plan: 'free' },
  'habitify':       { feature: 'Planner — Habits', description: 'Habit tracking and streaks', icon: '✅', monthlyUSD: 8, plan: 'free' },
  'finch':          { feature: 'Planner — Habits', description: 'Daily habit building', icon: '✅', monthlyUSD: 5, plan: 'free' },
  'wayoflife':      { feature: 'Planner — Habits', description: 'Habit and lifestyle tracking', icon: '✅', monthlyUSD: 5, plan: 'free' },
  'strides':        { feature: 'Planner — Goals & Habits', description: 'Goal and habit tracking', icon: '✅', monthlyUSD: 5, plan: 'free' },
  'done':           { feature: 'Planner — Habits', description: 'Simple habit tracker', icon: '✅', monthlyUSD: 4, plan: 'free' },
  // AI assistants
  'chatgpt':        { feature: 'AI Assistant', description: 'Conversational AI with memory', icon: '🤖', monthlyUSD: 20, plan: 'free' },
  'claude':         { feature: 'AI Assistant', description: 'Powered by Claude under the hood', icon: '🤖', monthlyUSD: 20, plan: 'free' },
  'gemini':         { feature: 'AI Assistant', description: 'AI assistant + image gen', icon: '🤖', monthlyUSD: 20, plan: 'free' },
  'perplexity':     { feature: 'AI Assistant + Web Search', description: 'AI with live web search', icon: '🤖', monthlyUSD: 20, plan: 'free' },
  'copilot':        { feature: 'AI Assistant', description: 'AI writing and productivity', icon: '🤖', monthlyUSD: 20, plan: 'free' },
  'microsoftcopilot':{ feature: 'AI Assistant', description: 'AI writing and productivity', icon: '🤖', monthlyUSD: 20, plan: 'free' },
  'grok':           { feature: 'AI Assistant', description: 'Conversational AI assistant', icon: '🤖', monthlyUSD: 16, plan: 'free' },
  'poe':            { feature: 'AI Assistant', description: 'Multi-model AI access', icon: '🤖', monthlyUSD: 20, plan: 'free' },
  // AI writing / content tools
  'jasper':         { feature: 'Content Studio', description: 'AI content creation', icon: '✍️', monthlyUSD: 39, plan: 'free' },
  'copy.ai':        { feature: 'Content Studio', description: 'AI copywriting', icon: '✍️', monthlyUSD: 36, plan: 'free' },
  'copyai':         { feature: 'Content Studio', description: 'AI copywriting', icon: '✍️', monthlyUSD: 36, plan: 'free' },
  'writesonic':     { feature: 'Content Studio', description: 'AI content generation', icon: '✍️', monthlyUSD: 16, plan: 'free' },
  'rytr':           { feature: 'Content Studio', description: 'AI writing assistant', icon: '✍️', monthlyUSD: 9, plan: 'free' },
  'hypotenuse':     { feature: 'Content Studio', description: 'AI content generation', icon: '✍️', monthlyUSD: 29, plan: 'free' },
  'anyword':        { feature: 'Content Studio', description: 'AI copywriting and content', icon: '✍️', monthlyUSD: 39, plan: 'free' },
  // Social media / content scheduling (Omnia generates, doesn't schedule)
  'buffer':         { feature: 'Content Studio', description: 'AI-generated social media content', icon: '✍️', monthlyUSD: 15, plan: 'free' },
  'hootsuite':      { feature: 'Content Studio', description: 'AI-generated social content', icon: '✍️', monthlyUSD: 99, plan: 'free' },
  'later':          { feature: 'Content Studio', description: 'AI-generated content for social', icon: '✍️', monthlyUSD: 25, plan: 'free' },
  'sproutsocial':   { feature: 'Content Studio', description: 'AI-generated social media content', icon: '✍️', monthlyUSD: 249, plan: 'free' },
  'planoly':        { feature: 'Content Studio', description: 'AI social content creation', icon: '✍️', monthlyUSD: 13, plan: 'free' },
  'metricool':      { feature: 'Content Studio', description: 'AI social media content', icon: '✍️', monthlyUSD: 18, plan: 'free' },
  // Files
  'dropbox':        { feature: 'Files', description: 'File storage and management', icon: '📁', monthlyUSD: 12, plan: 'free' },
  'googledrive':    { feature: 'Files', description: 'Cloud file storage', icon: '📁', monthlyUSD: 3, plan: 'free' },
  'onedrive':       { feature: 'Files', description: 'File storage', icon: '📁', monthlyUSD: 2, plan: 'free' },
  'box':            { feature: 'Files', description: 'Cloud file management', icon: '📁', monthlyUSD: 15, plan: 'free' },
  'icloud':         { feature: 'Files', description: 'Cloud file storage', icon: '📁', monthlyUSD: 3, plan: 'free' },
  // Invoices & business finance
  'freshbooks':     { feature: 'Invoices', description: 'Invoice creation and tracking', icon: '💰', monthlyUSD: 17, plan: 'plus' },
  'wave':           { feature: 'Invoices', description: 'Free invoicing', icon: '💰', monthlyUSD: 0, plan: 'plus' },
  'paymo':          { feature: 'Invoices', description: 'Invoicing and time tracking', icon: '💰', monthlyUSD: 10, plan: 'plus' },
  'bonsai':         { feature: 'Invoices', description: 'Freelance invoicing', icon: '💰', monthlyUSD: 25, plan: 'plus' },
  'honeybook':      { feature: 'Invoices + Proposals', description: 'Client proposals and invoices', icon: '💰', monthlyUSD: 36, plan: 'plus' },
  'quickbooks':     { feature: 'Invoices', description: 'Professional invoicing', icon: '💰', monthlyUSD: 30, plan: 'plus' },
  'xero':           { feature: 'Invoices', description: 'Business invoicing', icon: '💰', monthlyUSD: 15, plan: 'plus' },
  'invoiceninja':   { feature: 'Invoices', description: 'Invoice management', icon: '💰', monthlyUSD: 10, plan: 'plus' },
  'stripe':         { feature: 'Invoices', description: 'Client billing and invoicing', icon: '💰', monthlyUSD: 0, plan: 'plus' },
  'dubsado':        { feature: 'Invoices + Proposals', description: 'Client invoices and proposals', icon: '💰', monthlyUSD: 20, plan: 'plus' },
  'and.co':         { feature: 'Invoices', description: 'Freelance invoicing', icon: '💰', monthlyUSD: 18, plan: 'plus' },
  'harvest':        { feature: 'Invoices', description: 'Time tracking and invoicing', icon: '💰', monthlyUSD: 12, plan: 'plus' },
  // Personal finance (Life Hub)
  'ynab':           { feature: 'Life Hub — Budget Planner', description: 'AI-powered budgeting and expense tracking', icon: '💵', monthlyUSD: 15, plan: 'plus' },
  'mint':           { feature: 'Life Hub — Budget Planner', description: 'Budget tracking and financial health', icon: '💵', monthlyUSD: 0, plan: 'plus' },
  'personalcapital':{ feature: 'Life Hub — Net Worth Tracker', description: 'Net worth and investment tracking', icon: '💵', monthlyUSD: 0, plan: 'plus' },
  'monarchmoney':   { feature: 'Life Hub — Budget Planner', description: 'Budget and financial planning', icon: '💵', monthlyUSD: 15, plan: 'plus' },
  'copilotmoney':   { feature: 'Life Hub — Budget Planner', description: 'Personal finance and budgeting', icon: '💵', monthlyUSD: 14, plan: 'plus' },
  'empower':        { feature: 'Life Hub — Financial Health Score', description: 'Financial health and net worth', icon: '💵', monthlyUSD: 0, plan: 'plus' },
  'wealthfront':    { feature: 'Life Hub — Investment Ideas', description: 'Investment planning and ideas', icon: '💵', monthlyUSD: 0, plan: 'plus' },
  'acorns':         { feature: 'Life Hub — Investment Ideas', description: 'Investment ideas and passive income', icon: '💵', monthlyUSD: 3, plan: 'plus' },
  'clarity':        { feature: 'Life Hub — Budget Planner', description: 'Budget and bill management', icon: '💵', monthlyUSD: 5, plan: 'plus' },
  'pocketsmith':    { feature: 'Life Hub — Budget Planner', description: 'Financial forecasting and budgets', icon: '💵', monthlyUSD: 10, plan: 'plus' },
  'spendee':        { feature: 'Life Hub — Budget Planner', description: 'Expense tracking and budgeting', icon: '💵', monthlyUSD: 4, plan: 'plus' },
  // Fitness & health (Life Hub)
  'myfitnesspal':   { feature: 'Life Hub — Calorie & Macro Tracker', description: 'Calorie tracking and meal planning', icon: '🏋️', monthlyUSD: 20, plan: 'plus' },
  'cronometer':     { feature: 'Life Hub — Calorie & Macro Tracker', description: 'Nutrition and macro tracking', icon: '🏋️', monthlyUSD: 10, plan: 'plus' },
  'loseit':         { feature: 'Life Hub — Calorie & Macro Tracker', description: 'Calorie tracking and weight goals', icon: '🏋️', monthlyUSD: 10, plan: 'plus' },
  'fitbod':         { feature: 'Life Hub — Workout Planner', description: 'AI workout planning and tracking', icon: '🏋️', monthlyUSD: 13, plan: 'plus' },
  'hevy':           { feature: 'Life Hub — Workout Planner', description: 'Workout tracking and planning', icon: '🏋️', monthlyUSD: 5, plan: 'plus' },
  'strongapp':      { feature: 'Life Hub — Workout Planner', description: 'Strength training planner', icon: '🏋️', monthlyUSD: 10, plan: 'plus' },
  'noom':           { feature: 'Life Hub — Meal Planner + AI Trainer', description: 'Meal planning and wellness coaching', icon: '🏋️', monthlyUSD: 59, plan: 'plus' },
  'whoop':          { feature: 'Life Hub — Recovery Planner', description: 'Recovery and body metrics tracking', icon: '🏋️', monthlyUSD: 30, plan: 'plus' },
  'strava':         { feature: 'Life Hub — Progress Tracker', description: 'Fitness progress and activity tracking', icon: '🏋️', monthlyUSD: 12, plan: 'plus' },
  'healthifyme':    { feature: 'Life Hub — Meal Planner', description: 'Diet and nutrition planning', icon: '🏋️', monthlyUSD: 15, plan: 'plus' },
  '8fit':           { feature: 'Life Hub — Workout + Meal Planner', description: 'Workout and meal planning', icon: '🏋️', monthlyUSD: 10, plan: 'plus' },
  'caliber':        { feature: 'Life Hub — Workout Planner', description: 'Personal training and workouts', icon: '🏋️', monthlyUSD: 10, plan: 'plus' },
  'macrofactor':    { feature: 'Life Hub — Calorie & Macro Tracker', description: 'Macro and nutrition coaching', icon: '🏋️', monthlyUSD: 12, plan: 'plus' },
  // Email marketing (AI Money Tools)
  'mailchimp':      { feature: 'AI Money Tools — Email Sequences', description: 'AI-generated email nurture sequences', icon: '📧', monthlyUSD: 13, plan: 'plus' },
  'convertkit':     { feature: 'AI Money Tools — Email Sequences', description: 'AI-written email automation sequences', icon: '📧', monthlyUSD: 15, plan: 'plus' },
  'activecampaign': { feature: 'AI Money Tools — Email Sequences', description: 'AI email sequence builder', icon: '📧', monthlyUSD: 29, plan: 'plus' },
  'klaviyo':        { feature: 'AI Money Tools — Email Sequences', description: 'AI-generated email sequences', icon: '📧', monthlyUSD: 20, plan: 'plus' },
  'drip':           { feature: 'AI Money Tools — Email Sequences', description: 'AI email sequence builder', icon: '📧', monthlyUSD: 39, plan: 'plus' },
  'beehiiv':        { feature: 'AI Money Tools — Email Sequences', description: 'AI-written newsletters and sequences', icon: '📧', monthlyUSD: 42, plan: 'plus' },
  'flodesk':        { feature: 'AI Money Tools — Email Sequences', description: 'AI email sequence creation', icon: '📧', monthlyUSD: 38, plan: 'plus' },
  'mailerlite':     { feature: 'AI Money Tools — Email Sequences', description: 'AI email campaigns and sequences', icon: '📧', monthlyUSD: 10, plan: 'plus' },
  'substack':       { feature: 'AI Money Tools — Email Sequences', description: 'AI-written newsletters', icon: '📧', monthlyUSD: 0, plan: 'plus' },
  // SEO (AI Money Tools)
  'semrush':        { feature: 'AI Money Tools — SEO Blog Writer', description: 'AI-generated SEO-optimised blog content', icon: '🔍', monthlyUSD: 130, plan: 'plus' },
  'ahrefs':         { feature: 'AI Money Tools — SEO Blog Writer', description: 'AI SEO blog writing', icon: '🔍', monthlyUSD: 99, plan: 'plus' },
  'surferseo':      { feature: 'AI Money Tools — SEO Blog Writer', description: 'AI-written SEO-optimised articles', icon: '🔍', monthlyUSD: 89, plan: 'plus' },
  'clearscope':     { feature: 'AI Money Tools — SEO Blog Writer', description: 'AI SEO content generation', icon: '🔍', monthlyUSD: 170, plan: 'plus' },
  'frase':          { feature: 'AI Money Tools — SEO Blog Writer', description: 'AI SEO blog writing and optimisation', icon: '🔍', monthlyUSD: 15, plan: 'plus' },
  'marketmuse':     { feature: 'AI Money Tools — SEO Blog Writer', description: 'AI content and SEO writing', icon: '🔍', monthlyUSD: 149, plan: 'plus' },
  'rankmath':       { feature: 'AI Money Tools — SEO Blog Writer', description: 'AI SEO content optimisation', icon: '🔍', monthlyUSD: 8, plan: 'plus' },
  // Lead generation (AI Money Tools)
  'leadpages':      { feature: 'AI Money Tools — Lead Magnet Builder', description: 'AI-generated lead magnets and freebies', icon: '🎯', monthlyUSD: 37, plan: 'plus' },
  'optinmonster':   { feature: 'AI Money Tools — Lead Magnet Builder', description: 'AI lead magnet creation', icon: '🎯', monthlyUSD: 9, plan: 'plus' },
  'thriveleads':    { feature: 'AI Money Tools — Lead Magnet Builder', description: 'AI-generated lead magnets', icon: '🎯', monthlyUSD: 8, plan: 'plus' },
  'systeme':        { feature: 'AI Money Tools — Lead Magnet Builder', description: 'Funnel and lead magnet builder', icon: '🎯', monthlyUSD: 27, plan: 'plus' },
  // Reminders & calendar
  'fantastical':    { feature: 'Reminders', description: 'Smart reminders and scheduling', icon: '🔔', monthlyUSD: 5, plan: 'free' },
  'googlecalendar': { feature: 'Reminders', description: 'Event and reminder management', icon: '🔔', monthlyUSD: 0, plan: 'free' },
  'applecalendar':  { feature: 'Reminders', description: 'Calendar reminders and events', icon: '🔔', monthlyUSD: 0, plan: 'free' },
  'tick tick':      { feature: 'Reminders + Planner', description: 'Tasks and reminders', icon: '🔔', monthlyUSD: 3, plan: 'free' },
  'ticktick':       { feature: 'Reminders + Planner', description: 'Tasks and reminders', icon: '🔔', monthlyUSD: 3, plan: 'free' },
  'reclaim':        { feature: 'Reminders + Planner', description: 'Smart scheduling and task management', icon: '🔔', monthlyUSD: 10, plan: 'free' },
  'structured':     { feature: 'Reminders + Planner', description: 'Daily planner with reminders', icon: '🔔', monthlyUSD: 5, plan: 'free' },
  // Documents
  'googledocs':     { feature: 'Doc Builder', description: 'AI-powered document creation', icon: '📄', monthlyUSD: 0, plan: 'free' },
  'word':           { feature: 'Doc Builder', description: 'Professional document writing', icon: '📄', monthlyUSD: 10, plan: 'free' },
  'pages':          { feature: 'Doc Builder', description: 'Document creation', icon: '📄', monthlyUSD: 0, plan: 'free' },
  'dropboxpaper':   { feature: 'Doc Builder', description: 'AI document writing', icon: '📄', monthlyUSD: 12, plan: 'free' },
  'coda':           { feature: 'Notes + Doc Builder', description: 'Rich docs and note organisation', icon: '📄', monthlyUSD: 10, plan: 'free' },
  'quip':           { feature: 'Doc Builder', description: 'Collaborative document editing', icon: '📄', monthlyUSD: 10, plan: 'free' },
  // Code editors & IDEs (Code Studio)
  'codesandbox':    { feature: 'Code Studio', description: 'In-browser IDE with live preview and AI codegen', icon: '💻', monthlyUSD: 12, plan: 'pro' },
  'replit':         { feature: 'Code Studio', description: 'Online IDE with Python, Node.js execution and deploy', icon: '💻', monthlyUSD: 25, plan: 'pro' },
  'stackblitz':     { feature: 'Code Studio', description: 'In-browser IDE with live preview', icon: '💻', monthlyUSD: 0, plan: 'pro' },
  'codepen':        { feature: 'Code Studio', description: 'HTML/CSS/JS playground with live preview', icon: '💻', monthlyUSD: 8, plan: 'pro' },
  'jsbin':          { feature: 'Code Studio', description: 'JS/HTML sandbox with live preview', icon: '💻', monthlyUSD: 0, plan: 'pro' },
  'glitch':         { feature: 'Code Studio', description: 'Online code editor with hosting', icon: '💻', monthlyUSD: 0, plan: 'pro' },
  'gitpod':         { feature: 'Code Studio', description: 'Cloud IDE for code projects', icon: '💻', monthlyUSD: 9, plan: 'pro' },
  'github codespaces':{ feature: 'Code Studio', description: 'Cloud-based development IDE', icon: '💻', monthlyUSD: 9, plan: 'pro' },
  'githubcodespaces':{ feature: 'Code Studio', description: 'Cloud-based development IDE', icon: '💻', monthlyUSD: 9, plan: 'pro' },
  'cursor':         { feature: 'Code Studio', description: 'AI-first code editor with world-class codegen', icon: '💻', monthlyUSD: 20, plan: 'pro' },
  'v0':             { feature: 'Code Studio', description: 'AI code generation and live preview', icon: '💻', monthlyUSD: 20, plan: 'pro' },
  'bolt':           { feature: 'Code Studio', description: 'AI-powered code generation and IDE', icon: '💻', monthlyUSD: 20, plan: 'pro' },
  'bolt.new':       { feature: 'Code Studio', description: 'AI-powered code generation and IDE', icon: '💻', monthlyUSD: 20, plan: 'pro' },
  'lovable':        { feature: 'Code Studio', description: 'AI app builder with code editor', icon: '💻', monthlyUSD: 20, plan: 'pro' },
  'webflow':        { feature: 'Code Studio', description: 'Visual web design and CMS builder', icon: '💻', monthlyUSD: 23, plan: 'pro' },
  'framer':         { feature: 'Code Studio', description: 'Interactive web design and publish tool', icon: '💻', monthlyUSD: 20, plan: 'pro' },
  'wix':            { feature: 'Code Studio', description: 'Website builder with AI assistance', icon: '💻', monthlyUSD: 16, plan: 'pro' },
  'squarespace':    { feature: 'Code Studio', description: 'Website builder with design templates', icon: '💻', monthlyUSD: 16, plan: 'pro' },
  'github':         { feature: 'Code Studio', description: 'Code repository and project hosting', icon: '💻', monthlyUSD: 4, plan: 'pro' },
  // Proposals
  'proposify':      { feature: 'Proposals', description: 'AI-written client proposals', icon: '📋', monthlyUSD: 49, plan: 'plus' },
  'pandadoc':       { feature: 'Proposals', description: 'Smart proposal generation', icon: '📋', monthlyUSD: 19, plan: 'plus' },
  'qwilr':          { feature: 'Proposals', description: 'Professional proposals', icon: '📋', monthlyUSD: 35, plan: 'plus' },
  'better proposals':{ feature: 'Proposals', description: 'AI-generated client proposals', icon: '📋', monthlyUSD: 19, plan: 'plus' },
  'betterproposals':{ feature: 'Proposals', description: 'AI-generated client proposals', icon: '📋', monthlyUSD: 19, plan: 'plus' },
  'nusii':          { feature: 'Proposals', description: 'Client proposal builder', icon: '📋', monthlyUSD: 29, plan: 'plus' },
};

// Country/currency data
const COUNTRIES = [
  { code: 'US', name: '🇺🇸 United States', symbol: '$',   rate: 1.0,   note: '' },
  { code: 'GB', name: '🇬🇧 United Kingdom', symbol: '£',   rate: 0.79,  note: '' },
  { code: 'EU', name: '🇪🇺 Europe (EUR)',   symbol: '€',   rate: 0.92,  note: '' },
  { code: 'AU', name: '🇦🇺 Australia',      symbol: 'A$',  rate: 1.53,  note: '' },
  { code: 'CA', name: '🇨🇦 Canada',         symbol: 'C$',  rate: 1.37,  note: '' },
  { code: 'IN', name: '🇮🇳 India',          symbol: '₹',   rate: 60,    note: '~60% regional pricing' },
  { code: 'SG', name: '🇸🇬 Singapore',      symbol: 'S$',  rate: 1.34,  note: '' },
  { code: 'AE', name: '🇦🇪 UAE',            symbol: 'AED', rate: 3.67,  note: '' },
  { code: 'ZA', name: '🇿🇦 South Africa',   symbol: 'R',   rate: 8.5,   note: '~55% regional pricing' },
  { code: 'BR', name: '🇧🇷 Brazil',         symbol: 'R$',  rate: 3.5,   note: '~70% regional pricing' },
  { code: 'MX', name: '🇲🇽 Mexico',         symbol: 'MX$', rate: 12.0,  note: '~70% regional pricing' },
  { code: 'NG', name: '🇳🇬 Nigeria',        symbol: '$',   rate: 1.0,   note: 'USD pricing' },
  { code: 'PH', name: '🇵🇭 Philippines',    symbol: '₱',   rate: 35,    note: '~60% regional pricing' },
  { code: 'PK', name: '🇵🇰 Pakistan',       symbol: '₨',   rate: 55,    note: '~50% regional pricing' },
];

// Omnia plan pricing — canonical in AUD, converted to other currencies via rate
const OMNIA = {
  plus: { name: 'Plus', aud: 25, annualAud: 199, color: 'hsl(205,90%,60%)' },
  pro:  { name: 'Pro',  aud: 40, annualAud: 329, color: 'hsl(262,83%,75%)' },
};
// AUD exchange rate against USD (1 USD = A$1.53) — used to convert AUD prices to local
const AU_RATE = 1.53;

function normalise(tool: string) {
  return tool.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9.]/g, '');
}

function matchTool(raw: string): { original: string; match: ToolData | null } {
  const n = normalise(raw);
  if (STACK_MAP[n]) return { original: raw, match: STACK_MAP[n] };
  for (const key of Object.keys(STACK_MAP)) {
    if (n.includes(key) || key.includes(n)) return { original: raw, match: STACK_MAP[key] };
  }
  return { original: raw, match: null };
}

function fmt(symbol: string, amount: number) {
  return `${symbol}${amount % 1 === 0 ? amount : amount.toFixed(0)}`;
}

export function MyStackView() {
  const [input, setInput] = useState('');
  const [tools, setTools] = useState<string[]>([]);
  const [analysed, setAnalysed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [countryCode, setCountryCode] = useState('US');

  const country = COUNTRIES.find(c => c.code === countryCode) ?? COUNTRIES[0];
  const results = useMemo(() => tools.map(matchTool), [tools]);
  const matched = results.filter(r => r.match);
  const unmatched = results.filter(r => !r.match);

  // Money calculations
  const totalMonthlyUSD = useMemo(() =>
    matched.reduce((sum, r) => sum + (r.match?.monthlyUSD ?? 0), 0)
  , [matched]);

  const totalMonthlyLocal = Math.round(totalMonthlyUSD * country.rate);

  // Determine recommended Omnia plan based on features needed
  const needsPro = matched.some(r => r.match?.plan === 'pro');
  const recommendedPlan = needsPro ? OMNIA.pro : OMNIA.plus;
  // Convert AUD price → local currency (A$25 or A$40 base)
  const omniaLocal = Math.round(recommendedPlan.aud * country.rate / AU_RATE);
  const omniaAnnualLocal = Math.round(recommendedPlan.annualAud * country.rate / AU_RATE);
  const savingsLocal = totalMonthlyLocal - omniaLocal;

  const analyse = () => {
    const list = input.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    if (!list.length) { toast.error('Enter at least one tool'); return; }
    setTools(list);
    setAnalysed(true);
  };

  const reset = () => { setAnalysed(false); setTools([]); setInput(''); };

  const shareText = `I replaced ${matched.length} tool${matched.length !== 1 ? 's' : ''} with Omnia:\n${matched.map(r => `• ${r.original} → ${r.match!.feature}`).join('\n')}\n\nCurrently spending: ${fmt(country.symbol, totalMonthlyLocal)}/mo → Omnia ${recommendedPlan.name}: ${fmt(country.symbol, omniaLocal)}/mo\n\nGet Omnia: omnia.app`;

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'My Omnia Stack', text: shareText });
    } else {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Copied to clipboard!');
    }
  };

  return (
    <div className="page" style={{ maxWidth: '680px', paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'hsl(205 90% 48% / 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={18} color="hsl(205, 90%, 60%)" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Replace My Stack</h1>
        </div>
        <p style={{ fontSize: '14px', color: 'hsl(240 5% 55%)', lineHeight: 1.5 }}>See exactly how much you're spending on tools Omnia already replaces.</p>
      </div>

      {!analysed ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: 'hsl(0 0% 80%)' }}>
              Enter the tools you currently use
            </label>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={`Notion\nChatGPT\nTodoist\nFreshBooks\nDropbox\nCursor\nProposify`}
              rows={8}
              style={{ resize: 'none', fontFamily: 'inherit', lineHeight: 1.6 }}
            />
            <p style={{ fontSize: '12px', color: 'hsl(240 5% 45%)', marginTop: '8px' }}>One per line or comma-separated. 150+ tools recognised.</p>
          </div>

          {/* Country selector */}
          <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Globe size={16} color="hsl(240 5% 50%)" style={{ flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(240 5% 55%)', display: 'block', marginBottom: '6px' }}>YOUR COUNTRY (for local pricing)</label>
              <select
                value={countryCode}
                onChange={e => setCountryCode(e.target.value)}
                style={{ width: '100%', background: 'hsl(240 6% 10%)', border: '1px solid hsl(240 6% 18%)', borderRadius: '8px', color: 'hsl(0 0% 85%)', padding: '8px 10px', fontSize: '13px', cursor: 'pointer' }}
              >
                {COUNTRIES.map(c => (
                  <option key={c.code} value={c.code}>{c.name}{c.note ? ` (${c.note})` : ''}</option>
                ))}
              </select>
            </div>
          </div>

          <button onClick={analyse} disabled={!input.trim()} className="btn btn-primary" style={{ height: '48px', fontSize: '15px', fontWeight: 600, gap: '8px' }}>
            <Sparkles size={16} /> Analyse My Stack
          </button>

          {/* Sample tools */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', paddingTop: '4px' }}>
            {['Notion', 'ChatGPT', 'Todoist', 'YNAB', 'MyFitnessPal', 'Fitbod', 'Mailchimp', 'FreshBooks', 'Cursor', 'Asana', 'SEMrush', 'ConvertKit', 'Proposify', 'Google Docs', 'Bolt', 'Dropbox'].map(t => (
              <span
                key={t}
                onClick={() => setInput(prev => prev ? `${prev}\n${t}` : t)}
                style={{ padding: '4px 10px', borderRadius: '999px', background: 'hsl(240 6% 10%)', border: '1px solid hsl(240 6% 16%)', fontSize: '12px', color: 'hsl(240 5% 55%)', cursor: 'pointer' }}
                title="Click to add"
              >{t}</span>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Country selector (condensed) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
            <Globe size={13} color="hsl(240 5% 45%)" />
            <select
              value={countryCode}
              onChange={e => setCountryCode(e.target.value)}
              style={{ background: 'hsl(240 6% 10%)', border: '1px solid hsl(240 6% 18%)', borderRadius: '8px', color: 'hsl(0 0% 75%)', padding: '5px 8px', fontSize: '12px', cursor: 'pointer' }}
            >
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Hero stat */}
          <div className="card" style={{ padding: '24px', textAlign: 'center', background: 'hsl(205 90% 48% / 0.06)', borderColor: 'hsl(205 90% 48% / 0.2)' }}>
            <div style={{ fontSize: '52px', fontWeight: 800, background: 'linear-gradient(135deg, hsl(205,90%,60%) 0%, #a78bfa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{matched.length}</div>
            <p style={{ fontSize: '16px', fontWeight: 600, marginTop: '4px' }}>tool{matched.length !== 1 ? 's' : ''} replaced by Omnia</p>
            {unmatched.length > 0 && <p style={{ fontSize: '13px', color: 'hsl(240 5% 50%)', marginTop: '4px' }}>{unmatched.length} not covered (yet!)</p>}
          </div>

          {/* MONEY COMPARISON */}
          <div style={{ background: 'hsl(240 8% 7%)', border: '1px solid hsl(240 6% 16%)', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 18px', borderBottom: '1px solid hsl(240 6% 14%)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <DollarSign size={15} color="hsl(142, 70%, 55%)" />
              <span style={{ fontWeight: 700, fontSize: '13px' }}>Money Comparison</span>
              {country.note && <span style={{ fontSize: '11px', color: 'hsl(240 5% 45%)', marginLeft: 'auto' }}>* {country.note}</span>}
            </div>
            <div style={{ padding: '18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {/* Current spend */}
              <div style={{ padding: '16px', background: 'hsl(0 60% 50% / 0.07)', border: '1px solid hsl(0 60% 50% / 0.18)', borderRadius: '12px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(0 60% 60%)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>You currently pay</p>
                <p style={{ fontSize: '28px', fontWeight: 800, color: 'hsl(0 60% 65%)', letterSpacing: '-0.02em' }}>
                  {fmt(country.symbol, totalMonthlyLocal)}<span style={{ fontSize: '13px', fontWeight: 500, color: 'hsl(0 60% 50%)' }}>/mo</span>
                </p>
                {countryCode !== 'US' && <p style={{ fontSize: '11px', color: 'hsl(240 5% 45%)', marginTop: '4px' }}>(${totalMonthlyUSD} USD)</p>}
                <p style={{ fontSize: '11px', color: 'hsl(0 60% 50%)', marginTop: '8px' }}>Across {matched.length} matched tool{matched.length !== 1 ? 's' : ''}</p>
              </div>
              {/* Omnia cost */}
              <div style={{ padding: '16px', background: 'hsl(142 70% 40% / 0.07)', border: '1px solid hsl(142 70% 40% / 0.2)', borderRadius: '12px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(142, 70%, 55%)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Omnia {recommendedPlan.name}</p>
                <p style={{ fontSize: '28px', fontWeight: 800, color: 'hsl(142, 70%, 60%)', letterSpacing: '-0.02em' }}>
                  {fmt(country.symbol, omniaLocal)}<span style={{ fontSize: '13px', fontWeight: 500, color: 'hsl(142 70% 40%)' }}>/mo</span>
                </p>
                <p style={{ fontSize: '11px', color: 'hsl(240 5% 45%)', marginTop: '4px' }}>or {fmt(country.symbol, omniaAnnualLocal)}/yr</p>
                <p style={{ fontSize: '11px', color: 'hsl(142 70% 40%)', marginTop: '4px' }}>All features included</p>
              </div>
            </div>

            {/* Savings / Value banner */}
            <div style={{
              margin: '0 18px 18px',
              padding: '14px 16px',
              borderRadius: '10px',
              background: savingsLocal >= 0 ? 'hsl(142 70% 40% / 0.1)' : 'hsl(205 90% 48% / 0.08)',
              border: `1px solid ${savingsLocal >= 0 ? 'hsl(142 70% 40% / 0.25)' : 'hsl(205 90% 48% / 0.2)'}`,
              display: 'flex', alignItems: 'center', gap: '12px'
            }}>
              {savingsLocal >= 0
                ? <TrendingDown size={20} color="hsl(142, 70%, 55%)" style={{ flexShrink: 0 }} />
                : <TrendingUp size={20} color="hsl(205, 90%, 60%)" style={{ flexShrink: 0 }} />
              }
              <div>
                {savingsLocal >= 0 ? (
                  <>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: 'hsl(142, 70%, 60%)' }}>
                      You save {fmt(country.symbol, savingsLocal)}/mo · {fmt(country.symbol, savingsLocal * 12)}/yr
                    </p>
                    <p style={{ fontSize: '12px', color: 'hsl(240 5% 50%)', marginTop: '3px' }}>
                      Plus you get AI Assistant, Autopilot, Reminders, Doc Builder and more — all bundled in.
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(205, 90%, 65%)' }}>
                      Just {fmt(country.symbol, Math.abs(savingsLocal))} more/mo for everything Omnia offers
                    </p>
                    <p style={{ fontSize: '12px', color: 'hsl(240 5% 50%)', marginTop: '3px' }}>
                      AI Assistant + Autopilot + Planner + Notes + Reminders + Doc Builder + {needsPro ? 'Code Studio' : 'Life Hub'} all included.
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Annual savings highlight */}
            {savingsLocal > 0 && (
              <div style={{ margin: '0 18px 18px', padding: '10px 14px', borderRadius: '8px', background: 'hsl(38 95% 60% / 0.08)', border: '1px solid hsl(38 95% 60% / 0.2)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>🎉</span>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'hsl(38, 95%, 65%)' }}>
                  That's {fmt(country.symbol, savingsLocal * 12)}/yr back in your pocket · or pay {fmt(country.symbol, omniaAnnualLocal)}/yr and save even more
                </p>
              </div>
            )}
          </div>

          {/* Matched tools */}
          {matched.length > 0 && (
            <div className="card" style={{ padding: '16px' }}>
              <h2 style={{ fontWeight: 600, fontSize: '13px', marginBottom: '12px', color: 'hsl(240 5% 55%)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Replaced by Omnia</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {matched.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', background: 'hsl(240 6% 8%)', border: '1px solid hsl(240 6% 14%)' }}>
                    <span style={{ fontSize: '17px', flexShrink: 0 }}>{r.match!.icon}</span>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: 'hsl(0 0% 75%)', minWidth: '80px', flex: 1 }}>{r.original}</span>
                    {(r.match!.monthlyUSD ?? 0) > 0 && (
                      <span style={{ fontSize: '11px', color: 'hsl(0 60% 55%)', fontWeight: 600, flexShrink: 0 }}>
                        {fmt(country.symbol, Math.round((r.match!.monthlyUSD ?? 0) * country.rate))}/mo
                      </span>
                    )}
                    <ArrowRight size={13} color="hsl(240 5% 38%)" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 2 }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'hsl(205, 90%, 65%)' }}>{r.match!.feature}</p>
                      <p style={{ fontSize: '11px', color: 'hsl(240 5% 48%)', marginTop: '1px' }}>{r.match!.description}</p>
                    </div>
                    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {r.match!.plan === 'pro' && <span style={{ fontSize: '9px', padding: '2px 5px', borderRadius: '4px', background: 'hsl(262 83% 58% / 0.2)', color: 'hsl(262,83%,75%)', fontWeight: 700 }}>PRO</span>}
                      {r.match!.plan === 'plus' && <span style={{ fontSize: '9px', padding: '2px 5px', borderRadius: '4px', background: 'hsl(205 90% 48% / 0.15)', color: 'hsl(205,90%,65%)', fontWeight: 700 }}>PLUS</span>}
                      <Check size={13} color="#34d399" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Unmatched */}
          {unmatched.length > 0 && (
            <div className="card" style={{ padding: '16px' }}>
              <h2 style={{ fontWeight: 600, fontSize: '13px', marginBottom: '10px', color: 'hsl(240 5% 50%)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Not covered (yet)</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {unmatched.map((r, i) => (
                  <span key={i} style={{ padding: '5px 12px', borderRadius: '999px', background: 'hsl(240 6% 10%)', border: '1px solid hsl(240 6% 16%)', fontSize: '13px', color: 'hsl(240 5% 55%)' }}>{r.original}</span>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div style={{ padding: '18px', background: 'hsl(205 90% 48% / 0.06)', border: '1px solid hsl(205 90% 48% / 0.18)', borderRadius: '14px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>Ready to make the switch?</p>
            <p style={{ fontSize: '12px', color: 'hsl(240 5% 50%)', marginBottom: '14px' }}>
              {savingsLocal >= 0
                ? `Save ${fmt(country.symbol, savingsLocal)}/mo and get everything in one place.`
                : `Get all your tools + more in one place for ${fmt(country.symbol, omniaLocal)}/mo.`}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href={`/signup?plan=${recommendedPlan.name.toLowerCase()}`} className="btn btn-primary" style={{ textDecoration: 'none', height: '40px', paddingLeft: '20px', paddingRight: '20px', fontSize: '13px' }}>
                Get Omnia {recommendedPlan.name} <ArrowRight size={14} />
              </a>
              <a href="/signup" className="btn btn-outline" style={{ textDecoration: 'none', height: '40px', paddingLeft: '20px', paddingRight: '20px', fontSize: '13px' }}>
                Start Free
              </a>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={share} className="btn btn-outline" style={{ flex: 1, gap: '8px', minWidth: '120px', height: '40px', fontSize: '13px' }}>
              {copied ? <><Check size={14} /> Copied!</> : <><Share2 size={14} /> Share Result</>}
            </button>
            <button onClick={reset} className="btn btn-outline" style={{ flex: 1, minWidth: '120px', height: '40px', fontSize: '13px' }}>
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
