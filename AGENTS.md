<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Versioning

ทำตาม [`VERSIONING.md`](VERSIONING.md): ใช้ SemVer อิงฟีเจอร์ (PATCH=แก้บั๊ก/polish, MINOR=ฟีเจอร์ใหม่, MAJOR=เปลี่ยนใหญ่/breaking) — เลขเวอร์ชั่นมาจาก `version` ใน `package.json` ที่เดียว (ไหลเข้า footer อัตโนมัติ ไม่ต้องแก้ที่อื่น) ตอนออกรุ่น: อัปเดต `CHANGELOG.md` แล้วรัน `npm run release:patch|minor|major` (bump + commit + git tag) อย่า bump ทุก commit

# CSS / Theming (บังคับใช้)

ระบบธีมแบบ semantic token (skill [`nextjs-semantic-theme`](.agents/skills/nextjs-semantic-theme/SKILL.md)) — **ห้าม hardcode สี** ใช้ utility ที่ map กับ token เสมอ (`bg-brand-500`, `text-on-brand`, `text-muted`, `bg-card`, `border-border`). บังคับด้วย linter:
- **ESLint** ([`eslint.config.mjs`](eslint.config.mjs)) กัน `bg-[#...]`/`text-[rgb(...)]` และ neutral palette (`text-gray-*`, `bg-slate-*`, …) ใน className — `npm run lint`
- **stylelint** ([`stylelint.config.mjs`](stylelint.config.mjs)) กัน hex/named color ใน `index.css` + `theme.css` (ชั้น token ต้องเป็น `var()` ล้วน; ค่า hex จริงอยู่ใน `themes/*.css` เท่านั้น) — `npm run lint:css`
- รันรวม: `npm run lint:all` · ข้อยกเว้นที่มีเหตุผล (เช่น brand color เจ้าอื่น) ใช้ `// eslint-disable-next-line no-restricted-syntax -- <เหตุผล>`
