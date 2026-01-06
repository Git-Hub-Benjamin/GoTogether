# Web Client Signup Implementation

## Overview

The web client now includes a complete signup flow for new users. Users select their university and email, receive a verification code, and then complete account creation on the SignupPage.

## Flow

### 1. **Login Page** (`LoginPage.jsx`)
- User selects State and University
- User enters their school email
- Server sends verification code

### 2. **Verification Code** (`LoginForm.jsx`)
- User enters 6-digit verification code
- Server verifies the code and checks if user exists:
  - **Existing User**: Logs in directly with JWT
  - **New User**: Redirects to Signup Page

### 3. **Signup Page** (`SignupPage.jsx`)
- User enters their full name
- Optional: Enable password-based login
- If password enabled:
  - Enter and confirm password
  - Real-time password strength meter
  - Requirements checklist (uppercase, lowercase, number, special char, 8+ chars)
- Submits account creation
- Logs in automatically and shows dashboard

## Components

### `SignupPage.jsx`
Main signup form component with:
- Name input field
- Password toggle switch
- Conditional password fields with validation
- Real-time password strength meter
- Requirements checklist
- School info display
- Error handling and loading states

**Props:**
- `email` (string) - User's school email
- `school` (string) - University name
- `state` (string) - State code

### `PasswordStrengthMeter.jsx`
Visual password strength indicator with:
- Color-coded strength levels (Red → Green)
- Strength labels (Very Weak → Very Strong)
- Animated progress bar

**Props:**
- `strength` (number 0-100) - Password strength score

### `LoginForm.jsx` (Updated)
Updated to detect new users and redirect to signup:
- Checks response from `/api/auth/check-code`
- Stores signup data in `sessionStorage`
- Redirects to signup page if `isNewUser === true`

### `App.jsx` (Updated)
Main app component now handles:
- Checking for signup data in `sessionStorage`
- Rendering appropriate page (Login, Signup, or Dashboard)
- Cleanup of session data after use

## Authentication Flow

### New User Signup
```
1. POST /api/auth/verify-email
   → Send code to email
   
2. POST /api/auth/check-code
   → Verify code + check if user exists
   → If new user, return { isNewUser: true, requiresSignup: true }
   
3. POST /api/auth/signup
   → Create account with name and optional password
   → Return JWT token
   
4. Automatically logged in to dashboard
```

### Existing User Login
```
1. POST /api/auth/verify-email
   → Send code to email
   
2. POST /api/auth/check-code
   → Verify code + user exists
   → Return JWT token + user info
   
3. Automatically logged in to dashboard
```

### Password-Based Login (Optional)
```
1. POST /api/auth/verify-password
   → Check if user has password auth enabled
   
2. POST /api/auth/login
   → Verify email + password
   → Return JWT token
   
3. Automatically logged in to dashboard
```

## Password Requirements

Users can optionally enable password-based login. Passwords must meet these requirements:

- ✓ **Minimum 8 characters**
- ✓ **Uppercase letter (A-Z)**
- ✓ **Lowercase letter (a-z)**
- ✓ **Number (0-9)**
- ✓ **Special character** (!@#$%^&*...)

**Requirement:** At least 4 out of 5 requirements must be met

### Strength Scoring
- **Very Weak** (< 25): Red
- **Weak** (25-49): Orange
- **Fair** (50-74): Yellow
- **Strong** (75-99): Light Green
- **Very Strong** (100): Dark Green

## Backend Endpoints Used

- `POST /api/auth/verify-email` - Send verification code
- `POST /api/auth/check-code` - Verify code and detect new users
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/verify-password` - Check password auth availability
- `POST /api/auth/login` - Login with password (optional)

## State Management

- **AuthContext**: Stores JWT token and user info
- **sessionStorage**: Temporarily stores signup data between pages
- **localStorage**: Persists token and user info

## Error Handling

- Network errors are caught and displayed
- Validation errors from server shown to user
- Password mismatch validation
- Required field validation
- Disabled submit button until all requirements met

## UI/UX Features

- ✓ Real-time password strength meter
- ✓ Live requirements checklist
- ✓ Password match validation
- ✓ Loading states with spinner
- ✓ Error alerts
- ✓ Disabled states during submission
- ✓ School info summary display
- ✓ Responsive Material-UI design
- ✓ Smooth transitions and animations

## Future Enhancements

- [ ] Email verification before account creation
- [ ] Account recovery options
- [ ] Social login integration
- [ ] Terms & conditions acceptance
- [ ] Profile photo upload
- [ ] Phone number verification for mobile
