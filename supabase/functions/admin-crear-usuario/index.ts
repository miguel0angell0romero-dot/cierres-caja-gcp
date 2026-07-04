import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ROLES_VALIDOS = ['super_admin', 'admin', 'cajero']

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'No autorizado' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Cliente con el JWT de quien llama, solo para identificar al usuario.
    const clienteLlamador = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
    } = await clienteLlamador.auth.getUser()

    if (!user) {
      return jsonResponse({ error: 'No autorizado' }, 401)
    }

    // Cliente con la clave de servicio, para validar el rol y crear el usuario.
    const servicio = createClient(supabaseUrl, serviceRoleKey)

    const { data: perfilLlamador } = await servicio
      .from('profiles')
      .select('rol, activo')
      .eq('id', user.id)
      .single()

    if (!perfilLlamador || perfilLlamador.rol !== 'super_admin' || !perfilLlamador.activo) {
      return jsonResponse({ error: 'Solo un Super Admin puede crear usuarios' }, 403)
    }

    const { email, password, nombre, rol } = await req.json()

    if (!email || !password || !nombre) {
      return jsonResponse({ error: 'Faltan datos: email, password, nombre' }, 400)
    }

    const rolFinal = rol || 'cajero'
    if (!ROLES_VALIDOS.includes(rolFinal)) {
      return jsonResponse({ error: `Rol inválido: ${rolFinal}` }, 400)
    }

    const { data: creado, error: errorCrear } = await servicio.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (errorCrear || !creado.user) {
      return jsonResponse({ error: errorCrear?.message ?? 'No se pudo crear el usuario' }, 400)
    }

    const { error: errorPerfil } = await servicio.from('profiles').insert({
      id: creado.user.id,
      nombre,
      email,
      rol: rolFinal,
    })

    if (errorPerfil) {
      await servicio.auth.admin.deleteUser(creado.user.id)
      return jsonResponse({ error: errorPerfil.message }, 400)
    }

    return jsonResponse({ id: creado.user.id })
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : 'Error desconocido' }, 500)
  }
})
