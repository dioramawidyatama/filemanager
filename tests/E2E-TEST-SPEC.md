# FileManager E2E Test Specification

## Test Environment
- Base URL: http://localhost:3000
- Authentication: SSH Key required
- Test Data: Use `/home/opc/clawd/test-folder/` for isolation

---

## Authentication Tests

### TEST-AUTH-001: Login with valid SSH key
**Steps:**
1. Navigate to `/login`
2. Paste valid SSH public key from `~/.ssh/authorized_keys`
3. Click "Sign In"

**Expected:**
- Redirect to home page (`/`)
- File browser loads with root contents

### TEST-AUTH-002: Login with invalid SSH key
**Steps:**
1. Navigate to `/login`
2. Paste invalid/random key
3. Click "Sign In"

**Expected:**
- Error message: "Invalid SSH key"
- Remains on login page

### TEST-AUTH-003: Access without authentication
**Steps:**
1. Clear cookies/session
2. Navigate to `/` or any API endpoint

**Expected:**
- Redirect to `/login`
- API returns 401 Unauthorized

---

## File Browser Tests

### TEST-BROWSE-001: List root directory
**Steps:**
1. Login and navigate to `/`

**Expected:**
- Shows allowed folders: projects, docs, src, resources
- Hidden files not shown
- Blocked directories not accessible

### TEST-BROWSE-002: Navigate into folder
**Steps:**
1. Click on any folder in grid/list view

**Expected:**
- URL updates with path
- Breadcrumb shows current path
- Folder contents displayed

### TEST-BROWSE-003: View file content
**Steps:**
1. Click on a text file (e.g., `.js`, `.md`, `.txt`)

**Expected:**
- File viewer modal opens
- Monaco editor displays with syntax highlighting
- Content matches file

### TEST-BROWSE-004: View image file
**Steps:**
1. Click on an image file (`.png`, `.jpg`, `.gif`)

**Expected:**
- File viewer modal opens
- Image displayed

---

## CRUD Operations Tests

### TEST-CRUD-001: Create new file
**Steps:**
1. Click "New File" button
2. Enter filename: `test-file.js`
3. Click "Create"

**Expected:**
- File appears in list
- API returns 200 with file info
- Audit log entry created

### TEST-CRUD-002: Create new folder
**Steps:**
1. Click "New Folder" button
2. Enter folder name: `test-folder`
3. Click "Create"

**Expected:**
- Folder appears in list
- Can navigate into folder

### TEST-CRUD-003: Rename file
**Steps:**
1. Right-click file → Select "Rename"
2. Enter new name: `renamed-file.js`
3. Press Enter

**Expected:**
- File renamed in list
- API returns 200
- Path traversal blocked (try `../etc/passwd`)

### TEST-CRUD-004: Delete file
**Steps:**
1. Right-click file → Select "Delete"
2. Confirm deletion

**Expected:**
- File removed from list
- API returns 200
- File no longer accessible

### TEST-CRUD-005: Delete folder
**Steps:**
1. Right-click folder → Select "Delete"
2. Confirm deletion

**Expected:**
- Folder and contents removed
- API returns 200

---

## File Edit Tests

### TEST-EDIT-001: Edit and save file
**Steps:**
1. Open a text file
2. Click "Edit" button
3. Modify content in Monaco editor
4. Press Ctrl+S or click "Save"

**Expected:**
- File saved successfully
- Version created (if auto-versioning enabled)
- File size updated

### TEST-EDIT-002: Edit blocked file type
**Steps:**
1. Try to edit `.env` or `.pem` file

**Expected:**
- API returns 403 Forbidden
- Edit mode not available

---

## Upload Tests

### TEST-UPLOAD-001: Upload single file
**Steps:**
1. Click "Upload" button
2. Select file from computer
3. Confirm upload

**Expected:**
- File appears in current directory
- Upload progress shown
- API returns 200

### TEST-UPLOAD-002: Drag and drop files
**Steps:**
1. Drag file from desktop to file browser
2. Drop in drop zone

**Expected:**
- Visual feedback during drag
- File uploaded on drop
- File appears in list

### TEST-UPLOAD-003: Upload blocked file type
**Steps:**
1. Try to upload `.exe` or `.dll` file

**Expected:**
- Upload blocked or file ignored
- Security check prevents storage

---

## Security Tests

### TEST-SEC-001: Path traversal attempt
**Steps:**
1. Try to access `../../../etc/passwd` via API
2. Try to create file with path `../secret.txt`

