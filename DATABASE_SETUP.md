# 🎉 Lumina Project - Database Setup Complete

## ✅ Resumen de la Migración

La base de datos de Supabase ha sido configurada exitosamente con el siguiente schema:

### 📊 Tablas Creadas

1. **`profiles`** - Perfiles de usuario extendidos desde auth.users
   - ✅ Foreign key a `auth.users`
   - ✅ Campos: `id`, `full_name`, `role`, `apartment`
   - ✅ Índices en `role` y `apartment`

2. **`amenities`** - Espacios comunes disponibles para reservar
   - ✅ Campos: `id`, `name`, `capacity`, `available_from`, `available_to`, `is_active`
   - ✅ Constraint: `available_to > available_from`
   - ✅ Índice en `is_active`

3. **`bookings`** - Reservas realizadas por usuarios
   - ✅ Foreign keys a `amenities` y `auth.users`
   - ✅ Campos: `id`, `amenity_id`, `user_id`, `booking_date`, `start_time`, `end_time`, `status`
   - ✅ Constraint: `end_time > start_time`
   - ✅ Constraint unique: `(user_id, booking_date, start_time)`
   - ✅ Múltiples índices para optimizar consultas
   - ✅ **Realtime habilitado** para actualizaciones en tiempo real

4. **`announcements`** - Anuncios y comunicados del edificio
   - ✅ Campos: `id`, `title`, `content`, `priority`, `is_published`
   - ✅ Priority check: `low`, `normal`, `high`, `urgent`
   - ✅ Índices en `is_published` y `priority`

5. **`app_settings`** - Configuración dinámica (key-value store)
   - ✅ Campos: `key` (PK), `value` (JSONB), `description`
   - ✅ **Valores iniciales insertados**:
     - `min_hours_advance`: 24 horas
     - `max_duration`: 4 horas
     - `max_active_bookings`: 3 reservas

### ⚡ Triggers Configurados

1. **`handle_updated_at`** - Actualiza automáticamente el campo `updated_at` en:
   - ✅ profiles
   - ✅ amenities
   - ✅ bookings
   - ✅ announcements
   - ✅ app_settings

2. **`on_auth_user_created`** - ⭐ **Trigger principal**
   - ✅ Se ejecuta automáticamente cuando un usuario se registra en Supabase Auth
   - ✅ Crea un perfil en la tabla `profiles` con los datos del `raw_user_meta_data`
   - ✅ Valores por defecto:
     - `full_name`: 'Usuario' (si no se proporciona)
     - `role`: 'resident' (si no se proporciona)
     - `apartment`: null (opcional)

### 🔒 Seguridad (RLS)

- ⚠️ **Row Level Security NO está activado** (según tu solicitud)
- Se activará en la siguiente fase con las siguientes políticas planeadas:
  - Profiles: Usuario lee su fila, Admin lee todo
  - Amenities/Announcements: Todos leen (si activos/publicados), Solo Admin escribe
  - Bookings: Usuario lee/crea/cancela lo propio, Admin lee/modifica todo

### 🔧 Archivos Generados

1. **`.env`** - Variables de entorno de Supabase (NO commitear a Git)
   ```env
   VITE_SUPABASE_URL=https://ornzvfifcmkqszxfkpcn.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. **`.env.example`** - Template para otros desarrolladores
   - ✅ Puede commitearse a Git como referencia

3. **`supabase_schema.sql`** - SQL completo de la migración
   - ✅ Puede usarse para recrear el schema en otros entornos

### 📦 Migración Aplicada

- **Nombre**: `initial_schema_with_auth_trigger`
- **Versión**: `20260205005618`
- **Estado**: ✅ **Aplicada exitosamente**

## 🚀 Próximos Pasos

1. **Seed Data** (opcional):
   ```sql
   -- Agregar amenidades de ejemplo
   INSERT INTO public.amenities (name, capacity, available_from, available_to)
   VALUES 
     ('Piscina', 20, '08:00', '20:00'),
     ('Gimnasio', 10, '06:00', '22:00'),
     ('Salón de Fiestas', 50, '10:00', '23:00'),
     ('Cancha de Tenis', 4, '07:00', '21:00');
   ```

2. **Activar RLS** (siguiente fase):
   ```sql
   ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
   ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
   ```

3. **Edge Functions**:
   - Crear `validate-booking` para validar reservas contra `app_settings` y solapamientos

4. **Frontend Integration**:
   - Configurar Supabase Client con las variables de `.env`
   - Implementar autenticación
   - Suscribirse a cambios en tiempo real de `bookings`

## 📝 Notas Importantes

- ✅ El trigger `on_auth_user_created` está **activo y funcionando**
- ✅ Todos los usuarios que se registren automáticamente tendrán un perfil creado
- ✅ Realtime está habilitado en la tabla `bookings` para actualizaciones instantáneas
- ⚠️ No olvides agregar `.env` a tu `.gitignore`

## 🔗 Recursos

- **Supabase Dashboard**: https://supabase.com/dashboard/project/ornzvfifcmkqszxfkpcn
- **API URL**: https://ornzvfifcmkqszxfkpcn.supabase.co
- **Database**: PostgreSQL 17.6.1

---

**✅ Database setup completado exitosamente!**
