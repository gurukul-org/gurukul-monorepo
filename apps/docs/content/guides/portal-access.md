---
title: Portal Access & Login
description: Understand how to access your school portal and sign in securely.
order: 1
---

# Portal Access & Login

Gurukul uses a multi-tenant domain architecture. This means your school runs in its own isolated digital space. Understanding how to access your private portal and authenticate is key to keeping your school's data secure.

## Accessing Your Subdomain

Every school on Gurukul has a unique web address. This is the subdomain you configured during registration.

- **Format**: `https://[your-subdomain].gurukul.com`
- **Example**: If your subdomain is `greenwood`, your staff, instructors, students, and parents will all access the portal at:  
  **`https://greenwood.gurukul.com`**

> [!WARNING]
> Attempting to log in to your school portal from the main `gurukul.com` domain will not work for tenant-specific actions. Always make sure your browser address bar shows your school's specific subdomain before trying to log in.

## How Signing In Works

To sign in to your school's portal:

1. Navigate to `https://[your-subdomain].gurukul.com/login`.
2. Enter the email and password associated with your account.
3. Upon validation, you will be redirected to your dashboard.

### Subdomain Protection & Session Locking

To ensure maximum security:

- **Membership Check**: When you log in, Gurukul verifies that you have an active membership in the school associated with that subdomain.
- **Access Control**: If you are a member of `Greenwood High` but attempt to log in at `https://riverdale.gurukul.com`, the system will deny access (even if your password is correct) because you do not have a registered membership at Riverdale.
- **Session Expiry**: For security reasons, inactive sessions expire. If your session expires, you will be automatically returned to the login screen of your school's subdomain.