**Expected:**
- API returns 403 Forbidden
- Audit log records attempt
- No file system access outside root

### TEST-SEC-002: Hidden file access
**Steps:**
1. Try to list `.ssh` directory
2. Try to access `.env` file

**Expected:**
- Directory not shown in listing
- API returns 403 if accessed directly

### TEST-SEC-003: Unauthorized API access
**Steps:**
1. Clear session cookie
2. Call any API endpoint directly

**Expected:**
- API returns 401 Unauthorized
- No data leaked

---

## Version Control Tests

### TEST-VERSION-001: Auto-version on save
**Steps:**
1. Edit a file >500 bytes
2. Save the file

**Expected:**
- Version created automatically
- Version appears in history

### TEST-VERSION-002: View version history
**Steps:**
1. Click "History" button in file viewer
2. View list of versions

**Expected:**
- All versions listed with timestamps
- Commit messages shown
- Size and checksum displayed

### TEST-VERSION-003: Restore version
**Steps:**
1. Open version history
2. Click "Restore" on older version
3. Confirm restore

**Expected:**
- File content restored
- New version created with restore message
- File viewer updates

### TEST-VERSION-004: Compare versions
**Steps:**
1. Open version history
2. Click "Compare"
3. Select two versions

**Expected:**
- Diff viewer opens
- Changes highlighted (added/removed lines)
- Line numbers shown

---

## Manual Test Execution

Run these commands to test API endpoints:

```bash
# Test authentication
curl -X GET http://localhost:3000/api/files?path=/
# Expected: 401 Unauthorized

# Test with session (replace with actual session cookie)
curl -X GET http://localhost:3000/api/files?path=/ \
  -H "Cookie: session=YOUR_SESSION_TOKEN"
# Expected: 200 with file list

# Test path traversal
curl -X GET "http://localhost:3000/api/files/content?path=../../../etc/passwd" \
  -H "Cookie: session=YOUR_SESSION_TOKEN"
# Expected: 403 Forbidden

# Test file creation
curl -X POST http://localhost:3000/api/files/create \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_SESSION_TOKEN" \
  -d '{"parentPath":"/","name":"test.txt","type":"file"}'
# Expected: 200 with file info

# Test file save
curl -X PUT http://localhost:3000/api/files/save \
  -H "Content-Type: application/json" \
  -H "Cookie: session=YOUR_SESSION_TOKEN" \
  -d '{"path":"/test.txt","content":"Hello World"}'
# Expected: 200 with success message

# Test file delete
curl -X DELETE "http://localhost:3000/api/files/delete?path=/test.txt" \
  -H "Cookie: session=YOUR_SESSION_TOKEN"
# Expected: 200 with success message
```

---

## Automated Test Script (Node.js)

```javascript
// tests/e2e.test.js
// Run with: npm test

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const TEST_SSH_KEY = process.env.TEST_SSH_KEY; // Set in env

test.describe('FileManager E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('textarea[name="sshKey"]', TEST_SSH_KEY);
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE_URL}/`);
  });

  test('create, edit, and delete file', async ({ page }) => {
    // Create file
    await page.click('button:has-text("New File")');
    await page.fill('input[placeholder="Enter name..."]', 'e2e-test.js');
    await page.click('button:has-text("Create")');
    
    // Verify file created
    await expect(page.locator('text=e2e-test.js')).toBeVisible();
    
    // Open and edit file
    await page.click('text=e2e-test.js');
    await page.click('button:has-text("Edit")');
    
    // Type in Monaco editor
    await page.press('.monaco-editor', 'Control+a');
    await page.type('.monaco-editor', 'console.log("Hello E2E");');
    
    // Save
    await page.click('button:has-text("Save")');
    
    // Close viewer
    await page.click('button[title="Close"]');
    
    // Delete file
    await page.click('text=e2e-test.js', { button: 'right' });
    await page.click('text=Delete');
    await page.click('button:has-text("Confirm")');
    
    // Verify deleted
    await expect(page.locator('text=e2e-test.js')).not.toBeVisible();
  });
});
```

---

## Test Results Summary

| Category | Tests | Passed | Failed |
|----------|-------|--------|--------|
| Authentication | 3 | - | - |
| File Browser | 4 | - | - |
| CRUD Operations | 5 | - | - |
| File Edit | 2 | - | - |
| Upload | 3 | - | - |
| Security | 3 | - | - |
| Version Control | 4 | - | - |
| **Total** | **24** | - | - |

---

*Last Updated: 2024-02-15*
*Test Document Version: 1.0*
