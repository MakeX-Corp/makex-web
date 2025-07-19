export const CONVEX_AUTH_DOCS = `# Convex Auth Documentation

## Overview
Convex Auth is an authentication library for Convex applications that provides various authentication methods including OAuth, Magic Links, OTPs, and password-based authentication.

## Installation & Setup

### Prerequisites
- Working Convex app (follow Convex React Native quickstart)

### Installation Steps

1. **Install NPM package**
   \`\`\`bash
   npm install @convex-dev/auth@0.0.88-alpha.0 @auth/core@0.37.0
   \`\`\`

2. **Run initialization command**
   \`\`\`bash
   npx @convex-dev/auth --allow-dirty-git-state
   \`\`\`

### Manual Setup (Alternative)

1. **Add authentication tables to schema**
   \`\`\`typescript
   // convex/schema.ts
   import { defineSchema } from "convex/server";
   import { authTables } from "@convex-dev/auth/server";

   const schema = defineSchema({
     ...authTables,
     // Your other tables...
   });

   export default schema;
   \`\`\`

2. **Set up React provider**
   \`\`\`typescript
   // src/main.tsx
   import { ConvexAuthProvider } from "@convex-dev/auth/react";
   import React from "react";
   import ReactDOM from "react-dom/client";
   import { ConvexReactClient } from "convex/react";
   import App from "./App.tsx";

   const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

   ReactDOM.createRoot(document.getElementById("root")!).render(
     <React.StrictMode>
       <ConvexAuthProvider client={convex}>
         <App />
       </ConvexAuthProvider>
     </React.StrictMode>,
   );
   \`\`\`

## Password Authentication

### Basic Setup

1. **Provider configuration**
   \`\`\`typescript
   // convex/auth.ts
   import { Password } from "@convex-dev/auth/providers/Password";
   import { convexAuth } from "@convex-dev/auth/server";

   export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
     providers: [Password],
   });
   \`\`\`

2. **Sign-in form component**
   \`\`\`typescript
   // src/SignIn.tsx
   import { useAuthActions } from "@convex-dev/auth/react";
   import { useState } from "react";

   export function SignIn() {
     const { signIn } = useAuthActions();
     const [step, setStep] = useState<"signUp" | "signIn">("signIn");
     
     return (
       <form
         onSubmit={(event) => {
           event.preventDefault();
           const formData = new FormData(event.currentTarget);
           void signIn("password", formData);
         }}
       >
         <input name="email" placeholder="Email" type="text" />
         <input name="password" placeholder="Password" type="password" />
         <input name="flow" type="hidden" value={step} />
         <button type="submit">{step === "signIn" ? "Sign in" : "Sign up"}</button>
         <button
           type="button"
           onClick={() => {
             setStep(step === "signIn" ? "signUp" : "signIn");
           }}
         >
           {step === "signIn" ? "Sign up instead" : "Sign in instead"}
         </button>
       </form>
     );
   }
   \`\`\`

### Customization Options

#### Email Validation
\`\`\`typescript
// CustomEmail.ts
import { ConvexError } from "convex/values";
import { Password } from "@convex-dev/auth/providers/Password";
import { z } from "zod";

const ParamsSchema = z.object({
  email: z.string().email(),
});

export default Password({
  profile(params) {
    const { error, data } = ParamsSchema.safeParse(params);
    if (error) {
      throw new ConvexError(error.format());
    }
    return { email: data.email };
  },
});
\`\`\`

#### Password Validation
\`\`\`typescript
// CustomPassword.ts
import { ConvexError } from "convex/values";
import { Password } from "@convex-dev/auth/providers/Password";

export default Password({
  validatePasswordRequirements: (password: string) => {
    if (
      password.length < 8 ||
      !/\\d/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password)
    ) {
      throw new ConvexError("Invalid password.");
    }
  },
});
\`\`\`

#### Custom User Information
\`\`\`typescript
// CustomProfile.ts
import { Password } from "@convex-dev/auth/providers/Password";
import { DataModel } from "./_generated/dataModel";

export default Password<DataModel>({
  profile(params) {
    return {
      email: params.email as string,
      name: params.name as string,
      role: params.role as string,
    };
  },
});
\`\`\`

## Key Flow Types

### Password Provider Flows
- **"signIn"**: Standard sign-in flow
- **"signUp"**: New user registration flow

## Important Notes

1. **Flow Field**: All forms must include a \`flow\` hidden input to specify the authentication flow type
2. **FormData**: The \`signIn\` function expects FormData objects from form submissions
3. **Error Handling**: Use \`ConvexError\` for passing error information from backend to frontend
4. **Rate Limiting**: The library automatically rate-limits failed attempts

## Best Practices

1. **Input Validation**: Use Zod for client/server validation
2. **Password Security**: Implement proper password requirements
3. **UI Polish**: Check example repositories for better UI implementations

## Dependencies

- \`@convex-dev/auth\`
- \`@auth/core@0.37.0\`
- \`zod\` (for validation)

This documentation covers the basic setup and configuration of Convex Auth with focus on simple password-based authentication.`; 