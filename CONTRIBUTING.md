# Contributing

Thanks for helping improve the AI News-to-Knowledge Converter. Contributions should preserve source attribution and distinguish extracted claims from verified facts.

## Development setup

Follow the Windows or macOS/Linux setup in [README.md](README.md). Work on a focused branch and avoid committing local databases, model downloads, credentials, or private article text.

## Before opening a pull request

Run the relevant checks:

~~~powershell
cd backend
.\.venv\Scripts\python.exe -m pytest tests\test_nlp_components.py tests\test_api_endpoints.py -q
cd ..\frontend
npm run lint
npm run build
~~~

The live publisher connectivity test is network-dependent. Run it separately when appropriate; do not make a change appear verified against publishers unless that test actually succeeded.

## Issues and pull requests

- Include clear reproduction steps, expected behavior, and actual behavior.
- Add or update focused tests for behavior changes when practical.
- Describe changes to NLP assumptions, source adapters, API responses, or data persistence.
- Do not include secrets, personal data, unlicensed article text, or generated results presented as verified reporting.
- Keep documentation and screenshots aligned with the current application.
