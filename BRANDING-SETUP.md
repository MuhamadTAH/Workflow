# 🎨 n8n Custom Branding Setup

## 📋 **What You Need to Do:**

### **1. Add Logo Files**
Upload these files to `frontend/public/`:
- **logo.png** - Your company logo (recommended: 200x50px)
- **favicon.ico** - Your favicon (16x16px or 32x32px)

### **2. Add Environment Variables to Backend**
Add these to your Render backend service (`workflow-lg9z`):

```env
N8N_CUSTOM_BRANDING=true
N8N_BRAND_NAME=WorkflowPro
N8N_BRAND_LOGO_URL=https://frontend-prox.onrender.com/logo.png
N8N_BRAND_FAVICON_URL=https://frontend-prox.onrender.com/favicon.ico
```

### **3. Customize Branding**
Change these values to match your brand:
- **N8N_BRAND_NAME**: Your app name (replaces "n8n")
- **Logo URL**: Points to your logo file
- **Favicon URL**: Points to your favicon

## ✅ **Result:**
- ❌ n8n logo → ✅ Your logo
- ❌ "n8n" text → ✅ "WorkflowPro" (or your name)
- ❌ n8n favicon → ✅ Your favicon
- **Professional branded experience**

## 🔧 **If Environment Variables Don't Work:**
We can try CSS injection method as backup:
```css
/* Hide n8n branding */
.n8n-logo { display: none !important; }
[data-test-id="main-header"] img { display: none !important; }

/* Add your branding */
.main-header::before {
  content: "WorkflowPro";
  font-size: 18px;
  font-weight: bold;
  color: #your-brand-color;
}
```

**Upload your logo files and add the environment variables to remove all n8n branding!** 🚀