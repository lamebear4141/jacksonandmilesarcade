Make local file edits freely without committing or pushing after every change.

Only commit and push when the user explicitly says "publish this" or "ship it"
(or clearly equivalent wording). When that happens, run:
1. git add -A
2. git commit -m "<short description of the change>"
3. git push

Otherwise, leave changes uncommitted in the working tree so the user can test
locally first.
