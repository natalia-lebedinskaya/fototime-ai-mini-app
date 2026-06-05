# System Overview

Fototime AI is a Telegram Mini App for AI-powered event photography.

The application allows event guests to upload a photo and generate a themed AI image using predefined styles.

## Key Concepts

### Event

An event defines:

- available participants;
- available styles;
- active configuration.

### Participant

A participant type determines which styles are available.

Examples:

- Male
- Female
- Couple
- Family

### Style

A style represents a generation template.

Each style contains:

- id;
- name;
- preview;
- provider mapping.

### Generation

Generation consists of:

1. participant selection;
2. style selection;
3. photo upload;
4. provider request;
5. result retrieval.

## Supported Providers

- Mock Provider
- CyberPhotoBooth Provider

## Result Actions

Users can:

- download generated images;
- share generated images;
- generate new results;
- access generation history.
