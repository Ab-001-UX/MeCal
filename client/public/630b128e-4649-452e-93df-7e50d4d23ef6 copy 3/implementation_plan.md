# Implementation Plan - Separate Sliding Story to Welcome Page

The user wants to separate the sliding story from the login page. It will become a dedicated introduction page with CTAs to "Get Started" (Sign Up) and "Log In".

## Proposed Changes

### [Component Name] Welcome Page
I will create a new page to house the sliding story.

#### [NEW] [Welcome.jsx](file:///c:/Users/MONSURAT/OneDrive/Desktop/MeCal/client/src/pages/Welcome/Welcome.jsx)
-   Implement the sliding story with the 6 images.
-   Add "Get Started" button linking to `/onboard`.
-   Add "Have an account? Log in" link linking to `/login`.

#### [NEW] [Welcome.module.css](file:///c:/Users/MONSURAT/OneDrive/Desktop/MeCal/client/src/pages/Welcome/Welcome.module.css)
-   Styles for the slideshow and the CTAs.

### [Component Name] Login Page
#### [MODIFY] [Login.jsx](file:///c:/Users/MONSURAT/OneDrive/Desktop/MeCal/client/src/pages/Login/Login.jsx)
-   Remove the sliding story code and JSX.
-   Keep the clean glassmorphic form.

### [Component Name] Routing
#### [MODIFY] [App.jsx](file:///c:/Users/MONSURAT/OneDrive/Desktop/MeCal/client/src/App.jsx) (or wherever routes are defined)
-   Add the `/welcome` route or set it as the default landing page.

## Verification Plan
-   Verify that navigating to the root or `/welcome` shows the sliding story.
-   Verify that clicking "Log in" goes to the clean login page.
-   Verify that clicking "Get Started" goes to the onboarding/signup flow.
