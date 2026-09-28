# Chatiw Render Test

This project is the first connectivity test for running a Chromium browser on Render and opening https://chatiw.me/.

## Endpoints

- / - service information
- /health - Render health check
- /test - launches Chromium and tests access to Chatiw

## Render

Build command:
npm install && npx playwright install --with-deps chromium

Start command:
npm start

The first milestone is only to verify that Chatiw can be reached from the Render runtime. Automation features should be added only after this connectivity test succeeds.
