/**
 * ReverseBuilder Component Registry
 * Defines metadata, icons, and default blueprints for all 12 supported components.
 */
const ComponentRegistry = {
  definitions: {
    navbar: {
      type: 'navbar',
      name: 'Navigation Bar',
      icon: '🧭',
      category: 'Headers',
      defaultProps: {
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
      defaultStyles: {
        paddingTop: 18,
        paddingBottom: 18,
        backgroundColor: '#ffffff',
        textColor: '#0f172a',
        maxWidth: 1200
      }
    },

    hero: {
      type: 'hero',
      name: 'Hero Showcase',
      icon: '🚀',
      category: 'Headers',
      defaultProps: {
        badge: '⚡ Built for Developers',
        heading: 'Turn Any Reference Into Production Code',
        subheading: 'Reverse engineer websites, customize layouts in a visual builder, and export zero-dependency HTML and CSS instantly.',
        primaryButtonText: 'Start Building Free',
        primaryButtonHref: '#features',
        secondaryButtonText: 'Explore Demo',
        secondaryButtonHref: '#pricing',
        imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
        imageAlt: 'Hero Showcase Preview'
      },
      defaultStyles: {
        paddingTop: 80,
        paddingBottom: 80,
        backgroundColor: '#ffffff',
        textColor: '#0f172a',
        maxWidth: 1200
      }
    },

    features: {
      type: 'features',
      name: 'Feature Cards',
      icon: '⚡',
      category: 'Content',
      defaultProps: {
        badge: 'Capabilities',
        heading: 'Engineered for Performance & Speed',
        description: 'Everything you need to rebuild, customize, and export websites in seconds.',
        items: [
          { icon: '⚡', title: 'Fast Reconstruction', description: 'Extract headings, hierarchy, and colors with single-click precision.' },
          { icon: '🎨', title: 'Visual Live Editor', description: 'Tweak typography, spacing, and styling with instantaneous visual feedback.' },
          { icon: '📦', title: 'Clean ZIP Export', description: 'Zero-boilerplate semantic HTML5, pure CSS Grid, and vanilla JavaScript.' }
        ]
      },
      defaultStyles: {
        paddingTop: 80,
        paddingBottom: 80,
        backgroundColor: '#f8fafc',
        textColor: '#0f172a',
        maxWidth: 1200
      }
    },

    stats: {
      type: 'stats',
      name: 'Statistics Row',
      icon: '📊',
      category: 'Content',
      defaultProps: {
        heading: 'Trusted by High-Velocity Creators',
        items: [
          { value: '10x', label: 'Faster Prototyping' },
          { value: '99.9%', label: 'Clean Code Output' },
          { value: '500K+', label: 'Pages Rebuilt' },
          { value: '0', label: 'Framework Dependencies' }
        ]
      },
      defaultStyles: {
        paddingTop: 60,
        paddingBottom: 60,
        backgroundColor: '#ffffff',
        textColor: '#0f172a',
        maxWidth: 1200
      }
    },

    testimonials: {
      type: 'testimonials',
      name: 'Testimonials',
      icon: '💬',
      category: 'Social Proof',
      defaultProps: {
        badge: 'Customer Voices',
        heading: 'Loved by Founders & Engineers',
        description: 'See how teams are eliminating tedious wireframing cycles.',
        items: [
          {
            quote: 'ReverseBuilder generated production-ready HTML from our screenshots in under 2 minutes.',
            author: 'Sarah Chen',
            role: 'VP of Product at CloudScale',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80'
          },
          {
            quote: 'The export has zero boilerplate. Just pure semantic HTML and clean CSS grid.',
            author: 'Alex Rivera',
            role: 'Principal Engineer at DevForge',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80'
          }
        ]
      },
      defaultStyles: {
        paddingTop: 80,
        paddingBottom: 80,
        backgroundColor: '#f8fafc',
        textColor: '#0f172a',
        maxWidth: 1200
      }
    },

    pricing: {
      type: 'pricing',
      name: 'Pricing Tables',
      icon: '💳',
      category: 'Commerce',
      defaultProps: {
        badge: 'Flexible Plans',
        heading: 'Transparent Pricing for Every Team',
        description: 'Start free and upgrade seamlessly as your needs expand.',
        items: [
          {
            name: 'Starter',
            price: '$0',
            period: '/mo',
            description: 'For indie hackers and rapid prototyping.',
            isPopular: false,
            features: ['Up to 5 projects', 'URL extraction & inspection', 'Clean HTML/CSS export', 'Community support'],
            ctaText: 'Start Free'
          },
          {
            name: 'Professional',
            price: '$29',
            period: '/mo',
            description: 'For growing agencies and fast-moving teams.',
            isPopular: true,
            features: ['Unlimited projects', 'Vision AI screenshot reconstruction', 'Asset optimization', 'Priority support'],
            ctaText: 'Upgrade to Pro'
          },
          {
            name: 'Enterprise',
            price: '$99',
            period: '/mo',
            description: 'For dedicated infrastructure and team seats.',
            isPopular: false,
            features: ['Unlimited team seats', 'Self-hosted Docker export', 'Custom design systems', 'Dedicated account manager'],
            ctaText: 'Contact Sales'
          }
        ]
      },
      defaultStyles: {
        paddingTop: 80,
        paddingBottom: 80,
        backgroundColor: '#ffffff',
        textColor: '#0f172a',
        maxWidth: 1200
      }
    },

    contact: {
      type: 'contact',
      name: 'Contact Form',
      icon: '✉️',
      category: 'Forms',
      defaultProps: {
        badge: 'Get in Touch',
        heading: 'Let’s Build Something Remarkable',
        description: 'Have questions or need assistance? Send us a message.',
        buttonText: 'Send Message'
      },
      defaultStyles: {
        paddingTop: 80,
        paddingBottom: 80,
        backgroundColor: '#f8fafc',
        textColor: '#0f172a',
        maxWidth: 1200
      }
    },

    cta: {
      type: 'cta',
      name: 'Call to Action',
      icon: '📣',
      category: 'Conversion',
      defaultProps: {
        heading: 'Ready to Transform How You Build Websites?',
        description: 'Join thousands of creators using ReverseBuilder to turn inspiration into production code today.',
        buttonText: 'Start Building Now',
        buttonHref: '#pricing'
      },
      defaultStyles: {
        paddingTop: 80,
        paddingBottom: 80,
        backgroundColor: '#4f46e5',
        textColor: '#ffffff',
        textAlign: 'center',
        maxWidth: 1200
      }
    },

    footer: {
      type: 'footer',
      name: 'Page Footer',
      icon: '⚓',
      category: 'Footers',
      defaultProps: {
        brandName: 'ReverseBuilder',
        description: 'The visual reverse engineering platform for modern web artisans.',
        copyright: `© ${new Date().getFullYear()} ReverseBuilder. Built with precision.`
      },
      defaultStyles: {
        paddingTop: 60,
        paddingBottom: 40,
        backgroundColor: '#0b0f19',
        textColor: '#f8fafc',
        maxWidth: 1200
      }
    },

    'text-block': {
      type: 'text-block',
      name: 'Text Block',
      icon: '📝',
      category: 'Typography',
      defaultProps: {
        heading: 'Custom Text Content',
        content: 'ReverseBuilder provides a comprehensive suite of building blocks engineered to accelerate visual web authoring.'
      },
      defaultStyles: {
        paddingTop: 60,
        paddingBottom: 60,
        backgroundColor: '#ffffff',
        textColor: '#0f172a',
        maxWidth: 800
      }
    },

    'image-block': {
      type: 'image-block',
      name: 'Image Showcase',
      icon: '🖼️',
      category: 'Media',
      defaultProps: {
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
        alt: 'Analytics Dashboard',
        caption: 'Interactive real-time preview canvas'
      },
      defaultStyles: {
        paddingTop: 60,
        paddingBottom: 60,
        backgroundColor: '#ffffff',
        textColor: '#0f172a',
        maxWidth: 1200
      }
    },

    'card-grid': {
      type: 'card-grid',
      name: 'Card Grid',
      icon: '🗂️',
      category: 'Layout',
      defaultProps: {
        columns: 3,
        items: [
          { title: 'Modular Architecture', description: 'Extensible JSON AST component tree.', icon: '🏗️' },
          { title: 'Zero Lock-in', description: 'Export standard standalone HTML5 & CSS.', icon: '🔓' },
          { title: 'Visual Workbench', description: 'Interactive controls with live inspection.', icon: '🎨' }
        ]
      },
      defaultStyles: {
        paddingTop: 80,
        paddingBottom: 80,
        backgroundColor: '#ffffff',
        textColor: '#0f172a',
        maxWidth: 1200
      }
    }
  },

  getAll() {
    return Object.values(this.definitions);
  },

  get(type) {
    return this.definitions[type] || this.definitions['text-block'];
  },

  createInstance(type) {
    const def = this.get(type);
    const id = `${type}-${Math.random().toString(36).slice(2, 8)}`;
    return {
      id,
      type: def.type,
      name: def.name,
      props: JSON.parse(JSON.stringify(def.defaultProps)),
      styles: JSON.parse(JSON.stringify(def.defaultStyles)),
      children: []
    };
  }
};

window.ComponentRegistry = ComponentRegistry;
