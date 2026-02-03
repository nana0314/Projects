# 📱 Smart Split PWA: Comprehensive Test Plan

Use this guide to verify every feature of your application.

## 1. PWA & Installation 📲
| Feature | Action | Expected Result | Status |
|---------|--------|-----------------|--------|
| **Install Prompts** | Open in Chrome (Android) or Safari (iOS) | Browser menu shows "Install App" or "Add to Home Screen" | [ ] |
| **Desktop Install** | Click install icon in Chrome address bar | App opens in standalone window | [ ] |
| **App Icon** | Check home screen/desktop | Correct Smart Split logo is shown | [ ] |
| **Splash Screen** | Launch the app | Splash screen appears briefly (if configured) | [ ] |
| **Fullscreen** | Use the app | No browser URL bar (feels like native app) | [ ] |

## 2. Authentication 🔐
| Feature | Action | Expected Result | Status |
|---------|--------|-----------------|--------|
| **Sign In** | Click "Sign in with Google" | Popup opens, completing flows redirects to dashboard | [ ] |
| **Persistence** | Refresh page after login | You stay logged in | [ ] |
| **Logout** | Click "Sign Out" in profile | Redirects to login page, data cleared | [ ] |
| **Redirects** | Try accessing `/groups` while logged out | Auto-redirects to login page | [ ] |

## 3. Friends System 👥
| Feature | Action | Expected Result | Status |
|---------|--------|-----------------|--------|
| **Copy ID** | Click "Copy ID" on Profile | "Copied!" toast appears | [ ] |
| **Send Request** | Enter valid ID in "Add Friend" | "Request sent" success message | [ ] |
| **Receive Request** | Check "Pending Requests" on recipient | Request appears with Accept/Decline | [ ] |
| **Accept Request** | Click "Accept" | Request disappears, friend added to list | [ ] |
| **Decline Request** | Click "Decline" | Request disappears, no friend added | [ ] |
| **Blinking** | Go to `/friends` | Bottom "Friends" nav button blinks green | [ ] |

## 4. Groups & Expenses 💰
| Feature | Action | Expected Result | Status |
|---------|--------|-----------------|--------|
| **Create Group** | Create group "Trip" | Group appears in list immediately | [ ] |
| **Add Expense** | Add "$50 Dinner" to group | Expense listed, balances update | [ ] |
| **Split Logic** | Check "Balances" tab | Shows who owes whom correctly | [ ] |
| **Settle Up** | (If implemented) Mark paid | Balance reduces to $0 | [ ] |
| **Blinking** | Go to `/groups` | Bottom "Groups" nav button blinks green | [ ] |

## 5. Navigation & UI 🧭
| Feature | Action | Expected Result | Status |
|---------|--------|-----------------|--------|
| **Routing** | Click all 4 bottom tabs | URL changes, content updates instantly | [ ] |
| **Active State** | Check bottom bar on each page | **Only** the current page's button handles blink | [ ] |
| **Responsive** | Resize window / Rotate phone | Layout adjusts, no horizontal scroll | [ ] |
| **Profile Pic** | Upload new photo in Profile | Photo updates in nav bar and profile page | [ ] |

## 6. Offline Capabilities ✈️
| Feature | Action | Expected Result | Status |
|---------|--------|-----------------|--------|
| **Offline Load** | Turn off WiFi/Data -> Open App | App shell loads (doesn't show "No Internet" dino) | [ ] |
| **Cached Data** | View previously loaded groups | Data is visible from cache | [ ] |
| **Reconnection** | Turn WiFi back on | App reconnects to Firestore automatically | [ ] |

---

## 🐞 Bug Report Template
If you find an issue, note down:
1. **Page:** (e.g. Friends)
2. **Action:** (e.g. Clicking Accept)
3. **Error:** (e.g. "Permission denied" red toast)
4. **Console:** (Check F12 console for red errors)
