# Regression Checklist

## Event Configuration

- [ ] Event configuration is loaded from `/api/event-config`.
- [ ] Event name is displayed.
- [ ] Event status is displayed.
- [ ] Participants are rendered from event config.
- [ ] Styles are rendered from event config.

## Participant Selection

- [ ] User can select Male.
- [ ] User can select Female.
- [ ] Selected participant is highlighted.
- [ ] User can change selected participant.
- [ ] Style list changes after participant change.
- [ ] Previously selected style is reset after participant change.

## Style Selection

- [ ] Style cards are displayed with previews.
- [ ] Style name is displayed.
- [ ] Style price is displayed.
- [ ] User can select style.
- [ ] Selected style is highlighted.
- [ ] Styles are filtered by participant type.

## Photo Upload

- [ ] JPG file can be uploaded.
- [ ] JPEG file can be uploaded.
- [ ] PNG file can be uploaded.
- [ ] PDF file is rejected.
- [ ] File larger than 10 MB is rejected.
- [ ] File name is displayed after successful upload.

## Generation

- [ ] Generation button is disabled without participant.
- [ ] Generation button is disabled without style.
- [ ] Generation button is disabled without photo.
- [ ] Generation button is enabled with valid data.
- [ ] Button is disabled during generation.
- [ ] Duplicate request is not sent.
- [ ] Success message is displayed.
- [ ] Result image is displayed.

## Reset

- [ ] Reset button clears selected style.
- [ ] Reset button clears uploaded photo.
- [ ] Reset button hides result section.
- [ ] User can create another mock generation after reset.

## API

- [ ] `GET /api/health` returns 200.
- [ ] `GET /api/event-config` returns 200.
- [ ] `POST /api/generate` returns 200 for valid request.
- [ ] `POST /api/generate` returns 400 without participantId.
- [ ] `POST /api/generate` returns 400 without styleId.
- [ ] `POST /api/generate` returns 400 without photo.
- [ ] `POST /api/generate` returns 400 for invalid style and participant relation.
