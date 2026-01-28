# Buttons and Click Handlers Reference

Quick reference for all buttons in the app and the functions they trigger.

---

## 1. Login page (`app/page.tsx`)

### Sign in button
**Button:**
```tsx
<button
  ref={buttonRef}
  onClick={handleClick}
  className="relative w-28 h-28 rounded-full ..."
>
  {/* Google icon + "Sign in" */}
</button>
```
**Trigger:** `onClick={handleClick}` → calls `handleClick` on click.

**Handler:**
```tsx
const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
  const btn = buttonRef.current;
  if (!btn) return;
  // ripple animation...
  try {
    await signInWithGoogle();
  } catch (error) {
    alert(`Sign-in failed: ...`);
  }
};
```

---

## 2. Friends page (`app/friends/page.tsx`)

### Add Friend "+" (header)
**Button:**
```tsx
<button
  onClick={() => setShowAddModal(true)}
  className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-full ..."
  title="Add Friend"
>
  <svg>...</svg>
</button>
```
**Trigger:** `onClick={() => setShowAddModal(true)}` → opens Add Friend modal.

---

### Add Friend modal – Cancel
**Button:**
```tsx
<button
  type="button"
  onClick={() => {
    setShowAddModal(false);
    setError('');
    setSuccess('');
    setFriendId('');
  }}
  className="flex-1 px-4 py-2 border ..."
>
  Cancel
</button>
```
**Trigger:** `onClick` → closes modal and clears state.

---

### Add Friend modal – Add Friend (submit)
**Button:**
```tsx
<form onSubmit={handleAddFriend} className="space-y-4">
  ...
  <button type="submit" disabled={adding || !friendId.trim()} ...>
    {adding ? 'Adding...' : 'Add Friend'}
  </button>
</form>
```
**Trigger:** `onSubmit={handleAddFriend}` → form submit calls `handleAddFriend`.

**Handler:**
```tsx
const handleAddFriend = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!user || !friendId.trim()) return;
  setAdding(true);
  try {
    await addFriendByUniqueId(user.uid, friendId.trim().toUpperCase());
    setSuccess('Friend request sent successfully!');
    setFriendId('');
    setShowAddModal(false);
    await loadFriends();
  } catch (err) { setError(...); }
  finally { setAdding(false); }
};
```

---

### Show / Hide settled-up friends
**Buttons:**
```tsx
<button onClick={() => setShowSettledUp(true)} ...>Show x settled-up friends</button>
<button onClick={() => setShowSettledUp(false)} ...>Hide x settled-up friends</button>
```
**Trigger:** `onClick` → toggles `showSettledUp` to show/hide settled friends.

---

## 3. Groups page (`app/groups/page.tsx`)

### Join (header)
**Button:**
```tsx
<button
  onClick={() => setShowJoinModal(true)}
  className="px-3 py-1.5 text-sm ..."
  title="Join Group"
>
  Join
</button>
```
**Trigger:** `onClick={() => setShowJoinModal(true)}` → opens Join Group modal.

---

### Create "+" (header)
**Button:**
```tsx
<button
  onClick={() => setShowCreateModal(true)}
  className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-full ..."
  title="Create Group"
>
  <svg>...</svg>
</button>
```
**Trigger:** `onClick={() => setShowCreateModal(true)}` → opens Create Group modal.

---

### Leave / Delete (on each group card)
**Button:**
```tsx
<button
  onClick={() => handleLeaveGroup(group.id)}
  className="text-sm text-red-600 ..."
  title={...}
>
  {group.createdBy === user?.uid ? 'Delete' : 'Leave'}
</button>
```
**Trigger:** `onClick={() => handleLeaveGroup(group.id)}` → calls `handleLeaveGroup` with that group’s id.

**Handler:**
```tsx
const handleLeaveGroup = async (groupId: string) => {
  if (!user) return;
  const group = groups.find((g) => g.id === groupId);
  const isCreator = group?.createdBy === user.uid;
  if (!confirm(confirmMessage)) return;
  try {
    await leaveGroup(groupId, user.uid);
    setSuccess(...);
    await loadGroups();
  } catch (err) { setError(...); }
};
```

---

### Show / Hide settled-up groups
**Buttons:**
```tsx
<button onClick={() => setShowSettledUp(true)} ...>Show x settled-up group(s)</button>
<button onClick={() => setShowSettledUp(false)} ...>Hide x settled-up group(s)</button>
```
**Trigger:** `onClick` → toggles `showSettledUp`.

---

