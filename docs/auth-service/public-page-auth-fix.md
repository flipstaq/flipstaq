# Public Page Authentication Fix

**Date:** November 2, 2025  
**Issue:** "Refresh token not provided" error appearing on public pages for non-authenticated users

---

## 🐛 Problem Description

### Symptoms

When users visit the website **without being signed in**, they see errors in the server logs:

```
[AUTH] [Nest] 41932  - 11/02/2025, 8:39:17 AM   ERROR [ExceptionsHandler] Refresh token not provided
```

This happens on **every page load**, including public pages that should be accessible without authentication.

### Impact

- ❌ Server logs filled with unnecessary error messages
- ❌ Confusion for developers monitoring logs
- ❌ Potential performance impact from unnecessary API calls
- ✅ **Note:** Users can still access the website - this is a backend error, not a user-facing bug

---

## 🔍 Root Cause Analysis

### The Problem Flow

**Before Fix:**

```
1. User visits website (not logged in)
   ↓
2. AuthProvider useEffect runs on mount
   ↓
3. authService.validateToken() called
   ↓
4. No token exists → validation fails
   ↓
5. Catch block: authService.refreshToken() called
   ↓
6. POST /auth/refresh sent to backend
   ↓
7. Backend: No refresh token in cookie
   ↓
8. ❌ ERROR: "Refresh token not provided"
```

### Code Location

**File:** `apps/web/src/components/providers/AuthProvider.tsx`

**Problem Code (Lines 34-47):**

```typescript
useEffect(() => {
  const validateCurrentUser = async () => {
    try {
      // ❌ PROBLEM: Always tries to validate, even when no token exists
      const userInfo = await authService.validateToken();
      setUser(userInfo);
    } catch (error) {
      // ❌ PROBLEM: Always tries to refresh on validation failure
      try {
        const response = await authService.refreshToken();
        // ...
      } catch (refreshError) {
        // Error logged here
      }
    } finally {
      setLoading(false);
    }
  };

  validateCurrentUser();
}, []);
```

**Why This Happens:**

1. `AuthProvider` wraps the entire app
2. It runs on every page, including public pages
3. It attempts validation/refresh even when user has never logged in
4. Non-authenticated users don't have tokens → causes error

---

## ✅ Solution Implemented

### The Fix

Added a **token existence check** before attempting validation or refresh:

```typescript
useEffect(() => {
  const validateCurrentUser = async () => {
    try {
      // ✅ NEW: Check if token exists before validation
      const storedToken = authService.getAccessToken();

      if (!storedToken) {
        // No token found - user is not logged in (normal for public pages)
        setLoading(false);
        return; // ✅ Exit early - no API calls made
      }

      // Token exists, proceed with validation
      const userInfo = await authService.validateToken();
      setUser(userInfo);
    } catch (error) {
      // Only reached if token exists but is invalid/expired
      console.warn("Token validation failed, attempting to refresh...", error);

      try {
        const response = await authService.refreshToken();
        setUser(response.user);
        console.log("Token refreshed successfully on app load");
      } catch (refreshError) {
        console.warn(
          "Token refresh also failed, user needs to log in again:",
          refreshError
        );
        // Clear invalid tokens
        if (typeof window !== "undefined") {
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  validateCurrentUser();
}, []);
```

### What Changed

**Before:**

- ❌ Always called `validateToken()` → always called `refreshToken()` on failure
- ❌ Made 2 unnecessary API calls for every non-authenticated page load
- ❌ Caused error logs on backend

**After:**

- ✅ Checks `authService.getAccessToken()` first
- ✅ Returns early if no token exists (no API calls)
- ✅ Only validates/refreshes when user actually has credentials
- ✅ No errors for non-authenticated users

---

## 🧪 Testing Guide

### Test Scenario 1: Non-Authenticated User (Primary Fix)

**Steps:**

1. Open browser in **Incognito/Private mode**
2. Clear all cookies and local storage
3. Navigate to `http://localhost:3000`
4. Check browser console and server logs

**Expected Result:**

- ✅ Page loads normally
- ✅ No errors in browser console
- ✅ No "Refresh token not provided" in server logs
- ✅ User can browse public pages freely

### Test Scenario 2: Authenticated User with Valid Token

**Steps:**

1. Log in to the application
2. Stay on any page
3. Refresh the page (F5)
4. Check that you remain logged in

**Expected Result:**

- ✅ User stays logged in after refresh
- ✅ Token validated successfully
- ✅ No errors in console or logs
- ✅ User info displayed correctly

### Test Scenario 3: Authenticated User with Expired Token

**Steps:**

1. Log in to the application
2. Wait for access token to expire (15 minutes)
3. Refresh the page
4. Check logs

**Expected Result:**

- ✅ Token validation fails (expected)
- ✅ Automatic refresh attempt using refresh token cookie
- ✅ New access token obtained
- ✅ User remains logged in
- ✅ Log message: "Token refreshed successfully on app load"

### Test Scenario 4: Authenticated User with Expired Refresh Token

**Steps:**

1. Log in to the application
2. Manually delete the `refreshToken` cookie (browser DevTools)
3. Wait for access token to expire
4. Refresh the page

**Expected Result:**

- ✅ Token validation fails
- ✅ Refresh attempt fails (no refresh token)
- ✅ User logged out automatically
- ✅ localStorage cleared
- ✅ Redirected to login (or public home page)

### Test Scenario 5: Multiple Tabs (Non-Authenticated)

**Steps:**

1. Open 5 tabs in Incognito mode (not logged in)
2. Navigate to different pages in each tab
3. Check server logs

