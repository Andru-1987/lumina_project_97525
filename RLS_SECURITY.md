# 🔒 Lumina Project - Row Level Security (RLS) Configuration

## ✅ Resumen de Securización

La base de datos ha sido securizada exitosamente con **Row Level Security (RLS)** activado en todas las tablas.

### 📊 Estado de RLS por Tabla

| Tabla | RLS Activo | Políticas Creadas |
|-------|-----------|-------------------|
| `profiles` | ✅ | 3 políticas |
| `amenities` | ✅ | 2 políticas |
| `bookings` | ✅ | 4 políticas |
| `announcements` | ✅ | 2 políticas |
| `app_settings` | ✅ | 2 políticas |

### 🔐 Modelo de Seguridad

El sistema implementa un modelo de seguridad **basado en roles** con dos niveles:

1. **Admin** - Control total (bypass RLS)
2. **Resident** - Acceso limitado según reglas de negocio

## 📋 Políticas Implementadas

### 1️⃣ Tabla `profiles`

#### Para Admins:
- ✅ **"Admins have full access to profiles"** (ALL)
  - Pueden leer, crear, actualizar y eliminar cualquier perfil

#### Para Residents:
- ✅ **"Residents can view their own profile"** (SELECT)
  - Solo pueden ver su propio perfil (`id = auth.uid()`)
  
- ✅ **"Residents can update their own profile"** (UPDATE)
  - Pueden actualizar su perfil pero **NO pueden cambiar su role**
  - Restricción: El role debe permanecer igual

---

### 2️⃣ Tabla `amenities`

#### Para Admins:
- ✅ **"Admins have full access to amenities"** (ALL)
  - Pueden gestionar todas las amenidades (crear, editar, desactivar)

#### Para Residents:
- ✅ **"Residents can view active amenities"** (SELECT)
  - Solo pueden ver amenidades activas (`is_active = true`)
  - **NO pueden ver** amenidades desactivadas
  - **NO pueden** crear o modificar amenidades

---

### 3️⃣ Tabla `announcements`

#### Para Admins:
- ✅ **"Admins have full access to announcements"** (ALL)
  - Pueden crear, editar, publicar y eliminar anuncios

#### Para Residents:
- ✅ **"Residents can view published announcements"** (SELECT)
  - Solo pueden ver anuncios publicados (`is_published = true`)
  - **NO pueden ver** borradores o anuncios no publicados
  - **NO pueden** crear o modificar anuncios

---

### 4️⃣ Tabla `bookings` ⭐ **Políticas más complejas**

#### Para Admins:
- ✅ **"Admins have full access to bookings"** (ALL)
  - Control total sobre todas las reservas (CRUD completo)

#### Para Residents:
- ✅ **"Residents can view their own bookings"** (SELECT)
  - Solo ven sus propias reservas (`user_id = auth.uid()`)
  
- ✅ **"Residents can create their own bookings"** (INSERT)
  - Pueden crear reservas pero **deben** asignar `user_id = auth.uid()`
  - **NO pueden** crear reservas a nombre de otros usuarios
  
- ✅ **"Residents can cancel their own bookings"** (UPDATE)
  - Solo pueden cancelar sus reservas confirmadas
  - Restricciones:
    - Solo reservas propias (`user_id = auth.uid()`)
    - Solo si están en estado `'confirmed'`
    - Solo pueden cambiar `status` a `'cancelled'`
    - **NO pueden** modificar `booking_date`, `start_time`, `end_time`, `amenity_id`
  
- ❌ **NO tienen política DELETE**
  - Los residents **NO pueden eliminar** reservas de la base de datos
  - Solo pueden cambiar el status a `'cancelled'`

---

### 5️⃣ Tabla `app_settings`

#### Para Admins:
- ✅ **"Admins have full access to app_settings"** (ALL)
  - Pueden modificar la configuración de la aplicación
  - Control sobre límites de reservas, horas de anticipación, etc.

#### Para Residents:
- ✅ **"All users can view app settings"** (SELECT)
  - Todos los usuarios pueden leer la configuración
  - **NO pueden** modificar los valores

---

## 🛠️ Función Helper

### `public.is_admin()`

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Propósito:** Verifica si el usuario autenticado tiene el rol `'admin'`.

**Uso:** Utilizada en todas las políticas de admin para bypass total.

**Security Definer:** La función se ejecuta con privilegios elevados para acceder a la tabla profiles.

---

## 🔑 Matriz de Permisos

