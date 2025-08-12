# 🔍 Google Search Console Setup Guide

## Prerequisites
- Access to Google Cloud Console
- Admin access to mobula.io Google Search Console property
- Railway environment variable access

## Step 1: Create Google Cloud Service Account

### 1.1 Create/Select Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing one
3. Note the **Project ID** (you'll need this)

### 1.2 Enable Google Search Console API
1. Go to **APIs & Services** → **Library**
2. Search for "Google Search Console API"
3. Click **Enable**

### 1.3 Create Service Account
1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **Service Account**
3. Fill in details:
   - **Service account name**: `mobula-seo-agent`
   - **Service account ID**: `mobula-seo-agent` (auto-generated)
   - **Description**: `SEO agent for Mobula.io performance tracking`
4. Click **Create and Continue**
5. **Role**: Leave blank (we'll grant access in Search Console)
6. Click **Continue** → **Done**

### 1.4 Generate Service Account Key
1. Find your service account in the list
2. Click on the service account email
3. Go to **Keys** tab
4. Click **Add Key** → **Create New Key**
5. Choose **JSON** format
6. Click **Create** and download the JSON file
7. **Save this file securely** - you'll need it for Railway

## Step 2: Add Service Account to Google Search Console

### 2.1 Access Search Console
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Make sure **mobula.io** is added as a property
   - If not, click **Add Property** → **Domain** → Enter `mobula.io`

### 2.2 Grant Service Account Access
1. Select **mobula.io** property
2. Go to **Settings** (⚙️) in left sidebar
3. Click **Users and permissions**
4. Click **Add User**
5. **Email**: Enter the service account email from JSON file
   - Format: `mobula-seo-agent@[PROJECT-ID].iam.gserviceaccount.com`
6. **Permission**: Select **Owner** (full access needed for API)
7. Click **Add**

## Step 3: Configure Railway Environment Variables

You have two options for adding credentials to Railway:

### Option A: Base64 Encoded (Recommended)

1. **Encode your JSON file**:
   ```bash
   base64 -i path/to/your/service-account-key.json
   ```
   Copy the output (long string)

2. **Add to Railway**:
   - Go to your Railway project → **Variables**
   - Add: `GOOGLE_APPLICATION_CREDENTIALS_BASE64`
   - Value: Paste the base64 string
   - Click **Add**

### Option B: Direct JSON

1. **Copy JSON content**:
   - Open your service account JSON file
   - Copy the entire contents

2. **Add to Railway**:
   - Go to your Railway project → **Variables** 
   - Add: `GOOGLE_APPLICATION_CREDENTIALS`
   - Value: Paste the entire JSON content
   - Click **Add**

## Step 4: Verify Setup

### 4.1 Test Connection
1. Wait for Railway to redeploy (2-3 minutes)
2. Visit: `https://mobula-seo-production.up.railway.app/test-gsc`
3. You should see:
   ```json
   {
     "status": "success",
     "connection": true,
     "topQueries": [...],
     "message": "Google Search Console connected successfully"
   }
   ```

### 4.2 Check Railway Logs
1. Go to Railway → **Deployments** → **View Logs**
2. Look for:
   ```
   [GSC] Using base64-encoded Google credentials from environment
   [GSC] Target site found: sc-domain:mobula.io with permission level: siteOwner
   [GSC] Retrieved X performance records
   ```

## Step 5: Verify GSC Features Are Active

Once connected, your agent will automatically:

### 📊 **Daily Performance Tracking**
- Track keyword positions for core keywords
- Monitor click-through rates and impressions
- Identify ranking improvements/drops

### 📈 **Weekly Reports** 
- Generate comprehensive performance summaries
- Include top-performing pages and queries
- Track SEO progress with real data

### 🎯 **Content Performance Analysis**
- Monitor how generated content performs
- Track which articles drive traffic
- Optimize future content based on GSC insights

## Troubleshooting

### Connection Successful but No Domain Access
- **Issue**: Service account connected but can't access mobula.io data
- **Solution**: Make sure service account email is added to Search Console with **Owner** permissions

### "Insufficient Permission" Error
- **Issue**: Service account lacks proper Search Console access
- **Solution**: Re-add service account with **Owner** role (not Restricted)

### JSON Parsing Errors
- **Issue**: Malformed credentials in environment variables
- **Solution**: Re-encode/re-paste JSON ensuring no extra characters

### Domain Format Issues
- **Issue**: Service can't find mobula.io property
- **Solution**: The service auto-detects multiple formats. Check available sites in logs.

## Success Indicators

✅ **GSC Test Endpoint**: Returns success with real query data  
✅ **Railway Logs**: Show successful credential loading and site detection  
✅ **Weekly Reports**: Include real GSC performance data  
✅ **Daily Health Checks**: Show actual clicks/impressions from GSC  

Once complete, your autonomous agent will have comprehensive SEO performance insights directly from Google Search Console!