# Warungify Beta Intake Workflow

## Google Form fields

Use these required questions for the public beta application form:

1. Nama lengkap
2. Email untuk login Warungify
3. Nomor WhatsApp aktif
4. Nama toko / bisnis
5. Kategori produk yang dijual
6. Rata-rata order per hari
7. Kendala terbesar saat jualan pure via WhatsApp
8. Fitur Warungify yang paling dibutuhkan
9. Bersedia memberi feedback setelah trial? (Ya/Tidak)

Suggested form description:

```text
100 pendaftar pertama akan kami review. Akses beta diberikan bertahap mulai dari Batch 1 untuk seller yang paling sesuai dengan fokus awal Warungify.
```

Suggested closed message:

```text
Pendaftaran beta Warungify sementara sudah penuh. Terima kasih sudah tertarik.
```

## Google Sheet columns

After linking the form to Google Sheets, add these manual columns after the response columns:

```text
status
batch
approved_at
wa_approval_link
notified_at
notes
```

Valid `status` values:

```text
pending
approved
waitlist
rejected
```

## Auto-close at 100 responses

Open the Google Form, then go to Extensions > Apps Script and paste this script.
Replace `FORM_ID` with the Google Form ID.

```js
const FORM_ID = "FORM_ID";
const MAX_RESPONSES = 100;

function onFormSubmit() {
  const form = FormApp.openById(FORM_ID);
  const responses = form.getResponses();

  if (responses.length >= MAX_RESPONSES) {
    form.setAcceptingResponses(false);
    form.setCustomClosedFormMessage(
      "Pendaftaran beta Warungify sementara sudah penuh. Terima kasih sudah tertarik."
    );
  }
}
```

Create an installable trigger:

```text
Function: onFormSubmit
Event source: From form
Event type: On form submit
```

## WhatsApp approval link formula

Use a Sheet formula like this in `wa_approval_link`.
Adjust the cell references to match your Sheet columns.

Example assumptions:

- `B2` = Nama
- `C2` = Email
- `D2` = WhatsApp
- `K2` = Batch

```text
=IF($J2<>"approved","",HYPERLINK("https://wa.me/"&REGEXREPLACE(REGEXREPLACE($D2,"[^0-9]",""),"^0","62")&"?text="&ENCODEURL("Halo "&$B2&", aku dari Warungify."&CHAR(10)&CHAR(10)&"Kamu masuk Batch "&$K2&" untuk trial beta Warungify."&CHAR(10)&CHAR(10)&"Silakan daftar/login pakai email ini:"&CHAR(10)&$C2&CHAR(10)&CHAR(10)&"Link app:"&CHAR(10)&"https://your-vercel-app.vercel.app"&CHAR(10)&CHAR(10)&"Setelah masuk, coba buat order pertama dan pakai untuk alur jualan WhatsApp kamu. Nanti setelah beberapa hari aku minta feedback singkat ya."),"Kirim WA"))
```

After sending the WhatsApp message, fill `notified_at` manually.

## Supabase approval SQL

Approve an email before the user signs up:

```sql
insert into public.beta_approved_emails (email, approved_batch, notes)
values (lower('seller@email.com'), 1, 'Batch 1 from Google Sheet')
on conflict (email) do update
set approved_batch = excluded.approved_batch,
    approved_at = now(),
    notes = excluded.notes;
```

When this user creates an account with the same email, the `profiles` trigger will automatically set `beta_status = 'approved'`.

Approve one user:

```sql
update public.profiles
set beta_status = 'approved',
    approved_batch = 1,
    approved_at = now()
where lower(email) = lower('seller@email.com');
```

Approve a batch of users who already created accounts:

```sql
update public.profiles
set beta_status = 'approved',
    approved_batch = 1,
    approved_at = now()
where lower(email) in (
  lower('seller1@email.com'),
  lower('seller2@email.com')
);
```

Add a pre-signup approval batch:

```sql
insert into public.beta_approved_emails (email, approved_batch, notes)
values
  (lower('seller1@email.com'), 1, 'Batch 1 from Google Sheet'),
  (lower('seller2@email.com'), 1, 'Batch 1 from Google Sheet')
on conflict (email) do update
set approved_batch = excluded.approved_batch,
    approved_at = now(),
    notes = excluded.notes;
```

Move a user to waitlist:

```sql
update public.profiles
set beta_status = 'waitlist',
    approved_batch = null,
    approved_at = null
where lower(email) = lower('seller@email.com');
```
