<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Versioning

ทำตาม [`VERSIONING.md`](VERSIONING.md): ใช้ SemVer อิงฟีเจอร์ (PATCH=แก้บั๊ก/polish, MINOR=ฟีเจอร์ใหม่, MAJOR=เปลี่ยนใหญ่/breaking) — เลขเวอร์ชั่นมาจาก `version` ใน `package.json` ที่เดียว (ไหลเข้า footer อัตโนมัติ ไม่ต้องแก้ที่อื่น) ตอนออกรุ่น: อัปเดต `CHANGELOG.md` แล้วรัน `npm run release:patch|minor|major` (bump + commit + git tag) อย่า bump ทุก commit
