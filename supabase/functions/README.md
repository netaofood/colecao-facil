# Edge Functions

## criar-colecionador

Cria contas de colecionador. Só o super admin consegue chamar.

Existe porque criar conta exige a chave `service_role`, que ignora toda a
RLS e **não pode ficar no navegador**. Aqui ela vive no servidor do Supabase.

### Publicar

```bash
npm install -g supabase
supabase login
supabase link --project-ref cezdpszraznufpotucgr
supabase functions deploy criar-colecionador
```

As variáveis de ambiente já vêm preenchidas pelo Supabase. Não é preciso
configurar nada.

### Conferir se subiu

Painel do Supabase → Edge Functions → a função deve aparecer como deployed.
