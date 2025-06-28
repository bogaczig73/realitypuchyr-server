const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const sanitizeHtml = require('sanitize-html');
const { translateBlog, SUPPORTED_LANGUAGES } = require('../services/translationService');
const prisma = new PrismaClient();

// Sanitization options
const sanitizeOptions = {
    allowedTags: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
        'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
        'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'img'
    ],
    allowedAttributes: {
        a: ['href', 'name', 'target'],
        img: ['src', 'alt', 'title'],
        '*': ['class', 'style']
    },
    allowedStyles: {
        '*': {
            'color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/],
            'text-align': [/^left$/, /^right$/, /^center$/],
            'font-size': [/^\d+(?:px|em|%)$/]
        }
    },
    // Convert newlines to <br> tags
    transformTags: {
        'br': function(tagName, attribs) {
            return {
                tagName: 'br',
                attribs: {}
            };
        }
    }
};

// Helper function to preprocess content
const preprocessContent = (content) => {
    // Replace \n with <br> tags
    return content.replace(/\n/g, '<br>');
};

// Helper function to get preferred language from Accept-Language header
const getPreferredLanguage = (acceptLanguage) => {
  if (!acceptLanguage) return 'cs';
  
  // Parse Accept-Language header (e.g., "en-US,en;q=0.9,cs;q=0.8")
  const languages = acceptLanguage.split(',')
    .map(lang => {
      const [language, q = 'q=1.0'] = lang.trim().split(';');
      return {
        language: language.split('-')[0], // Get primary language code
        q: parseFloat(q.split('=')[1])
      };
    })
    .sort((a, b) => b.q - a.q);

  // Find first supported language
  const preferredLanguage = languages.find(lang => 
    SUPPORTED_LANGUAGES.includes(lang.language)
  );

  return preferredLanguage?.language || 'cs';
};

// Get all blogs
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const truncate = parseInt(req.query.truncate) || 0; // 0 means no truncation
        const skip = (page - 1) * limit;
        const preferredLanguage = req.language || 'cs'; // Use req.language set by middleware

        // Get blogs with pagination
        const blogs = await prisma.blog.findMany({
            orderBy: {
                date: 'desc'
            },
            skip,
            take: limit,
            include: {
                translations: {
                    where: {
                        language: preferredLanguage
                    }
                }
            }
        });

        // Process blogs to use translations if available
        const processedBlogs = blogs.map(blog => {
            let processedBlog = { ...blog };
            
            // If translation exists and it's not the original language, use it
            if (blog.translations && blog.translations.length > 0 && preferredLanguage !== blog.language) {
                const translation = blog.translations[0];
                processedBlog = {
                    ...blog,
                    name: translation.name,
                    slug: translation.slug, // Use translated slug
                    content: translation.content,
                    tags: translation.tags,
                    metaTitle: translation.metaTitle,
                    metaDescription: translation.metaDescription,
                    keywords: translation.keywords,
                    translations: undefined // Remove translations array from response
                };
            }

            // Truncate content if truncate parameter is provided
            if (truncate > 0 && processedBlog.content.length > truncate) {
                processedBlog.content = processedBlog.content.substring(0, truncate) + '...';
            }

            return processedBlog;
        });

        res.json(processedBlogs);
    } catch (error) {
        console.error('Error fetching blogs:', error);
        res.status(500).json({ error: 'Failed to fetch blogs', details: error.message });
    }
});

// Get single blog by slug
router.get('/:slug', async (req, res) => {
    try {
        const preferredLanguage = req.language || 'cs'; // Use req.language set by middleware
        const { slug } = req.params;
        
        // First try to find the blog by original slug
        let blog = await prisma.blog.findUnique({
            where: {
                slug: slug
            },
            include: {
                translations: {
                    where: {
                        language: preferredLanguage
                    }
                }
            }
        });

        // If not found by original slug, try to find by translated slug
        if (!blog) {
            const translation = await prisma.blogTranslation.findUnique({
                where: {
                    slug: slug
                },
                include: {
                    blog: {
                        include: {
                            translations: {
                                where: {
                                    language: preferredLanguage
                                }
                            }
                        }
                    }
                }
            });

            if (translation) {
                blog = translation.blog;
            }
        }
        
        if (!blog) {
            return res.status(404).json({ error: 'Blog not found' });
        }

        // If translation exists and it's not the original language, use it
        if (blog.translations && blog.translations.length > 0 && preferredLanguage !== blog.language) {
            const translation = blog.translations[0];
            const translatedBlog = {
                ...blog,
                name: translation.name,
                slug: translation.slug, // Use translated slug
                content: translation.content,
                tags: translation.tags,
                metaTitle: translation.metaTitle,
                metaDescription: translation.metaDescription,
                keywords: translation.keywords,
                translations: undefined // Remove translations array from response
            };
            return res.json(translatedBlog);
        }
        
        // If no translation exists or if preferred language is the original language,
        // return original blog
        const blogWithoutTranslations = {
            ...blog,
            translations: undefined // Remove translations array from response
        };
        
        res.json(blogWithoutTranslations);
    } catch (error) {
        console.error('Error fetching blog:', error);
        res.status(500).json({ error: 'Failed to fetch blog', details: error.message });
    }
});

