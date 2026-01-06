# Web Client Signup Testing Guide

## Prerequisites

- Backend server running on `http://localhost:5000`
- Web client running on `http://localhost:3000`
- MongoDB running
- All services started with `.\run-all.ps1`

## Testing Steps

### Test 1: New User Signup with Password

1. **Go to Login Page**
   - Navigate to `http://localhost:3000`
   - You should see the login form

2. **Select University**
   - Choose state: e.g., "California"
   - Choose school: e.g., "Stanford University"

3. **Enter Email**
   - Enter: `test.user@stanford.edu` (or other valid school email)

4. **Send Verification Code**
   - Click "Send Verification Code"
   - Check console or backend logs for code (mock email won't send)

5. **Enter Code**
   - Switch to code verification input
   - Enter the 6-digit code (check backend logs)

6. **Complete Signup**
   - You should be redirected to signup page
   - Page shows: Email, School, State
   - Enter name: "Test User"
   - Toggle "Enable Password Login" ON

7. **Set Password**
   - Enter password with all requirements:
     - At least 8 characters
     - Uppercase letter
     - Lowercase letter
     - Number
     - Special character
   - Example: `StrongPass123!`
   - Watch strength meter change from Red → Green
   - Confirm password matches

8. **Submit**
   - Click "Create Account"
   - Should see loading spinner
   - Auto-redirect to dashboard
   - You're logged in!

### Test 2: New User Signup without Password

Repeat Test 1 but:
- **Don't toggle** "Enable Password Login"
- Skip password fields
- Click "Create Account"
- Should still work and log in

### Test 3: Existing User Login

1. **Go to Login Page**
2. **Select same university and email** as Test 1
3. **Send Verification Code**
4. **Enter Code**
5. **Should auto-login to dashboard** (no signup page!)

### Test 4: Password-Based Login (Optional Feature)

After creating account with password:

1. **Logout**
   - Click logout in dashboard

2. **Try email verification** (should work)

3. **Later: Password login** (when implemented in frontend)
   - Use new `/api/auth/login` endpoint
   - Provide email + password
   - Should get JWT token

## Validation Tests

### Password Strength Meter

- **Type weak password**: `abc`
  - Should show "Very Weak" in red
  
- **Gradually add requirements**: `aB1!1234`
  - Should show "Strong" in green
  - Checklist should show all requirements met

### Validation Errors

- **Name field empty**: Submit button disabled
- **Password fields mismatch**: 
  - Error message: "Passwords don't match"
  - Submit button disabled
- **Password doesn't meet requirements**:
  - Submit button disabled
  - See which requirements are missing in checklist

### Error Handling

- **Invalid verification code**:
  - Should show error
  - Allow retry

- **Email already exists**:
  - Signup should return error
  - "User with this email already exists"

- **Network error**:
  - Should display error message
  - Allow retry

## Database Verification

To verify user was created in database:

```javascript
// In MongoDB
db.users.findOne({ email: "test.user@stanford.edu" })

// Should return:
{
  _id: ObjectId(...),
  email: "test.user@stanford.edu",
  school: "Stanford University",
  state: "California",
  name: "Test User",
  passwordEnabled: true/false,
  password: "...$2b$10$..." (hashed if passwordEnabled),
  deviceTokens: [],
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date
}
```

## Chrome DevTools - Console Logs

In browser console, you should see:

```
POST /api/auth/verify-email
Response: { message: "...", email: "..." }

POST /api/auth/check-code
Response: { 
  message: "Welcome! Please complete your signup.",
  isNewUser: true,
  requiresSignup: true,
  email: "...",
  school: "...",
  state: "..."
}

POST /api/auth/signup
Response: {
  message: "Account created successfully!",
  token: "eyJhbGc...",
  user: { email: "...", school: "...", state: "...", name: "..." }
}
```

## Backend Logs

Check backend logs for:
- Email verification code sent (mock)
- Code verification success
- New user detected → redirect to signup
- Account created successfully
- User logged in

## Common Issues & Solutions

### Issue: "No verification process for this email"
- **Solution**: Go back and request a new verification code

### Issue: "User already exists" when trying to signup
- **Solution**: Try logging in instead (use existing user flow)

### Issue: Password strength meter not updating
- **Solution**: Check browser console for errors

### Issue: Form fields not validating
- **Solution**: Ensure all required fields are filled

### Issue: Auto-login not happening
- **Solution**: Check browser console, verify token was returned

## Manual Testing Checklist

- [ ] New user can signup with email verification
- [ ] New user can choose to enable password
- [ ] Password strength meter works correctly
- [ ] Requirements checklist updates in real-time
- [ ] Password confirmation validation works
- [ ] Can create account with password
- [ ] Can create account without password
- [ ] Existing user auto-logins (doesn't see signup page)
- [ ] User automatically logged into dashboard after signup
- [ ] User info persists after page refresh
- [ ] Logout works and returns to login page
- [ ] Responsive design works on mobile/tablet

## Load Testing

For stress testing (optional):

```bash
# Create 10 test users with different emails
for i in {1..10}; do
  curl -X POST http://localhost:5000/api/auth/signup \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test'$i'@stanford.edu",
      "school": "Stanford University",
      "state": "California",
      "name": "Test User '$i'",
      "passwordEnabled": true,
      "password": "StrongPass123!"
    }'
done
```

## Next Steps

After successful testing:
1. ✓ Deploy frontend changes
2. ✓ Test on staging environment
3. ✓ Get user feedback on UX
4. ✓ Implement password-based login in frontend
5. ✓ Add mobile client signup support

