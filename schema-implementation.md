# Step 3: Add Schema Markup to mobula.io/compare

## What is Schema Markup?
Schema markup tells Google exactly what your content is about using structured data. This helps Google understand your page is a comparison article about DexScreener alternatives.

## How to Add Schema in Framer:

### Method 1: Framer Custom Code (Recommended)
1. Go to your Framer project
2. Navigate to **Project Settings** → **Custom Code**
3. In the **End of `<head>` tag** section, add:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article", 
  "headline": "5 DexScreener Alternatives: Real Performance Data & Developer Experience (2025)",
  "description": "Compare the top 5 DexScreener alternatives in 2025. Discover faster, more reliable crypto data APIs with better performance, lower latency, and comprehensive blockchain coverage.",
  "author": {
    "@type": "Organization",
    "name": "Mobula Team",
    "url": "https://mobula.io"
  },
  "publisher": {
    "@type": "Organization", 
    "name": "Mobula",
    "logo": {
      "@type": "ImageObject",
      "url": "https://mobula.io/logo.png"
    }
  },
  "datePublished": "2025-08-05",
  "dateModified": "2025-08-13",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://mobula.io/compare"
  },
  "keywords": ["dexscreener alternatives", "dex screener alternative", "crypto data api", "blockchain analytics"],
  "mentions": [
    {
      "@type": "SoftwareApplication",
      "name": "DexScreener",
      "applicationCategory": "Analytics Software"
    },
    {
      "@type": "SoftwareApplication", 
      "name": "Mobula",
      "applicationCategory": "Analytics Software",
      "url": "https://mobula.io"
    }
  ]
}
</script>
```

### Method 2: Page-Specific Schema (Advanced)
If you want schema only on the /compare page:

```html
<script>
if (window.location.pathname === '/compare') {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "5 DexScreener Alternatives: Real Performance Data & Developer Experience (2025)",
    "description": "Compare the top 5 DexScreener alternatives in 2025.",
    "author": {
      "@type": "Organization",
      "name": "Mobula Team"
    },
    "datePublished": "2025-08-05",
    "keywords": ["dexscreener alternatives", "crypto data api"]
  });
  document.head.appendChild(script);
}
</script>
```

## Verify Schema Implementation:
1. After adding the code, publish your Framer site
2. Go to: https://search.google.com/test/rich-results
3. Enter: https://mobula.io/compare
4. Check if schema is detected correctly

## Why This Helps:
- ✅ Google understands it's a comparison article
- ✅ Shows up in rich snippets
- ✅ Better click-through rates
- ✅ Improved relevance for "alternatives" searches