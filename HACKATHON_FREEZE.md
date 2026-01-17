# 🧊 HACKATHON MVP FREEZE

> [!CAUTION]
> **OFFICIAL SUBMISSION STATUS**: The Smart Waste Management AI system has been officially submitted for the 2026 Hackathon. The production environment is now in **STRICT FREEZE MODE**.

---

## 🌐 Official Submitted URLs (MVP)

These URLs represent the state of the project at the time of submission. Do NOT modify these environments.

| Component | URL | Status |
|-----------|-----|--------|
| **Frontend UI** | [https://frontend.jollysea-c5c0b121.centralus.azurecontainerapps.io](https://frontend.jollysea-c5c0b121.centralus.azurecontainerapps.io) | ✅ Frozen |
| **Backend API** | [https://backend.jollysea-c5c0b121.centralus.azurecontainerapps.io](https://backend.jollysea-c5c0b121.centralus.azurecontainerapps.io) | ✅ Frozen |
| **API Documentation** | [https://backend.jollysea-c5c0b121.centralus.azurecontainerapps.io/docs](https://backend.jollysea-c5c0b121.centralus.azurecontainerapps.io/docs) | ✅ Frozen |

---

## 💻 Local Environment (Development)

The local environment is where active development and **post-submission enhancements** take place.

- **Local Frontend**: `http://localhost:3000`
- **Local Backend**: `http://localhost:8000`
- **Database**: PostgreSQL (Local/Docker)

### ✨ Post-Submission Enhancements
The following improvements were added to the local environment *after* the initial MVP submission:
1. **Premium UI Skin**: Advanced CSS variables and glassmorphism styling.
2. **Defensive Loading States**: Improved UX for slow network connections.
3. **Enhanced Startup Logs**: Clearer feedback when services start locally.
4. **Local Stability Patches**: Refined routing and fallback logic for `localhost`.

---

## 🔐 Production Config Lock

The following files are considered **Locked for Production**:
- `backend/app/core/config.py` (Production overrides only via ENV)
- `frontend/src/api.js` (Fixed base URL detection)
- `HACKATHON_DEPLOYMENT.txt` (Historical record)

Any changes intended for production MUST be vetted against the frozen MVP requirements to ensure zero breaking changes for judges.

---

**Built with ❤️ for the 2026 Sustainable Cities Hackathon**
