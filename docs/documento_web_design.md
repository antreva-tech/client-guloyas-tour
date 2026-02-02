# Retail Web Dashboard Template — Configuration Guide

## Overview

This template is a white-label retail dashboard with public catalog and admin panel. Customize it for each client using environment variables.

## Brand Configuration

Set the following in `.env` (see `.env.example`):

| Variable | Description |
|----------|-------------|
| NEXT_PUBLIC_BRAND_NAME | Brand name (e.g. "Your Brand") |
| NEXT_PUBLIC_BRAND_TAGLINE | Tagline (e.g. "Premium Products") |
| NEXT_PUBLIC_SITE_URL | Production URL (e.g. https://example.com) |
| NEXT_PUBLIC_LOGO_PATH | Logo path (e.g. /logo.png) |
| NEXT_PUBLIC_WHATSAPP_NUMBER | WhatsApp number (e.g. 18295521078) |
| NEXT_PUBLIC_WHATSAPP_MESSAGE | Pre-filled WhatsApp message |
| NEXT_PUBLIC_CONTACT_EMAIL | Primary contact email |
| NEXT_PUBLIC_CONTACT_EMAIL_2 | Secondary email (optional) |
| NEXT_PUBLIC_ADDRESS_STREET | Street address |
| NEXT_PUBLIC_ADDRESS_CITY | City |
| NEXT_PUBLIC_ADDRESS_COUNTRY | Country |
| NEXT_PUBLIC_INSTAGRAM_HANDLE | Instagram handle (e.g. @handle) |
| NEXT_PUBLIC_INSTAGRAM_URL | Full Instagram URL |
| NEXT_PUBLIC_FOUNDED_YEAR | Year founded (optional, for "Since YYYY" copy) |

## Assets

- Replace `public/logo.png` with the client's logo
- Optionally replace `web-app-manifest-192x192.png` and `web-app-manifest-512x512.png` for PWA icons

## Location Data

The template includes Dominican Republic province/municipality data in `lib/locationData.ts`. Keep it for DR-focused clients or replace with another region as needed.
