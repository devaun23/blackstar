import os,re
s='/Users/devaun/blackstar/src/lib/factory/source-packs'
f=sorted([x for x in os.listdir(s) if x.endswith('.ts') and x not in ('index.ts','types.ts')])
e=[]
for x in f:
 c=open(os.path.join(s,x)).read()
 m=re.search(r'export\s+const\s+(PACK_\w+|pack)\s*:',c)
 if m:e.append((x[:-3],m.group(1)))
i=os.path.join(s,'index.ts')
l=open(i).read().split('
')
j=next((n for n,ln in enumerate(l) if ln.strip()=='};'),-1)
h='
'.join(l[:4])
r=[]
