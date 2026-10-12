const crypto = require('crypto');

const SUPPORTED_SECTION_TYPES = [
  'navbar',
  'hero',
  'features',
  'stats',
  'testimonials',
  'pricing',
  'contact',
  'cta',
  'footer',
  'text-block',
  'image-block',
  'card-grid',
  'raw-html'
];

/**
 * Escapes HTML characters to prevent XSS injection
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generates a unique ID
 */
function generateId(prefix = 'sec') {
  return `${prefix}-${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Default section templates when creating or repairing sections
 */
const DEFAULT_SECTION_PROPS = {
  'raw-html': {
    html: '<div style="padding: 20px;"><p>Custom HTML section</p></div>',
    text: ''
  },
  navbar: {
    brandName: 'ReverseBuilder',
    brandLogo: '',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Testimonials', href: '#testimonials' },
      { label: 'Contact', href: '#contact' }
    ],
    ctaText: 'Get Started',
    ctaHref: '#cta'
  },
  hero: {
    badge: '🚀 Next-Gen Website Builder',
    heading: 'Build Modern Websites at Warp Speed',
    subheading: 'Turn any design reference, URL, or screenshot into clean, responsive HTML and CSS code instantly.',
    primaryButtonText: 'Start Building Free',
    primaryButtonHref: '#features',
    secondaryButtonText: 'View Live Demo',
    secondaryButtonHref: '#demo',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Product Dashboard Mockup'
  },
  features: {
    badge: 'Features',
    heading: 'Engineered for Performance & Speed',
    description: 'Everything you need to rebuild, customize, and export production-ready websites in seconds.',
    items: [
      {
        icon: '⚡',
        title: 'URL Reverse Engineering',
        description: 'Extract headings, layout hierarchies, color palettes, and assets with one click.'
      },
      {
        icon: '🎨',
        title: 'Visual Live Editor',
        description: 'Edit text, tweak styles, reorder sections, and preview responsive views instantaneously.'
      },
      {
        icon: '📦',
        title: 'Clean Code Export',
        description: 'Download lightweight, semantic, dependency-free HTML, CSS, and vanilla JS archives.'
      }
    ]
  },
  stats: {
    heading: 'Trusted by Developers Worldwide',
    items: [
      { value: '10x', label: 'Faster Prototyping' },
      { value: '99.9%', label: 'Clean Code Output' },
      { value: '500K+', label: 'Pages Rebuilt' },
      { value: '0', label: 'Framework Dependencies' }
    ]
  },
  testimonials: {
    badge: 'Social Proof',
    heading: 'Loved by Founders & Designers',
    description: 'Hear from engineers who cut their prototyping time by over 80%.',
    items: [
      {
        quote: 'ReverseBuilder took our Figma screenshots and generated production-ready HTML in under 2 minutes. Mindblowing.',
        author: 'Sarah Chen',
        role: 'VP of Product at CloudScale',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80'
      },
      {
        quote: 'The export has zero boilerplate. Just pure semantic HTML and clean CSS grid. It saved us weeks of frontend work.',
        author: 'Alex Rivera',
        role: 'Principal Engineer at DevForge',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80'
      }
    ]
  },
  pricing: {
    badge: 'Flexible Plans',
    heading: 'Transparent Pricing for Every Team',
    description: 'Start free and upgrade as your projects grow.',
    items: [
      {
        name: 'Starter',
        price: '$0',
        period: '/month',
        description: 'Perfect for indie hackers and prototyping.',
        isPopular: false,
        features: ['Up to 5 projects', 'URL extraction & inspection', 'Clean HTML/CSS export', 'Community support'],
        ctaText: 'Start Free'
      },
      {
        name: 'Professional',
        price: '$29',
        period: '/month',
        description: 'For growing agencies and fast-moving teams.',
        isPopular: true,
        features: ['Unlimited projects', 'Vision AI screenshot reconstruction', 'Asset optimization', 'Priority email support', 'Custom domain export'],
        ctaText: 'Upgrade to Pro'
      },
      {
        name: 'Enterprise',
        price: '$99',
        period: '/month',
        description: 'Dedicated infrastructure and team collaboration.',
        isPopular: false,
        features: ['Unlimited team seats', 'Self-hosted Docker export', 'Custom design systems', 'Dedicated account manager'],
        ctaText: 'Contact Sales'
      }
    ]
  },
  contact: {
    badge: 'Get in Touch',
    heading: 'Let’s Build Something Remarkable Together',
    description: 'Have questions about ReverseBuilder or need a custom integration? Send us a message.',
    buttonText: 'Send Message'
  },
  cta: {
    heading: 'Ready to Transform How You Build Websites?',
    description: 'Join thousands of creators using ReverseBuilder to turn inspiration into production code today.',
    buttonText: 'Start Building Now',
    buttonHref: '#pricing'
  },
  footer: {
    brandName: 'ReverseBuilder',
    description: 'The visual reverse engineering platform for modern web artisans.',
    copyright: '© 2026 ReverseBuilder. Built with precision.',
    columns: [
      {
        title: 'Product',
        links: [
          { label: 'Features', href: '#features' },
          { label: 'Editor', href: '#editor' },
          { label: 'Templates', href: '#templates' }
        ]
      },
      {
        title: 'Resources',
        links: [
          { label: 'Documentation', href: '#docs' },
          { label: 'API Reference', href: '#api' },
          { label: 'Guides', href: '#guides' }
        ]
      },
      {
        title: 'Company',
        links: [
          { label: 'About', href: '#about' },
          { label: 'Privacy', href: '#privacy' },
          { label: 'Terms', href: '#terms' }
        ]
      }
    ]
  },
  'text-block': {
    tag: 'p',
    heading: 'Content Section',
    content: 'ReverseBuilder provides a comprehensive suite of building blocks engineered to accelerate visual web authoring.'
  },
  'image-block': {
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    alt: 'Analytics and Data Platform',
    caption: 'Interactive real-time preview canvas'
  },
  'card-grid': {
    columns: 3,
    items: [
      { title: 'Card 1', description: 'Description for item 1', icon: '🚀' },
      { title: 'Card 2', description: 'Description for item 2', icon: '💡' },
      { title: 'Card 3', description: 'Description for item 3', icon: '🛠️' }
    ]
  }
};

/**
 * Default Section Styles
 */
const DEFAULT_STYLES = {
  paddingTop: 80,
  paddingBottom: 80,
  paddingLeft: 24,
  paddingRight: 24,
  backgroundColor: '#ffffff',
  textColor: '#0f172a',
  textAlign: 'left',
  maxWidth: 1400
};

/**
 * Validates and normalizes a section
 */
function normalizeSection(rawSection, index = 0) {
  if (!rawSection || typeof rawSection !== 'object') {
    return null;
  }

  const type = (rawSection.type || 'text-block').toLowerCase();
  const safeType = SUPPORTED_SECTION_TYPES.includes(type) ? type : 'text-block';

  const id = (rawSection.id && typeof rawSection.id === 'string' && /^[a-zA-Z0-9_-]+$/.test(rawSection.id))
    ? rawSection.id
    : generateId(safeType);

  const defaultProps = DEFAULT_SECTION_PROPS[safeType] || {};
  const props = Object.assign({}, defaultProps, typeof rawSection.props === 'object' ? rawSection.props : {});

  const defaultStyles = Object.assign({}, DEFAULT_STYLES);
  if (safeType === 'navbar') {
    defaultStyles.paddingTop = 20;
    defaultStyles.paddingBottom = 20;
  } else if (safeType === 'footer') {
    defaultStyles.paddingTop = 64;
    defaultStyles.paddingBottom = 40;
    defaultStyles.backgroundColor = '#0b0f19';
    defaultStyles.textColor = '#f8fafc';
  } else if (safeType === 'cta') {
    defaultStyles.backgroundColor = '#4f46e5';
    defaultStyles.textColor = '#ffffff';
    defaultStyles.textAlign = 'center';
  } else if (safeType === 'raw-html') {
    defaultStyles.paddingTop = 0;
    defaultStyles.paddingBottom = 0;
    defaultStyles.backgroundColor = 'transparent';
    defaultStyles.textColor = 'inherit';
    defaultStyles.maxWidth = 1600;
  }

  const styles = Object.assign({}, defaultStyles, typeof rawSection.styles === 'object' ? rawSection.styles : {});

  styles.paddingTop = Math.max(0, Math.min(300, parseInt(styles.paddingTop, 10) || 0));
  styles.paddingBottom = Math.max(0, Math.min(300, parseInt(styles.paddingBottom, 10) || 0));
  styles.maxWidth = Math.max(300, Math.min(2400, parseInt(styles.maxWidth, 10) || defaultStyles.maxWidth));

  return {
    id,
    type: safeType,
    name: typeof rawSection.name === 'string' && rawSection.name.trim() ? rawSection.name.trim() : `${safeType.charAt(0).toUpperCase() + safeType.slice(1)} Section`,
    props,
    styles,
    children: Array.isArray(rawSection.children) ? rawSection.children.map(normalizeSection).filter(Boolean) : []
  };
}

/**
 * Validates and normalizes an entire project
 */
function validateProject(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Project data must be a valid JSON object.' };
  }

  const name = typeof data.name === 'string' && data.name.trim() ? data.name.trim().slice(0, 100) : 'Untitled Project';
  const description = typeof data.description === 'string' ? data.description.trim().slice(0, 500) : '';

  const theme = {
    primaryColor: data.theme?.primaryColor || '#4f46e5',
    secondaryColor: data.theme?.secondaryColor || '#06b6d4',
    backgroundColor: data.theme?.backgroundColor || '#ffffff',
    textColor: data.theme?.textColor || '#0f172a',
    fontFamily: data.theme?.fontFamily || "'Inter', sans-serif"
  };

  const reference = {
    type: ['url', 'screenshot', 'template', 'manual'].includes(data.reference?.type) ? data.reference.type : 'manual',
    source: typeof data.reference?.source === 'string' ? data.reference.source : '',
    screenshotUrl: typeof data.reference?.screenshotUrl === 'string' ? data.reference.screenshotUrl : ''
  };

  const rawSections = Array.isArray(data.sections) ? data.sections : [];
  const sections = rawSections
    .map((sec, idx) => normalizeSection(sec, idx))
    .filter(Boolean);

  return {
    valid: true,
    project: {
      version: 1,
      id: data.id || generateId('proj'),
      name,
      description,
      theme,
      reference,
      stylesheets: Array.isArray(data.stylesheets) ? data.stylesheets : [],
      inlineStyles: Array.isArray(data.inlineStyles) ? data.inlineStyles : [],
      sections,
      createdAt: data.createdAt || Date.now(),
      updatedAt: Date.now()
    }
  };
}

module.exports = {
  SUPPORTED_SECTION_TYPES,
  DEFAULT_SECTION_PROPS,
  DEFAULT_STYLES,
  normalizeSection,
  validateProject,
  escapeHtml,
  generateId
};
