# 🔍 Debug do Fluxo de Autenticação

## Para debugar o problema de redirect, siga estes passos:

### 1. Abra o DevTools do navegador (F12)

### 2. Vá para a aba **Network** e marque:
- ✅ Preserve log
- ✅ Disable cache

### 3. Tente fazer login como contratante e observe:

#### ✅ **Requisição POST /api/auth/login**
- Status: deve ser **200 OK**
- Response Headers → Set-Cookie:
  ```
  access_token=...; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=900
  refresh_token=...; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=...
  ```
- Response Body:
  ```json
  {
    "success": true,
    "user": { "id": "...", "email": "...", "role": "contratante", ... }
  }
  ```

#### 🔍 **Próximas requisições (aqui está o problema)**
Observe a sequência de requests após o login:

1. **GET /dashboard** ou **GET /dashboard?_rsc=...**
   - Request Headers → Cookie: `access_token=...`
   - Se o cookie **NÃO** está presente ❌ → **PROBLEMA AQUI**
   - Status esperado: 200 (se cookie presente) ou 307 redirect (se ausente)

2. **POST /api/auth/refresh** (se chamado)
   - Request Headers → Cookie: `refresh_token=...`
   - Se o cookie **NÃO** está presente ❌ → **PROBLEMA AQUI**
   - Status: 200 (sucesso) ou 401 (sem cookie)

3. **Se há redirect 307** → verifique o header `Location:`
   - Deve redirecionar para `/login`

### 4. Vá para a aba **Application** → **Cookies**
- Verifique se após o login existem:
  - ✅ `access_token`
  - ✅ `refresh_token`
- Se **NÃO existirem**, o problema é:
  - ❌ Cookies não sendo setados (problema na API)
  - ❌ SameSite/Secure/Domain incompatível
  - ❌ Replit proxy bloqueando cookies

### 5. Vá para a aba **Console**
- Procure por erros relacionados a:
  - CORS
  - Cookies
  - CSRF
  - Authentication

## 🔍 Possíveis Cenários

### Cenário A: Cookies não estão sendo setados
**Sintomas**: Após login, cookies não aparecem em Application → Cookies

**Causa**:
- `secure: true` mas app não está em HTTPS
- `sameSite: lax` incompatível com domínio Replit
- Domain mismatch

**Solução**: Ajustar configuração de cookies na API

### Cenário B: Cookies setados mas não enviados nas requisições
**Sintomas**: Cookies aparecem em Application, mas não em Request Headers

**Causa**:
- Path incorreto (deve ser `/`)
- SameSite strict demais
- Fetch sem `credentials: "include"`

**Solução**: Verificar todas as chamadas fetch

### Cenário C: Race condition no AuthProvider
**Sintomas**: Às vezes funciona, às vezes não

**Causa**:
- `checkAuth()` executando antes do `setUser()` do login
- Estado não sincronizado entre componentes

**Solução**: Remover `checkAuth()` automático após login bem-sucedido

### Cenário D: Middleware bloqueando antes do cookie chegar
**Sintomas**: 307 redirect instantâneo para /login

**Causa**:
- Middleware executa no Edge Runtime
- Cookie ainda não "comitado" pelo browser
- Next.js App Router SSR pegando versão antiga dos cookies

**Solução**: Adicionar delay ou remover verificação duplicada

## 📊 Logs que você deve ver no console do navegador:

Se tudo estiver correto:
```
1. Login request → 200 OK
2. Set cookies
3. Navigate to /dashboard
4. Dashboard request with cookies → 200 OK
5. Dashboard rendered
```

Se está com problema:
```
1. Login request → 200 OK
2. Set cookies (ou não!)
3. Navigate to /dashboard
4. Dashboard request WITHOUT cookies → 307 redirect
5. Redirect to /login
6. (Loop)
```

## 🎯 Próximos passos:
1. Execute o debug acima
2. Reporte o que você vê (qual cenário se encaixa)
3. Aplicaremos a correção específica