**Expected Result:**

- ✅ No "Refresh token not provided" errors
- ✅ Each tab loads independently
- ✅ No unnecessary API calls

---

## 🔍 Debugging

### Check Token Status

**Browser Console:**

```javascript
// Check if user has a token
localStorage.getItem("authToken"); // Should be null for non-authenticated users

// Check auth service status
import { authService } from "@/lib/auth";
console.log("Has token:", authService.getAccessToken());
console.log("Is authenticated:", authService.isAuthenticated());
```

### Monitor API Calls

**Browser DevTools (Network Tab):**

- Filter by `auth`
- Look for `/auth/validate` and `/auth/refresh` calls
- **Non-authenticated users:** Should see NO auth-related calls
- **Authenticated users:** Should see `/auth/validate` on page load

### Server Logs

**Auth Service Logs:**

```bash
cd services/auth-service
npm run start:dev

# Look for these patterns:
# ✅ No errors for public page visits
# ✅ Only validation/refresh logs for authenticated users
```

---

## 📊 Performance Impact

### Before Fix

**Per Non-Authenticated Page Load:**

- 1x POST `/auth/validate` (fails)
- 1x POST `/auth/refresh` (fails with error)
- Total: **2 unnecessary API calls**

**Impact with 1000 daily visitors (50% not logged in):**

- 500 users × 2 calls = **1,000 unnecessary requests/day**
- Server processing wasted on failed auth attempts
- Log files filled with error messages

### After Fix

**Per Non-Authenticated Page Load:**

- 0 API calls (early return)
- Total: **0 requests**

**Impact:**

- ✅ Eliminated 1,000+ unnecessary requests/day
- ✅ Reduced server load
- ✅ Cleaner logs
- ✅ Faster page loads for non-authenticated users

---

## 🏗️ Architecture

### Authentication Flow

#### **Non-Authenticated User (After Fix)**

```
1. User visits website
   ↓
2. AuthProvider mounts
   ↓
3. Check: authService.getAccessToken()
   ↓
4. Result: null (no token)
   ↓
5. ✅ Early return, setLoading(false)
   ↓
6. User sees public page
```

#### **Authenticated User with Valid Token**

```
1. User visits website (has token)
   ↓
2. AuthProvider mounts
   ↓
3. Check: authService.getAccessToken()
   ↓
4. Result: token exists
   ↓
5. Call: authService.validateToken()
   ↓
6. Success: Set user state
   ↓
7. User sees authenticated content
```

#### **Authenticated User with Expired Access Token**

```
1. User visits website (expired access token, valid refresh token)
   ↓
2. AuthProvider mounts
   ↓
3. Check: authService.getAccessToken()
   ↓
4. Result: token exists
   ↓
5. Call: authService.validateToken()
   ↓
6. Fail: Token expired
   ↓
7. Catch: Call authService.refreshToken()
   ↓
8. Success: New access token obtained
   ↓
9. Set user state
   ↓
10. User stays logged in
```

#### **Authenticated User with All Tokens Expired**

```
1. User visits website (all tokens expired)
   ↓
2. AuthProvider mounts
   ↓
3. Check: authService.getAccessToken()
   ↓
4. Result: token exists (but expired)
   ↓
5. Call: authService.validateToken()
   ↓
6. Fail: Token expired
   ↓
7. Catch: Call authService.refreshToken()
   ↓
8. Fail: Refresh token also expired
   ↓
9. Clear localStorage
   ↓
10. User logged out (needs to log in again)
```

---

## 🔐 Security Considerations

### What This Fix Does NOT Change

1. ✅ **Authentication still required for protected routes**

   - Middleware still blocks unauthorized access
   - JWT validation still enforced on backend

2. ✅ **Token security unchanged**

   - Refresh tokens still stored as HttpOnly cookies
   - Access tokens still memory-first storage
   - Same expiration times (15min access, 30day refresh)

3. ✅ **Protected endpoints still protected**
   - `/api/v1/users/me` still requires authentication
   - `/api/v1/products/my-products` still requires authentication
   - All auth guards still functional

### What Changed

1. ✅ **Reduced unnecessary API calls**

   - Only authenticated users trigger validation/refresh
   - Public page visitors don't hit auth endpoints

2. ✅ **Better user experience**
   - Faster page loads for public visitors
   - No console errors for developers
   - Cleaner server logs

---

## 📝 Related Files

### Modified Files

- `/apps/web/src/components/providers/AuthProvider.tsx` - Added token existence check

### Related Files (No Changes)

- `/apps/web/src/lib/auth.ts` - Auth service wrapper
- `/apps/web/src/lib/api/auth.ts` - Auth API client
- `/services/auth-service/src/auth/auth.controller.ts` - Backend auth controller

---

## ✅ Summary

### Problem

- ❌ "Refresh token not provided" errors for non-authenticated users
- ❌ Unnecessary API calls on every public page load
- ❌ Cluttered server logs

### Solution

- ✅ Check for token existence before validation/refresh
- ✅ Early return for non-authenticated users
- ✅ No API calls for public page visitors

### Impact

- ✅ Eliminated unnecessary errors
- ✅ Reduced server load
- ✅ Improved performance
- ✅ Better developer experience

### Files Changed

- 1 file modified: `apps/web/src/components/providers/AuthProvider.tsx`

### Testing Status

- ✅ Non-authenticated users: No errors
- ✅ Authenticated users: Stay logged in
- ✅ Token refresh: Works correctly
- ✅ Expired tokens: Handled gracefully

---

**Fix Applied:** November 2, 2025  
**Status:** ✅ Complete and Tested
