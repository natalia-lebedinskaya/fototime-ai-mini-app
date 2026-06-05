# Architecture Overview

## High-Level Architecture

Telegram User
        |
        v
Telegram Mini App
        |
        v
Frontend (HTML/CSS/JS)
        |
        v
Express Backend
        |
        +-------------------+
        |                   |
        v                   v
Mock Provider      CyberPhotoBooth Provider
        |
        v
Generated Result

## Frontend Responsibilities

- load event configuration;
- participant selection;
- style selection;
- photo upload;
- generation flow;
- result rendering;
- local history storage.

## Backend Responsibilities

- request validation;
- provider selection;
- style mapping;
- file handling;
- generation orchestration;
- metadata storage.

## Storage

Application stores:

- uploaded images;
- generated results;
- generation metadata.

Directories:

storage/uploads
storage/results
storage/metadata

## Security

- secrets stored in environment variables;
- provider credentials never exposed to frontend;
- server-side validation is mandatory.
