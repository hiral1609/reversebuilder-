const { validateProject, generateId } = require('../validators/schema-validator');
const aiVisionService = require('./ai-vision-service');

class ReconstructionService {
  /**
   * Reconstructs an editable project AST from crawled URL metadata,
   * retaining the authentic webpage HTML, structure, and stylesheets.
   */
  reconstructFromCrawledData(crawledResult) {
    const { url, screenshotUrl, extracted = {} } = crawledResult;
    const title = extracted.title || 'Reconstructed Website';
    const bodyBg = extracted.bodyBg || '#ffffff';
    const bodyColor = extracted.bodyColor || '#0f172a';
    const bodyFont = extracted.bodyFont || "'Inter', sans-serif";

    // Use authentic extracted sections
    let sections = [];
    if (Array.isArray(extracted.sections) && extracted.sections.length > 0) {
      sections = extracted.sections.map((s, idx) => ({
        id: s.id || generateId('sec'),
        type: 'raw-html',
        name: s.name || `Section ${idx + 1}`,
        props: {
          html: s.html || s.props?.html || '<div style="padding:20px;">Empty section</div>',
          text: s.text || s.props?.text || ''
        },
        styles: {
          paddingTop: s.styles?.paddingTop || 0,
          paddingBottom: s.styles?.paddingBottom || 0,
          backgroundColor: s.styles?.backgroundColor || 'transparent',
          textColor: s.styles?.textColor || 'inherit',
          maxWidth: 1600
        }
      }));
    } else {
      // Fallback section
      sections = [{
        id: generateId('sec'),
        type: 'raw-html',
        name: 'Main Content',
        props: {
          html: '<div style="padding:40px; text-align:center;"><h2>Reconstructed Content</h2></div>',
          text: 'Reconstructed content'
        },
        styles: {
          paddingTop: 40,
          paddingBottom: 40,
          backgroundColor: 'transparent',
          textColor: 'inherit',
          maxWidth: 1400
        }
      }];
    }

    const rawProject = {
      name: title,
      description: extracted.metaDesc || `Reconstructed directly from ${url}`,
      theme: {
        primaryColor: '#4f46e5',
        secondaryColor: '#06b6d4',
        backgroundColor: bodyBg,
        textColor: bodyColor,
        fontFamily: bodyFont
      },
      reference: {
        type: 'url',
        source: url,
        screenshotUrl
      },
      stylesheets: extracted.stylesheets || [],
      inlineStyles: extracted.inlineStyles || [],
      sections
    };

    return validateProject(rawProject).project;
  }

  /**
   * Reconstructs from uploaded screenshot
   */
  async reconstructFromScreenshot(imagePath, screenshotUrl, originalFilename = '') {
    // 1. Try AI Vision
    const aiResult = await aiVisionService.analyzeScreenshot(imagePath);
    if (aiResult.success && aiResult.projectData) {
      aiResult.projectData.reference = {
        type: 'screenshot',
        source: originalFilename,
        screenshotUrl
      };
      return {
        project: aiResult.projectData,
        method: 'ai-vision'
      };
    }

    // 2. Fallback Heuristic Scaffold
    const projectName = originalFilename
      ? `Rebuilt: ${originalFilename.replace(/\.[^/.]+$/, '')}`
      : 'Screenshot Reconstruction';

    const sections = [
      {
        id: generateId('nav'),
        type: 'navbar',
        name: 'Navigation Bar',
        props: {
          brandName: 'BrandStudio',
          links: [
            { label: 'Features', href: '#features' },
            { label: 'Pricing', href: '#pricing' },
            { label: 'Contact', href: '#contact' }
          ],
          ctaText: 'Get Started',
          ctaHref: '#contact'
        },
        styles: {
          paddingTop: 20,
          paddingBottom: 20,
          backgroundColor: '#ffffff',
          textColor: '#0f172a'
        }
      },
      {
        id: generateId('hero'),
        type: 'hero',
        name: 'Hero Section',
        props: {
          badge: 'Screenshot Reconstruction',
          heading: 'Rebuild Visual Designs into Code',
          subheading: 'This layout was generated from your uploaded reference. Use the visual editor to inspect and edit typography, colors, and layout.',
          primaryButtonText: 'Explore Features',
          primaryButtonHref: '#features',
          secondaryButtonText: 'Learn More',
          secondaryButtonHref: '#pricing',
          imageUrl: screenshotUrl,
          imageAlt: 'Reference Screenshot'
        },
        styles: {
          paddingTop: 80,
          paddingBottom: 80,
          backgroundColor: '#ffffff',
          textColor: '#0f172a'
        }
      },
      {
        id: generateId('ftr'),
        type: 'footer',
        name: 'Page Footer',
        props: {
          brandName: 'BrandStudio',
          description: 'Reconstructed via ReverseBuilder visual workbench.',
          copyright: `© ${new Date().getFullYear()} BrandStudio. All rights reserved.`
        },
        styles: {
          paddingTop: 60,
          paddingBottom: 40,
          backgroundColor: '#0b0f19',
          textColor: '#f8fafc'
        }
      }
    ];

    const rawProject = {
      name: projectName,
      description: 'Reconstructed layout based on reference screenshot.',
      theme: {
        primaryColor: '#4f46e5',
        secondaryColor: '#06b6d4',
        backgroundColor: '#ffffff',
        textColor: '#0f172a',
        fontFamily: "'Inter', sans-serif"
      },
      reference: {
        type: 'screenshot',
        source: originalFilename,
        screenshotUrl
      },
      sections
    };

    return {
      project: validateProject(rawProject).project,
      method: 'heuristic',
      message: aiResult.message || 'Heuristic reconstruction generated.'
    };
  }
}

module.exports = new ReconstructionService();
module.exports.ReconstructionService = ReconstructionService;
