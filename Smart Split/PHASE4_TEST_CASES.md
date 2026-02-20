# Phase 4: Receipt Scanning & AI Expense Assistant — Test Cases

## Test Environment Setup

- **App URL**: `http://localhost:3002`
- **Prerequisites**: Logged in with a user account, at least 1 friend and 1 group added
- **Cloud Functions**: Must be deployed (`firebase deploy --only functions`) for AI features to work

---

## A. Receipt Scanning — Add Expense Page

### TC-RS-01: Scan Receipt Button Visibility
| # | Step | Expected |
|:--|:--|:--|
| 1 | Navigate to `/add-expense` | Page loads with "📸 Scan Receipt" button at top of form |
| 2 | Verify button styling | Indigo dashed-border button with camera icon, full width |
| 3 | Check below login page (not logged in) | Page redirects to `/` (login) |

### TC-RS-02: Receipt Camera Capture (Mobile/PWA)
| # | Step | Expected |
|:--|:--|:--|
| 1 | Tap "📸 Scan Receipt" on mobile device | Native camera opens (or file picker on desktop) |
| 2 | Take photo of a receipt | "Scanning receipt..." overlay appears with spinner |
| 3 | Wait for processing | Overlay dismisses, form fields auto-filled |
| 4 | Verify pre-filled fields | Description = merchant name, Amount = total, Category = matched category |
| 5 | Verify success banner | Green success message: "Receipt scanned! Review the details below." |

### TC-RS-03: Receipt Scan — Blurry/Invalid Image
| # | Step | Expected |
|:--|:--|:--|
| 1 | Tap "📸 Scan Receipt" | Camera/file picker opens |
| 2 | Select a non-receipt image (e.g., selfie) | "Scanning receipt..." overlay appears |
| 3 | Wait for processing | Red error message: "Could not read receipt. Please try manual entry." |
| 4 | Verify form is still usable | User can manually enter expense details |

### TC-RS-04: Receipt Scan — Large Image Compression
| # | Step | Expected |
|:--|:--|:--|
| 1 | Select a high-resolution image (>5MB) | Image is compressed client-side before upload |
| 2 | Wait for processing | Scan processes normally without file size error |

### TC-RS-05: Scanning Overlay UX
| # | Step | Expected |
|:--|:--|:--|
| 1 | Start a receipt scan | Full-screen dark overlay with white card appears |
| 2 | Verify spinner animation | Green spinning circle visible |
| 3 | Verify text | "Scanning receipt..." and "This may take a few seconds" |
| 4 | Verify button disabled during scan | "📸 Scan Receipt" button is disabled/greyed out |

---

## B. AI Chat Bubble

### TC-CB-01: Chat Bubble Visibility
| # | Step | Expected |
|:--|:--|:--|
| 1 | Navigate to `/friends` | 🤖 floating bubble visible in bottom-right |
| 2 | Navigate to `/groups` | 🤖 bubble visible |
| 3 | Navigate to `/activity` | 🤖 bubble visible |
| 4 | Navigate to `/dashboard` | 🤖 bubble visible |
| 5 | Navigate to `/add-expense` | 🤖 bubble **NOT** visible |
| 6 | Navigate to `/` (login page, logged out) | 🤖 bubble **NOT** visible |

### TC-CB-02: Chat Bubble Styling & Animation
| # | Step | Expected |
|:--|:--|:--|
| 1 | View bubble on any allowed page | Purple gradient (indigo-to-violet) circular button |
| 2 | Verify animation | 🤖 emoji has subtle pulse animation |
| 3 | Hover over bubble (desktop) | Button scales up slightly |
| 4 | Click and release bubble | Button scales down then returns |

### TC-CB-03: Chat Bubble Z-Index Layering
| # | Step | Expected |
|:--|:--|:--|
| 1 | View `/friends` page | Bubble sits below "Add Expenses" FAB |
| 2 | Verify both buttons are clickable | Neither button overlaps the other |
| 3 | Verify bubble is above bottom nav | Bubble does not get hidden behind nav bar |

---