### Create Group modal – Cancel / Create
**Buttons:**
```tsx
<button type="button" onClick={() => setShowCreateModal(false)} ...>Cancel</button>
<form onSubmit={handleCreateGroup} ...>
  <button type="submit" disabled={creating || !groupName.trim()} ...>
    {creating ? 'Creating...' : 'Create'}
  </button>
</form>
```
**Trigger:** Cancel → `onClick` closes modal. Create → `onSubmit={handleCreateGroup}`.

**Handler:**
```tsx
const handleCreateGroup = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!user || !groupName.trim()) return;
  setCreating(true);
  try {
    await createGroup(groupName.trim(), user.uid, groupDescription.trim() || undefined);
    setSuccess('Group created successfully!');
    setGroupName(''); setGroupDescription('');
    setShowCreateModal(false);
    await loadGroups();
  } catch (err) { setError(...); }
  finally { setCreating(false); }
};
```

---

### Join Group modal – Cancel / Join
**Buttons:**
```tsx
<button type="button" onClick={() => setShowJoinModal(false)} ...>Cancel</button>
<form onSubmit={handleJoinGroup} ...>
  <button type="submit" disabled={joining || !groupId.trim()} ...>
    {joining ? 'Joining...' : 'Join'}
  </button>
</form>
```
**Trigger:** Cancel → `onClick` closes modal. Join → `onSubmit={handleJoinGroup}`.

**Handler:**
```tsx
const handleJoinGroup = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!user || !groupId.trim()) return;
  setJoining(true);
  try {
    await joinGroup(groupId.trim(), user.uid);
    setSuccess('Joined group successfully!');
    setGroupId('');
    setShowJoinModal(false);
    await loadGroups();
  } catch (err) { setError(...); }
  finally { setJoining(false); }
};
```

---

## 4. Activity page (`app/activity/page.tsx`)

### Delete expense
**Button:**
```tsx
<button
  onClick={() => handleDeleteExpense(expense.id)}
  disabled={deleting === expense.id}
  className="ml-4 px-3 py-1 text-sm text-red-600 ..."
  title="Delete expense"
>
  {deleting === expense.id ? 'Deleting...' : 'Delete'}
</button>
```
**Trigger:** `onClick={() => handleDeleteExpense(expense.id)}`.

**Handler:**
```tsx
const handleDeleteExpense = async (expenseId: string) => {
  if (!user) return;
  if (!confirm('Are you sure you want to delete this expense?')) return;
  setDeleting(expenseId);
  try {
    await deleteExpense(expenseId, user.uid);
    setSuccess('Expense deleted successfully!');
    await loadData();
  } catch (err) { setError(...); }
  finally { setDeleting(null); }
};
```

---

## 5. Balances page (`app/balances/page.tsx`)

### Settle Up
**Button:**
```tsx
<button
  onClick={handleSettleUp}
  disabled={settlingUp}
  className="px-6 py-2 bg-green-600 text-white rounded-lg ..."
>
  {settlingUp ? 'Settling Up...' : 'Settle Up'}
</button>
```
**Trigger:** `onClick={handleSettleUp}`.

**Handler:**
```tsx
const handleSettleUp = async () => {
  if (!user) return;
  if (!confirm('Are you sure you want to settle up all expenses?')) return;
  setSettlingUp(true);
  try {
    await performSettleUp(user.uid);
    setSuccess('All expenses settled up successfully!');
    await loadBalances();
  } catch (err) { setError(...); }
  finally { setSettlingUp(false); }
};
```

---

## 6. Expenses page (`app/expenses/page.tsx`)

### Add Expense (header)
**Button:**
```tsx
<button
  onClick={() => setShowCreateModal(true)}
  className="px-4 py-2 bg-blue-600 text-white rounded-lg ..."
>
  Add Expense
</button>
```
**Trigger:** `onClick={() => setShowCreateModal(true)}`.

---

### Add Your First Expense (empty state)
**Button:**
```tsx
<button onClick={() => setShowCreateModal(true)} ...>
  Add Your First Expense
</button>
```
**Trigger:** Same as above → opens Create Expense modal.

---

### Settle Up (in Net Balance card)
**Button:**
```tsx
<button
  onClick={handleSettleUp}
  disabled={settlingUp || (totalOwedTo === 0 && totalOwedFrom === 0)}
  className="mt-4 w-full px-4 py-2 bg-green-600 ..."
>
  {settlingUp ? 'Settling Up...' : 'Settle Up'}
</button>
```
**Trigger:** `onClick={handleSettleUp}`. Handler same idea as Balances page (uses `performSettleUp`).

---

### Delete expense (per expense)
**Button:**
```tsx
<button
  onClick={() => handleDeleteExpense(expense.id)}
  disabled={deleting === expense.id}
  ...
>
  {deleting === expense.id ? 'Deleting...' : 'Delete'}
</button>
```
**Trigger:** `onClick={() => handleDeleteExpense(expense.id)}`. Handler similar to Activity page.

