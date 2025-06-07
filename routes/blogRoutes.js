const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const sanitizeHtml = require('sanitize-html');
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

// Get all blogs
router.get('/', async (req, res) => {
    try {
        const blogs = await prisma.blog.findMany({
            orderBy: {
                date: 'desc'
            }
        });
        res.json(blogs);
    } catch (error) {
        console.error('Error fetching blogs:', error);
        res.status(500).json({ error: 'Failed to fetch blogs', details: error.message });
    }
});

// Get single blog by slug
router.get('/:slug', async (req, res) => {
    try {
        const blog = await prisma.blog.findUnique({
            where: {
                slug: req.params.slug
            }
        });
        
        if (!blog) {
            return res.status(404).json({ error: 'Blog not found' });
        }
        
        res.json(blog);
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

module.exports = router; 