// Create new blog
router.post('/', async (req, res) => {
    try {
        const {
            name,
            slug,
            content,
            tags,
            pictures,
            metaTitle,
            metaDescription,
            keywords,
            language
        } = req.body;

        // Validate required fields
        if (!name || !slug || !content) {
            return res.status(400).json({
                error: 'Missing required fields',
                details: [
                    !name && 'Name is required',
                    !slug && 'Slug is required',
                    !content && 'Content is required'
                ].filter(Boolean)
            });
        }

        // Check if slug already exists
        const existingBlog = await prisma.blog.findUnique({
            where: { slug }
        });

        if (existingBlog) {
            return res.status(400).json({
                error: 'Blog with this slug already exists'
            });
        }

        // Preprocess and sanitize content
        const preprocessedContent = preprocessContent(content);
        const sanitizedContent = sanitizeHtml(preprocessedContent, sanitizeOptions);

        const blog = await prisma.blog.create({
            data: {
                name,
                slug,
                content: sanitizedContent,
                tags: tags || [],
                pictures: pictures || [],
                metaTitle,
                metaDescription,
                keywords,
                language: language || 'cs'
            }
        });

        res.status(201).json(blog);
    } catch (error) {
        console.error('Error creating blog:', error);
        res.status(500).json({ 
            error: 'Failed to create blog',
            details: error.message
        });
    }
});

// Update blog
router.put('/:id', async (req, res) => {
    try {
        const {
            name,
            slug,
            content,
            tags,
            pictures,
            metaTitle,
            metaDescription,
            keywords,
            language
        } = req.body;

        // Validate required fields
        if (!name || !slug || !content) {
            return res.status(400).json({
                error: 'Missing required fields',
                details: [
                    !name && 'Name is required',
                    !slug && 'Slug is required',
                    !content && 'Content is required'
                ].filter(Boolean)
            });
        }

        // Check if slug exists for other blogs
        const existingBlog = await prisma.blog.findFirst({
            where: {
                slug,
                id: {
                    not: parseInt(req.params.id)
                }
            }
        });

        if (existingBlog) {
            return res.status(400).json({
                error: 'Blog with this slug already exists'
            });
        }

        // Preprocess and sanitize content
        const preprocessedContent = preprocessContent(content);
        const sanitizedContent = sanitizeHtml(preprocessedContent, sanitizeOptions);

        const blog = await prisma.blog.update({
            where: {
                id: parseInt(req.params.id)
            },
            data: {
                name,
                slug,
                content: sanitizedContent,
                tags: tags || [],
                pictures: pictures || [],
                metaTitle,
                metaDescription,
                keywords,
                language
            }
        });

        res.json(blog);
    } catch (error) {
        console.error('Error updating blog:', error);
        res.status(500).json({ 
            error: 'Failed to update blog',
            details: error.message
        });
    }
});

// Delete blog
router.delete('/:id', async (req, res) => {
    try {
        await prisma.blog.delete({
            where: {
                id: parseInt(req.params.id)
            }
        });

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting blog:', error);
        res.status(500).json({ 
            error: 'Failed to delete blog',
            details: error.message
        });
    }
});

// Translate blog to target language
router.post('/:id/translate', async (req, res) => {
  try {
    const { id } = req.params;
    const { targetLanguage, sourceLanguage } = req.body;

    if (!targetLanguage || !SUPPORTED_LANGUAGES.includes(targetLanguage)) {
      return res.status(400).json({ error: 'Invalid or unsupported target language' });
    }

    // Get the blog
    const blog = await prisma.blog.findUnique({
      where: { id: parseInt(id) },
      include: {
        translations: true
      }
    });

    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }

    // Check if translation already exists
    console.log('Translating blog:', blog.name);
    console.log('Target language:', targetLanguage);
    const existingTranslation = blog.translations.find(t => t.language === targetLanguage);
    if (existingTranslation) {
      return res.status(400).json({ error: 'Translation already exists for this language' });
    }

    // Translate the blog
    const translations = await translateBlog(blog, targetLanguage, sourceLanguage);

    // Create translation record
    const translation = await prisma.blogTranslation.create({
      data: {
        blogId: parseInt(id),
        language: targetLanguage,
        ...translations
      }
    });

    res.json(translation);
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 