| Tabla | Admin | Resident |
|-------|-------|----------|
| **profiles** | 🟢 ALL | 🟡 SELECT/UPDATE propio (no puede cambiar role) |
| **amenities** | 🟢 ALL | 🟡 SELECT (solo activos) |
| **announcements** | 🟢 ALL | 🟡 SELECT (solo publicados) |
| **bookings** | 🟢 ALL | 🟡 SELECT/INSERT/UPDATE propios (NO DELETE) |
| **app_settings** | 🟢 ALL | 🟡 SELECT (solo lectura) |

**Leyenda:**
- 🟢 Acceso completo (CREATE, READ, UPDATE, DELETE)
- 🟡 Acceso limitado con restricciones
- 🔴 Sin acceso

---

## 📦 Migración Aplicada

- **Nombre:** `enable_rls_and_security_policies`
- **Archivo:** [supabase_rls_policies.sql](file:///c:/Users/ander/Documents/coderhouse/lumina_project_97525/supabase_rls_policies.sql)
- **Estado:** ✅ **Aplicada exitosamente**
- **Total de políticas:** 13 políticas activas

---

## 🧪 Casos de Prueba Recomendados

### Test 1: Resident intenta ver perfil de otro usuario
```sql
-- Como resident, esto debería retornar 0 filas
SELECT * FROM profiles WHERE id != auth.uid();
```
**Resultado esperado:** 0 filas (solo ve su propio perfil)

### Test 2: Resident intenta cambiar su rol a admin
```sql
-- Como resident, esto debería fallar
UPDATE profiles 
SET role = 'admin' 
WHERE id = auth.uid();
```
**Resultado esperado:** ❌ Error de política RLS

### Test 3: Resident intenta ver amenidad inactiva
```sql
-- Como resident, esto debería retornar 0 filas
SELECT * FROM amenities WHERE is_active = false;
```
**Resultado esperado:** 0 filas

### Test 4: Resident intenta crear reserva a nombre de otro
```sql
-- Como resident, esto debería fallar
INSERT INTO bookings (amenity_id, user_id, booking_date, start_time, end_time)
VALUES ('uuid-amenity', 'otro-user-id', '2026-02-10', '10:00', '12:00');
```
**Resultado esperado:** ❌ Error de política RLS

### Test 5: Resident intenta eliminar una reserva
```sql
-- Como resident, esto debería fallar
DELETE FROM bookings WHERE id = 'mi-booking-id';
```
**Resultado esperado:** ❌ Error de política RLS (no tiene política DELETE)

### Test 6: Admin puede hacer todo
```sql
-- Como admin, todos estos queries deberían funcionar
SELECT * FROM profiles;
UPDATE profiles SET role = 'admin' WHERE id = 'any-user-id';
DELETE FROM bookings WHERE id = 'any-booking-id';
```
**Resultado esperado:** ✅ Todas las operaciones exitosas

---

## ⚠️ Consideraciones de Seguridad

### ✅ Implementado:
- ✅ RLS activado en todas las tablas
- ✅ Bypass total para admins
- ✅ Restricción de escalada de privilegios (residents no pueden cambiar su role)
- ✅ Isolation de datos por usuario (residents solo ven lo suyo)
- ✅ Protección contra modificación de reservas (solo pueden cancelar)
- ✅ Protección contra eliminación de reservas por residents

### 📌 Próximos pasos recomendados:
1. **Edge Function `validate-booking`**: Validar lógica de negocio antes de insertar
   - Verificar horas de anticipación mínimas
   - Verificar duración máxima
   - Verificar límite de reservas activas por usuario
   - Detectar solapamientos de horarios

2. **Auditoría**: Crear tabla de logs para registrar cambios críticos
   - Quién canceló qué reserva y cuándo
   - Cambios en amenities por admins
   - Cambios en configuración de app_settings

3. **Rate Limiting**: Implementar limitación de requests en el frontend

---

## 🔗 Recursos

- **Supabase Dashboard**: https://supabase.com/dashboard/project/ornzvfifcmkqszxfkpcn
- **SQL File**: [supabase_rls_policies.sql](file:///c:/Users/ander/Documents/coderhouse/lumina_project_97525/supabase_rls_policies.sql)
- **Schema Original**: [supabase_schema.sql](file:///c:/Users/ander/Documents/coderhouse/lumina_project_97525/supabase_schema.sql)

---

**✅ Row Level Security configurado exitosamente!**

**🔒 Tu base de datos ahora está securizada con políticas granulares.**