---

### Create Expense modal – Cancel / Create
**Buttons:** `onClick={() => setShowCreateModal(false)}` for Cancel; `onSubmit={handleCreateExpense}` for the form submit. `handleCreateExpense` creates the expense and reloads data.

---

## 7. Profile / Account page (`app/profile/page.tsx`)

### Profile picture (upload)
**Button:**
```tsx
<button
  type="button"
  onClick={() => fileInputRef.current?.click()}
  className="relative cursor-pointer ..."
  disabled={saving}
>
  {/* avatar img or initial */}
  {/* camera icon overlay */}
</button>
<input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
```
**Trigger:** `onClick` → programmatic `fileInputRef.current?.click()` opens file picker. Selecting a file fires `onChange={handleFileUpload}`.

**Handler:**
```tsx
const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  if (!user || !e.target.files?.[0]) return;
  const file = e.target.files[0];
  // validate size/type...
  setSaving(true);
  try {
    const photoURL = await uploadProfilePicture(user.uid, file);
    await updateUserProfile(user.uid, { photoURL });
    setSuccess('Profile picture updated successfully!');
    setTimeout(() => window.location.reload(), 1500);
  } catch (err) { setError(...); }
  finally { setSaving(false); }
};
```

---

### Copy Unique ID
**Button:**
```tsx
<button
  type="button"
  onClick={() => {
    navigator.clipboard.writeText(userData.uniqueId);
    setSuccess('Unique ID copied to clipboard!');
  }}
  className="px-4 py-2 bg-gray-200 ..."
>
  Copy
</button>
```
**Trigger:** `onClick` → copies `userData.uniqueId` and sets success message.

---

### Save Changes (form submit)
**Button:**
```tsx
<form onSubmit={handleSubmit} ...>
  ...
  <button type="submit" disabled={saving} ...>
    {saving ? 'Saving...' : 'Save Changes'}
  </button>
</form>
```
**Trigger:** `onSubmit={handleSubmit}`.

**Handler:**
```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!user || !userData) return;
  setSaving(true);
  try {
    await updateUserProfile(user.uid, { displayName });
    setSuccess('Profile updated successfully!');
    setTimeout(() => router.push('/friends'), 1500);
  } catch (err) { setError(...); }
  finally { setSaving(false); }
};
```

---

### Sign Out
**Button:**
```tsx
<button
  onClick={async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) { console.error(...); }
  }}
  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg ..."
>
  Sign Out
</button>
```
**Trigger:** `onClick` → inline async handler: `signOut()` then `router.push('/')`.

---

## Summary

| Page     | Button            | Trigger                              | Effect                              |
|----------|-------------------|--------------------------------------|-------------------------------------|
| Login    | Sign in           | `onClick={handleClick}`              | `signInWithGoogle()`                |
| Friends  | +                 | `onClick={() => setShowAddModal(true)}` | Open Add Friend modal           |
| Friends  | Add Friend submit | `onSubmit={handleAddFriend}`         | `addFriendByUniqueId`, reload       |
| Groups   | Join              | `onClick={() => setShowJoinModal(true)}` | Open Join modal                 |
| Groups   | +                 | `onClick={() => setShowCreateModal(true)}` | Open Create modal              |
| Groups   | Leave/Delete      | `onClick={() => handleLeaveGroup(group.id)}` | `leaveGroup` / delete group |
| Groups   | Create/Join submit| `onSubmit={handleCreateGroup}` etc.  | Create/join group, reload           |
| Activity | Delete            | `onClick={() => handleDeleteExpense(expense.id)}` | `deleteExpense`            |
| Balances | Settle Up         | `onClick={handleSettleUp}`           | `performSettleUp`, reload           |
| Expenses | Add Expense       | `onClick={() => setShowCreateModal(true)}` | Open Create Expense modal   |
| Expenses | Settle Up         | `onClick={handleSettleUp}`           | Same as Balances                    |
| Expenses | Delete            | `onClick={() => handleDeleteExpense(expense.id)}` | `deleteExpense`            |
| Profile  | Avatar            | `onClick` → `fileInputRef.current?.click()` | File picker → `handleFileUpload` |
| Profile  | Copy              | `onClick` inline                     | `navigator.clipboard.writeText`     |
| Profile  | Save Changes      | `onSubmit={handleSubmit}`            | `updateUserProfile` (displayName)   |
| Profile  | Sign Out          | `onClick` inline async               | `signOut()`, `router.push('/')`     |

---

*Generated from Smart Split codebase.*
