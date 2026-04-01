# User Import from Excel TODO

## Steps from approved plan:
- [x] 1. Install dependencies (nodemailer)
- [x] 2. Create utils/randomPassword.js
- [x] 3. Implement utils/mailHandler.js (nodemailer + Mailtrap config)
- [x] 4. Add ImportUsersFromExcel to controllers/users.js (exceljs parse, generate pass, create users role='user', send emails)
- [x] 5. Add POST /import-excel to routes/users.js (admin only, uploadExcel middleware)
- [ ] 6. Test endpoint with Excel file
- [ ] 7. Git branch blackboxai/user-import, commit, gh pr create
- [ ] 8. User provides Mailtrap screenshot
