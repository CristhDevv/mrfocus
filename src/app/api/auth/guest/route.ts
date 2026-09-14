import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { supabase } from '@/lib/supabase';
import { hashPassword, generateToken } from '@/lib/auth';

export async function POST() {
  try {
    const guestNum = Math.floor(1000 + Math.random() * 9000);
    const userId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const email = 'invitado_' + guestNum + '@mrfocus.app';
    const name = 'Invitado ' + guestNum;
    const passwordHash = hashPassword('guest_demo_password_' + userId);
    const now = new Date().toISOString();

    // Insert user into local DB
    db.prepare(
      'INSERT INTO users (id, email, password_hash, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(userId, email, passwordHash, name, now, now);

    // Insert into Supabase
    try {
      await supabase.from('users').insert({
        id: userId,
        email,
        password_hash: passwordHash,
        name,
        created_at: now,
        updated_at: now,
      });
    } catch (err) {
      console.warn('Supabase guest user insert error:', err);
    }

    // Default projects for guest
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
      console.warn('Supabase guest projects error:', err);
    }

    const authUser = { id: userId, email, name };
    const token = generateToken(authUser);

    const response = NextResponse.json({
      success: true,
      user: authUser,
      token,
      isGuest: true,
    });

    response.cookies.set('mrfocus_token', token, {
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Guest login error:', error);
    return NextResponse.json({ error: 'Error al generar sesión de invitado' }, { status: 500 });
  }
}