## C. AI Chat Modal

### TC-CM-01: Modal Open & Close
| # | Step | Expected |
|:--|:--|:--|
| 1 | Tap 🤖 bubble | Full-screen chat modal opens |
| 2 | Verify header | "🤖 AI Expense Assistant" with X close button |
| 3 | Tap X button | Modal closes, returns to previous page |
| 4 | Reopen modal | Chat history is cleared (fresh state) |

### TC-CM-02: Empty State — Suggested Prompts
| # | Step | Expected |
|:--|:--|:--|
| 1 | Open chat modal (fresh) | Large 🤖 icon, title, and description visible |
| 2 | Verify suggested prompts | Three example messages shown as tappable buttons |
| 3 | Tap a suggested prompt | Text fills into the input field |
| 4 | Verify prompts content | "Coffee 8.50, split with Sarah", "Uber 25, I paid for Weekend Trip group", "John owes me 15 for lunch" |

### TC-CM-03: Send Message — Basic Expense
| # | Step | Expected |
|:--|:--|:--|
| 1 | Type "Coffee 12.50" | Text appears in input field |
| 2 | Tap send (or press Enter) | User message appears as green bubble on right |
| 3 | Verify typing indicator | "🤖 Thinking..." appears on left side |
| 4 | Wait for response | Bot message appears with parsed expense summary card |
| 5 | Verify summary card | Shows merchant, amount ($12.50), category (Beverage/Food) |
| 6 | Verify action buttons | "✅ Confirm & Save" and "✏️ Edit in Form" buttons visible |

### TC-CM-04: Send Message — Split with Friends
| # | Step | Expected |
|:--|:--|:--|
| 1 | Type "Pizzahut 45, split with [friend's name]" | Message sent |
| 2 | Wait for response | Bot response shows parsed expense |
| 3 | Verify participants | Summary card shows "👥 Split with: [friend name]" |
| 4 | Verify friend matching | Friend is matched from your actual friend list |

### TC-CM-05: Fuzzy Friend Name Matching
| # | Step | Expected |
|:--|:--|:--|
| 1 | Type friend's name with a typo (e.g., "Jon" for "John") | Message sent |
| 2 | Wait for response | Bot attempts fuzzy match |
| 3 | Verify match result | Bot suggests correct name or reports no match |

### TC-CM-06: Group Expense Detection
| # | Step | Expected |
|:--|:--|:--|
| 1 | Type "Uber 30 for [group name] group" | Message sent |
| 2 | Wait for response | Bot response includes group info |
| 3 | Verify group matching | Summary card shows "🏠 Group: [group name]" |

### TC-CM-07: Follow-Up Questions (Multi-turn)
| # | Step | Expected |
|:--|:--|:--|
| 1 | Type "dinner 30" (no category specified) | Message sent |
| 2 | Wait for response | Bot may ask follow-up: "What category?" |
| 3 | Reply with "Food" | Second message sent |
| 4 | Wait for response | Bot returns complete expense with category = Food |

### TC-CM-08: Confirm & Save Action
| # | Step | Expected |
|:--|:--|:--|
| 1 | Parse an expense successfully (per TC-CM-03) | Summary card with action buttons |
| 2 | Tap "✅ Confirm & Save" | Button text changes to "Saving..." |
| 3 | Wait for save | "✅ Saved!" text replaces buttons |
| 4 | Verify in Firestore/Activity | Expense appears in Activity feed with correct details |

### TC-CM-09: Edit in Form Action
| # | Step | Expected |
|:--|:--|:--|
| 1 | Parse an expense successfully | Summary card with action buttons |
| 2 | Tap "✏️ Edit in Form" | Modal closes, navigates to `/add-expense` |
| 3 | Verify URL params | URL contains `?description=...&amount=...&category=...` |
| 4 | Verify form pre-fill | Description, Amount, Category fields are pre-populated |

