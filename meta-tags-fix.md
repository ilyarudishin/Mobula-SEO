# Step 2: Update Meta Tags for mobula.io/compare

## Current Meta Tags (WRONG):
```html
<title>Mobula | The onchain-native crypto data aggregator</title>
<meta name="description" content="Price, volume, liquidity, and market cap of any crypto, in real-time. Track crypto information & insights, buy at best price, analyse your wallets and more.">
```

## Required Meta Tags (FIXED):
```html
<title>5 DexScreener Alternatives: Real Performance Data & Developer Experience (2025) | Mobula</title>
<meta name="description" content="Compare the top 5 DexScreener alternatives in 2025. Discover faster, more reliable crypto data APIs with better performance, lower latency, and comprehensive blockchain coverage. Mobula offers superior API performance vs DexScreener, DexTools, and GeckoTerminal.">
```

## How to Update in Framer:

### Option A: Framer Dashboard
1. Go to your Framer project dashboard
2. Select the /compare page
3. Click "Settings" → "SEO"
4. Update:
   - **Page Title**: `5 DexScreener Alternatives: Real Performance Data & Developer Experience (2025) | Mobula`
   - **Meta Description**: `Compare the top 5 DexScreener alternatives in 2025. Discover faster, more reliable crypto data APIs with better performance, lower latency, and comprehensive blockchain coverage. Mobula offers superior API performance vs DexScreener, DexTools, and GeckoTerminal.`

### Option B: Custom Code (Advanced)
If you have access to custom code in Framer:
1. Go to Project Settings → Custom Code
2. Add to `<head>` section:

```html
<script>
if (window.location.pathname === '/compare') {
  document.title = '5 DexScreener Alternatives: Real Performance Data & Developer Experience (2025) | Mobula';
  
  // Update meta description
  let metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute('content', 'Compare the top 5 DexScreener alternatives in 2025. Discover faster, more reliable crypto data APIs with better performance, lower latency, and comprehensive blockchain coverage. Mobula offers superior API performance vs DexScreener, DexTools, and GeckoTerminal.');
  }
}
</script>
```

## Additional Meta Tags to Add:
```html
<meta property="og:title" content="5 DexScreener Alternatives: Real Performance Data & Developer Experience (2025)">
<meta property="og:description" content="Compare the top 5 DexScreener alternatives in 2025. Discover faster, more reliable crypto data APIs with better performance.">
<meta property="og:type" content="article">
<meta name="keywords" content="dexscreener alternatives, dex screener alternative, crypto data api, blockchain analytics, trading terminal api">
```