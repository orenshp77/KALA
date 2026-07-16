# iOS Shortcut - KALA Contact Import

## What the Shortcut Does

1. Finds ALL contacts on the iPhone
2. For each contact, extracts the name and phone number
3. Builds a JSON array of contacts
4. POSTs the data to the KALA API endpoint
5. Opens the app back in Safari

## API Endpoint

```
POST https://kala-orenshp77s-projects.vercel.app/api/import-contacts
```

### Request Body

```json
{
  "token": "SESSION_TOKEN_FROM_APP",
  "contacts": [
    { "name": "John Doe", "phone": "0501234567" },
    { "name": "Jane Smith", "phone": "052-9876543" }
  ]
}
```

### Response

```json
{ "success": true, "count": 247 }
```

## Shortcut Actions (Step by Step)

Create these actions in the iOS Shortcuts app:

### Action 1: Ask for Input
- Type: Text
- Prompt: "הדביקו את קוד הייבוא מאפליקציית KALA"
- Save result to variable: `ImportToken`

### Action 2: Find All Contacts
- Find All Contacts
- Save result to variable: `AllContacts`

### Action 3: Repeat with Each (AllContacts)
For each contact (Repeat Item):

#### Action 3a: Get Details of Contact
- Get **First Name** from Repeat Item → `FirstName`
- Get **Last Name** from Repeat Item → `LastName`  
- Get **Phone Number** from Repeat Item → `PhoneNumber`

#### Action 3b: Add to Variable
- Add dictionary to `ContactsList`:
  ```
  name: FirstName + " " + LastName
  phone: PhoneNumber
  ```

### End Repeat

### Action 4: Get Contents of URL
- URL: `https://kala-orenshp77s-projects.vercel.app/api/import-contacts`
- Method: POST
- Headers:
  - Content-Type: application/json
- Request Body (JSON):
  ```json
  {
    "token": ImportToken,
    "contacts": ContactsList
  }
  ```

### Action 5: Open URL
- URL: `https://kala-orenshp77s-projects.vercel.app/dashboard/guests`

## Supabase Table Setup

Run this SQL in your Supabase SQL Editor:

```sql
create table if not exists import_sessions (
  id text primary key,
  token text unique,
  event_id text,
  contacts text default '[]',
  status text default 'waiting',
  created_at timestamp with time zone default now()
);

-- Allow public access for the shortcut to write
alter table import_sessions enable row level security;

create policy "Allow all operations on import_sessions"
  on import_sessions
  for all
  using (true)
  with check (true);
```

## Notes

- The shortcut URL placeholder needs to be replaced with the actual iCloud shortcut link once created
- The token is generated client-side and stored in the `import_sessions` table
- Polling happens every 3 seconds with a 5-minute timeout
- Contacts are de-duplicated against existing guests when importing
