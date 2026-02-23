# SYSTEM: ARISE

A React application built with Vite.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
   - Copy `.env` and fill in your actual values:
     - `VITE_SUPABASE_URL` - Your Supabase project URL
     - `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
     - `VITE_GEMINI_API_KEY` - Your Google Gemini API key

3. Run the development server:
```bash
npm run dev
```

**Note:** If you encounter PowerShell execution policy errors, use one of these methods:

**Option 1:** Use the provided batch file:
```bash
dev.bat
```

**Option 2:** Bypass execution policy for the session:
```powershell
powershell -ExecutionPolicy Bypass -Command "npm run dev"
```

**Option 3:** Fix PowerShell execution policy permanently (run PowerShell as Administrator):
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**If you get "spawn EPERM" errors:**
This is usually caused by Windows Defender or antivirus blocking esbuild. Solutions:
1. Add the project folder to Windows Defender exclusions
2. Run your terminal/IDE as Administrator
3. Temporarily disable real-time protection while installing dependencies

## Project Structure

```
src/
  components/    # Reusable UI components
  pages/         # Full screen pages
  lib/           # Supabase client and helper functions
  styles/        # Global styles
```

## Routes

- `/` - Login page
- `/signup` - Signup page
- `/onboarding` - Awakening Protocol
- `/home` - Command Center
