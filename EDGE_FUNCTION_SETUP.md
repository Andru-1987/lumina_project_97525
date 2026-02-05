# ☁️ Edge Function: `validate-booking`

## ✅ Estado: Deployed
- **Nombre**: `validate-booking`
- **Versión**: 1
- **Status**: ACTIVE
- **Verify JWT**: True (Protegido por Supabase Auth)

## 📜 Descripción
Función crítica de negocio que actúa como "gatekeeper" para todas las nuevas reservas. Garantiza que solo se creen reservas válidas que cumplan con todas las reglas del edificio.

## 🧠 Lógica de Negocio Implementada

### 1. Autenticación y Autorización
- Verifica el JWT del usuario en el header `Authorization`.
- Utiliza **Service Role Key** para realizar operaciones privilegiadas (leer todas las reservas para check de overlap).
- `user_id` se extrae de forma segura del token, no del body (previene suplantación).

### 2. Validaciones contra `app_settings`
- **Min Hours Advance**: Verifica que la reserva se haga con al menos X horas de anticipación (Default: 24h).
- **Max Duration**: Verifica que la duración no exceda el máximo permitido (Default: 4h).
- **Max Active Bookings**: Verifica que el usuario no exceda el límite de reservas activas (Default: 3).

### 3. Validación de Horarios
- End Time > Start Time.
- Fechas y horas válidas.

### 4. Overlap Check (Anti-colisiones) 🛡️
- Consulta la base de datos para buscar cualquier reserva `confirmed` en el mismo `amenity_id` y fecha.
- Algoritmo de solapamiento: `(StartA < EndB) AND (EndA > StartB)`.
- Garantiza que **nunca** haya dos reservas en el mismo espacio al mismo tiempo.

### 5. Inserción Atómica
- Si todo es válido, inserta la reserva en la tabla `bookings` con estado `confirmed`.
- Usa el `user_id` autenticado.

## 💻 Código Fuente
El código fuente ha sido guardado localmente en:
`supabase/functions/validate-booking/index.ts`

## 🔗 Invocación
```javascript
const { data, error } = await supabase.functions.invoke('validate-booking', {
  body: {
    amenity_id: 'uuid-amenity',
    date: '2026-02-15',
    start_time: '14:00',
    end_time: '16:00'
  }
})
```

## ⚠️ Notas de Seguridad
- La función tiene `verify_jwt: true`, por lo que **SIEMPRE** requiere un usuario logueado.
- Usa `SUPABASE_SERVICE_ROLE_KEY` internamente, por lo que es crucial que el código no exponga datos sensibles en los errores.

---
**✅ Backend Logic completada.**