### TC-CM-10: Receipt Scan from Chat
| # | Step | Expected |
|:--|:--|:--|
| 1 | Open chat modal | Camera icon button visible in input bar |
| 2 | Tap camera icon | File picker / camera opens |
| 3 | Select a receipt image | "📸 Scanning receipt..." message appears in chat |
| 4 | Wait for processing | Bot responds with parsed receipt data and action buttons |

### TC-CM-11: Error Handling — Network Failure
| # | Step | Expected |
|:--|:--|:--|
| 1 | Disconnect from internet | No connection |
| 2 | Send a message in chat | User message appears |
| 3 | Wait for response | Red error message: "❌ Something went wrong. Please try again." |

### TC-CM-12: Enter Key Submission
| # | Step | Expected |
|:--|:--|:--|
| 1 | Type a message in the input field | Text appears |
| 2 | Press Enter | Message is sent (same as tapping send button) |
| 3 | Press Shift+Enter | Should NOT send (allows multi-line input) |

---

## D. Rate Limiting

### TC-RL-01: Rate Limit Enforcement
| # | Step | Expected |
|:--|:--|:--|
| 1 | Send 30 AI requests (mixed receipt scans + chat messages) | All succeed |
| 2 | Send 31st request | Error: "You've reached your daily limit of 30 AI requests. Try again tomorrow!" |
| 3 | Verify in Firestore | `users/{uid}/usage/{date}` doc shows `count: 30` |

### TC-RL-02: Rate Limit Reset
| # | Step | Expected |
|:--|:--|:--|
| 1 | Reach daily limit (30 requests) | Rate limit hit |
| 2 | Wait until next calendar day (UTC) | New usage doc for new date |
| 3 | Send a new request | Request succeeds (new day, fresh quota) |

---

## E. URL Prefill (Add Expense Page)

### TC-PF-01: Prefill from URL Parameters
| # | Step | Expected |
|:--|:--|:--|
| 1 | Navigate to `/add-expense?description=PizzaHut&amount=45&category=Food` | Page loads |
| 2 | Verify Description field | Pre-filled with "PizzaHut" |
| 3 | Verify Amount field | Pre-filled with "45" |
| 4 | Verify Category dropdown | Set to "Food" |

### TC-PF-02: Partial Prefill
| # | Step | Expected |
|:--|:--|:--|
| 1 | Navigate to `/add-expense?amount=25` | Page loads |
| 2 | Verify Amount field | Pre-filled with "25" |
| 3 | Verify other fields | Description empty, Category default ("Food") |

---

## F. Storage Rules

### TC-SR-01: Receipt Upload — Owner Access
| # | Step | Expected |
|:--|:--|:--|
| 1 | Upload receipt as User A | Upload succeeds to `/receipts/{userA_uid}/...` |
| 2 | Read receipt as User A | Read succeeds |
| 3 | Read receipt as User B | Read **denied** (not owner) |

### TC-SR-02: Receipt Upload — File Validation
| # | Step | Expected |
|:--|:--|:--|
| 1 | Upload image file <5MB | Upload succeeds |
| 2 | Upload file >5MB (uncompressed) | Upload **denied** by storage rules |
| 3 | Upload non-image file (e.g., .pdf) | Upload **denied** by content type rule |

---

## G. Weekly Insights — Gemini Model Update

### TC-WI-01: Model Version Verification
| # | Step | Expected |
|:--|:--|:--|
| 1 | Check `functions/src/weeklyInsight.ts` line 202 | Model = `gemini-2.5-flash-lite-preview-06-17` |
| 2 | Trigger weekly insight generation (via emulator or schedule) | Insight generated successfully using new model |
| 3 | Verify insight quality | Summary and tips returned without errors |

---

## H. Dark Mode Compatibility

### TC-DM-01: Chat Modal in Dark Mode
| # | Step | Expected |
|:--|:--|:--|
| 1 | Enable dark mode via Dashboard toggle | Theme switches to dark |
| 2 | Open AI chat modal | Dark background, appropriate text contrast |
| 3 | Send a message | User bubble = green, Bot bubble = dark gray |
| 4 | Verify summary card | Card has dark background with readable text |
| 5 | Verify input bar | Dark background, light placeholder text |
