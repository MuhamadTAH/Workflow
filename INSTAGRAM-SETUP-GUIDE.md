# 📷 Instagram Business API Setup Guide

## 🚨 **For User: MAHAMMAD_TAH**
**App ID**: `1278666043617717`
**Issue**: Development mode + wrong API type + missing permissions

## 🎯 **Required Setup for Instagram Auto-Response**

### **Step 1: Facebook App Configuration**
1. **Go to**: https://developers.facebook.com/apps/1278666043617717
2. **Add Products**:
   - ✅ Instagram Graph API (NOT Instagram Basic Display)
   - ✅ Pages API
3. **App Review**: Submit for permissions (see Step 4)

### **Step 2: Instagram Business Account Setup**
1. **Instagram App** → Settings → Account → **Switch to Professional**
2. Choose **Business Account** (not Creator)
3. **Connect to Facebook Page** (required for API access)

### **Step 3: Facebook Page Setup**
1. **Create Facebook Business Page** (if not exists)
2. **Connect Instagram** to Facebook Page:
   - Facebook Page Settings → Instagram → Connect Account
3. **Verify Connection**: Page should show connected Instagram account

### **Step 4: Required Permissions**
Submit for **App Review** to get these permissions:
- ✅ `manage_pages` - Access Facebook Pages
- ✅ `instagram_basic` - Basic Instagram profile access
- ✅ `instagram_content_publish` - Post content to Instagram
- ✅ `instagram_manage_messages` - Respond to DMs (requires review)
- ✅ `instagram_manage_comments` - Respond to comments (requires review)

### **Step 5: Generate Proper Access Token**

#### **Option A: Facebook Graph API Explorer**
1. Go to: https://developers.facebook.com/tools/explorer
2. **Select your app**: `1278666043617717`
3. **Add Permissions**: `manage_pages`, `instagram_basic`
4. **Generate Token** → This gives you a **User Access Token**
5. **Get Page Token**:
   ```
   GET /me/accounts
   ```
6. **Get Instagram Business Account**:
   ```
   GET /{page-id}?fields=instagram_business_account
   ```

#### **Option B: Manual Steps**
1. **Get User Access Token** (short-lived)
2. **Exchange for Long-lived User Token**:
   ```
   GET /oauth/access_token?
     grant_type=fb_exchange_token&
     client_id={app-id}&
     client_secret={app-secret}&
     fb_exchange_token={short-lived-user-token}
   ```
3. **Get Page Access Token**:
   ```
   GET /me/accounts?access_token={long-lived-user-token}
   ```
4. **Get Instagram Business Account ID**:
   ```
   GET /{page-id}?fields=instagram_business_account&access_token={page-access-token}
   ```

## 🔑 **What You Need for the Workflow:**

### **Instagram Account ID** (Numeric)
- ✅ Example: `17841405309211844`
- ❌ NOT your username: `@MAHAMMAD_TAH`

### **Access Token** (Page Token)
- ✅ Long-lived Page Access Token
- ❌ NOT User Access Token
- ❌ NOT short-lived token

## 🚨 **Current Issues with Your Setup:**

### **1. Development Mode**
- Your app is in **Development Mode**
- **Solution**: Submit for App Review OR add test users

### **2. Wrong API**
- Using **Instagram Basic Display** → Personal accounts only
- **Solution**: Switch to **Instagram Graph API** → Business accounts

### **3. Missing Permissions**
- Need `manage_pages` and `instagram_basic`
- **Solution**: Request permissions in App Review

### **4. Token Type**
- Likely using **User Token** instead of **Page Token**
- **Solution**: Get Page Access Token from `/me/accounts`

## 🛠️ **Quick Test (Without App Review)**

### **For Development/Testing:**
1. **Add Test Users** to your Facebook App
2. **Use Development Mode** with test accounts
3. **Generate Test Token** with required permissions
4. **Test with Instagram Business test account**

### **Test Token Generation:**
```bash
# Get short-lived user token from Graph Explorer
# Then exchange for long-lived token:

curl -X GET "https://graph.facebook.com/v18.0/oauth/access_token" \
  -d "grant_type=fb_exchange_token" \
  -d "client_id=1278666043617717" \
  -d "client_secret=YOUR_APP_SECRET" \
  -d "fb_exchange_token=SHORT_LIVED_TOKEN"
```

## 🎯 **Expected Tokens:**

### **Account ID**: 
```
17841405309211844
```

### **Access Token Format**:
```
EAABwzLixnjYBAxxxxxxxxxxxxxxxxxxxxxx
```

## ✅ **Success Checklist:**

- [ ] Facebook App has Instagram Graph API product
- [ ] Instagram account is Business account
- [ ] Instagram connected to Facebook Page  
- [ ] App has `manage_pages` + `instagram_basic` permissions
- [ ] Using **Page Access Token** (not User token)
- [ ] Account ID is numeric Instagram Business ID
- [ ] Token is long-lived (60+ days)

## 🚀 **Once Setup is Complete:**

1. **Account ID**: Use the numeric Instagram Business Account ID
2. **Access Token**: Use the Long-lived Page Access Token
3. **Test**: Click "Find My Account ID" in workflow builder
4. **Validate**: Click "Check" to verify connection
5. **Success**: You should see your account info with followers/posts

---

**Need Help?** 
- Facebook Developer Docs: https://developers.facebook.com/docs/instagram-api
- Instagram Graph API Guide: https://developers.facebook.com/docs/instagram-api/getting-started