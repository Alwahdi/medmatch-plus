-- Phase 58 (A): schema for professional application withdrawal
ALTER TYPE public.application_status ADD VALUE IF NOT EXISTS 'withdrawn';