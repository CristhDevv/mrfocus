import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { getAuthUser, hashPassword } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== 'superadmin') {
      return NextResponse.json({ error: 'Acceso denegado: Se requiere rol Superadmin' }, { status: 403 });
    }

    // Fetch from local DB & Supabase
    let usersList = db.prepare('SELECT * FROM users').all() as any[];

    try {
      const { data } = await supabase.from('users').select('id, email, name, role, created_at');
      if (data && data.length > 0) {
        const localEmails = new Set(usersList.map((u) => u.email));
        data.forEach((u) => {
          if (!localEmails.has(u.email)) {
            usersList.push(u);
          }
        });
      }
    } catch {}

    const sanitizedUsers = usersList.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role || 'user',
      createdAt: u.created_at || u.createdAt,
    }));

    return NextResponse.json({ users: sanitizedUsers });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = getAuthUser(req);
    if (!authUser || authUser.role !== 'superadmin') {
      return NextResponse.json({ error: 'Acceso denegado: Se requiere rol Superadmin' }, { status: 403 });
    }

    const { name, email, password, role = 'user' } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 });
    }
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'El correo electrónico es inválido' }, { status: 400 });
    }
    if (!password || password.length < 4) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 4 caracteres' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();
    const cleanRole = role === 'superadmin' ? 'superadmin' : 'user';

    const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return NextResponse.json({ error: 'Ya existe un usuario con este correo electrónico' }, { status: 400 });
    }

    const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const passwordHash = hashPassword(password);
    const now = new Date().toISOString();

    // Insert user locally
    db.prepare(
      'INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(userId, cleanEmail, passwordHash, cleanName, cleanRole, now, now);

    // Insert user into Supabase
    try {
      await supabase.from('users').insert({
        id: userId,
        email: cleanEmail,
        password_hash: passwordHash,
        name: cleanName,
        role: cleanRole,
        created_at: now,
        updated_at: now,
      });
    } catch (err) {
      console.warn('Supabase admin create user error:', err);
    }

    // Create private default projects for this newly created user
    const defaultProjects = [
      { id: 'proj_trabajo_' + userId, name: 'Trabajo & Desarrollo', color: '#3b82f6', icon: 'Briefcase', description: 'Proyectos profesionales y código' },
      { id: 'proj_personal_' + userId, name: 'Personal & Vida', color: '#10b981', icon: 'Home', description: 'Gestiones del hogar y bienestar' },
      { id: 'proj_finanzas_' + userId, name: 'Finanzas', color: '#f59e0b', icon: 'DollarSign', description: 'Inversiones, pagos y contabilidad' },
      { id: 'proj_estudio_' + userId, name: 'Aprendizaje', color: '#8b5cf6', icon: 'BookOpen', description: 'Cursos, lecturas y habilidades' },
    ];

    const insertProj = db.prepare(
      'INSERT INTO projects (id, user_id, name, color, icon, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );

    for (const p of defaultProjects) {
      insertProj.run(p.id, userId, p.name, p.color, p.icon, p.description, now);
    }

    try {
      await supabase.from('projects').insert(
        defaultProjects.map((p) => ({
          id: p.id,
          user_id: userId,
          name: p.name,
          color: p.color,
          icon: p.icon,
          description: p.description,
          created_at: now,
        }))
      );
    } catch (err) {
      console.warn('Supabase default projects error:', err);
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario creado exitosamente. Ya puede iniciar sesión de inmediato con su correo y contraseña.',
      user: {
        id: userId,
        email: cleanEmail,
        name: cleanName,
        role: cleanRole,
        createdAt: now,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Admin create user error:', error);
    return NextResponse.json({ error: 'Error al crear el usuario' }, { status: 500 });
  }
}
