# Dress2MyDoor Digitalisation - AI Coding Instructions

## Project Overview
**Dress2MyDoor** is a static website for a dress rental/sales business. This is a **frontend-only HTML/CSS project** with no backend, database, or build system. The site consists of multiple independent HTML pages that share a common stylesheet.

### Project Structure
```
├── homepage.html        # Main landing page (hero section, navigation stub)
├── gallerypage.html     # Dress collection gallery (grid layout)
├── contactpage.html     # Contact form section
└── homepage.css         # Shared stylesheet for all pages
```

## Critical Patterns

### Page Architecture
- **Single CSS file approach**: `homepage.css` is referenced in all HTML files (though filenames are inconsistent - see Known Issues)
- **Section-based design**: Each HTML file contains a single semantic HTML `<section>` focused on one feature
- **No JavaScript**: All functionality is HTML/CSS only (no interactivity yet)
- **Incomplete structure**: Pages reference navigation links (`href="#gallery"`, `href="#contact"`) suggesting future integration into a single-page layout

### Styling Patterns
- **Mobile-first absent**: Uses fixed viewport settings without responsive breakpoints
- **Color scheme**: Tomato red (`#ff6347`) for CTAs, dark gray (`#333`) for header, light backgrounds (`#f4f4f4`)
- **Layout**: CSS Grid for gallery (3 columns), Flexbox for hero centering and nav
- **Consistent spacing**: 20px gaps for grid, 40px padding for major sections
- **Hover states**: All interactive elements have color transitions (button hover: `#ff6347` → `#ff4500`)

### Form Structure
- Contact form uses `id="contact-form"` with required fields (name, email, message)
- Form method is `POST` but no backend endpoint configured (needs action attribute)
- Standard input validation via `required` attributes

## Known Issues & Technical Debt

1. **CSS file path mismatch**: `homepage.html` links `href="styles.css"` but file is named `homepage.css`
2. **Incomplete page integration**: Navigation links and section IDs suggest pages should be merged into single layout
3. **Missing form action**: Contact form has no `action` attribute or backend handler
4. **Placeholder imagery**: Gallery references external images (`dress1.jpg`, etc.) not included
5. **No responsive design**: Fixed layouts with no media queries for mobile devices

## Development Workflow

### When Adding Features
1. Update the relevant HTML section (gallery, contact, or create new section)
2. Add corresponding CSS to `homepage.css` (maintain existing naming conventions)
3. Follow existing BEM-inspired class naming: `.gallery-item`, `.hero-text`, `.cta-button`
4. Test styling matches existing color scheme and spacing patterns
5. **BEFORE committing**: Fix file path reference issue and test all pages load correctly

### When Styling
- Use hex colors (match `#ff6347`, `#333`, `#f4f4f4`, `#ccc`)
- Maintain 5px border-radius for small elements, 8px for larger components
- Add hover states to all interactive elements
- Use `box-sizing: border-box` (already global in reset)

### Testing Recommendations
- Verify CSS path reference works in all HTML files
- Test gallery grid layout at various viewport widths
- Validate contact form fields are required
- Check color contrast for accessibility (especially white text on image backgrounds)

## Integration Points (Future)

- **Single-page conversion**: Merge separate HTML pages using JavaScript routing or single layout with sections
- **Backend integration**: Form submission requires backend endpoint (currently POST to nowhere)
- **Image assets**: Add dress images to `assets/` or CDN reference
- **Analytics**: No tracking implemented - consider adding for business metrics
