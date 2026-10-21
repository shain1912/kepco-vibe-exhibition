# 바이브코딩 성과 전시관

한전 직무교육(업무자동화 바이브코딩) 수강생 결과물(웹 URL, 영상, GitHub repo, 보고서)을 로그인 없이 등록·조회하는 사이트.

- Next.js (App Router) + Tailwind
- Supabase: `projects` 테이블(공개 조회), 등록/삭제는 RPC `create_project` / `delete_project` (삭제 비밀번호는 bcrypt 해시로 별도 테이블 저장)
- Vercel 배포

## 로컬 실행

```bash
cp .env.example .env.local   # 값 채우기
npm install
npm run dev
```
