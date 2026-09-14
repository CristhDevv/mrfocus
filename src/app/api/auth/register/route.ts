import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { hashPassword, generateToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 });
    }
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Ingresa un correo electrónico válido' }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();

    // Check if user already exists
    const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return NextResponse.json({ error: 'Ya existe una cuenta con este correo electrónico' }, { status: 400 });
    }

    const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const passwordHash = hashPassword(password);
    const now = new Date().toISOString();

    // Insert user into local DB
    db.prepare(
      'INSERT INTO users (id, email, password_hash, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(userId, cleanEmail, passwordHash, cleanName, now, now);

    // Insert user into Supabase
    try {
      await supabase.from('users').insert({
        id: userId,
        email: cleanEmail,
        password_hash: passwordHash,
        name: cleanName,
        created_at: now,
        updated_at: now,
      });
    } catch (err) {
      console.warn('Supabase insert user error:', err);
    }

    // Create default project categories for this private environment
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

    const authUser = { id: userId, email: cleanEmail, name: cleanName };
    const token = generateToken(authUser);

    const response = NextResponse.json({
      success: true,
      user: authUser,
      token,
      message: 'Cuenta creada con éxito',
    });

    response.cookies.set('mrfocus_token', token, {
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Error al registrar el usuario' }, { status: 500 });
  }
}
