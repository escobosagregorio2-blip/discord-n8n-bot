# Instrucciones de Force Deploy - Bot Escalación

## VERIFICACIÓN: bot.js contiene escalación

✓ CONFIRMADO: La función `detectEscalationIntent` está en bot.js (línea 269)

```javascript
function detectEscalationIntent(content) {
  const lower = content.toLowerCase().trim();
  return ESCALATION_KEYWORDS.some((kw) => lower.includes(kw));
}
```

## Instrucciones Paso a Paso (Windows PowerShell)

### OPCIÓN 1: Usar el script automático (RECOMENDADO)

```powershell
# 1. Abre PowerShell como Administrador
# 2. Navega a la carpeta del proyecto
cd "C:\Users\Usuario\claude\Projects\TRADINGMIAMISCHOOL 2"

# 3. Ejecuta el script
.\FORCE_DEPLOY.ps1

# 4. Cuando te pida la URL de GitHub, pega:
# https://github.com/TU_USUARIO/TRADINGMIAMISCHOOL.git
# (Reemplaza TU_USUARIO con tu usuario de GitHub)
```

### OPCIÓN 2: Comandos manuales paso a paso

```powershell
# 1. Navega a la carpeta
cd "C:\Users\Usuario\claude\Projects\TRADINGMIAMISCHOOL 2"

# 2. Verifica que bot.js tiene la escalación
Select-String -Path ".\bot.js" -Pattern "detectEscalationIntent"
# Debe mostrar: function detectEscalationIntent(content) {

# 3. Limpia el .git anterior (si existe)
Remove-Item -Force -Recurse -Path ".\.git"

# 4. Inicializa git
git init
git config user.email "escobosagregorio2@gmail.com"
git config user.name "Trading Miami Bot"

# 5. Agrega todos los archivos
git add -A

# 6. Commit
git commit -m "fix: force push bot.js con escalacion"

# 7. Agrega el remote de GitHub
git remote add origin https://github.com/TU_USUARIO/TRADINGMIAMISCHOOL.git
# (Reemplaza TU_USUARIO)

# 8. Force push a main
git branch -M main
git push -f origin main

# Debe mostrar:
# remote: Resolving deltas: 100%
# To https://github.com/TU_USUARIO/TRADINGMIAMISCHOOL.git
#  + [force update] main -> main
```

## DESPUÉS: Redeploy en EasyPanel

1. **Navega a** https://ud046x.easypanel.host
2. **Busca** el proyecto del bot Discord
3. **Haz clic en** "Force Rebuild" o "Redeploy"
4. **Espera** a que los logs muestren:
   ```
   Bot conectado como: [bot name]#0000
   ```

## Verificación de Escalación

Una vez deployado, prueba en Discord:

```
Usuario: "Necesito un humano"
Bot debe: 
  - Responder: "He avisado al equipo de soporte..."
  - Enviar alerta en canal de escalación
  - Cambiar estado del canal a ESCALATED
```

## Palabras clave de escalación detectadas

El bot reconoce estas frases (línea 251-267 de bot.js):
- "hablar con un humano"
- "hablar con humano"
- "quiero un humano"
- "necesito un humano"
- "quiero una persona"
- "necesito una persona"
- "quiero un asesor"
- "necesito un asesor"
- "quiero un agente"
- "necesito un agente"
- "persona real"
- "habla un humano"
- "atendeme un humano"
- "soporte tecnico"
- "hablar con soporte"

## Troubleshooting

### Error: "fatal: not a git repository"
```powershell
# Asegúrate de estar en la carpeta correcta
cd "C:\Users\Usuario\claude\Projects\TRADINGMIAMISCHOOL 2"
# Luego intenta de nuevo
```

### Error: "Permission denied" en .git
```powershell
# Cierra cualquier editor o proceso que use esta carpeta
# Intenta limpiar con:
Remove-Item -Force -Recurse -Path ".\.git" -ErrorAction Ignore
# Luego git init
```

### GitHub rechaza el push
```powershell
# Verifica que tienes permisos en el repo
# Usa un Personal Access Token si tienes 2FA habilitado
# Instrucciones: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token
```

## Verificación final en GitHub

Después del push, en https://github.com/TU_USUARIO/TRADINGMIAMISCHOOL:
- ✓ Ver bot.js con la función detectEscalationIntent
- ✓ Commit message: "fix: force push bot.js con escalacion"
- ✓ Branch main actualizado a la hora actual

---

**Estado**: ✅ bot.js verificado con escalación lista para deploy
**Próximo paso**: Ejecutar FORCE_DEPLOY.ps1 o seguir OPCIÓN 2
